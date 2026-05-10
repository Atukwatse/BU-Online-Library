/**
 * File Management Routes
 */

const express = require('express');
const fileController = require('../../controllers/mysql/fileController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');
const { bookUpload, coverUpload, bannerUpload, researchUpload, printingUpload } = require('../../middleware/fileValidationMiddleware');

const router = express.Router();

// Upload routes with specific configurations
router.post('/upload/book', authenticateToken, bookUpload.single('file'), asyncHandler(fileController.uploadFile));
router.post('/upload/cover', authenticateToken, coverUpload.single('file'), asyncHandler(fileController.uploadFile));
router.post('/upload/banner', authenticateToken, bannerUpload.single('file'), asyncHandler(fileController.uploadFile));
router.post('/upload/research', authenticateToken, researchUpload.single('file'), asyncHandler(fileController.uploadFile));
router.post('/upload/printing', authenticateToken, printingUpload.single('file'), asyncHandler(fileController.uploadFile));

// File management routes
router.delete('/:filename', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(fileController.deleteFile));
router.get('/:filename/info', authenticateToken, asyncHandler(fileController.getFileInfo));
router.post('/cleanup', authenticateToken, authorize('Admin', 'SuperAdmin'), asyncHandler(fileController.cleanupOldFiles));

module.exports = router;
