/**
 * Borrowing Routes
 */

const express = require('express');
const borrowingController = require('../../controllers/mysql/borrowingController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');
const { validate, schemas } = require('../../middleware/validationMiddleware');

const router = express.Router();

// Public/Protected routes
router.post('/requests', authenticateToken, asyncHandler(borrowingController.createBorrowRequest));
router.get('/my-requests', authenticateToken, asyncHandler(borrowingController.getMyBorrowRequests));
router.get('/history', authenticateToken, asyncHandler(borrowingController.getBorrowingHistory));
router.get('/active', authenticateToken, asyncHandler(borrowingController.getActiveBorrowings));

// Admin/Staff routes
router.get('/requests', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(borrowingController.getBorrowRequests));
router.put('/requests/:id/approve', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(borrowingController.approveRequest));
router.put('/requests/:id/reject', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(borrowingController.rejectRequest));
router.put('/:id/return', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(borrowingController.returnBook));
router.get('/overdue', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(borrowingController.getOverdueBorrowings));
router.get('/stats', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(borrowingController.getBorrowingStats));
router.post('/mark-overdue', authenticateToken, authorize('Admin'), asyncHandler(borrowingController.markOverdueBorrowings));

module.exports = router;
