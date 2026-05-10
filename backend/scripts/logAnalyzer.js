/**
 * Log Analyzer Script
 * Analyzes log files for insights
 */

const fs = require('fs');
const path = require('path');
const { logger } = require('../utils/logger');

const LOG_DIR = path.join(__dirname, '../logs');

class LogAnalyzer {
  /**
   * Parse log line
   */
  static parseLogLine(line) {
    try {
      const jsonMatch = line.match(/\{.*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Analyze error logs
   */
  static analyzeErrorLogs() {
    const errorLogPath = path.join(LOG_DIR, 'error.log');
    
    if (!fs.existsSync(errorLogPath)) {
      return { message: 'No error log file found' };
    }

    const content = fs.readFileSync(errorLogPath, 'utf8');
    const lines = content.split('\n');
    
    const errors = [];
    const errorCounts = {};
    let totalErrors = 0;

    for (const line of lines) {
      if (line.trim()) {
        totalErrors++;
        const parsed = this.parseLogLine(line);
        if (parsed) {
          errors.push(parsed);
          const errorType = parsed.message || parsed.level || 'unknown';
          errorCounts[errorType] = (errorCounts[errorType] || 0) + 1;
        }
      }
    }

    return {
      totalErrors,
      errorCounts,
      recentErrors: errors.slice(-10),
    };
  }

  /**
   * Analyze auth logs
   */
  static analyzeAuthLogs() {
    const authLogPath = path.join(LOG_DIR, 'auth.log');
    
    if (!fs.existsSync(authLogPath)) {
      return { message: 'No auth log file found' };
    }

    const content = fs.readFileSync(authLogPath, 'utf8');
    const lines = content.split('\n');
    
    const authEvents = [];
    const authCounts = {
      login: { success: 0, failed: 0 },
      logout: { success: 0 },
      register: { success: 0, failed: 0 },
      password_change: { success: 0, failed: 0 },
    };

    for (const line of lines) {
      if (line.trim()) {
        const parsed = this.parseLogLine(line);
        if (parsed && parsed.action) {
          authEvents.push(parsed);
          
          if (authCounts[parsed.action]) {
            if (parsed.success) {
              authCounts[parsed.action].success++;
            } else {
              authCounts[parsed.action].failed++;
            }
          }
        }
      }
    }

    return {
      totalEvents: authEvents.length,
      authCounts,
      recentEvents: authEvents.slice(-10),
    };
  }

  /**
   * Analyze combined logs
   */
  static analyzeCombinedLogs() {
    const combinedLogPath = path.join(LOG_DIR, 'combined.log');
    
    if (!fs.existsSync(combinedLogPath)) {
      return { message: 'No combined log file found' };
    }

    const content = fs.readFileSync(combinedLogPath, 'utf8');
    const lines = content.split('\n');
    
    const logLevels = {};
    let totalLogs = 0;

    for (const line of lines) {
      if (line.trim()) {
        totalLogs++;
        const parsed = this.parseLogLine(line);
        if (parsed && parsed.level) {
          logLevels[parsed.level] = (logLevels[parsed.level] || 0) + 1;
        }
      }
    }

    return {
      totalLogs,
      logLevels,
    };
  }

  /**
   * Generate summary report
   */
  static generateReport() {
    const errorAnalysis = this.analyzeErrorLogs();
    const authAnalysis = this.analyzeAuthLogs();
    const combinedAnalysis = this.analyzeCombinedLogs();

    return {
      timestamp: new Date().toISOString(),
      errorAnalysis,
      authAnalysis,
      combinedAnalysis,
    };
  }
}

// Run analysis if called directly
if (require.main === module) {
  const report = LogAnalyzer.generateReport();
  console.log(JSON.stringify(report, null, 2));
}

module.exports = LogAnalyzer;
