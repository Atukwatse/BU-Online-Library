const Book = require('../models/Book');
const Download = require('../models/Download');
const User = require('../models/User');

// @desc    Get all books (with optional search and filtering)
// @route   GET /api/books
// @access  Public
exports.getAllBooks = async (req, res, next) => {
  try {
    const { search, category, status, year, page = 1, limit = 10 } = req.query;
    let filter = {};

    // Build filter based on query parameters
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { title: regex },
        { author: regex },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (status) {
      filter.status = status;
    }

    if (year) {
      filter.year = parseInt(year);
    }

    // Only show available books to public
    if (!req.user || req.user.role !== 'Admin') {
      filter.status = 'Available';
    }

    const skip = (page - 1) * limit;
    
    const books = await Book.find(filter)
      .sort({ dateAdded: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Book.countDocuments(filter);

    // Map coverImagePath to CoverImage for frontend compatibility
    const mappedBooks = books.map(book => ({
      ...book.toObject(),
      BookID: book._id,
      CoverImage: book.coverImagePath,
      Status: book.status
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
    next(error);
  }
};

// @desc    Get book by ID
// @route   GET /api/books/:id
// @access  Public
exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Map coverImagePath to CoverImage for frontend compatibility
    const mappedBook = {
      ...book.toObject(),
      BookID: book._id,
      CoverImage: book.coverImagePath,
      Status: book.status
    };

    res.status(200).json({
      status: 'success',
      data: mappedBook,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new book
// @route   POST /api/books
// @access  Private/Admin
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, year, description, status } = req.body;
    const filePath = req.file ? `/uploads/books/${req.file.filename}` : undefined;

    if (!title || !author || !category || !filePath) {
      res.status(400);
      throw new Error('Please provide title, author, category, and PDF file upload');
    }

    // Check if ISBN already exists
    if (isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        res.status(400);
        throw new Error('Book with this ISBN already exists');
      }
    }

    const bookData = {
      title,
      author,
      category,
      filePath,
      dateAdded: new Date(),
      fileSize: req.file ? req.file.size : 0,
    };

    if (isbn) bookData.isbn = isbn;
    if (year) bookData.year = parseInt(year);
    if (description) bookData.description = description;
    if (status) bookData.status = status;

    const book = await Book.create(bookData);

    res.status(201).json({
      status: 'success',
      message: 'Book created successfully',
      data: book,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private/Admin
exports.updateBook = async (req, res, next) => {
  try {
    const { title, author, isbn, category, year, description, status } = req.body;
    
    const book = await Book.findById(req.params.id);
    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Check if ISBN already exists (excluding current book)
    if (isbn && isbn !== book.isbn) {
      const existingBook = await Book.findOne({ isbn });
      if (existingBook) {
        res.status(400);
        throw new Error('Book with this ISBN already exists');
      }
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (author) updateData.author = author;
    if (isbn !== undefined) updateData.isbn = isbn;
    if (category) updateData.category = category;
    if (year) updateData.year = parseInt(year);
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;

    const updatedBook = await Book.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Private/Admin
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Also delete all download records for this book
    await Download.deleteMany({ book: req.params.id });

    res.status(200).json({
      status: 'success',
      message: 'Book deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Download book
// @route   POST /api/books/:id/download
// @access  Private
exports.downloadBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      res.status(404);
      throw new Error('Book not found');
    }

    if (book.status !== 'Available') {
      res.status(403);
      throw new Error('Book is not available for download');
    }

    // Record download
    const download = await Download.create({
      user: req.user.id,
      book: book._id,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Update user download count
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { downloadCount: 1 }
    });

    res.status(200).json({
      status: 'success',
      message: 'Download recorded successfully',
      downloadUrl: book.filePath,
      downloadId: download._id,
    });
  } catch (error) {
    next(error);
  }
};
