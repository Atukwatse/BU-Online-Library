/**
 * Download Protection Middleware
 * Protects file downloads with authentication and authorization
 */

const path = require('path');
const fs = require('fs');
const { AuthenticationError, AuthorizationError, NotFoundError } = require('../utils/errors');
const { download: logDownload } = require('../utils/logger');

/**
 * Verify user has access to download file
 */
const verifyDownloadAccess = (req, res, next) => {
  const filePath = req.filePath;
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('File not found');
  }

  // Check if user is authenticated
  if (!req.user) {
    throw new AuthenticationError('Authentication required to download files');
  }

  // Check if user has download permission
  if (!req.user.permissions || !req.user.permissions.includes('downloads:create')) {
    throw new AuthorizationError('You do not have permission to download files');
  }

  next();
};

/**
 * Log download
 */
const logFileDownload = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 200 && req.filePath) {
      logDownload(req.user.id, req.filePath, req.ip);
    }
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Rate limit downloads
 */
const downloadRateLimiter = (maxDownloads = 10, windowMs = 3600000) => {
  const downloads = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const now = Date.now();
    const userDownloads = downloads.get(req.user.id) || { count: 0, resetTime: now + windowMs };

    if (now > userDownloads.resetTime) {
      userDownloads.count = 0;
      userDownloads.resetTime = now + windowMs;
    }

    if (userDownloads.count >= maxDownloads) {
      throw new AuthorizationError(`Download limit exceeded. Maximum ${maxDownloads} downloads per hour.`);
    }

    userDownloads.count++;
    downloads.set(req.user.id, userDownloads);

    next();
  };
};

/**
 * Set download headers
 */
const setDownloadHeaders = (filename) => {
  return (req, res, next) => {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    next();
  };
};

/**
 * Stream file to response
 */
const streamFile = (filePath) => {
  return (req, res, next) => {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;
      
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': 'application/octet-stream',
      });

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': 'application/octet-stream',
      });

      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  };
};

module.exports = {
  verifyDownloadAccess,
  logFileDownload,
  downloadRateLimiter,
  setDownloadHeaders,
  streamFile,
};
