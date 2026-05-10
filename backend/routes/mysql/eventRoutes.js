/**
 * Event Management Routes
 */

const express = require('express');
const eventController = require('../../controllers/mysql/eventController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');
const { validate, schemas } = require('../../middleware/validationMiddleware');
const { uploadLimiter } = require('../../middleware/rateLimitMiddleware');
const upload = require('../../middleware/upload');

const router = express.Router();

// Public routes
router.get('/', asyncHandler(eventController.getEvents));
router.get('/:id', asyncHandler(eventController.getEventById));
router.get('/upcoming/upcoming', asyncHandler(eventController.getUpcomingEvents));
router.get('/past/past', asyncHandler(eventController.getPastEvents));

// Protected routes
router.post('/:id/register', authenticateToken, asyncHandler(eventController.registerForEvent));
router.delete('/:id/cancel', authenticateToken, asyncHandler(eventController.cancelRegistration));
router.get('/my-registrations/my-registrations', authenticateToken, asyncHandler(eventController.getMyRegistrations));

// Admin/Staff routes
router.post('/', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), uploadLimiter, upload.single('banner'), asyncHandler(eventController.createEvent));
router.put('/:id', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(eventController.updateEvent));
router.delete('/:id', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(eventController.deleteEvent));
router.get('/:id/registrations', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(eventController.getEventRegistrations));
router.put('/registrations/:id/attendance', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(eventController.markAttendance));
router.get('/stats/stats', authenticateToken, authorize('Admin', 'Staff', 'SuperAdmin'), asyncHandler(eventController.getEventStats));
router.post('/send-reminders/send-reminders', authenticateToken, authorize('Admin', 'SuperAdmin'), asyncHandler(eventController.sendEventReminders));

module.exports = router;
