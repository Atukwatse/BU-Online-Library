/**
 * File Service
 * Handles file operations, validation, and optimization
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const config = require('../config');
const { ValidationError, FileUploadError } = require('../utils/errors');
const { file: logFile } = require('../utils/logger');

class FileService {
  /**
   * Validate file before upload
   */
  static async validateFile(file, options = {}) {
    const {
      allowedTypes = config.upload.allowedFileTypes,
      maxSize = config.upload.maxFileSize,
      allowedExtensions = ['.pdf', '.doc', '.docx'],
    } = options;

    // Check file type
    if (!file.mimetype || !allowedTypes.includes(file.mimetype)) {
      throw new FileUploadError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      throw new FileUploadError(`File too large. Maximum size: ${maxSizeMB}MB`);
    }

    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new FileUploadError(`Invalid extension. Allowed: ${allowedExtensions.join(', ')}`);
    }

    return { valid: true };
  }

  /**
   * Optimize image
   */
  static async optimizeImage(inputPath, outputPath, options = {}) {
    const {
      width = 800,
      height = 800,
      quality = 80,
      format = 'jpeg',
    } = options;

    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();

      // Only resize if image is larger than target dimensions
      if (metadata.width > width || metadata.height > height) {
        await image
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .toFormat(format, { quality })
          .toFile(outputPath);
      } else {
        // Just compress
        await image
          .toFormat(format, { quality })
          .toFile(outputPath);
      }

      logFile('image_optimized', { inputPath, outputPath, originalSize: metadata.size });

      return { success: true, outputPath };
    } catch (error) {
      throw new FileUploadError('Image optimization failed: ' + error.message);
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logFile('file_deleted', { filePath });
        return { success: true };
      }
      return { success: false, message: 'File not found' };
    } catch (error) {
      throw new FileUploadError('Failed to delete file: ' + error.message);
    }
  }

  /**
   * Move file
   */
  static async moveFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.renameSync(sourcePath, destinationPath);
      logFile('file_moved', { sourcePath, destinationPath });
      return { success: true };
    } catch (error) {
      throw new FileUploadError('Failed to move file: ' + error.message);
    }
  }

  /**
   * Copy file
   */
  static async copyFile(sourcePath, destinationPath) {
    try {
      // Ensure destination directory exists
      const destDir = path.dirname(destinationPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      fs.copyFileSync(sourcePath, destinationPath);
      logFile('file_copied', { sourcePath, destinationPath });
      return { success: true };
    } catch (error) {
      throw new FileUploadError('Failed to copy file: ' + error.message);
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        extension: path.extname(filePath),
      };
    } catch (error) {
      throw new ValidationError('File not found');
    }
  }

  /**
   * Ensure directory exists
   */
  static ensureDirectory(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logFile('directory_created', { dirPath });
    }
  }

  /**
   * Clean up old files
   */
  static async cleanupOldFiles(directory, maxAgeDays = 30) {
    try {
      const files = fs.readdirSync(directory);
      const now = Date.now();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);

        if (stats.isFile() && (now - stats.mtime.getTime()) > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logFile('cleanup_completed', { directory, deletedCount });
      return { success: true, deletedCount };
    } catch (error) {
      throw new FileUploadError('Cleanup failed: ' + error.message);
    }
  }

  /**
   * Generate secure filename
   */
  static generateSecureFilename(originalName) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const sanitizedName = name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .toLowerCase();

    return `${sanitizedName}_${timestamp}_${randomString}${ext}`;
  }

  /**
   * Validate file is PDF
   */
  static async validatePDF(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext !== '.pdf') {
      throw new ValidationError('File must be a PDF');
    }
    return { valid: true };
  }

  /**
   * Get file size in human readable format
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = FileService;
