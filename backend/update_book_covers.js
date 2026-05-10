const mongoose = require('mongoose');
const Book = require('./models/Book');

mongoose.connect('mongodb://localhost:27017/bugema_elibrary')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Update the book cover images
    const updates = [
      {
        title: 'Research in Education',
        coverImagePath: '/RESEARCH METHODS.png'
      },
      {
        title: 'Life Science', 
        coverImagePath: '/LIFE SCIENCE.png'
      },
      {
        title: 'Principles of Economics',
        coverImagePath: '/PRINCIPLES OF ECONOMICS.jpeg'
      }
    ];
    
    for (const update of updates) {
      const result = await Book.updateOne(
        { title: update.title },
        { coverImagePath: update.coverImagePath }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated "${update.title}" with cover: ${update.coverImagePath}`);
      } else {
        console.log(`❌ Book "${update.title}" not found or already updated`);
      }
    }
    
    console.log('\nBook cover updates completed!');
    
    // Verify the updates
    console.log('\nVerifying updates:');
    const books = await Book.find({});
    books.forEach(book => {
      console.log(`"${book.title}" -> ${book.coverImagePath}`);
    });
    
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Error:', err);
    mongoose.connection.close();
  });
