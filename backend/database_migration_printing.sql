-- Printing Service Module Migration
-- Add tables for printing request system

USE bugema_elibrary;

-- Create PrintingRequests table
CREATE TABLE IF NOT EXISTS PrintingRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    PageCount INT NOT NULL,
    Color BOOLEAN NOT NULL DEFAULT 0,
    Copies INT NOT NULL DEFAULT 1,
    Priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    FilePath VARCHAR(255),
    Cost DECIMAL(10, 2) DEFAULT 0.00,
    Status ENUM('Pending', 'Approved', 'In Progress', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
    Notes TEXT,
    ApprovedBy INT,
    RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CompletedDate DATETIME,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ApprovedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    INDEX idx_user_id (UserID),
    INDEX idx_status (Status),
    INDEX idx_priority (Priority),
    INDEX idx_request_date (RequestDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display summary
SELECT 'Printing service module migration completed successfully!' as Status;
SELECT 'PrintingRequests table created' as NewTable;
