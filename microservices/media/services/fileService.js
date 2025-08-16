const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { generateUploadUrl, generateDownloadUrl } = require('./s3Service');
const fileModel = require('../models/fileModel');

async function createSignedUpload(fileName, contentType) {
  const key = `${uuidv4()}-${fileName}`;
  const url = await generateUploadUrl(key, contentType);
  await fileModel.save({ key, fileName, contentType, createdAt: new Date().toISOString() });
  return { url, key, expiresIn: config.aws.urlExpiry };
}

async function getSignedDownload(key) {
  const meta = await fileModel.get(key);
  if (!meta) {
    const err = new Error('File not found');
    err.status = 404;
    throw err;
  }
  const url = await generateDownloadUrl(key);
  return { url, expiresIn: config.aws.urlExpiry };
}

module.exports = { createSignedUpload, getSignedDownload };
