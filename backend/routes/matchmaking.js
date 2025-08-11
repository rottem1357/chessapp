// routes/matchmaking.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
  validateJoinQueue,
  validateUpdatePreferences,
  validatePagination,
  validateOptimalTimesQuery,
  validateCancelMatch,
  validateReportIssue,
  handleValidationErrors
} = require('../middleware/validation');
const matchmakingController = require('../controllers/matchmakingController');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

// Core queue management (protected routes)
router.post('/queue', verifyToken, validateJoinQueue, asyncHandler(matchmakingController.joinQueue));
router.delete('/queue', verifyToken, asyncHandler(matchmakingController.leaveQueue));
router.get('/status', verifyToken, asyncHandler(matchmakingController.getQueueStatus));

// Queue statistics and insights
router.get('/stats', asyncHandler(matchmakingController.getQueueStats));
router.get('/stats/detailed', verifyToken, asyncHandler(matchmakingController.getDetailedStats));

// User preferences and settings
router.get('/preferences', verifyToken, asyncHandler(matchmakingController.getPreferences));
router.put('/preferences', verifyToken, validateUpdatePreferences, asyncHandler(matchmakingController.updatePreferences));

// History and analytics  
router.get('/history', verifyToken, validatePagination, asyncHandler(matchmakingController.getQueueHistory));
router.get('/optimal-times', validateOptimalTimesQuery, asyncHandler(matchmakingController.getOptimalQueueTimes));

// Match management
router.post('/cancel-match', verifyToken, validateCancelMatch, asyncHandler(matchmakingController.cancelMatch));
router.post('/report-issue', verifyToken, validateReportIssue, asyncHandler(matchmakingController.reportIssue));

// Admin endpoints (if needed)
router.get('/admin/queues', verifyToken, asyncHandler(matchmakingController.getAdminQueueData));

module.exports = router;