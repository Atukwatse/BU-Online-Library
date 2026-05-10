/**
 * Printing Service Controller
 */

const PrintingService = require('../../services/printingService');
const { ValidationError } = require('../../utils/errors');

// @desc    Create printing request
// @route   POST /api/printing/requests
// @access  Private
exports.createPrintingRequest = async (req, res, next) => {
  try {
    const result = await PrintingService.createPrintingRequest(req.user.id, req.body);

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: { requestId: result.requestId, cost: result.cost },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get printing requests
// @route   GET /api/printing/requests
// @access  Private/Admin,Staff
exports.getPrintingRequests = async (req, res, next) => {
  try {
    const { status, priority, page, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const result = await PrintingService.getPrintingRequests(filters, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's printing requests
// @route   GET /api/printing/my-requests
// @access  Private
exports.getMyPrintingRequests = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await PrintingService.getUserPrintingRequests(req.user.id, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get printing request by ID
// @route   GET /api/printing/requests/:id
// @access  Private
exports.getPrintingRequestById = async (req, res, next) => {
  try {
    const request = await PrintingService.getPrintingRequestById(req.params.id);

    // Check if user owns the request or is admin/staff
    if (request.UserID !== req.user.id && 
        req.user.role !== 'Admin' && 
        req.user.role !== 'Staff' &&
        req.user.role !== 'SuperAdmin') {
      throw new ValidationError('Access denied');
    }

    res.status(200).json({
      status: 'success',
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update printing request
// @route   PUT /api/printing/requests/:id
// @access  Private/Admin,Staff
exports.updatePrintingRequest = async (req, res, next) => {
  try {
    const result = await PrintingService.updatePrintingRequest(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete printing request
// @route   DELETE /api/printing/requests/:id
// @access  Private
exports.deletePrintingRequest = async (req, res, next) => {
  try {
    const request = await PrintingService.getPrintingRequestById(req.params.id);

    // Only user who created it or admin can delete
    if (request.UserID !== req.user.id && 
        req.user.role !== 'Admin' &&
        req.user.role !== 'SuperAdmin') {
      throw new ValidationError('Access denied');
    }

    await PrintingService.deletePrintingRequest(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Printing request deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending printing requests
// @route   GET /api/printing/pending
// @access  Private/Admin,Staff
exports.getPendingRequests = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await PrintingService.getPendingRequests(page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get printing statistics
// @route   GET /api/printing/stats
// @access  Private/Admin,Staff
exports.getPrintingStats = async (req, res, next) => {
  try {
    const stats = await PrintingService.getPrintingStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Calculate cost estimate
// @route   POST /api/printing/calculate-cost
// @access  Private
exports.calculateCostEstimate = async (req, res, next) => {
  try {
    const { pageCount, color, copies } = req.body;

    if (!pageCount || color === undefined || !copies) {
      throw new ValidationError('Page count, color, and copies are required');
    }

    const result = await PrintingService.calculateCostEstimate(pageCount, color, copies);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
