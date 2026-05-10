const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const ensureDirectories = () => {
  const booksDir = path.join(__dirname, '../uploads/books');
  const coversDir = path.join(__dirname, '../uploads/covers');
  
  if (!fs.existsSync(path.join(__dirname, '../uploads'))) {
    fs.mkdirSync(path.join(__dirname, '../uploads'), { recursive: true });
  }
  if (!fs.existsSync(booksDir)) {
    fs.mkdirSync(booksDir, { recursive: true });
  }
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
  }
};

// Storage config for PDF files
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectories();
    cb(null, path.join(__dirname, '../uploads/books'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, `book_${uniqueSuffix}_${sanitizedName}`);
  },
});

// File filter for PDFs only
const pdfFileFilter = (req, file, cb) => {
  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== '.pdf') {
    return cb(new Error('Only PDF files are allowed'), false);
  }
  
  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    return cb(new Error('Invalid file type. Only PDF files are allowed'), false);
  }
  
  cb(null, true);
};

const uploadPDF = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
    files: 1
  },
});

// Storage config for cover images
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectories();
    cb(null, path.join(__dirname, '../uploads/covers'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `cover_${uniqueSuffix}${ext}`);
  },
});

// File filter for cover images
const coverFileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Only JPEG, PNG, and WebP images are allowed'), false);
  }
  cb(null, true);
};

const uploadCover = multer({
  storage: coverStorage,
  fileFilter: coverFileFilter,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB for covers
    files: 1
  },
});

module.exports = {
  uploadPDF,
  uploadCover,
  // Backward compatibility
  single: (fieldname) => uploadPDF.single(fieldname),
};
