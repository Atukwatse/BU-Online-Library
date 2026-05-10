-- Soft Delete Migration
-- Add soft delete support to main tables

USE bugema_elibrary;

-- Add soft delete columns to Users table
ALTER TABLE Users
ADD COLUMN IF NOT EXISTS DeletedAt DATETIME,
ADD COLUMN IF NOT EXISTS DeletedBy INT,
ADD INDEX idx_users_deleted (DeletedAt);

-- Add soft delete columns to Books table
ALTER TABLE Books
ADD COLUMN IF NOT EXISTS DeletedAt DATETIME,
ADD COLUMN IF NOT EXISTS DeletedBy INT,
ADD INDEX idx_books_deleted (DeletedAt);

-- Add soft delete columns to Categories table
ALTER TABLE Categories
ADD COLUMN IF NOT EXISTS DeletedAt DATETIME,
ADD COLUMN IF NOT EXISTS DeletedBy INT,
ADD INDEX idx_categories_deleted (DeletedAt);

-- Add soft delete columns to Events table
ALTER TABLE Events
ADD COLUMN IF NOT EXISTS DeletedAt DATETIME,
ADD COLUMN IF NOT EXISTS DeletedBy INT,
ADD INDEX idx_events_deleted (DeletedAt);

-- Create trigger for Users soft delete
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_user_delete
BEFORE DELETE ON Users
FOR EACH ROW
BEGIN
    UPDATE Users SET DeletedAt = NOW() WHERE UserID = OLD.UserID;
END//
DELIMITER ;

-- Create trigger for Books soft delete
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_book_delete
BEFORE DELETE ON Books
FOR EACH ROW
BEGIN
    UPDATE Books SET DeletedAt = NOW() WHERE BookID = OLD.BookID;
END//
DELIMITER ;

-- Create trigger for Categories soft delete
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_category_delete
BEFORE DELETE ON Categories
FOR EACH ROW
BEGIN
    UPDATE Categories SET DeletedAt = NOW() WHERE CategoryID = OLD.CategoryID;
END//
DELIMITER ;

-- Create trigger for Events soft delete
DELIMITER //
CREATE TRIGGER IF NOT EXISTS before_event_delete
BEFORE DELETE ON Events
FOR EACH ROW
BEGIN
    UPDATE Events SET DeletedAt = NOW() WHERE EventID = OLD.EventID;
END//
DELIMITER ;

-- Display summary
SELECT 'Soft delete migration completed successfully!' as Status;
SELECT 'Soft delete columns added to Users, Books, Categories, and Events tables' as Summary;
SELECT 'Delete triggers created to intercept hard deletes' as Triggers;
