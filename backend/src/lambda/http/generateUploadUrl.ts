import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
import { createLogger } from '../../utils/logger'

import { getPutSignedUrl } from '../../datalayer/S3Access'

const logger = createLogger('Uploadfile')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  logger.info(`Received request for signed url of : ${todoId}`)
  const url = await getPutSignedUrl(todoId)
  logger.info(`Received signed url of ${todoId}: ${url}`)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({ uploadUrl: url })
  }
}
