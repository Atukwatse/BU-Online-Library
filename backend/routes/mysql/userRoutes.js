const express = require('express');
const userController = require('../../controllers/mysql/userController');
const asyncHandler = require('../../middleware/asyncHandler');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// All user routes are protected and admin-only
router.use(protect);
router.use(authorize('Admin'));

// CRUD operations for users
router.get('/', asyncHandler(userController.getAllUsers));
router.get('/stats', asyncHandler(userController.getUserStats));
router.get('/:id', asyncHandler(userController.getUserById));
router.post('/', asyncHandler(userController.createUser));
router.put('/:id', asyncHandler(userController.updateUser));
router.delete('/:id', asyncHandler(userController.deleteUser));

// Status management
router.patch('/:id/toggle-status', asyncHandler(userController.toggleUserStatus));

// User downloads
router.get('/:id/downloads', asyncHandler(userController.getUserDownloads));

// Password management
router.post('/:id/reset-password', asyncHandler(userController.resetUserPassword));

module.exports = router;
