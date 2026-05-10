const jwt = require('jsonwebtoken');
const User = require('../../models/mysql/User');
const { body, validationResult } = require('express-validator');

// Generate JWT Token with role information
const generateToken = (user) => {
  return jwt.sign({ 
    id: user.UserID, 
    email: user.Email,
    role: user.Role,
    fullName: user.FullName
  }, process.env.JWT_SECRET || 'your_jwt_secret_key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Role-based user login
// @route   POST /api/auth/role-login
// @access  Public
exports.roleBasedLogin = async (req, res, next) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user with password
    const user = await User.findByEmailWithPassword(email);

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Check account status
    if (user.Status === 'Suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is suspended. Please contact administrator.'
      });
    }

    // Verify password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid email or password'
      });
    }

    // Update last login
    await user.updateLastLogin();

    // Generate JWT token with role information
    const token = generateToken(user);

    // Determine redirect URL based on role
    let redirectUrl;
    switch (user.Role) {
      case 'Admin':
        redirectUrl = '/admin/dashboard';
        break;
      case 'Staff':
        redirectUrl = '/staff/dashboard';
        break;
      case 'Student':
      default:
        redirectUrl = '/user/dashboard';
        break;
    }

    // Return success response with redirect URL
    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      token,
      user: {
        id: user.UserID,
        fullName: user.FullName,
        email: user.Email,
        role: user.Role,
        status: user.Status,
        lastLogin: user.LastLogin,
        downloadCount: user.DownloadCount
      },
      redirect: redirectUrl,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

  } catch (error) {
    console.error('Role-based login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error during login'
    });
  }
};

// @desc    Get user role and redirect info
// @route   GET /api/auth/redirect-info
// @access  Private
exports.getRedirectInfo = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Determine redirect URL and permissions based on role
    let redirectUrl, permissions, dashboardType;

    switch (user.Role) {
      case 'Admin':
        redirectUrl = '/admin/dashboard';
        permissions = [
          'users:read', 'users:write', 'users:delete',
          'books:read', 'books:write', 'books:delete',
          'categories:read', 'categories:write', 'categories:delete',
          'downloads:read', 'system:admin'
        ];
        dashboardType = 'Admin';
        break;
        
      case 'Staff':
        redirectUrl = '/staff/dashboard';
        permissions = [
          'books:read', 'books:write',
          'categories:read',
          'downloads:read'
        ];
        dashboardType = 'Staff';
        break;
        
      case 'Student':
      default:
        redirectUrl = '/user/dashboard';
        permissions = [
          'books:read',
          'downloads:create',
          'profile:read', 'profile:write'
        ];
        dashboardType = 'User';
        break;
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: user.toJSON(),
        redirectUrl,
        permissions,
        dashboardType,
        role: user.Role
      }
    });

  } catch (error) {
    console.error('Get redirect info error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get redirect information'
    });
  }
};

// @desc    Verify token and return user info with redirect
// @route   POST /api/auth/verify-token
// @access  Public
exports.verifyToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Token is required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    
    // Get user from database
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if user is still active
    if (user.Status === 'Suspended') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is suspended'
      });
    }

    // Determine redirect URL based on role
    let redirectUrl;
    switch (user.Role) {
      case 'Admin':
        redirectUrl = '/admin/dashboard';
        break;
      case 'Staff':
        redirectUrl = '/staff/dashboard';
        break;
      case 'Student':
      default:
        redirectUrl = '/user/dashboard';
        break;
    }

    res.status(200).json({
      status: 'success',
      message: 'Token is valid',
      user: user.toJSON(),
      redirectUrl,
      expiresIn: decoded.exp
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid or expired token'
      });
    }

    console.error('Token verification error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to verify token'
    });
  }
};

// @desc    Switch user role (for users with multiple roles)
// @route   POST /api/auth/switch-role
// @access  Private
exports.switchRole = async (req, res, next) => {
  try {
    const { newRole } = req.body;

    if (!newRole) {
      return res.status(400).json({
        status: 'error',
        message: 'New role is required'
      });
    }

    // Validate role
    const validRoles = ['Admin', 'Staff', 'Student'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role specified'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update user role (if allowed)
    await user.update({ role: newRole });

    // Generate new token with updated role
    const newToken = generateToken({ ...user, Role: newRole });

    // Determine new redirect URL
    let redirectUrl;
    switch (newRole) {
      case 'Admin':
        redirectUrl = '/admin/dashboard';
        break;
      case 'Staff':
        redirectUrl = '/staff/dashboard';
        break;
      case 'Student':
      default:
        redirectUrl = '/user/dashboard';
        break;
    }

    res.status(200).json({
      status: 'success',
      message: 'Role switched successfully',
      token: newToken,
      redirectUrl,
      user: {
        ...user.toJSON(),
        role: newRole
      }
    });

  } catch (error) {
    console.error('Role switch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to switch role'
    });
  }
};

// @desc    Refresh token with new redirect info
// @route   POST /api/auth/refresh-token
// @access  Private
exports.refreshToken = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Generate new token
    const newToken = generateToken(user);

    // Get current redirect URL
    let redirectUrl;
    switch (user.Role) {
      case 'Admin':
        redirectUrl = '/admin/dashboard';
        break;
      case 'Staff':
        redirectUrl = '/staff/dashboard';
        break;
      case 'Student':
      default:
        redirectUrl = '/user/dashboard';
        break;
    }

    res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      token: newToken,
      redirectUrl,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to refresh token'
    });
  }
};
