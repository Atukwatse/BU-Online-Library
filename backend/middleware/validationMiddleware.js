/**
 * Validation Middleware using Joi
 */
const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

/**
 * Generic validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {string} property - Request property to validate (body, query, params)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      throw new ValidationError('Validation failed', errors);
    }

    req[property] = value;
    next();
  };
};

/**
 * Common validation schemas
 */
const schemas = {
  // Auth schemas
  register: Joi.object({
    fullName: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      }),
    role: Joi.string().valid('Student', 'Staff', 'Admin').optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      })
      .required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      })
      .required(),
  }),

  // User schemas
  updateProfile: Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    department: Joi.string().optional(),
  }),

  // Book schemas
  createBook: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    author: Joi.string().min(1).max(255).required(),
    isbn: Joi.string().pattern(/^[0-9-]{10,17}$/).optional(),
    categoryID: Joi.number().integer().positive().required(),
    year: Joi.number().integer().min(1800).max(new Date().getFullYear() + 1).optional(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid('Available', 'Unavailable', 'Archived').optional(),
    publisher: Joi.string().max(255).optional(),
    language: Joi.string().max(50).optional(),
    edition: Joi.string().max(50).optional(),
  }),

  updateBook: Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    author: Joi.string().min(1).max(255).optional(),
    isbn: Joi.string().pattern(/^[0-9-]{10,17}$/).optional(),
    categoryID: Joi.number().integer().positive().optional(),
    year: Joi.number().integer().min(1800).max(new Date().getFullYear() + 1).optional(),
    description: Joi.string().max(2000).optional(),
    status: Joi.string().valid('Available', 'Unavailable', 'Archived').optional(),
    publisher: Joi.string().max(255).optional(),
    language: Joi.string().max(50).optional(),
    edition: Joi.string().max(50).optional(),
  }),

  // Category schemas
  createCategory: Joi.object({
    name: Joi.string().min(1).max(100).required(),
    description: Joi.string().max(500).optional(),
  }),

  updateCategory: Joi.object({
    name: Joi.string().min(1).max(100).optional(),
    description: Joi.string().max(500).optional(),
  }),

  // Pagination and filtering
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  }),

  // Search
  search: Joi.object({
    query: Joi.string().min(1).required(),
    category: Joi.number().integer().positive().optional(),
    year: Joi.number().integer().optional(),
    author: Joi.string().optional(),
  }),

  // Event schemas
  createEvent: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000).required(),
    venue: Joi.string().max(255).required(),
    speaker: Joi.string().max(255).optional(),
    date: Joi.date().iso().required(),
    time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    capacity: Joi.number().integer().min(1).required(),
  }),

  updateEvent: Joi.object({
    title: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(2000).optional(),
    venue: Joi.string().max(255).optional(),
    speaker: Joi.string().max(255).optional(),
    date: Joi.date().iso().optional(),
    time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
    capacity: Joi.number().integer().min(1).optional(),
    status: Joi.string().valid('Upcoming', 'Ongoing', 'Completed', 'Cancelled').optional(),
  }),

  // Research request schemas
  createResearchRequest: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(2000).required(),
    subject: Joi.string().max(100).required(),
    priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  }),

  updateResearchRequest: Joi.object({
    status: Joi.string().valid('Pending', 'In Review', 'Completed', 'Rejected').optional(),
    response: Joi.string().max(2000).optional(),
  }),

  // Printing request schemas
  createPrintingRequest: Joi.object({
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).optional(),
    pageCount: Joi.number().integer().min(1).required(),
    color: Joi.boolean().required(),
    copies: Joi.number().integer().min(1).max(100).default(1),
    priority: Joi.string().valid('Low', 'Medium', 'High').default('Medium'),
  }),

  updatePrintingRequest: Joi.object({
    status: Joi.string().valid('Pending', 'Approved', 'In Progress', 'Completed', 'Rejected').optional(),
    notes: Joi.string().max(1000).optional(),
  }),

  // Borrow request schemas
  createBorrowRequest: Joi.object({
    bookID: Joi.number().integer().positive().required(),
    dueDate: Joi.date().iso().min('now').required(),
    notes: Joi.string().max(500).optional(),
  }),

  updateBorrowRequest: Joi.object({
    status: Joi.string().valid('Pending', 'Approved', 'Rejected', 'Borrowed', 'Returned', 'Overdue').optional(),
    notes: Joi.string().max(500).optional(),
  }),
};

module.exports = {
  validate,
  schemas,
};
