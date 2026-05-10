const jwt = require('jsonwebtoken');
const User = require('../models/mysql/User');

// Verify token and attach user object to request
const authenticateToken = async (req, res, next) => {
  let token;

  // Get token from header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No token provided.',
      code: 'NO_TOKEN'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // Get fresh user data from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user is still active
    if (user.Status === 'Suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is suspended. Please contact administrator.',
        code: 'ACCOUNT_SUSPENDED'
      });
    }

    // Attach user and token to request
    req.user = user.toJSON();
    req.token = token;
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
};

// Role-based authorization middleware
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Check if user role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Access denied. User role '${req.user.role}' is not authorized to access this resource.`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const authorizePermissions = (...requiredPermissions) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Get user permissions based on role
    const userPermissions = getPermissionsForRole(req.user.role);

    // Check if user has required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions to access this resource',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredPermissions,
        userPermissions,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Get permissions for each role
const getPermissionsForRole = (role) => {
  const permissions = {
    Admin: [
      'users:read', 'users:write', 'users:delete',
      'books:read', 'books:write', 'books:delete',
      'categories:read', 'categories:write', 'categories:delete',
      'downloads:read', 'downloads:manage',
      'system:admin', 'system:config', 'system:logs',
      'reports:read', 'reports:export'
    ],
    Staff: [
      'books:read', 'books:write',
      'categories:read',
      'downloads:read',
      'reports:read'
    ],
    Student: [
      'books:read',
      'downloads:create',
      'profile:read', 'profile:write',
      'search:books', 'search:categories'
    ]
  };

  return permissions[role] || [];
};

// Check if user has specific permission
const hasPermission = (user, permission) => {
  const userPermissions = getPermissionsForRole(user.role);
  return userPermissions.includes(permission);
};

// Middleware to check if user owns the resource
const checkResourceOwnership = (resourceType) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'Admin') {
      return next();
    }

    const resourceId = req.params.id || req.params.userId || req.params.bookId;
    
    try {
      switch (resourceType) {
        case 'profile':
          // Users can only access their own profile
          if (req.user.id !== parseInt(resourceId)) {
            return res.status(403).json({
              status: 'error',
              message: 'You can only access your own profile',
              code: 'RESOURCE_ACCESS_DENIED'
            });
          }
          break;

        case 'download':
          // Check if user has access to download this book
          const Download = require('../models/mysql/Download');
          const hasAccess = await Download.hasUserDownloadedBook(req.user.id, resourceId);
          
          if (!hasAccess && req.user.role !== 'Staff') {
            return res.status(403).json({
              status: 'error',
              message: 'You do not have access to download this book',
              code: 'RESOURCE_ACCESS_DENIED'
            });
          }
          break;

        default:
          // For other resources, Staff can access anything
          if (req.user.role === 'Student') {
            return res.status(403).json({
              status: 'error',
              message: 'Insufficient permissions to access this resource',
              code: 'RESOURCE_ACCESS_DENIED'
            });
          }
      }
    } catch (error) {
      console.error('Resource ownership check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to check resource access',
        code: 'ACCESS_CHECK_ERROR'
      });
    }

    next();
  };
};

// Middleware to get user's accessible routes
const getAccessibleRoutes = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  const routes = getRoutesForRole(req.user.role);
  
  req.accessibleRoutes = routes;
  next();
};

// Get accessible routes based on role
const getRoutesForRole = (role) => {
  const routes = {
    Admin: [
      { path: '/admin/dashboard', name: 'Dashboard', icon: 'dashboard' },
      { path: '/admin/users', name: 'User Management', icon: 'people' },
      { path: '/admin/books', name: 'Book Management', icon: 'book' },
      { path: '/admin/categories', name: 'Categories', icon: 'category' },
      { path: '/admin/downloads', name: 'Downloads', icon: 'download' },
      { path: '/admin/reports', name: 'Reports', icon: 'analytics' },
      { path: '/admin/settings', name: 'System Settings', icon: 'settings' }
    ],
    Staff: [
      { path: '/staff/dashboard', name: 'Dashboard', icon: 'dashboard' },
      { path: '/staff/books', name: 'Book Management', icon: 'book' },
      { path: '/staff/categories', name: 'Categories', icon: 'category' },
      { path: '/staff/downloads', name: 'Downloads', icon: 'download' },
      { path: '/staff/reports', name: 'Reports', icon: 'analytics' }
    ],
    Student: [
      { path: '/user/dashboard', name: 'Dashboard', icon: 'dashboard' },
      { path: '/user/books', name: 'Browse Books', icon: 'book' },
      { path: '/user/my-downloads', name: 'My Downloads', icon: 'download' },
      { path: '/user/profile', name: 'My Profile', icon: 'person' },
      { path: '/user/search', name: 'Search', icon: 'search' }
    ]
  };

  return routes[role] || [];
};

// Middleware to validate session and redirect if needed
const validateSessionAndRedirect = (allowedRoles = []) => {
  return (req, res, next) => {
    // If no user is authenticated, redirect to login
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required',
        redirect: '/login',
        code: 'AUTH_REQUIRED'
      });
    }

    // If specific roles are required, check them
    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      // Get the correct redirect URL for user's role
      const correctRedirect = getRedirectUrlForRole(req.user.role);
      
      return res.status(403).json({
        status: 'error',
        message: `Access denied. Redirecting to your dashboard.`,
        redirect: correctRedirect,
        code: 'ROLE_REDIRECT'
      });
    }

    next();
  };
};

// Get redirect URL for role
const getRedirectUrlForRole = (role) => {
  const redirects = {
    Admin: '/admin/dashboard',
    Staff: '/staff/dashboard',
    Student: '/user/dashboard'
  };

  return redirects[role] || '/user/dashboard';
};

module.exports = {
  authenticateToken,
  authorize,
  authorizePermissions,
  hasPermission,
  checkResourceOwnership,
  getAccessibleRoutes,
  getRoutesForRole,
  getPermissionsForRole,
  validateSessionAndRedirect,
  getRedirectUrlForRole
};
