const mongoose = require('mongoose');
const Book = require('./models/Book');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bugema_elibrary', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const booksToAdd = [
  {
    title: 'Research in Education',
    author: 'Dr. Sarah Johnson',
    isbn: '978-0-987654-32-1',
    category: 'Education',
    year: 2021,
    description: 'Comprehensive guide to research methods in education, including qualitative and quantitative approaches, literature review, and academic writing for educational research.',
    filePath: '/books/research_in_education.pdf',
    coverImagePath: '/RESECRH METTHODS.png',
    status: 'Available',
    fileSize: 5242880
  },
  {
    title: 'Life Science',
    author: 'Prof. Michael Chen',
    isbn: '978-0-876543-21-9',
    category: 'Science',
    year: 2022,
    description: 'Fundamental concepts of life science including biology, ecology, evolution, and the scientific method for studying living organisms.',
    filePath: '/books/life_science.pdf',
    coverImagePath: '/LIFE SCIENCE.png',
    status: 'Available',
    fileSize: 6291456
  },
  {
    title: 'Principles of Economics',
    author: 'Dr. Emily Williams',
    isbn: '978-0-765432-10-8',
    category: 'Economics',
    year: 2020,
    description: 'Essential principles of economics including microeconomics, macroeconomics, market analysis, and economic theory applications.',
    filePath: '/books/principles_of_economics.pdf',
    coverImagePath: '/PRINCIPLES OF ECONOMICS.jpeg',
    status: 'Available',
    fileSize: 4194304
  }
];

async function addBooks() {
  try {
    // Clear existing books with same titles to avoid duplicates
    await Book.deleteMany({ 
      title: { $in: booksToAdd.map(book => book.title) }
    });
    
    // Add new books
    const insertedBooks = await Book.insertMany(booksToAdd);
    
    console.log('Books added successfully:');
    insertedBooks.forEach(book => {
      console.log(`- ${book.title} by ${book.author} (Cover: ${book.coverImagePath})`);
    });
    
  } catch (error) {
    console.error('Error adding books:', error);
  } finally {
    mongoose.connection.close();
  }
}

addBooks();
