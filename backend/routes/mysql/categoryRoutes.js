const express = require('express');
const Category = require('../../models/mysql/Category');
const asyncHandler = require('../../middleware/asyncHandler');
const { protect, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', asyncHandler(async (req, res, next) => {
  try {
    const categories = await Category.getWithBookCounts();
    res.status(200).json({
      status: 'success',
      count: categories.length,
      data: categories.map(cat => cat.toJSON()),
    });
  } catch (error) {
    next(error);
  }
}));

router.get('/popular', asyncHandler(async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const categories = await Category.getPopularCategories(parseInt(limit));
    res.status(200).json({
      status: 'success',
      count: categories.length,
      data: categories.map(cat => cat.toJSON()),
    });
  } catch (error) {
    next(error);
  }
}));

router.get('/search', asyncHandler(async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query is required'
      });
    }

    const categories = await Category.search(q);
    res.status(200).json({
      status: 'success',
      count: categories.length,
      data: categories.map(cat => cat.toJSON()),
    });
  } catch (error) {
    next(error);
  }
}));

router.get('/:id', asyncHandler(async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: category.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}));

// Protected routes (admin only)
router.use(protect);
router.use(authorize('Admin'));

router.post('/', asyncHandler(async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({
        status: 'error',
        message: 'Category name is required'
      });
    }

    const category = await Category.create({ name, description });
    res.status(201).json({
      status: 'success',
      message: 'Category created successfully',
      data: category.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}));

router.put('/:id', asyncHandler(async (req, res, next) => {
  try {
    const { name, description } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    const updatedCategory = await category.update(updateData);
    res.status(200).json({
      status: 'success',
      message: 'Category updated successfully',
      data: updatedCategory.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}));

router.delete('/:id', asyncHandler(async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    await category.delete();
    res.status(200).json({
      status: 'success',
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}));

module.exports = router;
