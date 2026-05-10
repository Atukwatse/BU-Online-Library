-- Database Optimization Migration
-- Indexing, query optimization, and performance improvements

USE bugema_elibrary;

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON Users(Email);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(Role);
CREATE INDEX IF NOT EXISTS idx_users_status ON Users(Status);
CREATE INDEX IF NOT EXISTS idx_users_date_registered ON Users(DateRegistered);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON Users(FullName);

-- Books table indexes
CREATE INDEX IF NOT EXISTS idx_books_title ON Books(Title);
CREATE INDEX IF NOT EXISTS idx_books_author ON Books(Author);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON Books(ISBN);
CREATE INDEX IF NOT EXISTS idx_books_status ON Books(Status);
CREATE INDEX IF NOT EXISTS idx_books_category ON Books(CategoryID);
CREATE INDEX IF NOT EXISTS idx_books_date_added ON Books(DateAdded);
CREATE INDEX IF NOT EXISTS idx_books_featured ON Books(IsFeatured);
CREATE INDEX IF NOT EXISTS idx_books_available ON Books(Status, AvailableCopies);

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON Categories(Name);

-- Downloads table indexes
CREATE INDEX IF NOT EXISTS idx_downloads_user ON Downloads(UserID);
CREATE INDEX IF NOT EXISTS idx_downloads_book ON Downloads(BookID);
CREATE INDEX IF NOT EXISTS idx_downloads_date ON Downloads(DownloadDate);
CREATE INDEX IF NOT EXISTS idx_downloads_user_book ON Downloads(UserID, BookID);

-- BookRatings table indexes (already created in migration)
-- Additional composite index for performance
CREATE INDEX IF NOT EXISTS idx_book_ratings_book_rating ON BookRatings(BookID, Rating);

-- BookFavorites table indexes
CREATE INDEX IF NOT EXISTS idx_book_favorites_user_book ON BookFavorites(UserID, BookID);
CREATE INDEX IF NOT EXISTS idx_book_favorites_created ON BookFavorites(CreatedAt);

-- BookReviews table indexes
CREATE INDEX IF NOT EXISTS idx_book_reviews_book ON BookReviews(BookID);
CREATE INDEX IF NOT EXISTS idx_book_reviews_user ON BookReviews(UserID);
CREATE INDEX IF NOT EXISTS idx_book_reviews_approved ON BookReviews(IsApproved);

-- RefreshTokens table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON RefreshTokens(UserID);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON RefreshTokens(ExpiresAt);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked ON RefreshTokens(IsRevoked);

-- BorrowRequests table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_borrow_requests_user ON BorrowRequests(UserID);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_book ON BorrowRequests(BookID);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_status ON BorrowRequests(Status);
CREATE INDEX IF NOT EXISTS idx_borrow_requests_date ON BorrowRequests(RequestDate);

-- Borrowings table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_borrowings_user ON Borrowings(UserID);
CREATE INDEX IF NOT EXISTS idx_borrowings_book ON Borrowings(BookID);
CREATE INDEX IF NOT EXISTS idx_borrowings_status ON Borrowings(Status);
CREATE INDEX IF NOT EXISTS idx_borrowings_due_date ON Borrowings(DueDate);

-- ReservationQueue table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_reservation_user ON ReservationQueue(UserID);
CREATE INDEX IF NOT EXISTS idx_reservation_book ON ReservationQueue(BookID);
CREATE INDEX IF NOT EXISTS idx_reservation_status ON ReservationQueue(Status);
CREATE INDEX IF NOT EXISTS idx_reservation_position ON ReservationQueue(Position);

-- Notifications table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_notifications_user ON Notifications(UserID);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON Notifications(Type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON Notifications(IsRead);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON Notifications(CreatedAt);

-- AuditLogs table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_audit_user ON AuditLogs(UserID);
CREATE INDEX IF NOT EXISTS idx_audit_action ON AuditLogs(Action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON AuditLogs(CreatedAt);

-- ResearchRequests table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_research_user ON ResearchRequests(UserID);
CREATE INDEX IF NOT EXISTS idx_research_status ON ResearchRequests(Status);
CREATE INDEX IF NOT EXISTS idx_research_priority ON ResearchRequests(Priority);
CREATE INDEX IF NOT EXISTS idx_research_subject ON ResearchRequests(Subject);

-- PrintingRequests table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_printing_user ON PrintingRequests(UserID);
CREATE INDEX IF NOT EXISTS idx_printing_status ON PrintingRequests(Status);
CREATE INDEX IF NOT EXISTS idx_printing_priority ON PrintingRequests(Priority);

-- Events table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_events_date ON Events(EventDate);
CREATE INDEX IF NOT EXISTS idx_events_status ON Events(Status);
CREATE INDEX IF NOT EXISTS idx_events_organizer ON Events(OrganizerID);

-- EventRegistrations table indexes (already created)
CREATE INDEX IF NOT EXISTS idx_event_registrations_user ON EventRegistrations(UserID);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event ON EventRegistrations(EventID);
CREATE INDEX IF NOT EXISTS idx_event_registrations_status ON EventRegistrations(Status);

-- Optimize tables
OPTIMIZE TABLE Users;
OPTIMIZE TABLE Books;
OPTIMIZE TABLE Categories;
OPTIMIZE TABLE Downloads;
OPTIMIZE TABLE BookRatings;
OPTIMIZE TABLE BookFavorites;
OPTIMIZE TABLE BookReviews;
OPTIMIZE TABLE RefreshTokens;
OPTIMIZE TABLE BorrowRequests;
OPTIMIZE TABLE Borrowings;
OPTIMIZE TABLE ReservationQueue;
OPTIMIZE TABLE Notifications;
OPTIMIZE TABLE AuditLogs;
OPTIMIZE TABLE ResearchRequests;
OPTIMIZE TABLE PrintingRequests;
OPTIMIZE TABLE Events;
OPTIMIZE TABLE EventRegistrations;

-- Analyze tables for query optimization
ANALYZE TABLE Users;
ANALYZE TABLE Books;
ANALYZE TABLE Categories;
ANALYZE TABLE Downloads;
ANALYZE TABLE BookRatings;
ANALYZE TABLE BookFavorites;
ANALYZE TABLE BookReviews;
ANALYZE TABLE RefreshTokens;
ANALYZE TABLE BorrowRequests;
ANALYZE TABLE Borrowings;
ANALYZE TABLE ReservationQueue;
ANALYZE TABLE Notifications;
ANALYZE TABLE AuditLogs;
ANALYZE TABLE ResearchRequests;
ANALYZE TABLE PrintingRequests;
ANALYZE TABLE Events;
ANALYZE TABLE EventRegistrations;

-- Display summary
SELECT 'Database optimization completed successfully!' as Status;
SELECT 'Indexes created and tables optimized for better query performance' as Summary;
