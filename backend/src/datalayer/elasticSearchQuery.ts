import * as elasticsearch from 'elasticsearch'
import * as httpAwsEs from 'http-aws-es'

import {
  APIGatewayProxyEvent,
  APIGatewayProxyHandler,
  APIGatewayProxyResult
} from 'aws-lambda'

import { createLogger } from '../utils/logger'

const logger = createLogger('queryTodos')

const esHost = process.env.ES_ENDPOINT

const es = new elasticsearch.Client({
  hosts: [esHost],
  connectionClass: httpAwsEs
})

export const handler: APIGatewayProxyHandler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  let queryString
  let from
  let size

  try {
    queryString = await parseQueryParameter(event)
    from = await parseFromParameter(event)
    size = await parseSizeParameter(event)
    logger.info(`queryString: ${queryString}`)
    logger.info(`fromParameter: ${from}`)
    logger.info(`sizeParameter: ${size}`)
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
  const body = {
    from,
    size,
    query: {
      wildcard: { name: queryString + '*' }
    }
  }
  const resp = await es.search({
    index: 'todos-index',
    type: 'todos',
    body
  })
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(resp)
  }
}

async function parseFromParameter(event: APIGatewayProxyEvent) {
  const fromStr = await getQueryParameter(event, 'from')
  if (!fromStr) {
    return 0
  }

  const from = parseInt(fromStr, 10)
  if (from <= 0) {
    throw new Error('Limit should be positive')
  }

  return from
}

async function parseSizeParameter(event: APIGatewayProxyEvent) {
  const sizeStr = await getQueryParameter(event, 'size')
  if (!sizeStr) {
    return 10
  }

  const size = parseInt(sizeStr, 10)
  if (size <= 0) {
    throw new Error('Limit should be positive')
  }

  return size
}

async function parseQueryParameter(event: APIGatewayProxyEvent) {
  const queryStr = await getQueryParameter(event, 'query')
  if (!queryStr) {
    return undefined
  }
  return queryStr
}

async function getQueryParameter(event: APIGatewayProxyEvent, name: string) {
  const queryParams = event.queryStringParameters
  if (!queryParams) {
    return undefined
  }

  return queryParams[name]
}
