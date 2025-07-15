// routes/admin.js
const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateAdminQuery } = require('../middleware/validation');
const adminController = require('../controllers/adminController');
const verifyToken = require('../middleware/verifyToken');
const verifyAdmin = require('../middleware/verifyAdmin');

const router = express.Router();

// All routes require admin access
router.use(verifyToken);
router.use(verifyAdmin);

router.get('/users', validateAdminQuery, asyncHandler(adminController.getUsers));
router.get('/games', validateAdminQuery, asyncHandler(adminController.getGames));
router.get('/reports', asyncHandler(adminController.getReports));
router.get('/stats', asyncHandler(adminController.getAdminStats));

module.exports = router;