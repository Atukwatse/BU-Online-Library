-- =====================================================
-- BUGEMA UNIVERSITY E-LIBRARY - OPTIMIZED DATABASE SCHEMA
-- Production-ready, normalized, and fully indexed
-- =====================================================

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS bugema_elibrary 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE bugema_elibrary;

-- =====================================================
-- DROP EXISTING TABLES (for clean deployment)
-- =====================================================
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS Downloads;
DROP TABLE IF EXISTS BookRatings;
DROP TABLE IF EXISTS BookReviews;
DROP TABLE IF EXISTS AdminLogs;
DROP TABLE IF EXISTS Books;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users Table - Enhanced with proper security and audit fields
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    FullName VARCHAR(255) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role ENUM('Admin', 'Student') NOT NULL DEFAULT 'Student',
    Status ENUM('Active', 'Suspended') NOT NULL DEFAULT 'Active',
    DateRegistered DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    LastLogin DATETIME NULL,
    DownloadCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_email (Email),
    INDEX idx_role (Role),
    INDEX idx_status (Status),
    INDEX idx_date_registered (DateRegistered),
    INDEX idx_fullname (FullName),
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_download_count CHECK (DownloadCount >= 0)
);

-- Categories Table - Normalized category management
CREATE TABLE Categories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_category_name (Name),
    
    -- Constraints
    CONSTRAINT chk_category_name_not_empty CHECK (TRIM(Name) != '')
);

-- Books Table - Enhanced with proper relationships and constraints
CREATE TABLE Books (
    BookID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(500) NOT NULL,
    Author VARCHAR(255) NOT NULL,
    ISBN VARCHAR(20) UNIQUE,
    CategoryID INT NOT NULL,
    Year INT,
    FilePath VARCHAR(500),
    CoverImagePath VARCHAR(500),
    Status ENUM('Available', 'Restricted', 'Archived') NOT NULL DEFAULT 'Available',
    DateAdded DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FileSize BIGINT,
    Description TEXT,
    DownloadCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_title (Title),
    INDEX idx_author (Author),
    INDEX idx_category_id (CategoryID),
    INDEX idx_status (Status),
    INDEX idx_year (Year),
    INDEX idx_isbn (ISBN),
    INDEX idx_date_added (DateAdded),
    INDEX idx_download_count (DownloadCount),
    
    -- Foreign Key
    CONSTRAINT fk_books_category FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE RESTRICT,
    
    -- Constraints
    CONSTRAINT chk_year_range CHECK (Year BETWEEN 1900 AND YEAR(CURRENT_DATE) + 1),
    CONSTRAINT chk_download_count CHECK (DownloadCount >= 0),
    CONSTRAINT chk_title_not_empty CHECK (TRIM(Title) != ''),
    CONSTRAINT chk_author_not_empty CHECK (TRIM(Author) != '')
);

-- Downloads Table - Enhanced tracking with more details
CREATE TABLE Downloads (
    DownloadID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    DownloadDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IPAddress VARCHAR(45),
    UserAgent VARCHAR(500),
    DownloadStatus ENUM('Completed', 'Failed', 'Cancelled') DEFAULT 'Completed',
    FileSize BIGINT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_user_downloads (UserID),
    INDEX idx_book_downloads (BookID),
    INDEX idx_download_date (DownloadDate),
    INDEX idx_download_status (DownloadStatus),
    INDEX idx_user_date (UserID, DownloadDate),
    INDEX idx_book_date (BookID, DownloadDate),
    
    -- Foreign Keys
    CONSTRAINT fk_downloads_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT fk_downloads_book FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_ip_format CHECK (IPAddress REGEXP '^([0-9]{1,3}\\.){3}[0-9]{1,3}$' OR IPAddress IS NULL)
);

-- =====================================================
-- OPTIONAL ENHANCEMENT TABLES
-- =====================================================

-- BookRatings Table - For user ratings
CREATE TABLE BookRatings (
    RatingID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    Rating TINYINT NOT NULL,
    RatingDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_book_ratings (BookID),
    INDEX idx_user_ratings (UserID),
    INDEX idx_rating_value (Rating),
    
    -- Foreign Keys
    CONSTRAINT fk_ratings_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_book FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_rating_range CHECK (Rating BETWEEN 1 AND 5),
    
    -- Unique constraint to prevent duplicate ratings
    UNIQUE KEY uk_user_book_rating (UserID, BookID)
);

