/**
 * Borrowing Controller
 */

const BorrowingService = require('../../services/borrowingService');
const { ValidationError } = require('../../utils/errors');

// @desc    Create borrow request
// @route   POST /api/borrowing/requests
// @access  Private
exports.createBorrowRequest = async (req, res, next) => {
  try {
    const { bookID, dueDate, notes } = req.body;

    if (!bookID || !dueDate) {
      throw new ValidationError('Book ID and due date are required');
    }

    const result = await BorrowingService.createBorrowRequest(
      req.user.id,
      bookID,
      dueDate,
      notes
    );

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: { requestId: result.requestId },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get borrow requests
// @route   GET /api/borrowing/requests
// @access  Private/Admin,Staff
exports.getBorrowRequests = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;

    const result = await BorrowingService.getBorrowRequests(filters, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's borrow requests
// @route   GET /api/borrowing/my-requests
// @access  Private
exports.getMyBorrowRequests = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;

    const filters = { userID: req.user.id };
    if (status) filters.status = status;

    const result = await BorrowingService.getBorrowRequests(filters, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve borrow request
// @route   PUT /api/borrowing/requests/:id/approve
// @access  Private/Admin,Staff
exports.approveRequest = async (req, res, next) => {
  try {
    const result = await BorrowingService.approveRequest(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject borrow request
// @route   PUT /api/borrowing/requests/:id/reject
// @access  Private/Admin,Staff
exports.rejectRequest = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const result = await BorrowingService.rejectRequest(req.params.id, req.user.id, notes);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return borrowed book
// @route   PUT /api/borrowing/:id/return
// @access  Private/Admin,Staff
exports.returnBook = async (req, res, next) => {
  try {
    const { notes } = req.body;
    const result = await BorrowingService.returnBook(req.params.id, req.user.id, notes);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        penalty: result.penalty,
        daysOverdue: result.daysOverdue,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue borrowings
// @route   GET /api/borrowing/overdue
// @access  Private/Admin,Staff
exports.getOverdueBorrowings = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const borrowings = await BorrowingService.getOverdueBorrowings(page, limit);

    res.status(200).json({
      status: 'success',
      data: borrowings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's borrowing history
// @route   GET /api/borrowing/history
// @access  Private
exports.getBorrowingHistory = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const history = await BorrowingService.getUserBorrowingHistory(req.user.id, page, limit);

    res.status(200).json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get borrowing statistics
// @route   GET /api/borrowing/stats
// @access  Private/Admin,Staff
exports.getBorrowingStats = async (req, res, next) => {
  try {
    const stats = await BorrowingService.getBorrowingStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's active borrowings
// @route   GET /api/borrowing/active
// @access  Private
exports.getActiveBorrowings = async (req, res, next) => {
  try {
    const borrowings = await BorrowingService.getUserActiveBorrowings(req.user.id);

    res.status(200).json({
      status: 'success',
      data: borrowings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark overdue borrowings (cron job)
// @route   POST /api/borrowing/mark-overdue
// @access  Private/Admin
exports.markOverdueBorrowings = async (req, res, next) => {
  try {
    const result = await BorrowingService.markOverdueBorrowings();

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};
