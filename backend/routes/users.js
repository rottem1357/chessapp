// routes/users.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateUpdateProfile, validateUserSearch, validateUserIdParam, validateUserPreferences, validateRatingHistoryQuery } = require('../middleware/validation');
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// Public routes
router.get('/search', validateUserSearch, asyncHandler(userController.searchUsers));

// Protected routes
router.put('/profile', verifyToken, validateUpdateProfile, asyncHandler(userController.updateProfile));
router.put('/preferences', verifyToken, validateUserPreferences, asyncHandler(userController.updatePreferences));
router.get('/preferences', verifyToken, asyncHandler(userController.getPreferences));
router.get('/puzzle-stats', verifyToken, asyncHandler(userController.getPuzzleStats));

// Dynamic routes
router.get('/:userId', optionalAuth, validateUserIdParam, asyncHandler(userController.getUserProfile));
router.get('/:userId/stats', validateUserIdParam, asyncHandler(userController.getUserStats));
router.get('/:userId/rating-history', validateRatingHistoryQuery, asyncHandler(userController.getRatingHistory));

module.exports = router;