# E-Library Backend API

A Node.js backend for an E-library system built with Express and MongoDB.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Update `.env` with your configuration:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/elibrary
   NODE_ENV=development
   ```

## Running the Server

**Development mode (with hot reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Books
- `GET /api/books` - Get all books
- `GET /api/books/:id` - Get book by ID
- `POST /api/books` - Create new book
- `PATCH /api/books/:id` - Update book
- `DELETE /api/books/:id` - Delete book

### Health Check
- `GET /api/health` - Server health status

## Project Structure

```
backend/
├── config/
│   └── database.js      # MongoDB connection
├── controllers/
│   └── bookController.js # Book controller logic
├── models/
│   └── Book.js          # Book schema
├── routes/
│   └── bookRoutes.js    # Book routes
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── server.js            # Main server file
└── README.md
```

## Example Request

```bash
# Create a book
curl -X POST http://localhost:5000/api/books \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "978-0743273565",
    "description": "A classic American novel",
    "category": "Fiction",
    "publishedYear": 1925,
    "pages": 180,
    "available": true
  }'
```

## License

ISC
