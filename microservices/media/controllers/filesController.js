const fileService = require('../services/fileService');
const logger = require('../utils/logger');

async function signFile(req, res) {
  const { fileName, contentType } = req.body;
  const result = await fileService.createSignedUpload(fileName, contentType);
  logger.info('Upload URL generated', { key: result.key, traceId: req.traceId });
  res.json(result);
}

async function getFile(req, res) {
  const key = req.params.id;
  const result = await fileService.getSignedDownload(key);
  logger.info('Download URL generated', { key, traceId: req.traceId });
  res.json(result);
}

module.exports = { signFile, getFile };
