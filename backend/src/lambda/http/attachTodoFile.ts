import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'

import { createLogger } from '../../utils/logger'

import { attachTodoFile } from '../../businessLogic/Todo'

const logger = createLogger('attachTodoFile')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const fileName = todoId + '-' + event.queryStringParameters['filename']
  logger.info(
    `recieved request for attaching the file ${fileName} to ${todoId}!!`
  )

  const attachTodoFileResponse = await attachTodoFile(todoId, fileName)

  return {
    statusCode: attachTodoFileResponse.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: attachTodoFileResponse.results
  }
}
