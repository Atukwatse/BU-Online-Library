/**
 * Research Support Routes
 */

const express = require('express');
const researchController = require('../../controllers/mysql/researchController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');
const { validate, schemas } = require('../../middleware/validationMiddleware');
const { uploadLimiter } = require('../../middleware/rateLimitMiddleware');
const upload = require('../../middleware/upload');

const router = express.Router();

// Protected routes
router.post('/requests', authenticateToken, uploadLimiter, upload.single('file'), asyncHandler(researchController.createResearchRequest));
router.get('/my-requests', authenticateToken, asyncHandler(researchController.getMyResearchRequests));
router.get('/requests/:id', authenticateToken, asyncHandler(researchController.getResearchRequestById));
router.delete('/requests/:id', authenticateToken, asyncHandler(researchController.deleteResearchRequest));

// Admin/Staff routes
router.get('/requests', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(researchController.getResearchRequests));
router.put('/requests/:id', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(researchController.updateResearchRequest));
router.get('/pending', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(researchController.getPendingRequests));
router.get('/stats', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(researchController.getResearchStats));

module.exports = router;
