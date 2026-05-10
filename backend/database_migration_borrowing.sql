-- Borrowing System Migration
-- Add tables for complete borrowing system

USE bugema_elibrary;

-- Create BorrowRequests table
CREATE TABLE IF NOT EXISTS BorrowRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    DueDate DATETIME NOT NULL,
    Notes TEXT,
    Status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    INDEX idx_user_id (UserID),
    INDEX idx_book_id (BookID),
    INDEX idx_status (Status),
    INDEX idx_request_date (RequestDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Borrowings table
CREATE TABLE IF NOT EXISTS Borrowings (
    BorrowingID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    BorrowDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    DueDate DATETIME NOT NULL,
    ReturnDate DATETIME,
    Status ENUM('Borrowed', 'Returned', 'Overdue') NOT NULL DEFAULT 'Borrowed',
    ApprovedBy INT,
    ReturnedBy INT,
    Penalty DECIMAL(10, 2) DEFAULT 0.00,
    Notes TEXT,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    FOREIGN KEY (ReturnedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    INDEX idx_user_id (UserID),
    INDEX idx_book_id (BookID),
    INDEX idx_status (Status),
    INDEX idx_due_date (DueDate),
    INDEX idx_borrow_date (BorrowDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create ReservationQueue table
CREATE TABLE IF NOT EXISTS ReservationQueue (
    ReservationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    BookID INT NOT NULL,
    Position INT NOT NULL,
    Status ENUM('Waiting', 'Available', 'Cancelled', 'Fulfilled') NOT NULL DEFAULT 'Waiting',
    RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    NotificationSent BOOLEAN NOT NULL DEFAULT 0,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (BookID) REFERENCES Books(BookID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_book (UserID, BookID, Status),
    INDEX idx_user_id (UserID),
    INDEX idx_book_id (BookID),
    INDEX idx_status (Status),
    INDEX idx_position (Position)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add borrowing-related columns to Books table if not exists
ALTER TABLE Books
ADD COLUMN IF NOT EXISTS TotalCopies INT NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS AvailableCopies INT NOT NULL DEFAULT 1;

-- Update existing books to have default copy values
UPDATE Books SET TotalCopies = 1, AvailableCopies = 1 WHERE TotalCopies IS NULL OR AvailableCopies IS NULL;

-- Display summary
SELECT 'Borrowing system migration completed successfully!' as Status;
SELECT 
    'BorrowRequests', 
    'Borrowings', 
    'ReservationQueue' as NewTables;
SELECT 'TotalCopies and AvailableCopies columns added to Books table' as Update;
