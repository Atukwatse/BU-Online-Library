const express = require('express');
const bookController = require('../../controllers/mysql/bookController');
const asyncHandler = require('../../middleware/asyncHandler');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { uploadPDF } = require('../../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', asyncHandler(bookController.getAllBooks));
router.get('/popular', asyncHandler(bookController.getPopularBooks));
router.get('/category/:categoryId', asyncHandler(bookController.getBooksByCategory));
router.post('/search', asyncHandler(bookController.searchBooks));
router.get('/:id', asyncHandler(bookController.getBookById));

// Protected routes
router.post('/:id/download', protect, asyncHandler(bookController.downloadBook));

// Admin-only routes
router.post('/', protect, authorize('Admin'), uploadPDF.single('pdf'), asyncHandler(bookController.createBook));
router.put('/:id', protect, authorize('Admin'), asyncHandler(bookController.updateBook));
router.delete('/:id', protect, authorize('Admin'), asyncHandler(bookController.deleteBook));
router.get('/:id/stats', protect, authorize('Admin'), asyncHandler(bookController.getBookStats));

module.exports = router;
