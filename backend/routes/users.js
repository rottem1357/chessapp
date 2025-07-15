// routes/users.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateUpdateProfile, validateUserSearch, validateUserPreferences } = require('../middleware/validation');
const userController = require('../controllers/userController');
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

// Public routes
router.get('/search', validateUserSearch, asyncHandler(userController.searchUsers));
router.get('/:userId', optionalAuth, asyncHandler(userController.getUserProfile));
router.get('/:userId/stats', asyncHandler(userController.getUserStats));

// Protected routes
router.put('/profile', verifyToken, validateUpdateProfile, asyncHandler(userController.updateProfile));
router.get('/preferences', verifyToken, asyncHandler(userController.getPreferences));
router.put('/preferences', verifyToken, validateUserPreferences, asyncHandler(userController.updatePreferences));
router.get('/puzzle-stats', verifyToken, asyncHandler(userController.getPuzzleStats));
router.get('/:userId/rating-history', asyncHandler(userController.getRatingHistory));

module.exports = router;