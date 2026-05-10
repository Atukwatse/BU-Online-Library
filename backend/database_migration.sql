-- =====================================================
-- DATABASE MIGRATION SCRIPT
-- Fixes issues in existing E-Library databases
-- =====================================================

USE bugema_elibrary;

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS users_backup AS SELECT * FROM users;
CREATE TABLE IF NOT EXISTS books_backup AS SELECT * FROM books;
CREATE TABLE IF NOT EXISTS downloads_backup AS SELECT * FROM downloads;

-- =====================================================
-- STEP 2: FIX USERS TABLE
-- =====================================================

-- Check if Users table exists and has the right structure
ALTER TABLE Users 
ADD COLUMN IF NOT EXISTS DownloadCount INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
MODIFY COLUMN FullName VARCHAR(255) NOT NULL,
MODIFY COLUMN Email VARCHAR(255) NOT NULL,
MODIFY COLUMN Role ENUM('Admin', 'Student') NOT NULL DEFAULT 'Student',
MODIFY COLUMN Status ENUM('Active', 'Suspended') NOT NULL DEFAULT 'Active';

-- Add missing indexes
ALTER TABLE Users 
ADD INDEX IF NOT EXISTS idx_email (Email),
ADD INDEX IF NOT EXISTS idx_role (Role),
ADD INDEX IF NOT EXISTS idx_status (Status),
ADD INDEX IF NOT EXISTS idx_date_registered (DateRegistered);

-- Add constraints
ALTER TABLE Users 
ADD CONSTRAINT IF NOT EXISTS chk_email_format 
CHECK (Email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
ADD CONSTRAINT IF NOT EXISTS chk_download_count 
CHECK (DownloadCount >= 0);

-- =====================================================
-- STEP 3: CREATE CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS Categories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category_name (Name),
    CONSTRAINT chk_category_name_not_empty CHECK (TRIM(Name) != '')
);

-- Insert categories from existing books if they don't exist
INSERT IGNORE INTO Categories (Name, Description)
SELECT DISTINCT Category, CONCAT('Books related to ', Category)
FROM Books 
WHERE Category IS NOT NULL AND Category != '';

-- =====================================================
-- STEP 4: FIX BOOKS TABLE
-- =====================================================

-- Add missing columns
ALTER TABLE Books 
ADD COLUMN IF NOT EXISTS CategoryID INT,
ADD COLUMN IF NOT EXISTS DownloadCount INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
MODIFY COLUMN Title VARCHAR(500) NOT NULL,
MODIFY COLUMN Author VARCHAR(255) NOT NULL,
MODIFY COLUMN Status ENUM('Available', 'Restricted', 'Archived') NOT NULL DEFAULT 'Available';

-- Update CategoryID based on existing Category names
UPDATE Books b
JOIN Categories c ON b.Category = c.Name
SET b.CategoryID = c.CategoryID
WHERE b.CategoryID IS NULL;

-- Make CategoryID required after migration
ALTER TABLE Books 
MODIFY COLUMN CategoryID INT NOT NULL;

-- Add foreign key constraint
ALTER TABLE Books 
ADD CONSTRAINT IF NOT EXISTS fk_books_category 
FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID) ON DELETE RESTRICT;

-- Add missing indexes
ALTER TABLE Books 
ADD INDEX IF NOT EXISTS idx_category_id (CategoryID),
ADD INDEX IF NOT EXISTS idx_year (Year),
ADD INDEX IF NOT EXISTS idx_isbn (ISBN),
ADD INDEX IF NOT EXISTS idx_download_count (DownloadCount);

-- Add constraints
ALTER TABLE Books 
ADD CONSTRAINT IF NOT EXISTS chk_year_range 
CHECK (Year BETWEEN 1900 AND YEAR(CURRENT_DATE) + 1),
ADD CONSTRAINT IF NOT EXISTS chk_download_count 
CHECK (DownloadCount >= 0),
ADD CONSTRAINT IF NOT EXISTS chk_title_not_empty 
CHECK (TRIM(Title) != ''),
ADD CONSTRAINT IF NOT EXISTS chk_author_not_empty 
CHECK (TRIM(Author) != '');

-- =====================================================
-- STEP 5: FIX DOWNLOADS TABLE
-- =====================================================

-- Add missing columns
ALTER TABLE Downloads 
ADD COLUMN IF NOT EXISTS UserAgent VARCHAR(500),
ADD COLUMN IF NOT EXISTS DownloadStatus ENUM('Completed', 'Failed', 'Cancelled') DEFAULT 'Completed',
ADD COLUMN IF NOT EXISTS FileSize BIGINT,
ADD COLUMN IF NOT EXISTS CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Add missing indexes
ALTER TABLE Downloads 
ADD INDEX IF NOT EXISTS idx_download_status (DownloadStatus),
ADD INDEX IF NOT EXISTS idx_user_date (UserID, DownloadDate),
ADD INDEX IF NOT EXISTS idx_book_date (BookID, DownloadDate);

