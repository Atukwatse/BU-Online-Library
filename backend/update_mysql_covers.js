const mysql = require('mysql2/promise');

async function updateMySQLBookCovers() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'bugema_elibrary'
    });

    console.log('Connected to MySQL database');

    // Update book cover images
    const updates = [
      {
        title: 'Research Methods in Education',
        coverImagePath: '/RESEARCH METHODS.png'
      },
      {
        title: 'Biology: Life Sciences',
        coverImagePath: '/LIFE SCIENCE.png'
      },
      {
        title: 'Principles of Economics',
        coverImagePath: '/PRINCIPLES OF ECONOMICS.jpeg'
      }
    ];

    for (const update of updates) {
      const [result] = await connection.execute(
        'UPDATE Books SET CoverImagePath = ? WHERE Title = ?',
        [update.coverImagePath, update.title]
      );
      
      if (result.affectedRows > 0) {
        console.log(`✅ Updated "${update.title}" with cover: ${update.coverImagePath}`);
      } else {
        console.log(`❌ Book "${update.title}" not found`);
      }
    }

    // Verify the updates
    console.log('\nVerifying updates:');
    const [books] = await connection.execute('SELECT BookID, Title, CoverImagePath FROM Books');
    books.forEach(book => {
      console.log(`"${book.Title}" -> ${book.CoverImagePath || 'NULL'}`);
    });

    await connection.end();
    console.log('\nMySQL book cover updates completed!');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

updateMySQLBookCovers();
