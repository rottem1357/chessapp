const validateSignRequest = (req, res, next) => {
  const { fileName, contentType } = req.body;
  const errors = [];
  if (!fileName) errors.push('fileName is required');
  if (!contentType) errors.push('contentType is required');
  if (errors.length > 0) {
    return res.status(400).json({ message: errors.join(', ') });
  }
  next();
};

const validateFileId = (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'File ID is required' });
  }
  next();
};

module.exports = { validateSignRequest, validateFileId };
