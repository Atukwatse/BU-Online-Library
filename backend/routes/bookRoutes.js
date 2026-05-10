const express = require('express');
const bookController = require('../controllers/bookController');
const coverController = require('../controllers/coverController');
const asyncHandler = require('../middleware/asyncHandler');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadPDF } = require('../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', asyncHandler(bookController.getAllBooks));
router.get('/:id', asyncHandler(bookController.getBookById));

// Protected routes
router.post('/', protect, authorize('Admin'), uploadPDF.single('pdf'), asyncHandler(bookController.createBook));
router.put('/:id', protect, authorize('Admin'), asyncHandler(bookController.updateBook));
router.delete('/:id', protect, authorize('Admin'), asyncHandler(bookController.deleteBook));

// Download tracking
router.post('/:id/download', protect, asyncHandler(bookController.downloadBook));

// AI Cover generation (admin only)
router.post('/:id/generate-cover', protect, authorize('Admin'), asyncHandler(coverController.generateBookCover));
router.delete('/:id/cover', protect, authorize('Admin'), asyncHandler(coverController.deleteBookCover));

module.exports = router;
