const express = require('express');
const authController = require('../../controllers/mysql/authController');
const asyncHandler = require('../../middleware/asyncHandler');
const { protect } = require('../../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/logout', asyncHandler(authController.logout));

// Protected routes
router.get('/me', protect, asyncHandler(authController.getMe));
router.put('/profile', protect, asyncHandler(authController.updateProfile));
router.put('/change-password', protect, asyncHandler(authController.changePassword));

module.exports = router;
