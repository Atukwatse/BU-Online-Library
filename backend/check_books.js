const mongoose = require('mongoose');
const Book = require('./models/Book');

mongoose.connect('mongodb://localhost:27017/bugema_elibrary')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const books = await Book.find({});
    console.log(`Found ${books.length} books in database:`);
    
    books.forEach((book, index) => {
      console.log(`\nBook ${index + 1}:`);
      console.log(`  Title: ${book.title}`);
      console.log(`  Author: ${book.author}`);
      console.log(`  CoverImagePath: ${book.coverImagePath}`);
      console.log(`  Status: ${book.status}`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });
