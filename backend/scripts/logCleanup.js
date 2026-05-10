/**
 * Log Cleanup Script
 * Cleans up old log files
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

const LOG_DIR = path.join(__dirname, '../logs');
const MAX_AGE_DAYS = 30;

function cleanupLogs() {
  try {
    const files = fs.readdirSync(LOG_DIR);
    const now = Date.now();
    const maxAge = MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
    let deletedCount = 0;
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(LOG_DIR, file);
      const stats = fs.statSync(filePath);

      if (stats.isFile()) {
        const age = now - stats.mtime.getTime();
        
        if (age > maxAge) {
          totalSize += stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          logger.info(`Deleted old log file: ${file}`);
        }
      }
    }

    logger.info(`Log cleanup completed. Deleted ${deletedCount} files, freed ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    
    return {
      success: true,
      deletedCount,
      freedSpace: `${(totalSize / 1024 / 1024).toFixed(2)} MB`,
    };
  } catch (error) {
    logger.error('Log cleanup failed', error);
    throw error;
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanupLogs();
}

module.exports = cleanupLogs;
