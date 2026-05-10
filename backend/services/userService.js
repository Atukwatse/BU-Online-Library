/**
 * User Service
 * Handles user-related business logic
 */

const BaseService = require('./baseService');
const User = require('../models/mysql/User');
const { ConflictError, ValidationError } = require('../utils/errors');
const { performance: logPerformance } = require('../utils/logger');

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  /**
   * Get all users with filtering and pagination
   */
  async getAllUsers(options = {}) {
    const startTime = Date.now();
    const { search, role, status, page = 1, limit = 10, sortBy = 'DateRegistered', sortOrder = 'DESC' } = options;
    
    const filters = {};
    if (search) filters.search = search;
    if (role) filters.role = role;
    if (status) filters.status = status;
    
    const result = await this.findAll({
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });

    logPerformance('getAllUsers', Date.now() - startTime);
    return result;
  }

  /**
   * Get user by ID with statistics
   */
  async getUserById(id) {
    const startTime = Date.now();
    const user = await this.findById(id);
    const stats = await user.getStats();
    
    logPerformance('getUserById', Date.now() - startTime);
    return { ...user.toJSON(), ...stats };
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const startTime = Date.now();
    const { fullName, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const data = {
      fullName,
      email,
      password,
      role: role || 'Student',
      dateRegistered: new Date(),
    };

    const user = await this.create(data);
    logPerformance('createUser', Date.now() - startTime);
    return user;
  }

  /**
   * Update user profile
   */
  async updateUser(id, updateData) {
    const startTime = Date.now();
    const { email, ...otherData } = updateData;

    const user = await this.findById(id);

    // Check if email is being changed and if it's already taken
    if (email && email !== user.Email) {
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('Email already in use');
      }
      otherData.email = email;
    }

    const updatedUser = await this.update(id, otherData);
    logPerformance('updateUser', Date.now() - startTime);
    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const startTime = Date.now();
    const user = await User.findByEmailWithPassword(userId);
    
    if (!user) {
      throw new ValidationError('User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ValidationError('Current password is incorrect');
    }

    await this.update(userId, { password: newPassword });
    logPerformance('changePassword', Date.now() - startTime);
    return { success: true };
  }

  /**
   * Suspend user account
   */
  async suspendUser(id, reason = '') {
    const startTime = Date.now();
    await this.update(id, { status: 'Suspended' });
    logPerformance('suspendUser', Date.now() - startTime);
    return { success: true, message: 'User suspended successfully' };
  }

  /**
   * Activate user account
   */
  async activateUser(id) {
    const startTime = Date.now();
    await this.update(id, { status: 'Active' });
    logPerformance('activateUser', Date.now() - startTime);
    return { success: true, message: 'User activated successfully' };
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(id) {
    const startTime = Date.now();
    await this.delete(id);
    logPerformance('deleteUser', Date.now() - startTime);
    return { success: true, message: 'User deleted successfully' };
  }

  /**
   * Search users
   */
  async searchUsers(query, options = {}) {
    const startTime = Date.now();
    const { page = 1, limit = 10 } = options;
    
    // This would be implemented in the User model
    const users = await User.findAll({
      filters: { search: query },
      limit,
      offset: (page - 1) * limit,
    });

    logPerformance('searchUsers', Date.now() - startTime);
    return users;
  }

  /**
   * Get user statistics
   */
  async getUserStats(id) {
    const startTime = Date.now();
    const user = await this.findById(id);
    const stats = await user.getStats();
    logPerformance('getUserStats', Date.now() - startTime);
    return stats;
  }

  /**
   * Get user download history
   */
  async getUserDownloads(userId, page = 1, limit = 20) {
    const startTime = Date.now();
    // This would be implemented with Download model
    // const downloads = await Download.findByUser(userId, page, limit);
    logPerformance('getUserDownloads', Date.now() - startTime);
    return { downloads: [], total: 0 };
  }

  /**
   * Update user role
   */
  async updateUserRole(id, newRole) {
    const startTime = Date.now();
    const validRoles = ['Student', 'Staff', 'Admin', 'SuperAdmin'];
    
    if (!validRoles.includes(newRole)) {
      throw new ValidationError('Invalid role');
    }

    await this.update(id, { role: newRole });
    logPerformance('updateUserRole', Date.now() - startTime);
    return { success: true, message: 'User role updated successfully' };
  }
}

module.exports = new UserService();
