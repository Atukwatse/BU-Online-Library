/**
 * Book Features Routes
 * Handles favorites, ratings, reviews, and advanced book features
 */

const express = require('express');
const bookFeaturesController = require('../../controllers/mysql/bookFeaturesController');
const { asyncHandler } = require('../../middleware/enhancedErrorHandler');
const { authenticateToken, authorize } = require('../../middleware/enhancedRoleBasedAuth');

const router = express.Router({ mergeParams: true });

// Favorite routes
router.post('/:id/favorite', authenticateToken, asyncHandler(bookFeaturesController.addToFavorites));
router.delete('/:id/favorite', authenticateToken, asyncHandler(bookFeaturesController.removeFromFavorites));
router.post('/:id/favorite/toggle', authenticateToken, asyncHandler(bookFeaturesController.toggleFavorite));
router.get('/:id/favorite/check', authenticateToken, asyncHandler(bookFeaturesController.checkFavorite));
router.get('/favorites', authenticateToken, asyncHandler(bookFeaturesController.getFavorites));

// Rating routes
router.post('/:id/rating', authenticateToken, asyncHandler(bookFeaturesController.rateBook));
router.get('/:id/ratings', asyncHandler(bookFeaturesController.getBookRatings));
router.get('/ratings/my-ratings', authenticateToken, asyncHandler(bookFeaturesController.getMyRatings));

// Review routes
router.post('/:id/reviews', authenticateToken, asyncHandler(bookFeaturesController.createReview));
router.get('/:id/reviews', asyncHandler(bookFeaturesController.getBookReviews));
router.get('/reviews/pending', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(bookFeaturesController.getPendingReviews));
router.put('/reviews/:id/approve', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(bookFeaturesController.approveReview));
router.delete('/reviews/:id', authenticateToken, authorize('Admin', 'Staff'), asyncHandler(bookFeaturesController.rejectReview));

// Featured and trending routes
router.get('/featured', asyncHandler(bookFeaturesController.getFeaturedBooks));
router.get('/trending', asyncHandler(bookFeaturesController.getTrendingBooks));
router.get('/recommended', authenticateToken, asyncHandler(bookFeaturesController.getRecommendedBooks));
router.get('/recently-viewed', authenticateToken, asyncHandler(bookFeaturesController.getRecentlyViewed));

module.exports = router;