-- BookReviews Table - For user reviews
CREATE TABLE BookReviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    ReviewText TEXT NOT NULL,
    ReviewDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Approved', 'Pending', 'Rejected') DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_book_reviews (BookID),
    INDEX idx_user_reviews (UserID),
    INDEX idx_review_status (Status),
    INDEX idx_review_date (ReviewDate),
    
    -- Foreign Keys
    CONSTRAINT fk_reviews_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_book FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_review_not_empty CHECK (TRIM(ReviewText) != '')
);

-- AdminLogs Table - For admin activity tracking
CREATE TABLE AdminLogs (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Action VARCHAR(100) NOT NULL,
    EntityType ENUM('User', 'Book', 'Category', 'System') NOT NULL,
    EntityID INT,
    OldValues JSON,
    NewValues JSON,
    IPAddress VARCHAR(45),
    UserAgent VARCHAR(500),
    LogDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_admin_logs_user (UserID),
    INDEX idx_admin_logs_action (Action),
    INDEX idx_admin_logs_entity (EntityType, EntityID),
    INDEX idx_admin_logs_date (LogDate),
    
    -- Foreign Key
    CONSTRAINT fk_logs_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_action_not_empty CHECK (TRIM(Action) != '')
);

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- User Statistics View
CREATE VIEW UserStats AS 
SELECT 
    u.Role,
    u.Status,
    COUNT(*) as UserCount,
    DATE(u.DateRegistered) as RegistrationDate,
    SUM(u.DownloadCount) as TotalDownloads
FROM Users u 
GROUP BY u.Role, u.Status, DATE(u.DateRegistered);

-- Book Statistics View
CREATE VIEW BookStats AS 
SELECT 
    c.Name as CategoryName,
    b.Status,
    COUNT(*) as BookCount,
    SUM(b.DownloadCount) as TotalDownloads,
    AVG(b.DownloadCount) as AvgDownloads,
    YEAR(b.DateAdded) as YearAdded
FROM Books b
JOIN Categories c ON b.CategoryID = c.CategoryID
GROUP BY c.Name, b.Status, YEAR(b.DateAdded);

-- Recent Activity View
CREATE VIEW RecentActivity AS 
SELECT 
    'User Registration' as ActivityType,
    u.FullName as UserName,
    u.Email as Details,
    u.DateRegistered as ActivityDate,
    'User' as EntityType,
    u.UserID as EntityID
FROM Users u 
UNION ALL
SELECT 
    'Book Added' as ActivityType,
    b.Title as UserName,
    CONCAT('Author: ', b.Author) as Details,
    b.DateAdded as ActivityDate,
    'Book' as EntityType,
    b.BookID as EntityID
FROM Books b 
UNION ALL
SELECT 
    'Download' as ActivityType,
    u.FullName as UserName,
    b.Title as Details,
    d.DownloadDate as ActivityDate,
    'Download' as EntityType,
    d.DownloadID as EntityID
FROM Downloads d
JOIN Users u ON d.UserID = u.UserID
JOIN Books b ON d.BookID = b.BookID
ORDER BY ActivityDate DESC 
LIMIT 100;

-- Popular Books View
CREATE VIEW PopularBooks AS 
SELECT 
    b.BookID,
    b.Title,
    b.Author,
    c.Name as Category,
    COUNT(d.DownloadID) as DownloadCount,
    AVG(r.Rating) as AverageRating,
    COUNT(rv.ReviewID) as ReviewCount
FROM Books b
LEFT JOIN Downloads d ON b.BookID = d.BookID
LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
LEFT JOIN BookRatings r ON b.BookID = r.BookID
LEFT JOIN BookReviews rv ON b.BookID = rv.BookID AND rv.Status = 'Approved'
WHERE b.Status = 'Available'
GROUP BY b.BookID, b.Title, b.Author, c.Name
ORDER BY DownloadCount DESC, AverageRating DESC;

-- =====================================================
-- STORED PROCEDURES FOR COMMON OPERATIONS
-- =====================================================

DELIMITER //

-- Procedure to update download count
CREATE PROCEDURE UpdateDownloadCount(IN bookID INT)
BEGIN
    UPDATE Books 
    SET DownloadCount = DownloadCount + 1 
    WHERE BookID = bookID;
END //

-- Procedure to get user statistics
CREATE PROCEDURE GetUserStats(IN userID INT)
BEGIN
    SELECT 
        u.UserID,
        u.FullName,
        u.Email,
        u.Role,
        u.Status,
        u.DateRegistered,
        u.LastLogin,
        u.DownloadCount,
        COUNT(d.DownloadID) as ActualDownloads,
        COUNT(DISTINCT d.BookID) as UniqueBooksDownloaded
    FROM Users u
    LEFT JOIN Downloads d ON u.UserID = d.UserID
    WHERE u.UserID = userID
    GROUP BY u.UserID;
