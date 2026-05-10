-- Add specific books with custom cover images
USE bugema_elibrary;

-- Insert the specific books mentioned by the user
INSERT INTO Books (Title, Author, ISBN, CategoryID, Year, Description, Status, DateAdded, DownloadCount, FileSize, CoverImage) VALUES 
('Research in Education', 'Dr. Sarah Johnson', '978-0-987654-32-1', 3, 2021, 'Comprehensive guide to research methods in education, including qualitative and quantitative approaches, literature review, and academic writing for educational research.', 'Available', NOW(), 0, 5242880, '/RESECRH METTHODS.png'),
('Life Science', 'Prof. Michael Chen', '978-0-876543-21-9', 9, 2022, 'Fundamental concepts of life science including biology, ecology, evolution, and the scientific method for studying living organisms.', 'Available', NOW(), 0, 6291456, '/LIFE SCIENCE.png'),
('Principles of Economics', 'Dr. Emily Williams', '978-0-765432-10-8', 7, 2020, 'Essential principles of economics including microeconomics, macroeconomics, market analysis, and economic theory applications.', 'Available', NOW(), 0, 4194304, '/PRINCIPLES OF ECONOMICS.jpeg');

-- Display confirmation
SELECT 'Specific books added successfully!' as Status;
SELECT Title, Author, CoverImage FROM Books WHERE Title IN ('Research in Education', 'Life Science', 'Principles of Economics');
