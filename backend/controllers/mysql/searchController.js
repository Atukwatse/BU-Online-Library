/**
 * Search Controller
 * Handles advanced search functionality
 */

const SearchService = require('../../services/searchService');
const { ValidationError } = require('../../utils/errors');

// @desc    Smart book search
// @route   GET /api/search/books
// @access  Public
exports.searchBooks = async (req, res, next) => {
  try {
    const {
      query,
      category,
      author,
      year,
      publisher,
      language,
      tags,
      rating,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    // Log search for analytics
    if (query && req.user) {
      await SearchService.logSearch(query, req.user.id, {
        category,
        author,
        year,
        publisher,
        language,
        tags,
        rating,
      });
    }

    const result = await SearchService.searchBooks({
      query,
      category: category ? parseInt(category) : undefined,
      author,
      year: year ? parseInt(year) : undefined,
      publisher,
      language,
      tags: tags ? tags.split(',') : undefined,
      rating: rating ? parseInt(rating) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      sortBy,
      sortOrder,
    });

    res.status(200).json({
      status: 'success',
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global search
// @route   GET /api/search/global
// @access  Public
exports.globalSearch = async (req, res, next) => {
  try {
    const { query, limit } = req.query;

    if (!query) {
      throw new ValidationError('Search query is required');
    }

    const result = await SearchService.globalSearch(query, { limit });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get search suggestions
// @route   GET /api/search/suggestions
// @access  Public
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { query, limit } = req.query;

    if (!query) {
      throw new ValidationError('Search query is required');
    }

    const result = await SearchService.getSearchSuggestions(query, limit);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get popular search terms
// @route   GET /api/search/popular
// @access  Public
exports.getPopularSearchTerms = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const result = await SearchService.getPopularSearchTerms(limit);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get filter options
// @route   GET /api/search/filters
// @access  Public
exports.getFilterOptions = async (req, res, next) => {
  try {
    const result = await SearchService.getFilterOptions();

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