END //

-- Procedure to get book statistics
CREATE PROCEDURE GetBookStats(IN bookID INT)
BEGIN
    SELECT 
        b.BookID,
        b.Title,
        b.Author,
        c.Name as Category,
        b.Status,
        b.DownloadCount,
        COUNT(d.DownloadID) as ActualDownloads,
        AVG(r.Rating) as AverageRating,
        COUNT(rv.ReviewID) as ReviewCount
    FROM Books b
    LEFT JOIN Categories c ON b.CategoryID = c.CategoryID
    LEFT JOIN Downloads d ON b.BookID = d.BookID
    LEFT JOIN BookRatings r ON b.BookID = r.BookID
    LEFT JOIN BookReviews rv ON b.BookID = rv.BookID AND rv.Status = 'Approved'
    WHERE b.BookID = bookID
    GROUP BY b.BookID;
END //

DELIMITER ;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

DELIMITER //

-- Trigger to log admin actions
CREATE TRIGGER log_book_changes
AFTER UPDATE ON Books
FOR EACH ROW
BEGIN
    IF OLD.Title != NEW.Title OR OLD.Author != NEW.Author OR OLD.Status != NEW.Status THEN
        INSERT INTO AdminLogs (UserID, Action, EntityType, EntityID, OldValues, NewValues)
        VALUES (
            @current_user_id,
            'UPDATE_BOOK',
            'Book',
            NEW.BookID,
            JSON_OBJECT('Title', OLD.Title, 'Author', OLD.Author, 'Status', OLD.Status),
            JSON_OBJECT('Title', NEW.Title, 'Author', NEW.Author, 'Status', NEW.Status)
        );
    END IF;
END //

-- Trigger to update download count
CREATE TRIGGER update_book_download_count
AFTER INSERT ON Downloads
FOR EACH ROW
BEGIN
    CALL UpdateDownloadCount(NEW.BookID);
END //

DELIMITER ;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert default categories
INSERT INTO Categories (Name, Description) VALUES 
('Computer Science', 'Books related to computer science, programming, and technology'),
('Information Science', 'Books on information systems, library science, and data management'),
('Research', 'Academic research methods and methodologies'),
('Web Development', 'Web development, design, and programming'),
('Database', 'Database design, management, and systems'),
('Mathematics', 'Mathematical concepts and applications'),
('Business', 'Business management and administration'),
('Education', 'Educational theory and practice');

-- Insert default admin user (password: admin123)
INSERT INTO Users (FullName, Email, PasswordHash, Role, Status) VALUES 
('System Administrator', 'admin@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Active');

-- Insert sample books with proper category references
INSERT INTO Books (Title, Author, ISBN, CategoryID, Year, Description) VALUES 
('Introduction to Computer Science', 'Dr. Sarah Johnson', '978-0-123456-78-9', 1, 2020, 'A comprehensive introduction to computer science fundamentals'),
('Digital Libraries and Information Systems', 'Prof. Michael Chen', '978-0-234567-89-0', 2, 2021, 'Modern approaches to digital library management'),
('Academic Research Methods', 'Dr. Emily Williams', '978-0-345678-90-1', 3, 2019, 'Essential guide to academic research methodologies'),
('Web Development Fundamentals', 'James Anderson', '978-0-456789-01-2', 4, 2022, 'Complete guide to modern web development'),
('Database Management Systems', 'Dr. Robert Taylor', '978-0-567890-12-3', 5, 2020, 'Comprehensive database management and design');

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Create composite indexes for common queries
CREATE INDEX idx_books_category_status ON Books(CategoryID, Status);
CREATE INDEX idx_books_status_date ON Books(Status, DateAdded);
CREATE INDEX idx_downloads_user_status ON Downloads(UserID, DownloadStatus);
CREATE INDEX idx_users_status_role ON Users(Status, Role);

-- =====================================================
-- SECURITY SETTINGS
-- =====================================================

-- Create a read-only user for reporting
CREATE USER IF NOT EXISTS 'elibrary_readonly'@'localhost' IDENTIFIED BY 'readonly_password_2024';
GRANT SELECT ON bugema_elibrary.* TO 'elibrary_readonly'@'localhost';

-- Create application user with limited permissions
CREATE USER IF NOT EXISTS 'elibrary_app'@'localhost' IDENTIFIED BY 'app_password_2024';
GRANT SELECT, INSERT, UPDATE, DELETE ON bugema_elibrary.* TO 'elibrary_app'@'localhost';

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

SELECT 'E-Library Database Schema Successfully Created and Optimized!' as Status;
