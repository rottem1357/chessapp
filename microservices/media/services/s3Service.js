const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config');

const client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

async function generateUploadUrl(key, contentType) {
  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: config.aws.urlExpiry });
}

async function generateDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: config.aws.bucket,
    Key: key,
  });
  return getSignedUrl(client, command, { expiresIn: config.aws.urlExpiry });
}

module.exports = { generateUploadUrl, generateDownloadUrl };
