import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

// const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'
import { DataAccessResponse } from '../models/DataAccessResponse'
import { getGetSignedUrl } from '../datalayer/S3Access'

const logger = createLogger('TodoAccess')

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly todoTable = process.env.TODO_TABLE,
    private readonly todoIndex = process.env.TODO_TABLE_INDEX
  ) {}

  async createTodo(todoItem: TodoItem): Promise<DataAccessResponse> {
    var resp
    await this.docClient
      .put({
        TableName: this.todoTable,
        Item: todoItem
      })
      .promise()
      .then(() => {
        logger.info('Successfully Created!')
        resp = {
          status: 201,
          results: JSON.stringify(todoItem)
        }
      })
      .catch((err) => {
        logger.error(
          `Failed to create todo!! Check with DynamoDB connection. \n ${err}`
        )
        resp = {
          status: 500,
          results: 'Error'
        }
      })
    return resp as DataAccessResponse
  }

  async deleteTodo(todoId: string): Promise<DataAccessResponse> {
    var resp
    if (await this.todoItemExists(todoId)) {
      logger.error('todoId Not Present')
      resp = {
        status: 404,
        results: 'todoId Not Found'
      }
    } else {
      await this.docClient
        .delete({
          TableName: this.todoTable,
          Key: {
            todoId: todoId
          }
        })
        .promise()
        .then(() => {
          logger.info('Successfully Deleted!')
          resp = {
            status: 200,
            results: `Successfully deleted ${todoId}`
          }
        })
        .catch((err) => {
          logger.error(
            `Failed to delete todo!! Check with DynamoDB connection. \n ${err}`
          )
          resp = {
            status: 500,
            results: `Failed to delete todo!! Check with DynamoDB connection. \n ${err}`
          }
        })
    }
    return resp as DataAccessResponse
  }

  async updateTodo(
    todoId: string,
    updatedTodo: TodoUpdate
  ): Promise<DataAccessResponse> {
    var resp
    if (await this.todoItemExists(todoId)) {
      logger.error('todoId Not Present')
      resp = {
        status: 404,
        results: `todoId Not Present`
      }
    } else {
      logger.info(`${JSON.stringify(updatedTodo.name)}`)
      await this.docClient
        .update({
          TableName: this.todoTable,
          Key: {
            todoId: todoId
          },
          UpdateExpression: 'set #task_name = :n, dueDate = :dD, done = :d',
          ExpressionAttributeValues: {
            ':n': updatedTodo.name,
            ':dD': updatedTodo.dueDate,
            ':d': updatedTodo.done,
            ':pf': updatedTodo.pflag
          },
          ExpressionAttributeNames: {
            '#task_name': 'name'
          },
          ReturnValues: 'UPDATED_NEW'
        })
        .promise()
        .then((data) => {
          logger.info(`Successfully updated to ${JSON.stringify(data)}`)
          resp = {
            status: 200,
            results: JSON.stringify(data)
          }
        })
        .catch((err) => {
          logger.error(
            `Failed to update todo!! Check with DynamoDB connection. \n ${err}`
          )
          resp = {
            status: 500,
            results: `Failed to update todo!! Check with DynamoDB connection. \n ${err}`
          }
        })
    }
    return resp as DataAccessResponse
  }

  async getTodos(
    userId: string,
    limit: number,
    nextKey
  ): Promise<DataAccessResponse> {
    var resp
    await this.docClient
      .query({
        TableName: this.todoTable,
        IndexName: this.todoIndex,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: true,
        Limit: limit,
        ExclusiveStartKey: nextKey
      })
      .promise()
      .then((data) => {
        logger.info('Successfully Retrieved!')
        logger.info(`${data}`)
        data.Items.map((item) => {
          if (item.attachmentUrl) {
            item.attachmentUrl = getGetSignedUrl(item.attachmentUrl)
          }
        })
        resp = {
          status: 201,
          results: JSON.stringify({
            Items: data.Items,
            LastEvaluatedKey: encodeNextKey(data.LastEvaluatedKey)
          })
        }
      })
      .catch((err) => {
        logger.error(
          `Failed to get todo!! Check with DynamoDB connection. \n ${err}`
        )
        resp = {
          status: 500,
          results: `Failed to get todo!! Check with DynamoDB connection. \n ${err}`
        }
      })
    return resp as DataAccessResponse
  }

  async todoItemExists(todoId: string) {
    const result = await this.docClient
      .get({
        TableName: this.todoTable,
        Key: {
          todoId: todoId
        }
      })
      .promise()

    logger.info(`${JSON.stringify(result)}`)

    return JSON.stringify(result) === '{}'
  }

  async attachTodoFile(
    todoId: string,
    fileName: string
  ): Promise<DataAccessResponse> {
    var resp
    if (await this.todoItemExists(todoId)) {
      logger.error('todoId Not Present')
      resp = {
        status: 404,
        results: `logger.error('todoId Not Present')`
      }
    } else {
      logger.info(`${JSON.stringify(fileName)}`)
      await this.docClient
        .update({
          TableName: this.todoTable,
          Key: {
            todoId: todoId
          },
          UpdateExpression: 'set attachmentUrl = :aUrl',
          ExpressionAttributeValues: {
            ':aUrl': fileName
          },
          ReturnValues: 'UPDATED_NEW'
        })
        .promise()
        .then((data) => {
          logger.info(`Successfully updated to ${JSON.stringify(data)}`)
          resp = {
            status: 200,
            results: JSON.stringify(data)
          }
        })
        .catch((err) => {
          logger.error(
            `Failed to update todo!! Check with DynamoDB connection. \n ${err}`
          )
          resp = {
            status: 500,
            results: `Failed to update todo!! Check with DynamoDB connection. \n ${err}`
          }
        })
    }
    return resp as DataAccessResponse
  }
}
function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    logger.info('Creating a local DynamoDB instance')
    return new AWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  logger.info(`Connecting to DynamoDB`)
  return new AWS.DynamoDB.DocumentClient()
}

function encodeNextKey(lastEvaluatedKey) {
  if (!lastEvaluatedKey) {
    return null
  }

  return encodeURIComponent(JSON.stringify(lastEvaluatedKey))
}
