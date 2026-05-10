/**
 * Book Service
 * Handles book-related business logic
 */

const BaseService = require('./baseService');
const Book = require('../models/mysql/Book');
const Category = require('../models/mysql/Category');
const Download = require('../models/mysql/Download');
const { ConflictError, ValidationError } = require('../utils/errors');
const { performance: logPerformance } = require('../utils/logger');

class BookService extends BaseService {
  constructor() {
    super(Book);
  }

  /**
   * Get all books with advanced filtering and pagination
   */
  async getAllBooks(options = {}) {
    const startTime = Date.now();
    const { search, category, status, year, author, page = 1, limit = 10, sortBy = 'DateAdded', sortOrder = 'DESC' } = options;
    
    const filters = {};
    if (search) filters.search = search;
    if (category) filters.category = category;
    if (status) filters.status = status;
    if (year) filters.year = year;
    if (author) filters.author = author;
    
    const result = await this.findAll({
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });

    logPerformance('getAllBooks', Date.now() - startTime, { count: result.data.length });
    return result;
  }

  /**
   * Get book by ID with statistics
   */
  async getBookById(id) {
    const startTime = Date.now();
    const book = await this.findById(id);
    const stats = await book.getStats();
    
    logPerformance('getBookById', Date.now() - startTime);
    return { ...book.toJSON(), ...stats };
  }

  /**
   * Create new book with validation
   */
  async createBook(bookData, filePath = null) {
    const startTime = Date.now();
    const { title, author, isbn, categoryID, year, description, status, publisher, language, edition } = bookData;

    // Verify category exists
    const category = await Category.findById(categoryID);
    if (!category) {
      throw new ValidationError('Invalid category');
    }

    // Check if ISBN already exists
    if (isbn) {
      const existingBooks = await Book.advancedSearch({ isbn });
      if (existingBooks.length > 0) {
        throw new ConflictError('Book with this ISBN already exists');
      }
    }

    const data = {
      title,
      author,
      isbn,
      categoryID,
      year: year ? parseInt(year) : null,
      description,
      status: status || 'Available',
      filePath,
      publisher,
      language,
      edition,
      fileSize: 0, // Will be set if file is uploaded
      dateAdded: new Date(),
    };

    const book = await this.create(data);
    logPerformance('createBook', Date.now() - startTime);
    return book;
  }

  /**
   * Update book
   */
  async updateBook(id, updateData) {
    const startTime = Date.now();
    const { categoryID, isbn, ...otherData } = updateData;

    const book = await this.findById(id);

    // Verify category exists if provided
    if (categoryID) {
      const category = await Category.findById(categoryID);
      if (!category) {
        throw new ValidationError('Invalid category');
      }
      otherData.categoryID = categoryID;
    }

    // Check if ISBN already exists (excluding current book)
    if (isbn && isbn !== book.ISBN) {
      const existingBooks = await Book.advancedSearch({ isbn });
      if (existingBooks.length > 0) {
        throw new ConflictError('Book with this ISBN already exists');
      }
      otherData.isbn = isbn;
    }

    const updatedBook = await this.update(id, otherData);
    logPerformance('updateBook', Date.now() - startTime);
    return updatedBook;
  }

  /**
   * Get popular books
   */
  async getPopularBooks(limit = 10) {
    const startTime = Date.now();
    const books = await Book.getPopularBooks(parseInt(limit));
    logPerformance('getPopularBooks', Date.now() - startTime);
    return books;
  }

  /**
   * Get books by category
   */
  async getBooksByCategory(categoryId, limit = 20) {
    const startTime = Date.now();
    const books = await Book.findByCategory(parseInt(categoryId), parseInt(limit));
    logPerformance('getBooksByCategory', Date.now() - startTime);
    return books;
  }

  /**
   * Advanced book search
   */
  async searchBooks(searchOptions) {
    const startTime = Date.now();
    const books = await Book.advancedSearch(searchOptions);
    logPerformance('searchBooks', Date.now() - startTime);
    return books;
  }

  /**
   * Record book download
   */
  async recordDownload(userId, bookId, ipAddress, userAgent) {
    const startTime = Date.now();
    const book = await this.findById(bookId);

    if (book.Status !== 'Available') {
      throw new ValidationError('Book is not available for download');
    }

    const downloadData = {
      userID: userId,
      bookID: bookId,
      ipAddress,
      userAgent,
      fileSize: book.FileSize,
    };

    const download = await Download.create(downloadData);
    logPerformance('recordDownload', Date.now() - startTime);
    return download;
  }

  /**
   * Get book statistics
   */
  async getBookStats(id) {
    const startTime = Date.now();
    const book = await this.findById(id);
    const stats = await book.getStats();
    logPerformance('getBookStats', Date.now() - startTime);
    return stats;
  }

  /**
   * Get trending books (based on recent downloads)
   */
  async getTrendingBooks(limit = 10, days = 30) {
    const startTime = Date.now();
    // This would be implemented in the Book model
    // const books = await Book.getTrendingBooks(limit, days);
    // For now, return popular books
    const books = await this.getPopularBooks(limit);
    logPerformance('getTrendingBooks', Date.now() - startTime);
    return books;
  }

  /**
   * Get recommended books for a user
   */
  async getRecommendedBooks(userId, limit = 10) {
    const startTime = Date.now();
    // This would be implemented with recommendation algorithm
    // For now, return popular books
    const books = await this.getPopularBooks(limit);
    logPerformance('getRecommendedBooks', Date.now() - startTime);
    return books;
  }
}

module.exports = new BookService();
