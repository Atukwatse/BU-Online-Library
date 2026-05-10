/**
 * Event Management Controller
 */

const EventService = require('../../services/eventService');
const { ValidationError } = require('../../utils/errors');

// @desc    Create event
// @route   POST /api/events
// @access  Private/Admin,Staff
exports.createEvent = async (req, res, next) => {
  try {
    const result = await EventService.createEvent(req.user.id, req.body);

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: { eventId: result.eventId },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;

    const result = await EventService.getEvents(filters, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
exports.getEventById = async (req, res, next) => {
  try {
    const event = await EventService.getEventById(req.params.id);

    res.status(200).json({
      status: 'success',
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private/Admin,Staff
exports.updateEvent = async (req, res, next) => {
  try {
    const result = await EventService.updateEvent(req.params.id, req.body);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private/Admin,Staff
exports.deleteEvent = async (req, res, next) => {
  try {
    await EventService.deleteEvent(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Register for event
// @route   POST /api/events/:id/register
// @access  Private
exports.registerForEvent = async (req, res, next) => {
  try {
    const result = await EventService.registerForEvent(req.user.id, req.params.id);

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: { registrationId: result.registrationId },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel event registration
// @route   DELETE /api/events/:id/cancel
// @access  Private
exports.cancelRegistration = async (req, res, next) => {
  try {
    const result = await EventService.cancelRegistration(req.user.id, req.params.id);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event registrations
// @route   GET /api/events/:id/registrations
// @access  Private/Admin,Staff
exports.getEventRegistrations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await EventService.getEventRegistrations(req.params.id, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's event registrations
// @route   GET /api/events/my-registrations
// @access  Private
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await EventService.getUserRegistrations(req.user.id, page, limit);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark attendance
// @route   PUT /api/events/registrations/:id/attendance
// @access  Private/Admin,Staff
exports.markAttendance = async (req, res, next) => {
  try {
    const result = await EventService.markAttendance(req.params.id);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Public
exports.getUpcomingEvents = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const events = await EventService.getUpcomingEvents(limit);

    res.status(200).json({
      status: 'success',
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get past events
// @route   GET /api/events/past
// @access  Public
exports.getPastEvents = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const events = await EventService.getPastEvents(page, limit);

    res.status(200).json({
      status: 'success',
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get event statistics
// @route   GET /api/events/stats
// @access  Private/Admin,Staff
exports.getEventStats = async (req, res, next) => {
  try {
    const stats = await EventService.getEventStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Send event reminders (cron job)
// @route   POST /api/events/send-reminders
// @access  Private/Admin
exports.sendEventReminders = async (req, res, next) => {
  try {
    const result = await EventService.sendEventReminders();

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
