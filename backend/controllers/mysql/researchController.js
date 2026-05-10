/**
 * Research Support Controller
 */

const ResearchService = require('../../services/researchService');
const { ValidationError } = require('../../utils/errors');

// @desc    Create research request
// @route   POST /api/research/requests
// @access  Private
exports.createResearchRequest = async (req, res, next) => {
  try {
    const result = await ResearchService.createResearchRequest(req.user.id, req.body);

    res.status(201).json({
      status: 'success',
      message: result.message,
      data: { requestId: result.requestId },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get research requests
// @route   GET /api/research/requests
// @access  Private/Admin,Staff
exports.getResearchRequests = async (req, res, next) => {
  try {
    const { status, priority, subject, page, limit } = req.query;

    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (subject) filters.subject = subject;

    const result = await ResearchService.getResearchRequests(filters, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's research requests
// @route   GET /api/research/my-requests
// @access  Private
exports.getMyResearchRequests = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await ResearchService.getUserResearchRequests(req.user.id, page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get research request by ID
// @route   GET /api/research/requests/:id
// @access  Private
exports.getResearchRequestById = async (req, res, next) => {
  try {
    const request = await ResearchService.getResearchRequestById(req.params.id);

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

// @desc    Update research request
// @route   PUT /api/research/requests/:id
// @access  Private/Admin,Staff
exports.updateResearchRequest = async (req, res, next) => {
  try {
    const result = await ResearchService.updateResearchRequest(
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

// @desc    Delete research request
// @route   DELETE /api/research/requests/:id
// @access  Private
exports.deleteResearchRequest = async (req, res, next) => {
  try {
    const request = await ResearchService.getResearchRequestById(req.params.id);

    // Only user who created it or admin can delete
    if (request.UserID !== req.user.id && 
        req.user.role !== 'Admin' &&
        req.user.role !== 'SuperAdmin') {
      throw new ValidationError('Access denied');
    }

    await ResearchService.deleteResearchRequest(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Research request deleted',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending research requests
// @route   GET /api/research/pending
// @access  Private/Admin,Staff
exports.getPendingRequests = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await ResearchService.getPendingRequests(page, limit);

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get research statistics
// @route   GET /api/research/stats
// @access  Private/Admin,Staff
exports.getResearchStats = async (req, res, next) => {
  try {
    const stats = await ResearchService.getResearchStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
