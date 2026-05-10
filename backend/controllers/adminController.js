const AdminBook = require('../models/AdminBook');
const LibraryResource = require('../models/LibraryResource');
const StaffLogin = require('../models/StaffLogin');

const getDashboardData = async (req, res) => {
  try {
    const [books, resources, staff] = await Promise.all([
      AdminBook.find().sort({ createdAt: -1 }).lean(),
      LibraryResource.find().sort({ createdAt: -1 }).lean(),
      StaffLogin.find().select('-password').sort({ department: 1, id: 1 }).lean(),
    ]);

    res.status(200).json({
      stats: {
        books: books.length,
        resources: resources.length,
        staff: staff.length,
      },
      books,
      resources,
      staff,
    });
  } catch (error) {
    res.status(500).json({ message: 'Unable to load dashboard data.' });
  }
};

const createBook = async (req, res) => {
  try {
    const { title, author, category, isbn, quantity, status } = req.body;

    if (!title || !author || !category) {
      return res.status(400).json({ message: 'Title, author, and category are required.' });
    }

    const book = await AdminBook.create({
      title: String(title).trim(),
      author: String(author).trim(),
      category: String(category).trim(),
      isbn: String(isbn || '').trim(),
      quantity: Number(quantity || 1),
      status: status || 'available',
      createdBy: req.staff.id,
    });

    return res.status(201).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create book.' });
  }
};

const updateBook = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.quantity !== undefined) {
      updates.quantity = Number(updates.quantity);
    }

    const book = await AdminBook.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update book.' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const book = await AdminBook.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    return res.status(200).json({ message: 'Book deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete book.' });
  }
};

const createResource = async (req, res) => {
  try {
    const { title, type, link, status, notes } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: 'Title and type are required.' });
    }

    const resource = await LibraryResource.create({
      title: String(title).trim(),
      type: String(type).trim(),
      link: String(link || '').trim(),
      status: status || 'active',
      notes: String(notes || '').trim(),
    });

    return res.status(201).json(resource);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to create resource.' });
  }
};

const updateResource = async (req, res) => {
  try {
    const resource = await LibraryResource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    return res.status(200).json(resource);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to update resource.' });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await LibraryResource.findByIdAndDelete(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    return res.status(200).json({ message: 'Resource deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to delete resource.' });
  }
};

module.exports = {
  getDashboardData,
  createBook,
  updateBook,
  deleteBook,
  createResource,
  updateResource,
  deleteResource,
};
