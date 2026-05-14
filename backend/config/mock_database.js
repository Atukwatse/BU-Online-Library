// Mock Database Implementation for Testing
// This simulates database operations when MySQL is not available

class MockDatabase {
  constructor() {
    this.users = [
      {
        UserID: 1,
        FullName: 'System Administrator',
        Email: 'admin@bugema.ac.ug',
        PasswordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        Role: 'Admin',
        Status: 'Active',
        DateRegistered: new Date(),
        LastLogin: new Date(),
        DownloadCount: 0
      },
      {
        UserID: 2,
        FullName: 'Library Staff',
        Email: 'staff@bugema.ac.ug',
        PasswordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        Role: 'Staff',
        Status: 'Active',
        DateRegistered: new Date(),
        LastLogin: new Date(),
        DownloadCount: 0
      },
      {
        UserID: 3,
        FullName: 'Test Student',
        Email: 'student@bugema.ac.ug',
        PasswordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        Role: 'Student',
        Status: 'Active',
        DateRegistered: new Date(),
        LastLogin: new Date(),
        DownloadCount: 0
      },
      {
        UserID: 4,
        FullName: 'Admin User',
        Email: 'admin@gmail.com',
        PasswordHash: '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
        Role: 'Admin',
        Status: 'Active',
        DateRegistered: new Date(),
        LastLogin: new Date(),
        DownloadCount: 0
      }
    ];

    this.books = [
      {
        BookID: 1,
        Title: 'Introduction to Computer Science',
        Author: 'John Smith',
        ISBN: '978-0-123456-78-9',
        CategoryID: 1,
        Year: 2020,
        Description: 'A comprehensive introduction to computer science fundamentals',
        Status: 'Available',
        DateAdded: new Date(),
        DownloadCount: 45,
        CoverImagePath: '/books/cover_cs.png'
      },
      {
        BookID: 2,
        Title: 'Advanced Mathematics',
        Author: 'Jane Doe',
        ISBN: '978-0-234567-89-0',
        CategoryID: 2,
        Year: 2021,
        Description: 'Advanced mathematical concepts and theories',
        Status: 'Available',
        DateAdded: new Date(),
        DownloadCount: 32,
        CoverImagePath: '/books/cover_math.png'
      },
      {
        BookID: 3,
        Title: 'Principles of Economics',
        Author: 'Robert Brown',
        ISBN: '978-0-345678-90-1',
        CategoryID: 5,
        Year: 2020,
        Description: 'Fundamental concepts and principles of economic theory',
        Status: 'Available',
        DateAdded: new Date(),
        DownloadCount: 42,
        CoverImagePath: '/PRINCIPLES OF ECONOMICS.jpeg'
      },
      {
        BookID: 4,
        Title: 'African History & Heritage',
        Author: 'Grace Nakato',
        ISBN: '978-0-456789-01-2',
        CategoryID: 6,
        Year: 2022,
        Description: 'Exploration of African history and cultural heritage',
        Status: 'Available',
        DateAdded: new Date(),
        DownloadCount: 25,
        CoverImagePath: '/books/cover_history.png'
      },
      {
        BookID: 5,
        Title: 'Biology: Life Sciences',
        Author: 'Peter Opio',
        ISBN: '978-0-567890-12-3',
        CategoryID: 4,
        Year: 2021,
        Description: 'Comprehensive guide to biological sciences and life processes',
        Status: 'Unavailable',
        DateAdded: new Date(),
        DownloadCount: 35,
        CoverImagePath: '/LIFE SCIENCE.png'
      },
      {
        BookID: 6,
        Title: 'Research Methods in Education',
        Author: 'Mary Akello',
        ISBN: '978-0-678901-23-4',
        CategoryID: 3,
        Year: 2019,
        Description: 'Essential guide to academic research methodologies',
        Status: 'Available',
        DateAdded: new Date(),
        DownloadCount: 28,
        CoverImagePath: '/RESEARCH METHODS.png'
      }
    ];

    this.categories = [
      { CategoryID: 1, Name: 'Computer Science', Description: 'Books related to computer science' },
      { CategoryID: 2, Name: 'Information Science', Description: 'Books on information systems' },
      { CategoryID: 3, Name: 'Research Methods', Description: 'Books on academic research methodologies' },
      { CategoryID: 4, Name: 'Life Sciences', Description: 'Books on biological sciences and life processes' },
      { CategoryID: 5, Name: 'Economics', Description: 'Books on economic theory and principles' },
      { CategoryID: 6, Name: 'African Studies', Description: 'Books on African history and heritage' }
    ];

    this.downloads = [];
    
    this.borrowRequests = [
      {
        RequestID: 1,
        UserID: 3,
        BookID: 1,
        DueDate: '2024-06-30',
        Notes: 'Need for research project',
        Status: 'Pending',
        RequestDate: new Date(),
        CreatedAt: new Date()
      },
      {
        RequestID: 2,
        UserID: 3,
        BookID: 2,
        DueDate: '2024-07-15',
        Notes: 'Course assignment',
        Status: 'Approved',
        RequestDate: new Date(),
        CreatedAt: new Date()
      }
    ];
    
    this.events = [
      {
        EventID: 1,
        Title: 'Library Orientation Workshop',
        Description: 'Learn about the library resources and how to use them effectively',
        Location: 'Main Library Hall',
        EventDate: '2024-06-15',
        EventTime: '10:00 AM',
        RegistrationDeadline: '2024-06-10',
        MaxAttendees: 50,
        BannerImage: '/events/library-workshop.jpg',
        OrganizerID: 1,
        Status: 'Upcoming',
        CreatedAt: new Date()
      },
      {
        EventID: 2,
        Title: 'Research Methods Seminar',
        Description: 'Advanced research techniques for academic success',
        Location: 'Conference Room A',
        EventDate: '2024-06-20',
        EventTime: '2:00 PM',
        RegistrationDeadline: '2024-06-15',
        MaxAttendees: 30,
        BannerImage: '/events/research-seminar.jpg',
        OrganizerID: 2,
        Status: 'Upcoming',
        CreatedAt: new Date()
      },
      {
        EventID: 3,
        Title: 'Digital Literacy Training',
        Description: 'Improve your digital skills for academic research',
        Location: 'Computer Lab',
        EventDate: '2024-06-25',
        EventTime: '9:00 AM',
        RegistrationDeadline: '2024-06-20',
        MaxAttendees: 25,
        BannerImage: '/events/digital-literacy.jpg',
        OrganizerID: 1,
        Status: 'Upcoming',
        CreatedAt: new Date()
      }
    ];
  }

