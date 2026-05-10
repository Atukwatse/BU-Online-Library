/**
 * Borrowing Service
 * Handles borrowing logic and business rules
 */

const BorrowRequest = require('../models/mysql/BorrowRequest');
const Book = require('../models/mysql/Book');
const { ValidationError, ConflictError } = require('../utils/errors');
const { performance: logPerformance } = require('../utils/logger');

class BorrowingService {
  /**
   * Create borrow request
   */
  static async createBorrowRequest(userID, bookID, dueDate, notes) {
    const startTime = Date.now();

    // Check if book exists and is available
    const book = await Book.findById(bookID);
    if (!book) {
      throw new ValidationError('Book not found');
    }

    if (book.Status !== 'Available') {
      throw new ValidationError('Book is not available for borrowing');
    }

    if (book.AvailableCopies <= 0) {
      throw new ConflictError('No copies available for borrowing');
    }

    // Check if user has already borrowed this book and not returned
    const existingBorrowing = await BorrowRequest.getUserBorrowingHistory(userID, 1, 100);
    const activeBorrowing = existingBorrowing.find(b => b.BookID === parseInt(bookID) && b.Status === 'Borrowed');
    if (activeBorrowing) {
      throw new ConflictError('You already have this book borrowed');
    }

    // Validate due date
    const due = new Date(dueDate);
    const maxDueDate = new Date();
    maxDueDate.setDate(maxDueDate.getDate() + 30); // Max 30 days from now

    if (due < new Date()) {
      throw new ValidationError('Due date must be in the future');
    }

    if (due > maxDueDate) {
      throw new ValidationError('Due date cannot be more than 30 days from now');
    }

    // Create borrow request
    const requestId = await BorrowRequest.create({
      userID,
      bookID,
      dueDate,
      notes,
    });

    logPerformance('createBorrowRequest', Date.now() - startTime);
    return { requestId, message: 'Borrow request submitted successfully' };
  }

  /**
   * Get all borrow requests (with filters)
   */
  static async getBorrowRequests(filters = {}, page = 1, limit = 20) {
    return await BorrowRequest.findAll(filters, page, limit);
  }

  /**
   * Approve borrow request
   */
  static async approveRequest(requestId, approvedBy) {
    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      throw new ValidationError('Borrow request not found');
    }

    if (request.Status !== 'Pending') {
      throw new ValidationError('Request has already been processed');
    }

    // Check book availability again
    const book = await Book.findById(request.BookID);
    if (book.AvailableCopies <= 0) {
      throw new ConflictError('No copies available');
    }

    await BorrowRequest.approve(requestId, approvedBy);

    return { success: true, message: 'Borrow request approved' };
  }

  /**
   * Reject borrow request
   */
  static async rejectRequest(requestId, rejectedBy, notes) {
    const request = await BorrowRequest.findById(requestId);
    if (!request) {
      throw new ValidationError('Borrow request not found');
    }

    if (request.Status !== 'Pending') {
      throw new ValidationError('Request has already been processed');
    }

    await BorrowRequest.reject(requestId, rejectedBy, notes);

    return { success: true, message: 'Borrow request rejected' };
  }

  /**
   * Return borrowed book
   */
  static async returnBook(borrowingID, returnedBy, notes) {
    const borrowing = await BorrowRequest.getBorrowingById(borrowingID);
    if (!borrowing) {
      throw new ValidationError('Borrowing record not found');
    }

    if (borrowing.Status !== 'Borrowed') {
      throw new ValidationError('Book has already been returned');
    }

    await BorrowRequest.returnBook(borrowingID, returnedBy, notes);

    // Calculate penalty if overdue
    const { penalty, daysOverdue } = await BorrowRequest.calculatePenalty(borrowingID);

    return { 
      success: true, 
      message: 'Book returned successfully',
      penalty: penalty > 0 ? penalty : null,
      daysOverdue: daysOverdue > 0 ? daysOverdue : null,
    };
  }

  /**
   * Get overdue borrowings
   */
  static async getOverdueBorrowings(page = 1, limit = 20) {
    return await BorrowRequest.getOverdueBorrowings(page, limit);
  }

  /**
   * Get user's borrowing history
   */
  static async getUserBorrowingHistory(userID, page = 1, limit = 20) {
    return await BorrowRequest.getUserBorrowingHistory(userID, page, limit);
  }

  /**
   * Get borrowing statistics
   */
  static async getBorrowingStats() {
    return await BorrowRequest.getStats();
  }

  /**
   * Mark overdue borrowings
   */
  static async markOverdueBorrowings() {
    const sql = `
      UPDATE Borrowings
      SET Status = 'Overdue',
          UpdatedAt = NOW()
      WHERE Status = 'Borrowed' AND DueDate < NOW()
    `;
    
    await BorrowRequest.constructor.query?.(sql) || await require('../config/mysql_database').query(sql);
    return { success: true, message: 'Overdue borrowings marked' };
  }

  /**
   * Get pending requests count
   */
  static async getPendingRequestsCount() {
    const result = await BorrowRequest.findAll({ status: 'Pending' }, 1, 1);
    return result.pagination.total;
  }

  /**
   * Get active borrowings for a user
   */
  static async getUserActiveBorrowings(userID) {
    const history = await BorrowRequest.getUserBorrowingHistory(userID, 1, 100);
    return history.filter(b => b.Status === 'Borrowed');
  }
}

module.exports = BorrowingService;
