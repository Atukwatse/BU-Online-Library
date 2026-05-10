/**
 * Generate Log Report Script
 * Creates a comprehensive log report
 */

const LogAnalyzer = require('./logAnalyzer');
const fs = require('fs');
const path = require('path');

function generateLogReport() {
  const report = LogAnalyzer.generateReport();
  const reportPath = path.join(__dirname, '../logs/report.json');

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('Log report generated:', reportPath);
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

if (require.main === module) {
  generateLogReport();
}

module.exports = generateLogReport;
