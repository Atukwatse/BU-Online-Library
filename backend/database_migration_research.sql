-- Research Support Module Migration
-- Add tables for research request system

USE bugema_elibrary;

-- Create ResearchRequests table
CREATE TABLE IF NOT EXISTS ResearchRequests (
    RequestID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT NOT NULL,
    Subject VARCHAR(100) NOT NULL,
    Priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
    FilePath VARCHAR(255),
    Status ENUM('Pending', 'In Review', 'Completed', 'Rejected') NOT NULL DEFAULT 'Pending',
    Response TEXT,
    ReviewedBy INT,
    RequestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CompletedDate DATETIME,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (ReviewedBy) REFERENCES Users(UserID) ON DELETE SET NULL,
    INDEX idx_user_id (UserID),
    INDEX idx_status (Status),
    INDEX idx_priority (Priority),
    INDEX idx_subject (Subject),
    INDEX idx_request_date (RequestDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display summary
SELECT 'Research support module migration completed successfully!' as Status;
SELECT 'ResearchRequests table created' as NewTable;
