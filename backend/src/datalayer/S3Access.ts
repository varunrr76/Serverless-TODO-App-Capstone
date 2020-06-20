import * as AWS from 'aws-sdk'
// import * as AWSXRay from 'aws-xray-sdk'

// const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new AWS.S3()

const filesBucketName = process.env.FILES_S3_BUCKET

const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export async function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: filesBucketName,
    Key: todoId,
    Expires: urlExpiration
  })
}
