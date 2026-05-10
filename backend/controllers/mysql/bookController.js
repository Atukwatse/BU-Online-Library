const Book = require('../../models/mysql/Book');
const Category = require('../../models/mysql/Category');
const Download = require('../../models/mysql/Download');
const User = require('../../models/mysql/User');

// @desc    Get all books (with optional search and filtering)
// @route   GET /api/books
// @access  Public
exports.getAllBooks = async (req, res, next) => {
  try {
    const { search, category, status, year, page = 1, limit = 10 } = req.query;
    let filter = { page, limit };

    // Build filter based on query parameters
    if (search) filter.search = search;
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (year) filter.year = year;

    // Only show available books to non-admin users
    if (!req.user || req.user.role !== 'Admin') {
      filter.onlyAvailable = true;
    }

    const books = await Book.findAll(filter);
    const total = await Book.count(filter);

    // Map CoverImagePath to CoverImage for frontend compatibility
    const mappedBooks = books.map(book => ({
      ...book.toJSON(),
      CoverImage: book.CoverImagePath
    }));

    res.status(200).json({
      status: 'success',
      count: books.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: mappedBooks,
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get books'
    });
  }
};

// @desc    Get book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Get book statistics
    const stats = await book.getStats();

    // Map CoverImagePath to CoverImage for frontend compatibility
    const mappedBook = {
      ...book.toJSON(),
      ...stats,
      CoverImage: book.CoverImagePath
    };

    res.status(200).json({
      status: 'success',
      data: mappedBook,
    });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get book'
    });
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, categoryID, year, description, status } = req.body;
    const filePath = req.file ? `/uploads/books/${req.file.filename}` : undefined;

    if (!title || !author || !categoryID || !filePath) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide title, author, category, and PDF file upload'
      });
    }

    // Verify category exists
    const category = await Category.findById(categoryID);
    if (!category) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category'
      });
    }

    // Check if ISBN already exists
    if (isbn) {
      const existingBooks = await Book.advancedSearch({ isbn });
      if (existingBooks.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Book with this ISBN already exists'
        });
      }
    }

    const bookData = {
      title,
      author,
      isbn,
      categoryID,
      year: year ? parseInt(year) : null,
      description,
      status: status || 'Available',
      filePath,
      fileSize: req.file ? req.file.size : 0,
      dateAdded: new Date(),
    };

    const book = await Book.create(bookData);

    // Map CoverImagePath to CoverImage for frontend compatibility
    const mappedBook = {
      ...book.toJSON(),
      CoverImage: book.CoverImagePath
    };

    res.status(201).json({
      status: 'success',
      message: 'Book created successfully',
      data: mappedBook,
    });
  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to create book'
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res, next) => {
  try {
    const { title, author, isbn, categoryID, year, description, status } = req.body;
    
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    // Verify category exists if provided
    if (categoryID) {
      const category = await Category.findById(categoryID);
      if (!category) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid category'
        });
      }
    }

    // Check if ISBN already exists (excluding current book)
    if (isbn && isbn !== book.ISBN) {
      const existingBooks = await Book.advancedSearch({ isbn });
      if (existingBooks.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Book with this ISBN already exists'
        });
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (categoryID) updateData.categoryID = categoryID;
    if (year) updateData.year = parseInt(year);
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const updatedBook = await book.update(updateData);

    // Map CoverImagePath to CoverImage for frontend compatibility
    const mappedBook = {
      ...updatedBook.toJSON(),
      CoverImage: updatedBook.CoverImagePath
    };

    res.status(200).json({
      status: 'success',
      message: 'Book updated successfully',
      data: mappedBook,
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to update book'
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    await book.delete();

    res.status(200).json({
      status: 'success',
      message: 'Book deleted successfully',
    });
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete book'
    });
  }
};

// @desc    Download book
// @route   POST /api/books/:id/download
// @access  Private
exports.downloadBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    if (book.Status !== 'Available') {
      return res.status(403).json({
        status: 'error',
        message: 'Book is not available for download'
      });
    }

    // Record download
    const downloadData = {
      userID: req.user.id,
      bookID: book.BookID,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      fileSize: book.FileSize,
    };

    const download = await Download.create(downloadData);

    res.status(200).json({
      status: 'success',
      message: 'Download recorded successfully',
      data: {
        downloadUrl: book.FilePath,
        downloadId: download.DownloadID,
        fileName: `${book.Title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      },
    });
  } catch (error) {
    console.error('Download book error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to download book'
    });
  }
};

// @desc    Get popular books
// @route   GET /api/books/popular
// @access  Public
exports.getPopularBooks = async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const books = await Book.getPopularBooks(parseInt(limit));

    // Map CoverImagePath to CoverImage for frontend compatibility
    const mappedBooks = books.map(book => ({
      ...book.toJSON(),
      CoverImage: book.CoverImagePath
    }));

    res.status(200).json({
      status: 'success',
      count: books.length,
      data: mappedBooks,
    });
  } catch (error) {
    console.error('Get popular books error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get popular books'
    });
  }
};

// @desc    Get books by category
// @route   GET /api/books/category/:categoryId
// @access  Public
exports.getBooksByCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { limit = 20 } = req.query;

    const books = await Book.findByCategory(parseInt(categoryId), parseInt(limit));

    // Map CoverImagePath to CoverImage for frontend compatibility
    const mappedBooks = books.map(book => ({
      ...book.toJSON(),
      CoverImage: book.CoverImagePath
    }));

    res.status(200).json({
      status: 'success',
      count: books.length,
      data: mappedBooks,
    });
  } catch (error) {
    console.error('Get books by category error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get books by category'
    });
  }
};

// @desc    Advanced book search
// @route   POST /api/books/search
// @access  Public
exports.searchBooks = async (req, res, next) => {
  try {
    const searchOptions = req.body;
    const books = await Book.advancedSearch(searchOptions);

    // Map CoverImagePath to CoverImage for frontend compatibility
    const mappedBooks = books.map(book => ({
      ...book.toJSON(),
      CoverImage: book.CoverImagePath
    }));

    res.status(200).json({
      status: 'success',
      count: books.length,
      data: mappedBooks,
    });
  } catch (error) {
    console.error('Search books error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to search books'
    });
  }
};

// @desc    Get book statistics
// @route   GET /api/books/:id/stats
// @access  Private/Admin
exports.getBookStats = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        status: 'error',
        message: 'Book not found'
      });
    }

    const stats = await book.getStats();

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    console.error('Get book stats error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to get book statistics'
    });
  }
};