-- Add constraints
ALTER TABLE Downloads 
ADD CONSTRAINT IF NOT EXISTS chk_ip_format 
CHECK (IPAddress REGEXP '^([0-9]{1,3}\\.){3}[0-9]{1,3}$' OR IPAddress IS NULL);

-- =====================================================
-- STEP 6: CREATE ENHANCEMENT TABLES
-- =====================================================

-- BookRatings Table
CREATE TABLE IF NOT EXISTS BookRatings (
    RatingID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    Rating TINYINT NOT NULL,
    RatingDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_book_ratings (BookID),
    INDEX idx_user_ratings (UserID),
    INDEX idx_rating_value (Rating),
    
    CONSTRAINT fk_ratings_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT fk_ratings_book FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    CONSTRAINT chk_rating_range CHECK (Rating BETWEEN 1 AND 5),
    UNIQUE KEY uk_user_book_rating (UserID, BookID)
);

-- BookReviews Table
CREATE TABLE IF NOT EXISTS BookReviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    ReviewText TEXT NOT NULL,
    ReviewDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Approved', 'Pending', 'Rejected') DEFAULT 'Pending',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_book_reviews (BookID),
    INDEX idx_user_reviews (UserID),
    INDEX idx_review_status (Status),
    INDEX idx_review_date (ReviewDate),
    
    CONSTRAINT fk_reviews_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_book FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    CONSTRAINT chk_review_not_empty CHECK (TRIM(ReviewText) != '')
);

-- AdminLogs Table
CREATE TABLE IF NOT EXISTS AdminLogs (
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
    
    INDEX idx_admin_logs_user (UserID),
    INDEX idx_admin_logs_action (Action),
    INDEX idx_admin_logs_entity (EntityType, EntityID),
    INDEX idx_admin_logs_date (LogDate),
    
    CONSTRAINT fk_logs_user FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    CONSTRAINT chk_action_not_empty CHECK (TRIM(Action) != '')
);

-- =====================================================
-- STEP 7: CREATE OR UPDATE VIEWS
-- =====================================================

-- Drop existing views if they exist
DROP VIEW IF EXISTS UserStats;
DROP VIEW IF EXISTS BookStats;
DROP VIEW IF EXISTS RecentActivity;
DROP VIEW IF EXISTS PopularBooks;

-- Create optimized views
CREATE VIEW UserStats AS 
SELECT 
    u.Role,
    u.Status,
    COUNT(*) as UserCount,
    DATE(u.DateRegistered) as RegistrationDate,
    SUM(u.DownloadCount) as TotalDownloads
FROM Users u 
GROUP BY u.Role, u.Status, DATE(u.DateRegistered);

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

-- =====================================================
-- STEP 8: DATA CLEANUP
-- =====================================================

-- Remove duplicate downloads (keep latest)
DELETE d1 FROM Downloads d1
JOIN Downloads d2 ON d1.UserID = d2.UserID 
AND d1.BookID = d2.BookID 
AND d1.DownloadDate < d2.DownloadDate;

-- Update download counts based on actual downloads
UPDATE Books b
SET DownloadCount = (
    SELECT COUNT(*) 
    FROM Downloads d 
    WHERE d.BookID = b.BookID 
    AND d.DownloadStatus = 'Completed'
);

-- Update user download counts
UPDATE Users u
SET DownloadCount = (
    SELECT COUNT(*) 
    FROM Downloads d 
    WHERE d.UserID = u.UserID 
    AND d.DownloadStatus = 'Completed'
);

-- =====================================================
-- STEP 9: PERFORMANCE OPTIMIZATION
-- =====================================================

-- Create composite indexes
CREATE INDEX IF NOT EXISTS idx_books_category_status ON Books(CategoryID, Status);
CREATE INDEX IF NOT EXISTS idx_books_status_date ON Books(Status, DateAdded);
CREATE INDEX IF NOT EXISTS idx_downloads_user_status ON Downloads(UserID, DownloadStatus);
CREATE INDEX IF NOT EXISTS idx_users_status_role ON Users(Status, Role);

-- =====================================================
-- STEP 10: VALIDATION
-- =====================================================

-- Check for orphaned records
SELECT 'Orphaned Downloads' as Issue, COUNT(*) as Count 
FROM Downloads d 
LEFT JOIN Users u ON d.UserID = u.UserID 
WHERE u.UserID IS NULL

UNION ALL

SELECT 'Orphaned Downloads (Books)' as Issue, COUNT(*) as Count 
FROM Downloads d 
LEFT JOIN Books b ON d.BookID = b.BookID 
WHERE b.BookID IS NULL

UNION ALL

SELECT 'Books without Category' as Issue, COUNT(*) as Count 
FROM Books b 
LEFT JOIN Categories c ON b.CategoryID = c.CategoryID 
WHERE c.CategoryID IS NULL;

-- =====================================================
-- COMPLETION
-- =====================================================

SELECT 'Database Migration Completed Successfully!' as Status,
       (SELECT COUNT(*) FROM Users) as TotalUsers,
       (SELECT COUNT(*) FROM Books) as TotalBooks,
       (SELECT COUNT(*) FROM Categories) as TotalCategories,
       (SELECT COUNT(*) FROM Downloads) as TotalDownloads;
