const User = require('../models/User');
const bcrypt = require('bcrypt');

// @desc    Get all users (admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;
    let filter = {};

    // Build filter based on query parameters
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { fullName: regex },
        { email: regex },
      ];
    }

    if (role) {
      filter.role = role;
    }

    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    
    const users = await User.find(filter)
      .select('-password')
      .sort({ dateRegistered: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      status: 'success',
      count: users.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    res.status(200).json({
      status: 'success',
      data: user,
    });
  } catch (error) {
    next(error);
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
      res.status(400);
      throw new Error('Please provide full name, email, and password');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error('User already exists with this email');
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

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: userResponse,
    });
  } catch (error) {
    next(error);
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
      res.status(404);
      throw new Error('User not found');
    }

    // Check if email already exists (excluding current user)
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(400);
        throw new Error('User already exists with this email');
      }
    }

    // Prevent admin from changing their own role to non-admin
    if (req.user.id === req.params.id && role && role !== 'Admin') {
      res.status(400);
      throw new Error('Admin cannot change their own role');
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // Handle password update
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent admin from deleting themselves
    if (req.user.id === req.params.id) {
      res.status(400);
      throw new Error('Cannot delete your own account');
    }

    // Prevent deletion of the last admin
    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin', status: 'Active' });
      if (adminCount <= 1) {
        res.status(400);
        throw new Error('Cannot delete the last admin user');
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (suspend/activate)
// @route   PATCH /api/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    // Prevent admin from suspending themselves
    if (req.user.id === req.params.id) {
      res.status(400);
      throw new Error('Cannot change your own status');
    }

    // Prevent suspension of the last admin
    if (user.role === 'Admin' && user.status === 'Active') {
      const adminCount = await User.countDocuments({ role: 'Admin', status: 'Active' });
      if (adminCount <= 1) {
        res.status(400);
        throw new Error('Cannot suspend the last admin user');
      }
    }

    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active';
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { status: newStatus },
      { new: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      message: `User ${newStatus.toLowerCase()} successfully`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};
