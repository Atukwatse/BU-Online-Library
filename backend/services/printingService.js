/**
 * Printing Service
 */

const PrintingRequest = require('../models/mysql/PrintingRequest');
const NotificationService = require('./notificationService');
const config = require('../config');
const { ValidationError } = require('../utils/errors');
const { performance: logPerformance } = require('../utils/logger');

class PrintingService {
  /**
   * Create printing request
   */
  static async createPrintingRequest(userID, data) {
    const startTime = Date.now();
    const { title, description, pageCount, color, copies, priority, filePath } = data;

    if (!title || !pageCount) {
      throw new ValidationError('Title and page count are required');
    }

    if (pageCount > config.printing.maxPagesPerRequest) {
      throw new ValidationError(`Page count cannot exceed ${config.printing.maxPagesPerRequest}`);
    }

    if (copies < 1 || copies > 100) {
      throw new ValidationError('Copies must be between 1 and 100');
    }

    // Calculate cost
    const cost = PrintingRequest.calculateCost(pageCount, color, copies);

    const requestId = await PrintingRequest.create({
      userID,
      title,
      description,
      pageCount,
      color,
      copies,
      priority: priority || 'Medium',
      filePath,
    });

    // Update cost in database
    const db = require('../config/mysql_database');
    await db.query(
      'UPDATE PrintingRequests SET Cost = ? WHERE RequestID = ?',
      [cost, requestId]
    );

    // Notify staff/admin
    await NotificationService.notifyPrintingRequestCreated(requestId, userID, title);

    logPerformance('createPrintingRequest', Date.now() - startTime);
    return { requestId, cost, message: 'Printing request submitted successfully' };
  }

  /**
   * Get all printing requests
   */
  static async getPrintingRequests(filters = {}, page = 1, limit = 20) {
    return await PrintingRequest.findAll(filters, page, limit);
  }

  /**
   * Get printing request by ID
   */
  static async getPrintingRequestById(id) {
    const request = await PrintingRequest.findById(id);
    if (!request) {
      throw new ValidationError('Printing request not found');
    }
    return request;
  }

  /**
   * Update printing request (staff/admin)
   */
  static async updatePrintingRequest(id, data, reviewerID) {
    const request = await PrintingRequest.findById(id);
    if (!request) {
      throw new ValidationError('Printing request not found');
    }

    const { status, notes } = data;

    const completedDate = status === 'Completed' ? new Date() : null;

    await PrintingRequest.update(id, {
      status,
      notes,
      approvedBy: reviewerID,
      completedDate,
    });

    // Notify user of status update
    if (status !== request.Status) {
      await NotificationService.notifyPrintingStatusUpdate(
        request.UserID,
        request.Title,
        status
      );
    }

    return { success: true, message: 'Printing request updated' };
  }

  /**
   * Delete printing request
   */
  static async deletePrintingRequest(id) {
    await PrintingRequest.delete(id);
    return { success: true, message: 'Printing request deleted' };
  }

  /**
   * Get user's printing requests
   */
  static async getUserPrintingRequests(userID, page = 1, limit = 20) {
    return await PrintingRequest.findByUser(userID, page, limit);
  }

  /**
   * Get pending requests
   */
  static async getPendingRequests(page = 1, limit = 20) {
    return await PrintingRequest.getPendingRequests(page, limit);
  }

  /**
   * Get printing statistics
   */
  static async getPrintingStats() {
    return await PrintingRequest.getStats();
  }

  /**
   * Calculate cost estimate
   */
  static async calculateCostEstimate(pageCount, color, copies) {
    if (pageCount > config.printing.maxPagesPerRequest) {
      throw new ValidationError(`Page count cannot exceed ${config.printing.maxPagesPerRequest}`);
    }

    const cost = PrintingRequest.calculateCost(pageCount, color, copies);
    return { cost, pageCount, color, copies };
  }
}

module.exports = PrintingService;
