const User = require('../../models/mysql/User');
const Download = require('../../models/mysql/Download');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    let filter = { page, limit };

    // Build filter based on query parameters
    if (search) filter.search = search;
    if (role) filter.role = role;
    if (status) filter.status = status;

    const users = await User.findAll(filter);
    const total = await User.count(filter);

    res.status(200).json({
      status: 'success',
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users.map(user => user.toJSON()),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get users'
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get user statistics
    const stats = await user.getStats();

    res.status(200).json({
      status: 'success',
      data: {
        ...user.toJSON(),
        ...stats
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get user'
    });
  }
};

// @desc    Create new user (admin only)
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res, next) => {
  try {
    const { fullName, email, password, role, status } = req.body;

    // Validate input
    if (!fullName || !email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide full name, email, and password'
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: role || 'Student',
      status: status || 'Active',
      dateRegistered: new Date(),
    });

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create user'
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { fullName, email, role, status, password } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role to non-admin
    if (req.user.id === parseInt(req.params.id) && role && role !== 'Admin') {
      return res.status(400).json({
        status: 'error',
        message: 'Admin cannot change their own role'
      });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) updateData.password = password;

    const updatedUser = await user.update(updateData);

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error('Update user error:', error);
    if (error.message.includes('already exists')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update user'
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot delete your own account'
      });
    }

    // Check if this is the last admin
    if (user.Role === 'Admin') {
      const adminCount = await User.count({ role: 'Admin', status: 'Active' });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete the last admin user'
        });
      }
    }

    await user.delete();

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete user'
    });
  }
};

// @desc    Toggle user status (suspend/activate)
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Prevent admin from suspending themselves
    if (req.user.id === parseInt(req.params.id)) {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot change your own status'
      });
    }

    // Check if this is the last admin being suspended
    if (user.Role === 'Admin' && user.Status === 'Active') {
      const adminCount = await User.count({ role: 'Admin', status: 'Active' });
      if (adminCount <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot suspend the last admin user'
        });
      }
    }

    const updatedUser = await user.toggleStatus();

    res.status(200).json({
      status: 'success',
      message: `User ${updatedUser.Status.toLowerCase()} successfully`,
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to toggle user status'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private/Admin
exports.getUserStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ status: 'Active' });
    const suspendedUsers = await User.count({ status: 'Suspended' });
    const adminUsers = await User.count({ role: 'Admin' });
    const studentUsers = await User.count({ role: 'Student' });

    // Get recent registrations
    const recentUsers = await User.findAll({ 
      page: 1, 
      limit: 5,
      sortBy: 'DateRegistered',
      sortOrder: 'DESC'
    });

    // Get active users (with downloads in last 30 days)
    const activeUsersWithDownloads = await Download.getActiveUsers(10, 30);

    res.status(200).json({
      status: 'success',
      data: {
        totalUsers,
        activeUsers,
        suspendedUsers,
        adminUsers,
        studentUsers,
        recentRegistrations: recentUsers.map(user => user.toJSON()),
        activeUsersWithDownloads
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get user statistics'
    });
  }
};

// @desc    Get user's download history
// @route   GET /api/users/:id/downloads
// @access  Private/Admin
exports.getUserDownloads = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const downloads = await Download.findByUser(parseInt(req.params.id), {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    const total = await Download.count({ userID: parseInt(req.params.id) });

    res.status(200).json({
      status: 'success',
      count: downloads.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: downloads.map(download => download.toJSON()),
    });
  } catch (error) {
    console.error('Get user downloads error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get user downloads'
    });
  }
};

// @desc    Reset user password
// @route   POST /api/users/:id/reset-password
// @access  Private/Admin
exports.resetUserPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a new password'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    await user.update({ password: newPassword });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to reset password'
    });
  }
};
