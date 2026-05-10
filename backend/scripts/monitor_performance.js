#!/usr/bin/env node

/**
 * Database Performance Monitoring Script
 * Monitors database performance and provides optimization recommendations
 */

const db = require('../config/mysql_database');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = [];
    this.thresholds = {
      queryTime: 1000, // 1 second
      connectionCount: 80, // 80% of max connections
      diskUsage: 80, // 80% disk usage
      memoryUsage: 80 // 80% memory usage
    };
  }

  async measureQuery(query, description) {
    const start = Date.now();
    try {
      const result = await db.query(query);
      const duration = Date.now() - start;
      
      this.metrics.push({
        type: 'query',
        description,
        query: query.substring(0, 100) + '...',
        duration,
        resultCount: Array.isArray(result) ? result.length : 1,
        timestamp: new Date().toISOString()
      });

      return { result, duration };
    } catch (error) {
      const duration = Date.now() - start;
      
      this.metrics.push({
        type: 'query_error',
        description,
        query: query.substring(0, 100) + '...',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  async checkSlowQueries() {
    console.log('🔍 Checking for slow queries...');
    
    const slowQueriesQuery = `
      SELECT 
        query_time,
        lock_time,
        rows_sent,
        rows_examined,
        sql_text
      FROM mysql.slow_log 
      WHERE start_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      ORDER BY query_time DESC
      LIMIT 10
    `;

    try {
      const { result } = await this.measureQuery(slowQueriesQuery, 'Get slow queries');
      
      if (result.length > 0) {
        console.log(`⚠️  Found ${result.length} slow queries in the last hour:`);
        result.forEach((query, index) => {
          console.log(`   ${index + 1}. Time: ${query.query_time}s - ${query.sql_text.substring(0, 80)}...`);
        });
      } else {
        console.log('✅ No slow queries found in the last hour');
      }
    } catch (error) {
      console.log('⚠️  Could not check slow queries (slow_log may not be enabled)');
    }
  }

  async checkIndexes() {
    console.log('📊 Analyzing index usage...');
    
    const indexUsageQuery = `
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        CARDINALITY,
        SEQ_IN_INDEX,
        COLUMN_NAME
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = 'bugema_elibrary'
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `;

    const { result } = await this.measureQuery(indexUsageQuery, 'Get index usage');
    
    const indexStats = {};
    result.forEach(row => {
      if (!indexStats[row.TABLE_NAME]) {
        indexStats[row.TABLE_NAME] = [];
      }
      indexStats[row.TABLE_NAME].push({
        index: row.INDEX_NAME,
        column: row.COLUMN_NAME,
        cardinality: row.CARDINALITY
      });
    });

    console.log('📈 Index Analysis:');
    Object.entries(indexStats).forEach(([table, indexes]) => {
      console.log(`   📋 ${table}: ${indexes.length} indexes`);
      indexes.forEach(idx => {
        console.log(`      • ${idx.index} on ${idx.column} (Cardinality: ${idx.cardinality})`);
      });
    });

    return indexStats;
  }

  async checkTableSizes() {
    console.log('📏 Analyzing table sizes...');
    
    const tableSizeQuery = `
      SELECT 
        TABLE_NAME,
        ROUND(((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024), 2) AS 'SizeMB',
        TABLE_ROWS,
        ROUND((DATA_LENGTH / 1024 / 1024), 2) AS 'DataMB',
        ROUND((INDEX_LENGTH / 1024 / 1024), 2) AS 'IndexMB'
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'bugema_elibrary'
      ORDER BY (DATA_LENGTH + INDEX_LENGTH) DESC
    `;

    const { result } = await this.measureQuery(tableSizeQuery, 'Get table sizes');
    
    console.log('📊 Table Sizes:');
    result.forEach(table => {
      console.log(`   📋 ${table.TABLE_NAME}: ${table.SizeMB}MB (${table.TABLE_ROWS} rows)`);
      console.log(`      Data: ${table.DataMB}MB, Indexes: ${table.IndexMB}MB`);
    });

    return result;
  }

  async checkConnectionCount() {
    console.log('🔗 Checking connection count...');
    
    const connectionQuery = `
      SELECT 
        COUNT(*) as total_connections,
        SUM(CASE WHEN COMMAND = 'Sleep' THEN 1 ELSE 0 END) as idle_connections,
        SUM(CASE WHEN COMMAND != 'Sleep' THEN 1 ELSE 0 END) as active_connections
      FROM information_schema.PROCESSLIST
    `;

    const { result } = await this.measureQuery(connectionQuery, 'Get connection count');
    const connections = result[0];
    
    console.log(`🔗 Connections: ${connections.total_connections} total`);
    console.log(`   Active: ${connections.active_connections}, Idle: ${connections.idle_connections}`);

    // Check if approaching threshold
    const maxConnections = await this.getMaxConnections();
    const usagePercent = (connections.total_connections / maxConnections) * 100;
    
    if (usagePercent > this.thresholds.connectionCount) {
      console.log(`⚠️  High connection usage: ${usagePercent.toFixed(2)}%`);
    } else {
      console.log(`✅ Connection usage: ${usagePercent.toFixed(2)}%`);
    }

    return { ...connections, maxConnections, usagePercent };
  }

  async getMaxConnections() {
    const { result } = await this.measureQuery('SHOW VARIABLES LIKE "max_connections"', 'Get max connections');
    return parseInt(result[0].Value);
  }

  async analyzeQueryPerformance() {
    console.log('⚡ Analyzing query performance...');
    
    const testQueries = [
      {
        name: 'User Lookup by Email',
        query: 'SELECT * FROM Users WHERE Email = ?',
        params: ['test@example.com']
      },
      {
        name: 'Book Search by Title',
        query: 'SELECT * FROM Books WHERE Title LIKE ? LIMIT 10',
        params: ['%test%']
      },
      {
        name: 'Download Count Query',
        query: 'SELECT COUNT(*) as count FROM Downloads WHERE DownloadDate >= DATE_SUB(NOW(), INTERVAL 7 DAY)'
      },
      {
        name: 'Popular Books Query',
        query: `
          SELECT b.BookID, b.Title, COUNT(d.DownloadID) as downloadCount
          FROM Books b
          LEFT JOIN Downloads d ON b.BookID = d.BookID
          GROUP BY b.BookID
          ORDER BY downloadCount DESC
          LIMIT 10
        `
      },
      {
        name: 'User Statistics',
        query: `
          SELECT 
            Role,
            Status,
            COUNT(*) as count
          FROM Users
          GROUP BY Role, Status
        `
      }
    ];

    const results = [];
    
    for (const test of testQueries) {
      const { duration } = await this.measureQuery(test.query, test.name);
      
      results.push({
        name: test.name,
        duration,
        status: duration > this.thresholds.queryTime ? 'SLOW' : 'OK'
      });

      console.log(`   ⏱️  ${test.name}: ${duration}ms ${duration > this.thresholds.queryTime ? '⚠️' : '✅'}`);
    }

    return results;
  }

  async checkFragmentation() {
    console.log('🧩 Checking table fragmentation...');
    
    const fragmentationQuery = `
      SELECT 
        TABLE_NAME,
        ROUND(((DATA_FREE / 1024 / 1024), 2)) AS 'FragmentationMB',
        ROUND(((DATA_FREE / (DATA_LENGTH + INDEX_LENGTH)) * 100), 2) AS 'FragmentationPercent'
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'bugema_elibrary'
        AND DATA_FREE > 0
      ORDER BY FragmentationPercent DESC
    `;

    try {
      const { result } = await this.measureQuery(fragmentationQuery, 'Check fragmentation');
      
      if (result.length > 0) {
        console.log(`⚠️  Found ${result.length} fragmented tables:`);
        result.forEach(table => {
          console.log(`   📋 ${table.TABLE_NAME}: ${table.FragmentationMB}MB (${table.FragmentationPercent}%)`);
        });
      } else {
        console.log('✅ No table fragmentation detected');
      }

      return result;
    } catch (error) {
      console.log('⚠️  Could not check fragmentation');
      return [];
    }
  }

  async generateOptimizationRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];

    // Analyze slow queries
    const slowQueries = this.metrics.filter(m => m.type === 'query' && m.duration > this.thresholds.queryTime);
    if (slowQueries.length > 0) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        title: 'Optimize Slow Queries',
        description: `${slowQueries.length} queries are taking longer than ${this.thresholds.queryTime}ms`,
        action: 'Consider adding indexes or optimizing query structure'
      });
    }

    // Check for missing indexes
    const frequentQueries = this.metrics.filter(m => m.type === 'query' && m.duration > 500);
    if (frequentQueries.length > 0) {
      recommendations.push({
        type: 'index',
        priority: 'medium',
        title: 'Review Index Strategy',
        description: 'Some queries are taking longer than expected',
        action: 'Analyze query patterns and consider additional indexes'
      });
    }

    // Check table sizes
    const largeTables = await this.checkTableSizes();
    const veryLargeTables = largeTables.filter(t => t.SizeMB > 100);
    if (veryLargeTables.length > 0) {
      recommendations.push({
        type: 'storage',
        priority: 'medium',
        title: 'Large Tables Detected',
        description: `${veryLargeTables.length} tables are over 100MB`,
        action: 'Consider partitioning or archiving old data'
      });
    }

    // Check fragmentation
    const fragmentedTables = await this.checkFragmentation();
    if (fragmentedTables.length > 0) {
      recommendations.push({
        type: 'maintenance',
        priority: 'low',
        title: 'Table Fragmentation',
        description: `${fragmentedTables.length} tables have fragmentation`,
        action: 'Run OPTIMIZE TABLE on fragmented tables'
      });
    }

    console.log('💡 Recommendations:');
    recommendations.forEach((rec, index) => {
      const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢';
      console.log(`   ${index + 1}. ${priority} ${rec.title}`);
      console.log(`      ${rec.description}`);
      console.log(`      Action: ${rec.action}\n`);
    });

    return recommendations;
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalQueries: this.metrics.filter(m => m.type === 'query').length,
        slowQueries: this.metrics.filter(m => m.type === 'query' && m.duration > this.thresholds.queryTime).length,
        averageQueryTime: this.metrics.reduce((sum, m) => sum + (m.duration || 0), 0) / this.metrics.length
      },
      metrics: this.metrics,
      recommendations: []
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'performance_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Performance report saved to: ${reportPath}`);

    return report;
  }

  async runFullAnalysis() {
    console.log('🚀 Starting Database Performance Analysis\n');
    
    try {
      // Check database health
      const isHealthy = await db.healthCheck();
      if (!isHealthy) {
        throw new Error('Database health check failed');
      }
      console.log('✅ Database health check passed\n');

      // Run all analyses
      await this.checkSlowQueries();
      await this.checkIndexes();
      await this.checkTableSizes();
      await this.checkConnectionCount();
      await this.analyzeQueryPerformance();
      await this.checkFragmentation();
      
      // Generate recommendations
      await this.generateOptimizationRecommendations();
      
      // Generate report
      await this.generateReport();

      console.log('\n🎉 Performance analysis completed!');
      console.log('\n📋 Summary:');
      console.log(`   • Total queries analyzed: ${this.metrics.length}`);
      console.log(`   • Slow queries detected: ${this.metrics.filter(m => m.duration > this.thresholds.queryTime).length}`);
      console.log(`   • Average query time: ${(this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length).toFixed(2)}ms`);

    } catch (error) {
      console.error('\n❌ Performance analysis failed:', error.message);
      throw error;
    }
  }
}

// Run analysis
if (require.main === module) {
  const monitor = new PerformanceMonitor();
  monitor.runFullAnalysis().catch(console.error);
}

module.exports = PerformanceMonitor;
