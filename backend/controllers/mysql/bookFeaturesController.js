/**
 * Book Features Controller
 * Handles favorites, ratings, reviews, and advanced book features
 */

const BookRating = require('../../models/mysql/BookRating');
const BookFavorite = require('../../models/mysql/BookFavorite');
const BookReview = require('../../models/mysql/BookReview');
const Book = require('../../models/mysql/Book');
const { ValidationError, NotFoundError } = require('../../utils/errors');

// @desc    Add book to favorites
// @route   POST /api/books/:id/favorite
// @access  Private
exports.addToFavorites = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    await BookFavorite.create({
      bookID: req.params.id,
      userID: req.user.id,
    });

    res.status(201).json({
      status: 'success',
      message: 'Book added to favorites',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove book from favorites
// @route   DELETE /api/books/:id/favorite
// @access  Private
exports.removeFromFavorites = async (req, res, next) => {
  try {
    await BookFavorite.delete(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      message: 'Book removed from favorites',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle favorite status
// @route   POST /api/books/:id/favorite/toggle
// @access  Private
exports.toggleFavorite = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const result = await BookFavorite.toggle(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's favorites
// @route   GET /api/books/favorites
// @access  Private
exports.getFavorites = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const favorites = await BookFavorite.findByUser(req.user.id, page, limit);

    res.status(200).json({
      status: 'success',
      data: favorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if book is favorited
// @route   GET /api/books/:id/favorite/check
// @access  Private
exports.checkFavorite = async (req, res, next) => {
  try {
    const isFavorite = await BookFavorite.isFavorite(req.params.id, req.user.id);

    res.status(200).json({
      status: 'success',
      data: { isFavorite },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Rate a book
// @route   POST /api/books/:id/rating
// @access  Private
exports.rateBook = async (req, res, next) => {
  try {
    const { rating, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    await BookRating.create({
      bookID: req.params.id,
      userID: req.user.id,
      rating,
      review: review || null,
    });

    res.status(201).json({
      status: 'success',
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get book ratings
// @route   GET /api/books/:id/ratings
// @access  Public
exports.getBookRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const ratings = await BookRating.findByBook(req.params.id, page, limit);
    const stats = await BookRating.getAverageRating(req.params.id);

    res.status(200).json({
      status: 'success',
      data: ratings,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's ratings
// @route   GET /api/books/ratings/my-ratings
// @access  Private
exports.getMyRatings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const ratings = await BookRating.findByUser(req.user.id, page, limit);

    res.status(200).json({
      status: 'success',
      data: ratings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit a book review
// @route   POST /api/books/:id/reviews
// @access  Private
exports.createReview = async (req, res, next) => {
  try {
    const { review, rating } = req.body;

    if (!review || review.trim().length === 0) {
      throw new ValidationError('Review text is required');
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new ValidationError('Rating must be between 1 and 5');
    }

    const book = await Book.findById(req.params.id);
    if (!book) {
      throw new NotFoundError('Book not found');
    }

    const reviewId = await BookReview.create({
      bookID: req.params.id,
      userID: req.user.id,
      review,
      rating,
    });

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully. It will be visible after approval.',
      data: { reviewId },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get book reviews
// @route   GET /api/books/:id/reviews
// @access  Public
exports.getBookReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reviews = await BookReview.findByBook(req.params.id, page, limit);
    const stats = await BookReview.getStats(req.params.id);

    res.status(200).json({
      status: 'success',
      data: reviews,
      stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get pending reviews (admin)
// @route   GET /api/books/reviews/pending
// @access  Private/Admin
exports.getPendingReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const reviews = await BookReview.getPendingReviews(page, limit);

    res.status(200).json({
      status: 'success',
      data: reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve review (admin)
// @route   PUT /api/books/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = async (req, res, next) => {
  try {
    await BookReview.approve(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Review approved successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reject review (admin)
// @route   DELETE /api/books/reviews/:id
// @access  Private/Admin
exports.rejectReview = async (req, res, next) => {
  try {
    await BookReview.reject(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'Review rejected successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured books
// @route   GET /api/books/featured
// @access  Public
exports.getFeaturedBooks = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // This would be implemented in Book model
    const books = await Book.findAll({
      filters: { featured: true },
      limit: parseInt(limit),
    });

    res.status(200).json({
      status: 'success',
      data: books.data,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending books
// @route   GET /api/books/trending
// @access  Public
exports.getTrendingBooks = async (req, res, next) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    
    const books = await BookRating.getTopRatedBooks(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recommended books
// @route   GET /api/books/recommended
// @access  Private
exports.getRecommendedBooks = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // For now, return most favorited books
    const books = await BookFavorite.getMostFavoritedBooks(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recently viewed books
// @route   GET /api/books/recently-viewed
// @access  Private
exports.getRecentlyViewed = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    
    // This would require a RecentlyViewed table or session tracking
    // For now, return popular books
    const books = await Book.getPopularBooks(parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: books,
    });
  } catch (error) {
    next(error);
  }
};
