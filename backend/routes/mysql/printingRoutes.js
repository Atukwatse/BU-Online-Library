/**
 * Printing Service Routes
 */

const express = require('express');
const printingController = require('../../controllers/mysql/printingController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');
const { validate, schemas } = require('../../middleware/validationMiddleware');
const { uploadLimiter } = require('../../middleware/rateLimitMiddleware');
const upload = require('../../middleware/upload');

const router = express.Router();

// Protected routes
router.post('/requests', authenticateToken, uploadLimiter, upload.single('file'), asyncHandler(printingController.createPrintingRequest));
router.post('/calculate-cost', authenticateToken, asyncHandler(printingController.calculateCostEstimate));
router.get('/my-requests', authenticateToken, asyncHandler(printingController.getMyPrintingRequests));
router.get('/requests/:id', authenticateToken, asyncHandler(printingController.getPrintingRequestById));
router.delete('/requests/:id', authenticateToken, asyncHandler(printingController.deletePrintingRequest));

// Admin/Staff routes
router.get('/requests', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(printingController.getPrintingRequests));
router.put('/requests/:id', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(printingController.updatePrintingRequest));
router.get('/pending', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(printingController.getPendingRequests));
router.get('/stats', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(printingController.getPrintingStats));

module.exports = router;
