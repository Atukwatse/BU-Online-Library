/**
 * Event Management Service
 */

const Event = require('../models/mysql/Event');
const EventRegistration = require('../models/mysql/EventRegistration');
const NotificationService = require('./notificationService');
const { ValidationError, ConflictError } = require('../utils/errors');
const { performance: logPerformance } = require('../utils/logger');

class EventService {
  /**
   * Create event
   */
  static async createEvent(organizerID, data) {
    const startTime = Date.now();
    const { title, description, location, eventDate, eventTime, registrationDeadline, maxAttendees, bannerImage } = data;

    if (!title || !eventDate) {
      throw new ValidationError('Title and event date are required');
    }

    const eventId = await Event.create({
      title,
      description,
      location,
      eventDate,
      eventTime,
      registrationDeadline,
      maxAttendees,
      bannerImage,
      organizerID,
    });

    logPerformance('createEvent', Date.now() - startTime);
    return { eventId, message: 'Event created successfully' };
  }

  /**
   * Get all events
   */
  static async getEvents(filters = {}, page = 1, limit = 20) {
    return await Event.findAll(filters, page, limit);
  }

  /**
   * Get event by ID
   */
  static async getEventById(id) {
    const event = await Event.findById(id);
    if (!event) {
      throw new ValidationError('Event not found');
    }
    return event;
  }

  /**
   * Update event
   */
  static async updateEvent(id, data) {
    const event = await Event.findById(id);
    if (!event) {
      throw new ValidationError('Event not found');
    }

    await Event.update(id, data);
    return { success: true, message: 'Event updated successfully' };
  }

  /**
   * Delete event
   */
  static async deleteEvent(id) {
    await Event.delete(id);
    return { success: true, message: 'Event deleted successfully' };
  }

  /**
   * Register for event
   */
  static async registerForEvent(userID, eventID) {
    const event = await Event.findById(eventID);
    if (!event) {
      throw new ValidationError('Event not found');
    }

    if (event.Status !== 'Upcoming') {
      throw new ValidationError('Event is not open for registration');
    }

    // Check registration deadline
    if (event.RegistrationDeadline && new Date(event.RegistrationDeadline) < new Date()) {
      throw new ValidationError('Registration deadline has passed');
    }

    // Check if already registered
    const isRegistered = await EventRegistration.isRegistered(userID, eventID);
    if (isRegistered) {
      throw new ConflictError('Already registered for this event');
    }

    // Check max attendees
    if (event.MaxAttendees) {
      const registrationCount = await EventRegistration.getRegistrationCount(eventID);
      if (registrationCount >= event.MaxAttendees) {
        throw new ConflictError('Event is fully booked');
      }
    }

    const registrationId = await EventRegistration.create({ userID, eventID });

    // Notify user
    await NotificationService.notifyEventRegistered(userID, event.Title);

    return { registrationId, message: 'Successfully registered for event' };
  }

  /**
   * Cancel event registration
   */
  static async cancelRegistration(userID, eventID) {
    const registration = await EventRegistration.findByUser(userID, 1, 100);
    const targetRegistration = registration.find(r => r.EventID === parseInt(eventID));

    if (!targetRegistration) {
      throw new ValidationError('Registration not found');
    }

    await EventRegistration.cancel(targetRegistration.RegistrationID);
    return { success: true, message: 'Registration cancelled' };
  }

  /**
   * Get event registrations
   */
  static async getEventRegistrations(eventID, page = 1, limit = 20) {
    return await EventRegistration.findByEvent(eventID, page, limit);
  }

  /**
   * Get user's event registrations
   */
  static async getUserRegistrations(userID, page = 1, limit = 20) {
    return await EventRegistration.findByUser(userID, page, limit);
  }

  /**
   * Mark attendance
   */
  static async markAttendance(registrationID) {
    await EventRegistration.markAttendance(registrationID);
    return { success: true, message: 'Attendance marked' };
  }

  /**
   * Get upcoming events
   */
  static async getUpcomingEvents(limit = 10) {
    return await Event.getUpcomingEvents(limit);
  }

  /**
   * Get past events
   */
  static async getPastEvents(page = 1, limit = 20) {
    return await Event.getPastEvents(page, limit);
  }

  /**
   * Get event statistics
   */
  static async getEventStats() {
    return await Event.getStats();
  }

  /**
   * Send event reminder (cron job)
   */
  static async sendEventReminders() {
    const events = await Event.getUpcomingEvents(50);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    for (const event of events) {
      const eventDate = new Date(event.EventDate);
      
      // Send reminder if event is tomorrow
      if (eventDate.toDateString() === tomorrow.toDateString()) {
        const registrations = await EventRegistration.findByEvent(event.EventID, 1, 1000);
        
        for (const reg of registrations.data) {
          await NotificationService.notifyEventReminder(reg.UserID, event.Title, event.EventDate);
        }
      }
    }

    return { success: true, message: 'Event reminders sent' };
  }
}

module.exports = EventService;
