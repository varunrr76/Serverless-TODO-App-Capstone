import 'source-map-support/register'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  APIGatewayProxyHandler
} from 'aws-lambda'
import { createLogger } from '../../utils/logger'

import { getTodos } from '../../businessLogic/Todo'

const logger = createLogger('getTodos')

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  logger.info(`get todos request received for the authenticated user!!`)

  let nextKey
  let limit

  try {
    nextKey = await parseNextKeyParameter(event)
    limit = (await parseLimitParameter(event)) || 10
    logger.info(`nextKey: ${nextKey}`)
    logger.info(`limit: ${limit}`)
  } catch (e) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        error: 'Invalid Parameters'
      })
    }
  }

  const token: string = event.headers.Authorization.split(' ')[1]

  const getTodoResponse = await getTodos(token, limit, nextKey)

  return {
    statusCode: getTodoResponse.status,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: getTodoResponse.results
  }
}

async function parseLimitParameter(event: APIGatewayProxyEvent) {
  const limitStr = await getQueryParameter(event, 'limit')
  if (!limitStr) {
    return undefined
  }

  const limit = parseInt(limitStr, 10)
  if (limit <= 0) {
    throw new Error('Limit should be positive')
  }

  return limit
}

async function parseNextKeyParameter(event: APIGatewayProxyEvent) {
  const nextKeyStr = await getQueryParameter(event, 'nextKey')
  if (!nextKeyStr) {
    return undefined
  }

  const uriDecoded = decodeURIComponent(nextKeyStr)
  return JSON.parse(uriDecoded)
}

async function getQueryParameter(event: APIGatewayProxyEvent, name: string) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}
