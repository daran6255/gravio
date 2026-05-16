#!/bin/bash

# Database Backup Script for WinVinaya CRM
# Usage: ./backup-db.sh {dev|qa|prod}

set -e

ENV=$1

if [ -z "$ENV" ]; then
    echo "Error: Environment not specified"
    echo "Usage: ./backup-db.sh {dev|qa|prod}"
    exit 1
fi

# Environment-specific configurations
case $ENV in
    dev)
        DB_NAME="winvinaya_dev"
        ;;
    qa)
        DB_NAME="winvinaya_qa"
        ;;
    prod)
        DB_NAME="winvinaya_prod"
        ;;
    *)
        echo "Error: Invalid environment"
        exit 1
        ;;
esac

# Backup directory
BACKUP_DIR="/var/www/winvinaya-crm/backups/db"
mkdir -p $BACKUP_DIR

# Create timestamped backup filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "================================"
echo "Database Backup - $ENV Environment"
echo "Database: $DB_NAME"
echo "================================"

# Create backup
echo "Creating database backup..."
pg_dump -U postgres $DB_NAME | gzip > $BACKUP_FILE

# Verify backup was created
if [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup created successfully: $BACKUP_FILE ($FILE_SIZE)"
else
    echo "❌ Backup failed!"
    exit 1
fi

# Keep only last 10 backups
echo "Cleaning old backups (keeping last 10)..."
cd $BACKUP_DIR
ls -t ${DB_NAME}_*.sql.gz | tail -n +11 | xargs -r rm

echo "================================"
echo "✅ Backup completed successfully!"
echo "Location: $BACKUP_FILE"
echo "================================"

# List recent backups
echo "Recent backups:"
ls -lht ${DB_NAME}_*.sql.gz | head -n 5
