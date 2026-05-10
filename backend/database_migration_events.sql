-- Event Management Module Migration
-- Add tables for event management system

USE bugema_elibrary;

-- Create Events table
CREATE TABLE IF NOT EXISTS Events (
    EventID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    Location VARCHAR(255),
    EventDate DATE NOT NULL,
    EventTime TIME,
    RegistrationDeadline DATE,
    MaxAttendees INT,
    BannerImage VARCHAR(255),
    OrganizerID INT,
    Status ENUM('Upcoming', 'Ongoing', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Upcoming',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (OrganizerID) REFERENCES Users(UserID) ON DELETE SET NULL,
    INDEX idx_event_date (EventDate),
    INDEX idx_status (Status),
    INDEX idx_organizer (OrganizerID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create EventRegistrations table
CREATE TABLE IF NOT EXISTS EventRegistrations (
    RegistrationID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    EventID INT NOT NULL,
    RegistrationDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Registered', 'Cancelled', 'Attended') NOT NULL DEFAULT 'Registered',
    CancelledAt DATETIME,
    AttendedAt DATETIME,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE,
    FOREIGN KEY (EventID) REFERENCES Events(EventID) ON DELETE CASCADE,
    UNIQUE KEY unique_user_event (UserID, EventID),
    INDEX idx_user_id (UserID),
    INDEX idx_event_id (EventID),
    INDEX idx_status (Status),
    INDEX idx_registration_date (RegistrationDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Display summary
SELECT 'Event management module migration completed successfully!' as Status;
SELECT 
    'Events', 
    'EventRegistrations' as NewTables;
