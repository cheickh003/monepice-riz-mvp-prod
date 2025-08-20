import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function s3() {
  const region = process.env.S3_REGION || 'auto'
  const endpoint = process.env.S3_ENDPOINT
  const accessKeyId = process.env.S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error('R2/S3 configuration missing (S3_ENDPOINT/ACCESS KEY/SECRET)')
  }
  return new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })
}

export async function getSignedUploadUrl(key: string, contentType: string) {
  const client = s3()
  const bucket = process.env.S3_BUCKET!
  const command = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType })
  const url = await getSignedUrl(client, command, { expiresIn: 60 * 5 })
  return { url, bucket, key }
}

