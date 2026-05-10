-- RBAC Enhancement Migration
-- Add Super Admin role and update Users table

USE bugema_elibrary;

-- Update Users table to support Super Admin role
ALTER TABLE Users
MODIFY COLUMN Role ENUM('Student', 'Staff', 'Admin', 'SuperAdmin') NOT NULL DEFAULT 'Student';

-- Create Permissions table (for future use with dynamic permissions)
CREATE TABLE IF NOT EXISTS Permissions (
    PermissionID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    Category VARCHAR(50),
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create RolePermissions table (for future use with dynamic role-permission mapping)
CREATE TABLE IF NOT EXISTS RolePermissions (
    RolePermissionID INT AUTO_INCREMENT PRIMARY KEY,
    Role ENUM('Student', 'Staff', 'Admin', 'SuperAdmin') NOT NULL,
    PermissionID INT NOT NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (PermissionID) REFERENCES Permissions(PermissionID) ON DELETE CASCADE,
    UNIQUE KEY unique_role_permission (Role, PermissionID),
    INDEX idx_role (Role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default permissions
INSERT INTO Permissions (Name, Description, Category) VALUES
-- User permissions
('users:read', 'View user information', 'users'),
('users:write', 'Create and update users', 'users'),
('users:delete', 'Delete users', 'users'),
('users:impersonate', 'Impersonate other users', 'users'),
-- Book permissions
('books:read', 'View books', 'books'),
('books:write', 'Create and update books', 'books'),
('books:delete', 'Delete books', 'books'),
('books:approve', 'Approve book submissions', 'books'),
('books:feature', 'Feature books on homepage', 'books'),
('books:favorite', 'Add books to favorites', 'books'),
('books:rate', 'Rate books', 'books'),
('books:review', 'Review books', 'books'),
-- Category permissions
('categories:read', 'View categories', 'categories'),
('categories:write', 'Create and update categories', 'categories'),
('categories:delete', 'Delete categories', 'categories'),
-- Download permissions
('downloads:read', 'View download history', 'downloads'),
('downloads:manage', 'Manage downloads', 'downloads'),
('downloads:delete', 'Delete download records', 'downloads'),
('downloads:create', 'Download books', 'downloads'),
-- System permissions
('system:admin', 'Access system administration', 'system'),
('system:config', 'Modify system configuration', 'system'),
('system:logs', 'View system logs', 'system'),
('system:backup', 'Create system backups', 'system'),
('system:restore', 'Restore from backups', 'system'),
-- Report permissions
('reports:read', 'View reports', 'reports'),
('reports:export', 'Export reports', 'reports'),
('reports:delete', 'Delete reports', 'reports'),
-- Admin permissions
('admins:read', 'View admin accounts', 'admins'),
('admins:write', 'Create and update admin accounts', 'admins'),
('admins:delete', 'Delete admin accounts', 'admins'),
-- Event permissions
('events:read', 'View events', 'events'),
('events:write', 'Create and update events', 'events'),
('events:delete', 'Delete events', 'events'),
('events:manage', 'Manage event registrations', 'events'),
('events:register', 'Register for events', 'events'),
-- Notification permissions
('notifications:read', 'View notifications', 'notifications'),
('notifications:write', 'Create and update notifications', 'notifications'),
('notifications:send', 'Send notifications', 'notifications'),
('notifications:delete', 'Delete notifications', 'notifications'),
-- Research permissions
('research:read', 'View research requests', 'research'),
('research:write', 'Create and update research requests', 'research'),
('research:delete', 'Delete research requests', 'research'),
('research:approve', 'Approve research requests', 'research'),
('research:create', 'Submit research requests', 'research'),
-- Printing permissions
('printing:read', 'View printing requests', 'printing'),
('printing:write', 'Create and update printing requests', 'printing'),
('printing:delete', 'Delete printing requests', 'printing'),
('printing:approve', 'Approve printing requests', 'printing'),
('printing:configure', 'Configure printing settings', 'printing'),
('printing:create', 'Submit printing requests', 'printing'),
-- Borrowing permissions
('borrowing:read', 'View borrowing records', 'borrowing'),
('borrowing:write', 'Create and update borrowing records', 'borrowing'),
('borrowing:delete', 'Delete borrowing records', 'borrowing'),
('borrowing:approve', 'Approve borrowing requests', 'borrowing'),
('borrowing:override', 'Override borrowing restrictions', 'borrowing'),
('borrowing:create', 'Submit borrowing requests', 'borrowing'),
-- Analytics permissions
('analytics:read', 'View analytics', 'analytics'),
('analytics:export', 'Export analytics data', 'analytics'),
('analytics:configure', 'Configure analytics settings', 'analytics'),
-- Settings permissions
('settings:read', 'View settings', 'settings'),
('settings:write', 'Modify settings', 'settings'),
-- Profile permissions
('profile:read', 'View profile', 'profile'),
('profile:write', 'Update profile', 'profile'),
-- Search permissions
('search:books', 'Search books', 'search'),
('search:categories', 'Search categories', 'search');

-- Display summary
SELECT 'RBAC migration completed successfully!' as Status;
SELECT 'SuperAdmin role added to Users table' as Update1;
SELECT 'Permissions and RolePermissions tables created' as Update2;
SELECT COUNT(*) as TotalPermissions FROM Permissions;
