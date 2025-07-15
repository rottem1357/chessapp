// routes/index.js - Main router file
const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const gameRoutes = require('./games');
const aiRoutes = require('./ai');
const matchmakingRoutes = require('./matchmaking');
const puzzleRoutes = require('./puzzles');
const friendRoutes = require('./friends');
const ratingRoutes = require('./ratings');
const openingRoutes = require('./openings');
const statisticsRoutes = require('./statistics');
const adminRoutes = require('./admin');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Chess App Backend API is running',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/games', gameRoutes);
router.use('/ai', aiRoutes);
router.use('/matchmaking', matchmakingRoutes);
router.use('/puzzles', puzzleRoutes);
router.use('/friends', friendRoutes);
router.use('/ratings', ratingRoutes);
router.use('/openings', openingRoutes);
router.use('/statistics', statisticsRoutes);
router.use('/admin', adminRoutes);

module.exports = router;