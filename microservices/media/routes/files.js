const express = require('express');
const router = express.Router();
const controller = require('../controllers/filesController');
const { validateSignRequest, validateFileId } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');

router.post('/sign', validateSignRequest, asyncHandler(controller.signFile));
router.get('/:id', validateFileId, asyncHandler(controller.getFile));

module.exports = router;
