import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

import { createLogger } from '../../utils/logger'

import { createTodo } from '../../businessLogic/Todo'

const logger = createLogger('CreateTodo')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)

  logger.info(`create request for ${JSON.stringify(newTodo)} received!!`)

  const token: string = event.headers.Authorization.split(' ')[1]

  const createItemResponse = await createTodo(newTodo, token)

  return {
    statusCode: createItemResponse.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: createItemResponse.results
  }
}
