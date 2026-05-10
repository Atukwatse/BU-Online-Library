const express = require('express');
const { body } = require('express-validator');
const roleBasedAuthController = require('../../controllers/mysql/roleBasedAuthController');
const { authenticateToken, authorize, getAccessibleRoutes } = require('../../middleware/roleBasedAuth');
const asyncHandler = require('../../middleware/asyncHandler');

const router = express.Router();

// Validation middleware
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// @desc    Role-based login with redirect
// @route   POST /api/auth/role-login
// @access  Public
router.post('/role-login', validateLogin, asyncHandler(roleBasedAuthController.roleBasedLogin));

// @desc    Get user redirect information
// @route   GET /api/auth/redirect-info
// @access  Private
router.get('/redirect-info', authenticateToken, asyncHandler(roleBasedAuthController.getRedirectInfo));

// @desc    Verify token and return redirect info
// @route   POST /api/auth/verify-token
// @access  Public
router.post('/verify-token', asyncHandler(roleBasedAuthController.verifyToken));

// @desc    Switch user role (for multi-role users)
// @route   POST /api/auth/switch-role
// @access  Private
router.post('/switch-role', authenticateToken, asyncHandler(roleBasedAuthController.switchRole));

// @desc    Refresh token with updated redirect info
// @route   POST /api/auth/refresh-token
// @access  Private
router.post('/refresh-token', authenticateToken, asyncHandler(roleBasedAuthController.refreshToken));

// @desc    Get user's accessible routes and permissions
// @route   GET /api/auth/accessible-routes
// @access  Private
router.get('/accessible-routes', authenticateToken, getAccessibleRoutes, asyncHandler(async (req, res, next) => {
  try {
    const userPermissions = require('../../middleware/roleBasedAuth').getPermissionsForRole(req.user.role);
    
    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
        role: req.user.role,
        permissions: userPermissions,
        accessibleRoutes: req.accessibleRoutes,
        redirectUrl: require('../../middleware/roleBasedAuth').getRedirectUrlForRole(req.user.role)
      }
    });
  } catch (error) {
    next(error);
  }
}));

// @desc    Check if user has specific permission
// @route   POST /api/auth/check-permission
// @access  Private
router.post('/check-permission', authenticateToken, asyncHandler(async (req, res, next) => {
  try {
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json({
        status: 'error',
        message: 'Permission is required'
      });
    }

    const hasPermission = require('../../middleware/roleBasedAuth').hasPermission(req.user, permission);

    res.status(200).json({
      status: 'success',
      data: {
        hasPermission,
        permission,
        userRole: req.user.role
      }
    });
  } catch (error) {
    next(error);
  }
}));

// @desc    Get role-based dashboard data
// @route   GET /api/auth/dashboard-data
// @access  Private
router.get('/dashboard-data', authenticateToken, asyncHandler(async (req, res, next) => {
  try {
    const User = require('../../models/mysql/User');
    const Book = require('../../models/mysql/Book');
    const Download = require('../../models/mysql/Download');

    let dashboardData = {
      user: req.user,
      role: req.user.role,
      lastLogin: req.user.lastLogin
    };

    // Get role-specific dashboard data
    switch (req.user.role) {
      case 'Admin':
        const totalUsers = await User.count();
        const totalBooks = await Book.count();
        const totalDownloads = await Download.getStats();
        const recentUsers = await User.findAll({ limit: 5 });
        
        dashboardData = {
          ...dashboardData,
          stats: {
            totalUsers,
            totalBooks,
            totalDownloads: totalDownloads.totalDownloads,
            activeUsers: totalDownloads.uniqueUsers
          },
          recentActivity: {
            users: recentUsers.map(u => u.toJSON()),
            summary: `${totalUsers} total users, ${totalBooks} books, ${totalDownloads.totalDownloads} downloads`
          }
        };
        break;

      case 'Staff':
        const staffBooks = await Book.findAll({ limit: 10 });
        const staffDownloads = await Download.getRecentDownloads(10);
        const categories = await Book.findAll({ distinct: 'category' });
        
        dashboardData = {
          ...dashboardData,
          stats: {
            totalBooks: staffBooks.length,
            recentDownloads: staffDownloads.length,
            totalCategories: categories.length
          },
          recentActivity: {
            books: staffBooks.map(b => b.toJSON()),
            downloads: staffDownloads
          }
        };
        break;

      case 'Student':
        const studentDownloads = await Download.findByUser(req.user.id, { limit: 5 });
        const popularBooks = await Book.getPopularBooks(5);
        const userStats = await User.findById(req.user.id);
        
        dashboardData = {
          ...dashboardData,
          stats: {
            downloadCount: userStats.DownloadCount,
            recentDownloads: studentDownloads.length
          },
          recommendations: {
            popularBooks: popularBooks.map(b => b.toJSON()),
            categories: await Book.findAll({ distinct: 'category', limit: 5 })
          }
        };
        break;
    }

    res.status(200).json({
      status: 'success',
      data: dashboardData
    });

  } catch (error) {
    next(error);
  }
}));

// @desc    Logout with role cleanup
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', authenticateToken, asyncHandler(async (req, res, next) => {
  try {
    // In a stateless JWT system, we don't need to do anything server-side
    // The client should delete the token
    
    res.status(200).json({
      status: 'success',
      message: 'Logout successful',
      redirect: '/login',
      clearToken: true
    });
  } catch (error) {
    next(error);
  }
}));

module.exports = router;