  async execute(query, params = []) {
    console.log(`🔍 Mock Query: ${query}`);
    if (params.length > 0) {
      console.log(`📝 Parameters:`, params);
    }

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Handle different query types
    if (query.includes('SELECT')) {
      return this.handleSelect(query, params);
    } else if (query.includes('INSERT')) {
      return this.handleInsert(query, params);
    } else if (query.includes('UPDATE')) {
      return this.handleUpdate(query, params);
    } else if (query.includes('DELETE')) {
      return this.handleDelete(query, params);
    } else {
      return [{}];
    }
  }

  // Add query method to match MySQL2 interface
  async query(sql, params = []) {
    console.log(`🔍 Mock Query: ${sql}`);
    if (params.length > 0) {
      console.log(`📝 Parameters:`, params);
    }

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 100));

    // Handle different query types
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      console.log('🔍 Calling handleSelect for SELECT query');
      const result = this.handleSelect(sql, params);
      console.log('🔍 handleSelect result:', result);
      return result;
    } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
      return this.handleInsert(sql, params);
    } else if (sql.trim().toUpperCase().startsWith('UPDATE')) {
      return this.handleUpdate(sql, params);
    } else if (sql.trim().toUpperCase().startsWith('DELETE')) {
      return this.handleDelete(sql, params);
    } else {
      console.log(`⚠️ Mock Database: Ignoring unsupported query type: ${sql.substring(0, 20)}...`);
      return [[]];
    }
  }

  handleSelect(query, params) {
    // User queries
    if (query.includes('Users') && query.includes('Email')) {
      const email = params[0];
      const user = this.users.find(u => u.Email === email);
      return user ? [[user]] : [[]];
    }
    
    if (query.includes('Users') && query.includes('UserID')) {
      const userId = params[0];
      const user = this.users.find(u => u.UserID === userId);
      return user ? [[user]] : [[]];
    }

    if (query.includes('Users') && query.includes('COUNT')) {
      return [[{ count: this.users.length }]];
    }

    // Book queries
    if (query.includes('Books') && query.includes('COUNT')) {
      return [[{ count: this.books.length }]];
    }

    if (query.includes('Books')) {
      // Handle JOIN with Categories
      if (query.includes('LEFT JOIN Categories') || query.includes('c.Name as CategoryName')) {
        const booksWithCategories = this.books.map(book => {
          const category = this.categories.find(c => c.CategoryID === book.CategoryID);
          return {
            ...book,
            CategoryName: category ? category.Name : null
          };
        });
        
        // Apply status filter if present
        if (query.includes('AND b.Status = "Available"')) {
          return booksWithCategories.filter(book => book.Status === 'Available');
        }
        
        return booksWithCategories;
      }
      return [this.books];
    }

    // Category queries
    if (query.includes('Categories') && query.includes('COUNT')) {
      return [[{ count: this.categories.length }]];
    }

    if (query.includes('Categories')) {
      return [this.categories];
    }

    // Download queries
    if (query.includes('Downloads') && query.includes('COUNT')) {
      return [[{ count: this.downloads.length }]];
    }

    if (query.includes('Downloads')) {
      return [this.downloads];
    }

    // Event queries - improved detection
    console.log('🔍 DEBUG: Checking for Events query in:', query);
    console.log('🔍 DEBUG: query.includes("Events"):', query.includes('Events'));
    console.log('🔍 DEBUG: query.includes("Events e"):', query.includes('Events e'));
    
    if (query.includes('Events') || query.includes('Events e')) {
      console.log('🔍 Events query detected!');
      console.log('📊 Events data length:', this.events.length);
      
      // Check if this is a COUNT query
      if (query.includes('COUNT(*) as total')) {
        console.log('🔍 Events COUNT query detected');
        return [{ total: this.events.length }];
      }
      
      // Handle regular events query with JOIN and subquery
      const eventsWithOrganizer = this.events.map(event => {
        const organizer = this.users.find(u => u.UserID === event.OrganizerID);
        return {
          ...event,
          OrganizerName: organizer ? organizer.FullName : null,
          RegisteredCount: 0 // Mock registration count
        };
      });
      console.log('📊 Events with organizer length:', eventsWithOrganizer.length);
      console.log('📊 Events with organizer data:', eventsWithOrganizer);
      
      // Return as array to match expected format
      return eventsWithOrganizer;
    }

    // Borrow request queries
    if (query.includes('BorrowRequests') && query.includes('COUNT')) {
      return [[{ count: this.borrowRequests.length }]];
    }

    if (query.includes('BorrowRequests')) {
      return [this.borrowRequests];
    }

    // Handle Requests table (used by test server)
    if (query.includes('Requests') && query.includes('COUNT')) {
      return [[{ count: this.borrowRequests.length }]];
    }

    if (query.includes('Requests')) {
      return [this.borrowRequests];
    }

    // Default empty result
    return [[]];
  }

  handleInsert(query, params) {
    if (query.includes('Users')) {
      const newUser = {
        UserID: this.users.length + 1,
        FullName: params[0],
        Email: params[1],
        PasswordHash: params[2],
        Role: params[3] || 'Student',
        Status: 'Active',
        DateRegistered: new Date(),
        LastLogin: null,
        DownloadCount: 0
      };
      this.users.push(newUser);
      return [{ insertId: newUser.UserID }];
    }

    if (query.includes('Downloads')) {
      const newDownload = {
        DownloadID: this.downloads.length + 1,
        UserID: params[0],
        BookID: params[1],
        DownloadDate: new Date(),
        IPAddress: params[2] || '127.0.0.1',
        DownloadStatus: 'Completed'
      };
      this.downloads.push(newDownload);
      return [{ insertId: newDownload.DownloadID }];
    }

    if (query.includes('BorrowRequests')) {
      const newBorrowRequest = {
        RequestID: this.borrowRequests.length + 1,
        UserID: params[0],
        BookID: params[1],
        DueDate: params[2],
        Notes: params[3] || '',
        Status: 'Pending',
        RequestDate: new Date(),
        CreatedAt: new Date()
      };
      this.borrowRequests.push(newBorrowRequest);
      return [{ insertId: newBorrowRequest.RequestID }];
    }

    // Handle Requests table (used by test server)
    if (query.includes('Requests')) {
      const newRequest = {
        RequestID: this.borrowRequests.length + 1,
        BookID: params[0],
        BookTitle: params[1],
        UserName: params[2],
        UserEmail: params[3],
        RequestDate: params[4],
        Status: params[5] || 'Pending'
      };
      this.borrowRequests.push(newRequest);
      return [{ insertId: newRequest.RequestID, lastID: newRequest.RequestID }];
    }

    return [{ insertId: 1 }];
  }

  handleUpdate(query, params) {
    if (query.includes('Users') && query.includes('LastLogin')) {
      const userId = params[0];
      const user = this.users.find(u => u.UserID === userId);
      if (user) {
        user.LastLogin = new Date();
        return [{ affectedRows: 1 }];
      }
    }

    return [{ affectedRows: 0 }];
  }

  handleDelete(query, params) {
    return [{ affectedRows: 1 }];
  }

  async getConnection() {
    return {
      config: {
        host: 'localhost',
        port: 3306,
        database: 'bugema_elibrary'
      },
      release: () => {
        console.log('🔌 Mock connection released');
      }
    };
  }

  async connect() {
    console.log('✅ Mock database connected');
    return true;
  }

  async end() {
    console.log('🔌 Mock database disconnected');
  }

  async healthCheck() {
    return {
      status: 'healthy',
      database: 'mock',
      timestamp: new Date().toISOString()
    };
  }

  async getStats() {
    return {
      users: this.users.length,
      books: this.books.length,
      categories: this.categories.length,
      downloads: this.downloads.length
    };
  }

  async close() {
    console.log('🔌 Mock database connection closed');
  }
}

module.exports = new MockDatabase();
