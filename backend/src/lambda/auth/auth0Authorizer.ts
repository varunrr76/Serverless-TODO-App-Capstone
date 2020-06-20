import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken' //
import { createLogger } from '../../utils/logger'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
const cert = `-----BEGIN CERTIFICATE-----
MIIDDTCCAfWgAwIBAgIJdoryE41ivHfGMA0GCSqGSIb3DQEBCwUAMCQxIjAgBgNV
BAMTGWRldi1rZG1saTFyeS51cy5hdXRoMC5jb20wHhcNMjAwNjE1MjM0OTA2WhcN
MzQwMjIyMjM0OTA2WjAkMSIwIAYDVQQDExlkZXYta2RtbGkxcnkudXMuYXV0aDAu
Y29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuJSe6XWAo7SnZyHO
DCw0ulJKqAaD25REGq9wUirn/ThEiLYagCsoDFZ2r+53Y4gXvI4thb+9mDoKG9az
bvJCDiMyMbfxOVMrir60ScDF7ug5hnu49gY5nPjkaTxNvgcUCfQgmr5OqahZBNtc
jRdWpvazu67pbIejQmUG4SDWnIDo6zwGrSjmMhrkpNaQRAvc0OzmocXo4TXpRHSg
Ib4m0YHBM8BNV42PsYiiOZe9NgqWXwlMSnwkzIxjZ2EWha7BiO5F84xn9dSC/bMD
r8jeCtdlVk0ymeV+MZYKbWx3tOEg9oSg+1eQmpzjZQ1QXorLa2GCNnd0i6DV2Id2
i21zJQIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBQ+s88Z0mRW
0HdIGVy3RfCV6syb5zAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEB
AJDUHnl32dsmOsTH0jcIlUBnBzg+cUQXstYVpMQWRxuhesWRkEkOyya0ZmUxXNpV
K+ULyHGgJDhkPxbsesw0wEP8ftNTLHQT+i3RBQgJAfL2orRGxvW6g1YUlkO9q4xn
+HZ0Ibc4a4rtXTf33AjwZyYVkYlTfCT5Ddjz+epdAs+Foqic0gI6IDISFlrzrsT9
uRsmTSTeO4LSPB2+oxV65YkSyiMznQ6wMacNsLFsgrNRONB20rIBuZVxAc6TSlIu
bTmzXu4DklOcSGsz7980OBHyXFSCLg4fLS2qMfX6wGq8E0OrjKknWuLVzyXkVjoR
K5zC6cdclL+JTVB/J7v+7v8=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
