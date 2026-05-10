/**
 * Research Support Service
 */

const ResearchRequest = require('../models/mysql/ResearchRequest');
const NotificationService = require('./notificationService');
const { ValidationError } = require('../utils/errors');
const { performance: logPerformance } = require('../utils/logger');

class ResearchService {
  /**
   * Create research request
   */
  static async createResearchRequest(userID, data) {
    const startTime = Date.now();
    const { title, description, subject, priority, filePath } = data;

    if (!title || !description || !subject) {
      throw new ValidationError('Title, description, and subject are required');
    }

    const requestId = await ResearchRequest.create({
      userID,
      title,
      description,
      subject,
      priority: priority || 'Medium',
      filePath,
    });

    // Notify staff/admin
    await NotificationService.notifyResearchRequestCreated(requestId, userID, title);

    logPerformance('createResearchRequest', Date.now() - startTime);
    return { requestId, message: 'Research request submitted successfully' };
  }

  /**
   * Get all research requests
   */
  static async getResearchRequests(filters = {}, page = 1, limit = 20) {
    return await ResearchRequest.findAll(filters, page, limit);
  }

  /**
   * Get research request by ID
   */
  static async getResearchRequestById(id) {
    const request = await ResearchRequest.findById(id);
    if (!request) {
      throw new ValidationError('Research request not found');
    }
    return request;
  }

  /**
   * Update research request (staff/admin)
   */
  static async updateResearchRequest(id, data, reviewerID) {
    const request = await ResearchRequest.findById(id);
    if (!request) {
      throw new ValidationError('Research request not found');
    }

    const { status, response, filePath } = data;

    await ResearchRequest.update(id, {
      status,
      response,
      reviewedBy: reviewerID,
      filePath,
    });

    // Notify user of status update
    if (status !== request.Status) {
      await NotificationService.notifyResearchStatusUpdate(
        request.UserID,
        request.Title,
        status
      );
    }

    return { success: true, message: 'Research request updated' };
  }

  /**
   * Delete research request
   */
  static async deleteResearchRequest(id) {
    await ResearchRequest.delete(id);
    return { success: true, message: 'Research request deleted' };
  }

  /**
   * Get user's research requests
   */
  static async getUserResearchRequests(userID, page = 1, limit = 20) {
    return await ResearchRequest.findByUser(userID, page, limit);
  }

  /**
   * Get pending requests
   */
  static async getPendingRequests(page = 1, limit = 20) {
    return await ResearchRequest.getPendingRequests(page, limit);
  }

  /**
   * Get research statistics
   */
  static async getResearchStats() {
    return await ResearchRequest.getStats();
  }
}

module.exports = ResearchService;
