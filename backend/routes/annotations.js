// routes/annotations.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateMoveId, validateAnnotationData } = require('../middleware/validation');
const {
  addAnnotation,
  getAnnotationsForMove,
  deleteAnnotation
} = require('../controllers/annotationController');

const router = express.Router();

router.post('/moves/:moveId/annotations', validateMoveId, validateAnnotationData, asyncHandler(addAnnotation));
router.get('/moves/:moveId/annotations', validateMoveId, asyncHandler(getAnnotationsForMove));
router.delete('/annotations/:id', asyncHandler(deleteAnnotation));

module.exports = router;