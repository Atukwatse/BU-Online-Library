# Database Deployment Script for Bugema E-Library
# This script deploys the optimized MySQL database schema

Write-Host "Starting Bugema E-Library Database Deployment..." -ForegroundColor Green

# Check if MySQL is available
try {
    $mysqlVersion = & mysql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "MySQL found: $mysqlVersion" -ForegroundColor Green
    } else {
        Write-Host "MySQL not found. Please install MySQL first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "MySQL not found. Please install MySQL first." -ForegroundColor Red
    exit 1
}

# Get MySQL credentials
Write-Host "Please enter MySQL credentials:" -ForegroundColor Yellow
$mysqlUser = Read-Host "MySQL username (default: root)"
if ([string]::IsNullOrEmpty($mysqlUser)) {
    $mysqlUser = "root"
}

$mysqlPassword = Read-Host "MySQL password (press Enter for no password)" -AsSecureString
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAutoGet([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword))

# Database name
$databaseName = "bugema_elibrary"

Write-Host "Deployment Configuration:" -ForegroundColor Cyan
Write-Host "   Database: $databaseName" -ForegroundColor White
Write-Host "   User: $mysqlUser" -ForegroundColor White

try {
    # Create database if it doesn't exist
    Write-Host "Creating database..." -ForegroundColor Yellow
    $createDbQuery = "CREATE DATABASE IF NOT EXISTS $databaseName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
    
    if ($plainPassword) {
        & mysql -u $mysqlUser -p$plainPassword -e $createDbQuery 2>$null
    } else {
        & mysql -u $mysqlUser -e $createDbQuery 2>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database created/verified" -ForegroundColor Green
    } else {
        Write-Host "Failed to create database" -ForegroundColor Red
        exit 1
    }

    # Deploy the schema
    Write-Host "Deploying optimized schema..." -ForegroundColor Yellow
    $schemaFile = "database_schema_optimized.sql"
    
    if (Test-Path $schemaFile) {
        if ($plainPassword) {
            $content = Get-Content $schemaFile -Raw
            $content | & mysql -u $mysqlUser -p$plainPassword $databaseName 2>$null
        } else {
            $content = Get-Content $schemaFile -Raw
            $content | & mysql -u $mysqlUser $databaseName 2>$null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Schema deployed successfully" -ForegroundColor Green
        } else {
            Write-Host "Schema deployment failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Schema file not found: $schemaFile" -ForegroundColor Red
        exit 1
    }

    # Run migration if exists
    $migrationFile = "database_migration.sql"
    if (Test-Path $migrationFile) {
        Write-Host "Running database migration..." -ForegroundColor Yellow
        if ($plainPassword) {
            $content = Get-Content $migrationFile -Raw
            $content | & mysql -u $mysqlUser -p$plainPassword $databaseName 2>$null
        } else {
            $content = Get-Content $migrationFile -Raw
            $content | & mysql -u $mysqlUser $databaseName 2>$null
        }
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Migration completed" -ForegroundColor Green
        } else {
            Write-Host "Migration failed (non-critical)" -ForegroundColor Yellow
        }
    }

    # Verify deployment
    Write-Host "Verifying deployment..." -ForegroundColor Yellow
    $checkQuery = "SHOW TABLES;"
    
    if ($plainPassword) {
        $tables = & mysql -u $mysqlUser -p$plainPassword $databaseName -e $checkQuery 2>$null
    } else {
        $tables = & mysql -u $mysqlUser $databaseName -e $checkQuery 2>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Tables created:" -ForegroundColor Green
        $tables | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    }

    # Check sample data
    Write-Host "Checking sample users..." -ForegroundColor Yellow
    $userQuery = "SELECT UserID, FullName, Email, Role, Status FROM Users LIMIT 5;"
    
    if ($plainPassword) {
        $users = & mysql -u $mysqlUser -p$plainPassword $databaseName -e $userQuery 2>$null
    } else {
        $users = & mysql -u $mysqlUser $databaseName -e $userQuery 2>$null
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Sample users:" -ForegroundColor Green
        $users | ForEach-Object { Write-Host "   $_" -ForegroundColor White }
    }

    Write-Host "Database deployment completed successfully!" -ForegroundColor Green
    Write-Host "Database is ready for the E-Library application." -ForegroundColor Cyan

} catch {
    Write-Host "Database deployment failed:" -ForegroundColor Red
    Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Start the backend server: npm start" -ForegroundColor White
Write-Host "   2. Open login page: http://localhost:5000/login.html" -ForegroundColor White
Write-Host "   3. Test with: admin@bugema.ac.ug / admin123" -ForegroundColor White
