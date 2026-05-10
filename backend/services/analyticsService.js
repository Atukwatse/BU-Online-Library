/**
 * Analytics Service
 * Provides advanced analytics for admin dashboard
 */

const db = require('../config/mysql_database');
const { performance: logPerformance } = require('../utils/logger');

class AnalyticsService {
  /**
   * Get overall dashboard statistics
   */
  static async getDashboardStats() {
    const startTime = Date.now();

    const [users, books, downloads, borrowings, events, research, printing] = await Promise.all([
      this.getUserStats(),
      this.getBookStats(),
      this.getDownloadStats(),
      this.getBorrowingStats(),
      this.getEventStats(),
      this.getResearchStats(),
      this.getPrintingStats(),
    ]);

    const stats = {
      users,
      books,
      downloads,
      borrowings,
      events,
      research,
      printing,
    };

    logPerformance('getDashboardStats', Date.now() - startTime);
    return stats;
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN Status = 'Active' THEN 1 END) as activeUsers,
        COUNT(CASE WHEN Status = 'Suspended' THEN 1 END) as suspendedUsers,
        COUNT(CASE WHEN DATE(DateRegistered) = CURDATE() THEN 1 END) as newUsersToday,
        COUNT(CASE WHEN DATE(DateRegistered) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as newUsersThisWeek,
        COUNT(CASE WHEN DATE(DateRegistered) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as newUsersThisMonth
      FROM Users
    `;

    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get book statistics
   */
  static async getBookStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalBooks,
        COUNT(CASE WHEN Status = 'Available' THEN 1 END) as availableBooks,
        COUNT(CASE WHEN Status = 'Unavailable' THEN 1 END) as unavailableBooks,
        COUNT(CASE WHEN DATE(DateAdded) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as newBooksThisMonth,
        SUM(AvailableCopies) as totalAvailableCopies,
        SUM(TotalCopies) as totalCopies
      FROM Books
    `;

    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get download statistics
   */
  static async getDownloadStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalDownloads,
        COUNT(CASE WHEN DATE(DownloadDate) = CURDATE() THEN 1 END) as downloadsToday,
        COUNT(CASE WHEN DATE(DownloadDate) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as downloadsThisWeek,
        COUNT(CASE WHEN DATE(DownloadDate) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as downloadsThisMonth,
        SUM(FileSize) as totalDataTransferred
      FROM Downloads
    `;

    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get borrowing statistics
   */
  static async getBorrowingStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalBorrowings,
        COUNT(CASE WHEN Status = 'Borrowed' THEN 1 END) as activeBorrowings,
        COUNT(CASE WHEN Status = 'Returned' THEN 1 END) as returnedBorrowings,
        COUNT(CASE WHEN Status = 'Overdue' THEN 1 END) as overdueBorrowings,
        COUNT(CASE WHEN DATE(BorrowDate) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as borrowingsThisMonth,
        SUM(Penalty) as totalPenaltiesCollected
      FROM Borrowings
    `;

    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get event statistics
   */
  static async getEventStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalEvents,
        COUNT(CASE WHEN Status = 'Upcoming' THEN 1 END) as upcomingEvents,
        COUNT(CASE WHEN Status = 'Ongoing' THEN 1 END) as ongoingEvents,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completedEvents,
        (SELECT COUNT(*) FROM EventRegistrations WHERE Status = 'Registered') as totalRegistrations,
        (SELECT COUNT(*) FROM EventRegistrations WHERE Status = 'Attended') as totalAttendees
      FROM Events
    `;

    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get research request statistics
   */
  static async getResearchStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as pendingRequests,
        COUNT(CASE WHEN Status = 'In Review' THEN 1 END) as inReviewRequests,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completedRequests,
        COUNT(CASE WHEN Status = 'Rejected' THEN 1 END) as rejectedRequests,
        COUNT(CASE WHEN DATE(RequestDate) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as requestsThisMonth
      FROM ResearchRequests
    `;

    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get printing request statistics
   */
  static async getPrintingStats() {
    const sql = `
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN Status = 'Pending' THEN 1 END) as pendingRequests,
        COUNT(CASE WHEN Status = 'In Progress' THEN 1 END) as inProgressRequests,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completedRequests,
        SUM(PageCount * Copies) as totalPagesPrinted,
        SUM(Cost) as totalRevenue
      FROM PrintingRequests
    `;

    const result = await db.query(sql);
    return result[0];
  }

  /**
   * Get monthly report
   */
  static async getMonthlyReport(year, month) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const [users, downloads, borrowings, events, research, printing] = await Promise.all([
      this.getMonthlyUserStats(startDate, endDate),
      this.getMonthlyDownloadStats(startDate, endDate),
      this.getMonthlyBorrowingStats(startDate, endDate),
      this.getMonthlyEventStats(startDate, endDate),
      this.getMonthlyResearchStats(startDate, endDate),
      this.getMonthlyPrintingStats(startDate, endDate),
    ]);

    return {
      month,
      year,
      users,
      downloads,
      borrowings,
      events,
      research,
      printing,
    };
  }

  /**
   * Get monthly user statistics
   */
  static async getMonthlyUserStats(startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as newUsers,
        COUNT(CASE WHEN Status = 'Active' THEN 1 END) as activeUsers
      FROM Users
      WHERE DateRegistered BETWEEN ? AND ?
    `;

    const result = await db.query(sql, [startDate, endDate]);
    return result[0];
  }

  /**
   * Get monthly download statistics
   */
  static async getMonthlyDownloadStats(startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as totalDownloads,
        COUNT(DISTINCT UserID) as uniqueUsers,
        SUM(FileSize) as totalDataTransferred
      FROM Downloads
      WHERE DownloadDate BETWEEN ? AND ?
    `;

    const result = await db.query(sql, [startDate, endDate]);
    return result[0];
  }

  /**
   * Get monthly borrowing statistics
   */
  static async getMonthlyBorrowingStats(startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as totalBorrowings,
        COUNT(CASE WHEN Status = 'Returned' THEN 1 END) as returned,
        COUNT(CASE WHEN Status = 'Overdue' THEN 1 END) as overdue,
        SUM(Penalty) as totalPenalties
      FROM Borrowings
      WHERE BorrowDate BETWEEN ? AND ?
    `;

    const result = await db.query(sql, [startDate, endDate]);
    return result[0];
  }

  /**
   * Get monthly event statistics
   */
  static async getMonthlyEventStats(startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as totalEvents,
        (SELECT COUNT(*) FROM EventRegistrations er JOIN Events e ON er.EventID = e.EventID WHERE e.EventDate BETWEEN ? AND ?) as totalRegistrations
      FROM Events
      WHERE EventDate BETWEEN ? AND ?
    `;

    const result = await db.query(sql, [startDate, endDate, startDate, endDate]);
    return result[0];
  }

  /**
   * Get monthly research statistics
   */
  static async getMonthlyResearchStats(startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completed
      FROM ResearchRequests
      WHERE RequestDate BETWEEN ? AND ?
    `;

    const result = await db.query(sql, [startDate, endDate]);
    return result[0];
  }

  /**
   * Get monthly printing statistics
   */
  static async getMonthlyPrintingStats(startDate, endDate) {
    const sql = `
      SELECT 
        COUNT(*) as totalRequests,
        COUNT(CASE WHEN Status = 'Completed' THEN 1 END) as completed,
        SUM(PageCount * Copies) as totalPagesPrinted,
        SUM(Cost) as totalRevenue
      FROM PrintingRequests
      WHERE RequestDate BETWEEN ? AND ?
    `;

    const result = await db.query(sql, [startDate, endDate]);
    return result[0];
  }

  /**
   * Get popular books
   */
  static async getPopularBooks(limit = 10) {
    const sql = `
      SELECT 
        b.BookID,
        b.Title,
        b.Author,
        COUNT(d.DownloadID) as downloadCount,
        COUNT(br.RatingID) as ratingCount,
        AVG(br.Rating) as averageRating
      FROM Books b
      LEFT JOIN Downloads d ON b.BookID = d.BookID
      LEFT JOIN BookRatings br ON b.BookID = br.BookID
      WHERE b.Status = 'Available'
      GROUP BY b.BookID
      ORDER BY downloadCount DESC, averageRating DESC
      LIMIT ?
    `;

    return await db.query(sql, [limit]);
  }

  /**
   * Get user engagement metrics
   */
  static async getUserEngagement() {
    const sql = `
      SELECT 
        u.UserID,
        u.FullName,
        u.Email,
        COUNT(DISTINCT d.DownloadID) as downloadCount,
        COUNT(DISTINCT bf.FavoriteID) as favoriteCount,
        COUNT(DISTINCT br.RatingID) as ratingCount,
        COUNT(DISTINCT er.RegistrationID) as eventRegistrationCount
      FROM Users u
      LEFT JOIN Downloads d ON u.UserID = d.UserID
      LEFT JOIN BookFavorites bf ON u.UserID = bf.UserID
      LEFT JOIN BookRatings br ON u.UserID = br.UserID
      LEFT JOIN EventRegistrations er ON u.UserID = er.UserID
      WHERE u.Status = 'Active'
      GROUP BY u.UserID
      ORDER BY downloadCount DESC
      LIMIT 20
    `;

    return await db.query(sql);
  }

  /**
   * Get system activity timeline
   */
  static async getActivityTimeline(days = 30) {
    const sql = `
      SELECT 
        DATE(CreatedAt) as date,
        'user' as type,
        COUNT(*) as count
      FROM Users
      WHERE DATE(CreatedAt) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(CreatedAt)
      
      UNION ALL
      
      SELECT 
        DATE(DownloadDate) as date,
        'download' as type,
        COUNT(*) as count
      FROM Downloads
      WHERE DATE(DownloadDate) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(DownloadDate)
      
      UNION ALL
      
      SELECT 
        DATE(BorrowDate) as date,
        'borrowing' as type,
        COUNT(*) as count
      FROM Borrowings
      WHERE DATE(BorrowDate) >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY DATE(BorrowDate)
      
      ORDER BY date DESC
    `;

    return await db.query(sql, [days, days, days]);
  }

  /**
   * Get category distribution
   */
  static async getCategoryDistribution() {
    const sql = `
      SELECT 
        c.CategoryID,
        c.Name,
        COUNT(b.BookID) as bookCount,
        COUNT(DISTINCT d.DownloadID) as downloadCount
      FROM Categories c
      LEFT JOIN Books b ON c.CategoryID = b.CategoryID
      LEFT JOIN Downloads d ON b.BookID = d.BookID
      GROUP BY c.CategoryID
      ORDER BY bookCount DESC
    `;

    return await db.query(sql);
  }
}

module.exports = AnalyticsService;
