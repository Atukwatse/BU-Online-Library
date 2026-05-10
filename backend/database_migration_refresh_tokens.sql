-- Refresh Tokens Table Migration
-- Add this to your database to support JWT refresh token rotation

USE bugema_elibrary;

-- Create RefreshTokens table
CREATE TABLE IF NOT EXISTS RefreshTokens (
    RefreshTokenID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Token VARCHAR(255) NOT NULL UNIQUE,
    ExpiresAt DATETIME NOT NULL,
    IPAddress VARCHAR(45),
    UserAgent TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    RevokedAt DATETIME,
    IsRevoked BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_user_id (UserID),
    INDEX idx_token (Token),
    INDEX idx_expires_at (ExpiresAt),
    INDEX idx_is_revoked (IsRevoked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add email verification fields to Users table
ALTER TABLE Users
ADD COLUMN IF NOT EXISTS EmailVerified BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS VerificationToken VARCHAR(255),
ADD COLUMN IF NOT EXISTS VerificationTokenExpiry DATETIME,
ADD COLUMN IF NOT EXISTS ResetToken VARCHAR(255),
ADD COLUMN IF NOT EXISTS ResetTokenExpiry DATETIME,
ADD COLUMN IF NOT EXISTS FailedLoginAttempts INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS LockedUntil DATETIME,
ADD INDEX idx_verification_token (VerificationToken),
ADD INDEX idx_reset_token (ResetToken);

-- Add additional book metadata fields
ALTER TABLE Books
ADD COLUMN IF NOT EXISTS Publisher VARCHAR(255),
ADD COLUMN IF NOT EXISTS Language VARCHAR(50) DEFAULT 'English',
ADD COLUMN IF NOT EXISTS Edition VARCHAR(50),
ADD COLUMN IF NOT EXISTS Tags JSON,
ADD COLUMN IF NOT EXISTS IsFeatured BOOLEAN NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS CoverImage VARCHAR(255),
ADD COLUMN IF NOT EXISTS PreviewPages INT,
ADD COLUMN IF NOT EXISTS TotalCopies INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS AvailableCopies INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS AddedBy INT,
ADD FOREIGN KEY (AddedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
ADD INDEX idx_featured (IsFeatured),
ADD INDEX idx_tags ((CAST(Tags AS CHAR(255))));

-- Create BookRatings table
CREATE TABLE IF NOT EXISTS BookRatings (
    RatingID INT AUTO_INCREMENT PRIMARY KEY,
    BookID INT NOT NULL,
    UserID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    Review TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_book (UserID, BookID),
    INDEX idx_book_id (BookID),
    INDEX idx_user_id (UserID),
    INDEX idx_rating (Rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create BookFavorites table
CREATE TABLE IF NOT EXISTS BookFavorites (
    FavoriteID INT AUTO_INCREMENT PRIMARY KEY,
    BookID INT NOT NULL,
    UserID INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_book (UserID, BookID),
    INDEX idx_book_id (BookID),
    INDEX idx_user_id (UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create BookReviews table
CREATE TABLE IF NOT EXISTS BookReviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    BookID INT NOT NULL,
    UserID INT NOT NULL,
    Review TEXT NOT NULL,
    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
    IsApproved BOOLEAN NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_book_id (BookID),
    INDEX idx_user_id (UserID),
    INDEX idx_approved (IsApproved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Notifications table
CREATE TABLE IF NOT EXISTS Notifications (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Type VARCHAR(50) NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Message TEXT,
    Data JSON,
    IsRead BOOLEAN NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ReadAt DATETIME,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    INDEX idx_user_id (UserID),
    INDEX idx_is_read (IsRead),
    INDEX idx_type (Type),
    INDEX idx_created_at (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create AuditLogs table
CREATE TABLE IF NOT EXISTS AuditLogs (
    LogID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT,
    Action VARCHAR(100) NOT NULL,
    ResourceType VARCHAR(50),
    ResourceID INT,
    Details JSON,
    IPAddress VARCHAR(45),
    UserAgent TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE SET NULL,
    INDEX idx_user_id (UserID),
    INDEX idx_action (Action),
    INDEX idx_resource (ResourceType, ResourceID),
    INDEX idx_created_at (CreatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display summary
SELECT 'Database migration completed successfully!' as Status;
SELECT 
    'RefreshTokens', 
    'BookRatings', 
    'BookFavorites', 
    'BookReviews', 
    'Notifications', 
    'AuditLogs' as NewTables;
