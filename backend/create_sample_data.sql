-- Sample Data for Bugema E-Library
-- This script creates test users and sample books

USE bugema_elibrary;

-- Insert test users (passwords are hashed with bcrypt - all passwords: 'admin123', 'staff123', 'student123')
INSERT INTO Users (FullName, Email, PasswordHash, Role, Status, DateRegistered, LastLogin, DownloadCount) VALUES 
('System Administrator', 'admin@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'Active', NOW(), NOW(), 0),
('Library Staff', 'staff@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Staff', 'Active', NOW(), NOW(), 0),
('Test Student', 'student@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW(), NOW(), 0),
('John Smith', 'john.smith@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW(), DATE_SUB(NOW(), INTERVAL 1 DAY), 5),
('Jane Doe', 'jane.doe@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW(), DATE_SUB(NOW(), INTERVAL 2 DAY), 3),
('Michael Johnson', 'michael.johnson@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW(), DATE_SUB(NOW(), INTERVAL 3 DAY), 8),
('Sarah Williams', 'sarah.williams@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW(), DATE_SUB(NOW(), INTERVAL 4 DAY), 2),
('Robert Brown', 'robert.brown@bugema.ac.ug', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Student', 'Active', NOW(), DATE_SUB(NOW(), INTERVAL 5 DAY), 6);

-- Insert categories
INSERT INTO Categories (Name, Description) VALUES 
('Computer Science', 'Books related to computer science, programming, and technology'),
('Information Science', 'Books on information systems, library science, and data management'),
('Research', 'Academic research methods and methodologies'),
('Web Development', 'Web development, design, and programming'),
('Database', 'Database design, management, and systems'),
('Mathematics', 'Mathematical concepts and applications'),
('Business', 'Business management and administration'),
('Education', 'Educational theory and practice'),
('Engineering', 'Engineering principles and applications'),
('Literature', 'Literary works and criticism');

-- Insert sample books
INSERT INTO Books (Title, Author, ISBN, CategoryID, Year, Description, Status, DateAdded, DownloadCount, FileSize) VALUES 
('Introduction to Computer Science', 'Dr. Sarah Johnson', '978-0-123456-78-9', 1, 2020, 'A comprehensive introduction to computer science fundamentals including algorithms, data structures, and programming concepts.', 'Available', NOW(), 45, 5242880),
('Digital Libraries and Information Systems', 'Prof. Michael Chen', '978-0-234567-89-0', 2, 2021, 'Modern approaches to digital library management, information architecture, and digital preservation.', 'Available', NOW(), 32, 8388608),
('Academic Research Methods', 'Dr. Emily Williams', '978-0-345678-90-1', 3, 2019, 'Essential guide to academic research methodologies, literature review, and scholarly writing.', 'Available', NOW(), 28, 4194304),
('Web Development Fundamentals', 'James Anderson', '978-0-456789-01-2', 4, 2022, 'Complete guide to modern web development including HTML5, CSS3, JavaScript, and responsive design.', 'Available', NOW(), 67, 6291456),
('Database Management Systems', 'Dr. Robert Taylor', '978-0-567890-12-3', 5, 2020, 'Comprehensive database management and design principles with practical examples.', 'Available', NOW(), 51, 7340032),
('Advanced Mathematics', 'Dr. Lisa Brown', '978-0-678901-23-4', 6, 2021, 'Advanced mathematical concepts including calculus, linear algebra, and discrete mathematics.', 'Available', NOW(), 23, 3145728),
('Business Administration', 'Prof. David Wilson', '978-0-789012-34-5', 7, 2020, 'Modern business administration principles, management theories, and organizational behavior.', 'Available', NOW(), 38, 5767168),
('Educational Technology', 'Dr. Maria Garcia', '978-0-890123-45-6', 8, 2022, 'Technology in education, e-learning platforms, and digital teaching methods.', 'Available', NOW(), 42, 4718592),
('Software Engineering', 'Dr. James Miller', '978-0-901234-56-7', 1, 2021, 'Software engineering principles, design patterns, and development methodologies.', 'Available', NOW(), 35, 6871948),
('Data Science Fundamentals', 'Prof. Jennifer Davis', '978-0-012345-67-8', 2, 2022, 'Introduction to data science, machine learning, and statistical analysis.', 'Available', NOW(), 58, 9437184),
('Network Security', 'Dr. Thomas Anderson', '978-1-123456-78-9', 1, 2021, 'Network security principles, cryptography, and cyber threat protection.', 'Available', NOW(), 29, 5242880),
('Artificial Intelligence', 'Dr. Rachel Lee', '978-1-234567-89-0', 1, 2022, 'Artificial intelligence concepts, machine learning algorithms, and neural networks.', 'Available', NOW(), 72, 8388608),
('Project Management', 'Prof. William Johnson', '978-1-345678-90-1', 7, 2020, 'Project management methodologies, agile practices, and team leadership.', 'Available', NOW(), 31, 4194304),
('Digital Marketing', 'Dr. Patricia Brown', '978-1-456789-01-2', 7, 2021, 'Digital marketing strategies, social media, and online advertising.', 'Available', NOW(), 44, 3670016),
('Cloud Computing', 'Dr. Christopher Wilson', '978-1-567890-12-3', 1, 2022, 'Cloud computing architecture, services, and deployment strategies.', 'Available', NOW(), 61, 7340032);

-- Insert sample downloads
INSERT INTO Downloads (UserID, BookID, DownloadDate, IPAddress, DownloadStatus, UserAgent) VALUES 
(3, 1, NOW(), '127.0.0.1', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 2, DATE_SUB(NOW(), INTERVAL 1 DAY), '127.0.0.1', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(4, 3, DATE_SUB(NOW(), INTERVAL 2 DAY), '127.0.0.1', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(5, 4, DATE_SUB(NOW(), INTERVAL 3 DAY), '127.0.0.1', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(3, 5, DATE_SUB(NOW(), INTERVAL 4 DAY), '127.0.0.1', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(6, 6, DATE_SUB(NOW(), INTERVAL 1 DAY), '192.168.1.100', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(7, 7, DATE_SUB(NOW(), INTERVAL 2 DAY), '192.168.1.101', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(8, 8, DATE_SUB(NOW(), INTERVAL 3 DAY), '192.168.1.102', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(4, 9, DATE_SUB(NOW(), INTERVAL 5 DAY), '127.0.0.1', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'),
(5, 10, DATE_SUB(NOW(), INTERVAL 6 DAY), '127.0.0.1', 'Completed', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

-- Update download counts for users
UPDATE Users SET DownloadCount = (
    SELECT COUNT(*) FROM Downloads WHERE Downloads.UserID = Users.UserID
) WHERE UserID IN (SELECT DISTINCT UserID FROM Downloads);

-- Update download counts for books
UPDATE Books SET DownloadCount = (
    SELECT COUNT(*) FROM Downloads WHERE Downloads.BookID = Books.BookID
) WHERE BookID IN (SELECT DISTINCT BookID FROM Downloads);

-- Display summary
SELECT 'Sample data created successfully!' as Status;
SELECT 
    (SELECT COUNT(*) FROM Users) as TotalUsers,
    (SELECT COUNT(*) FROM Books) as TotalBooks,
    (SELECT COUNT(*) FROM Categories) as TotalCategories,
    (SELECT COUNT(*) FROM Downloads) as TotalDownloads;
SELECT 
    Role,
    COUNT(*) as UserCount
FROM Users 
GROUP BY Role;
SELECT 
    c.Name as Category,
    COUNT(b.BookID) as BookCount
FROM Categories c
LEFT JOIN Books b ON c.CategoryID = b.CategoryID
GROUP BY c.Name;
