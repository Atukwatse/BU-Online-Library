/**
 * File Validation Middleware
 * Enhanced file upload validation and optimization
 */

const multer = require('multer');
const path = require('path');
const { ValidationError, FileUploadError } = require('../utils/errors');
const config = require('../config');

/**
 * File type validation
 */
const validateFileType = (file, allowedTypes) => {
  if (!file.mimetype) {
    throw new FileUploadError('Invalid file type');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new FileUploadError(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return true;
};

/**
 * File size validation
 */
const validateFileSize = (file, maxSize) => {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    throw new FileUploadError(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
  }

  return true;
};

/**
 * File extension validation
 */
const validateFileExtension = (file, allowedExtensions) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    throw new FileUploadError(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}`);
  }

  return true;
};

/**
 * Sanitize filename
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

/**
 * Generate unique filename
 */
const generateUniqueFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const sanitizedName = sanitizeFilename(name);
  
  return `${sanitizedName}_${timestamp}_${randomString}${ext}`;
};

/**
 * Multer configuration for books
 */
const bookUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.upload.bookPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    try {
      validateFileType(file, config.upload.allowedFileTypes);
      validateFileExtension(file, ['.pdf']);
      validateFileSize(file, config.upload.maxFileSize);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  },
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

/**
 * Multer configuration for covers
 */
const coverUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.upload.coverPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    try {
      validateFileType(file, config.upload.allowedImageTypes);
      validateFileExtension(file, ['.jpg', '.jpeg', '.png', '.webp']);
      validateFileSize(file, config.upload.maxCoverSize);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  },
  limits: {
    fileSize: config.upload.maxCoverSize,
  },
});

/**
 * Multer configuration for event banners
 */
const bannerUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.upload.eventBannerPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    try {
      validateFileType(file, config.upload.allowedImageTypes);
      validateFileExtension(file, ['.jpg', '.jpeg', '.png', '.webp']);
      validateFileSize(file, config.upload.maxCoverSize);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  },
  limits: {
    fileSize: config.upload.maxCoverSize,
  },
});

/**
 * Multer configuration for research files
 */
const researchUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.upload.researchPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    try {
      validateFileType(file, config.upload.allowedFileTypes);
      validateFileExtension(file, ['.pdf', '.doc', '.docx']);
      validateFileSize(file, config.upload.maxFileSize);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  },
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

/**
 * Multer configuration for printing files
 */
const printingUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, config.upload.printingPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = generateUniqueFilename(file.originalname);
      cb(null, uniqueName);
    },
  }),
  fileFilter: (req, file, cb) => {
    try {
      validateFileType(file, config.upload.allowedFileTypes);
      validateFileExtension(file, ['.pdf', '.doc', '.docx']);
      validateFileSize(file, config.upload.maxFileSize);
      cb(null, true);
    } catch (error) {
      cb(error, false);
    }
  },
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

/**
 * Generic file upload configuration
 */
const createUploadConfig = (destination, allowedTypes, maxSize, allowedExtensions) => {
  return multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, destination);
      },
      filename: (req, file, cb) => {
        const uniqueName = generateUniqueFilename(file.originalname);
        cb(null, uniqueName);
      },
    }),
    fileFilter: (req, file, cb) => {
      try {
        validateFileType(file, allowedTypes);
        validateFileExtension(file, allowedExtensions);
        validateFileSize(file, maxSize);
        cb(null, true);
      } catch (error) {
        cb(error, false);
      }
    },
    limits: {
      fileSize: maxSize,
    },
  });
};

module.exports = {
  validateFileType,
  validateFileSize,
  validateFileExtension,
  sanitizeFilename,
  generateUniqueFilename,
  bookUpload,
  coverUpload,
  bannerUpload,
  researchUpload,
  printingUpload,
  createUploadConfig,
};
