import { DynamoDBStreamEvent, DynamoDBStreamHandler } from 'aws-lambda'
import 'source-map-support/register'
import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'

const esHost = process.env.ES_ENDPOINT

const es = new elasticsearch.Client({
  hosts: [esHost],
  connectionClass: httpAwsEs
})

export const handler: DynamoDBStreamHandler = async (
  event: DynamoDBStreamEvent
) => {
  console.log('Processing events batch from DynamoDB', JSON.stringify(event))
  for (const record of event.Records) {
    console.log('Processing record', JSON.stringify(record))
    if (record.eventName === 'INSERT') {
      const newItem = record.dynamodb.NewImage
      const body = {
        todoId: newItem.todoId.S,
        name: newItem.name.S,
        dueDate: newItem.dueDate.S,
        createdAt: newItem.createdAt.S,
        pflag: newItem.pflag.S,
        done: newItem.done.S
      }
      await es.index({
        index: 'todos-index',
        type: 'todos',
        id: newItem.todoId.S,
        body
      })
    } else if (record.eventName === 'REMOVE') {
      const todoId = record.dynamodb.Keys.todoId.S
      await es.delete({
        index: 'todos-index',
        type: 'todos',
        id: todoId
      })
    } else {
      const newItem = record.dynamodb.NewImage
      const body = {
        doc: {
          todoId: newItem.todoId.S,
          name: newItem.name.S,
          dueDate: newItem.dueDate.S,
          createdAt: newItem.createdAt.S,
          pflag: newItem.pflag.S,
          done: newItem.done.S,
          attachmentUrl: newItem.attachmentUrl.S ? newItem.attachmentUrl.S : ''
        }
      }
      await es.update({
        index: 'todos-index',
        type: 'todos',
        id: newItem.todoId.S,
        body
      })
    }
  }
}
