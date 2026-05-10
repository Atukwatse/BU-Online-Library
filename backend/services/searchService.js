/**
 * Smart Search Service
 * Handles advanced search functionality for books
 */

const Book = require('../models/mysql/Book');
const Category = require('../models/mysql/Category');
const { performance: logPerformance } = require('../utils/logger');

class SearchService {
  /**
   * Smart book search with multiple filters
   */
  static async searchBooks(options = {}) {
    const startTime = Date.now();
    const {
      query,
      category,
      author,
      year,
      publisher,
      language,
      tags,
      rating,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'DESC',
    } = options;

    const filters = {};
    
    if (query) filters.search = query;
    if (category) filters.category = category;
    if (author) filters.author = author;
    if (year) filters.year = year;
    if (publisher) filters.publisher = publisher;
    if (language) filters.language = language;
    if (rating) filters.rating = rating;
    if (tags) filters.tags = tags;

    const result = await Book.findAll({
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    });

    logPerformance('searchBooks', Date.now() - startTime, { query, resultCount: result.data.length });
    return result;
  }

  /**
   * Global search across multiple entities
   */
  static async globalSearch(query, options = {}) {
    const startTime = Date.now();
    const { limit = 10 } = options;

    const results = {
      books: [],
      categories: [],
      users: [],
    };

    // Search books
    if (query) {
      const books = await Book.advancedSearch({
        search: query,
        limit,
      });
      results.books = books.map(b => ({
        type: 'book',
        id: b.BookID,
        title: b.Title,
        author: b.Author,
        category: b.CategoryName,
      }));
    }

    // Search categories
    const categories = await Category.search(query, limit);
    results.categories = categories.map(c => ({
      type: 'category',
      id: c.CategoryID,
      name: c.Name,
    }));

    logPerformance('globalSearch', Date.now() - startTime, { query });
    return results;
  }

  /**
   * Get search suggestions/autocomplete
   */
  static async getSearchSuggestions(query, limit = 10) {
    const startTime = Date.now();
    
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    const suggestions = await Book.getSearchSuggestions(query, limit);

    logPerformance('getSearchSuggestions', Date.now() - startTime, { query });
    return { suggestions };
  }

  /**
   * Get popular search terms
   */
  static async getPopularSearchTerms(limit = 10) {
    // This would require a SearchLog table to track searches
    // For now, return empty array
    return { terms: [] };
  }

  /**
   * Log search query for analytics
   */
  static async logSearch(query, userId, filters = {}) {
    // This would save to a SearchLog table
    // await SearchLog.create({
    //   query,
    //   userId,
    //   filters,
    //   timestamp: new Date(),
    // });
    return { success: true };
  }

  /**
   * Get advanced filters options
   */
  static async getFilterOptions() {
    const categories = await Category.findAll({ limit: 100 });
    
    const years = await Book.getDistinctYears();
    const publishers = await Book.getDistinctPublishers();
    const languages = await Book.getDistinctLanguages();

    return {
      categories: categories.data,
      years,
      publishers,
      languages,
    };
  }
}

module.exports = SearchService;
