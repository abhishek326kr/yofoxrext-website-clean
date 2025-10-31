#!/bin/bash

# YoForex Backup and Restore Script
# Handles database backups, file backups, and restoration
# Usage: 
#   ./backup-restore.sh backup [s3|local]
#   ./backup-restore.sh restore [backup-id]
#   ./backup-restore.sh list
#   ./backup-restore.sh schedule

set -euo pipefail

# Configuration
BACKUP_DIR="/var/backups/yoforex"
S3_BUCKET="${S3_BACKUP_BUCKET:-yoforex-backups}"
S3_REGION="${AWS_DEFAULT_REGION:-us-east-1}"
DATABASE_URL="${DATABASE_URL}"
UPLOAD_DIR="/var/www/yoforex/public/uploads"
CONFIG_DIR="/var/www/yoforex"
TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
BACKUP_ID="yoforex-backup-${TIMESTAMP}"
LOG_FILE="/var/log/yoforex/backup-${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Create necessary directories
mkdir -p "$BACKUP_DIR" "$(dirname "$LOG_FILE")"

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
    return 1
}

# Check prerequisites
check_prerequisites() {
    local missing_tools=()
    
    # Check for required tools
    command -v pg_dump >/dev/null 2>&1 || missing_tools+=("postgresql-client")
    command -v tar >/dev/null 2>&1 || missing_tools+=("tar")
    command -v gzip >/dev/null 2>&1 || missing_tools+=("gzip")
    
    if [ "$1" == "s3" ]; then
        command -v aws >/dev/null 2>&1 || missing_tools+=("awscli")
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        echo "Install with: sudo apt-get install ${missing_tools[*]}"
        exit 1
    fi
    
    # Check database URL
    if [ -z "${DATABASE_URL:-}" ]; then
        log_error "DATABASE_URL not set"
        exit 1
    fi
}

# Database backup function
backup_database() {
    local backup_file="$1/database.sql"
    
    log_info "Starting database backup..."
    
    # Create PostgreSQL backup with custom format for faster restore
    if PGPASSWORD="${DATABASE_URL##*@}" pg_dump "$DATABASE_URL" \
        --format=custom \
        --verbose \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --file="$backup_file" 2>>"$LOG_FILE"; then
        
        # Compress the backup
        gzip -9 "$backup_file"
        log_success "Database backup completed: ${backup_file}.gz"
        return 0
    else
        log_error "Database backup failed"
        return 1
    fi
}

# File backup function
backup_files() {
    local backup_dir="$1"
    
    log_info "Starting file backup..."
    
    # Backup uploads directory
    if [ -d "$UPLOAD_DIR" ]; then
        log_info "Backing up uploads..."
        tar -czf "$backup_dir/uploads.tar.gz" -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")" 2>>"$LOG_FILE"
        log_success "Uploads backed up"
    else
        log_warning "Uploads directory not found"
    fi
    
    # Backup configuration files
    log_info "Backing up configuration files..."
    CONFIG_FILES=(
        ".env.production"
        "ecosystem.config.js"
        "nginx/yoforex.conf"
        "drizzle.config.ts"
    )
    
    cd "$CONFIG_DIR"
    tar -czf "$backup_dir/config.tar.gz" "${CONFIG_FILES[@]}" 2>>"$LOG_FILE" || true
    log_success "Configuration files backed up"
    
    return 0
}

# Create backup metadata
create_metadata() {
    local backup_dir="$1"
    
    cat > "$backup_dir/metadata.json" <<EOF
{
  "backup_id": "$BACKUP_ID",
  "timestamp": "$TIMESTAMP",
  "created_at": "$(date -u '+%Y-%m-%dT%H:%M:%SZ')",
  "hostname": "$(hostname)",
  "database_url": "${DATABASE_URL%%@*}@***",
  "backup_size": "$(du -sh "$backup_dir" | cut -f1)",
  "files": $(ls -1 "$backup_dir" | jq -R . | jq -s .),
  "version": "1.0.0"
}
EOF
    
    log_info "Metadata created"
}

# Upload to S3
upload_to_s3() {
    local backup_dir="$1"
    
    log_info "Uploading backup to S3..."
    
    # Check AWS credentials
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS credentials not configured"
        return 1
    fi
    
    # Create bucket if it doesn't exist
    if ! aws s3 ls "s3://$S3_BUCKET" >/dev/null 2>&1; then
        log_info "Creating S3 bucket: $S3_BUCKET"
        aws s3 mb "s3://$S3_BUCKET" --region "$S3_REGION"
        
        # Enable versioning
        aws s3api put-bucket-versioning \
            --bucket "$S3_BUCKET" \
            --versioning-configuration Status=Enabled
    fi
    
    # Upload backup with server-side encryption
    if aws s3 sync "$backup_dir" "s3://$S3_BUCKET/$BACKUP_ID/" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256 \
        --metadata "timestamp=$TIMESTAMP,hostname=$(hostname)" \
        --exclude "*.log"; then
        
        log_success "Backup uploaded to S3: s3://$S3_BUCKET/$BACKUP_ID/"
        
        # Set lifecycle policy for old backups (optional)
        setup_s3_lifecycle
        
        return 0
    else
        log_error "S3 upload failed"
        return 1
    fi
}

# Setup S3 lifecycle policy
setup_s3_lifecycle() {
    cat > /tmp/lifecycle.json <<EOF
{
  "Rules": [{
    "Id": "DeleteOldBackups",
    "Status": "Enabled",
    "Prefix": "yoforex-backup-",
    "Transitions": [{
      "Days": 30,
      "StorageClass": "GLACIER"
    }],
    "Expiration": {
      "Days": 90
    }
  }]
}
EOF
    
    aws s3api put-bucket-lifecycle-configuration \
        --bucket "$S3_BUCKET" \
        --lifecycle-configuration file:///tmp/lifecycle.json 2>/dev/null || true
    
    rm -f /tmp/lifecycle.json
}

# Main backup function
perform_backup() {
    local destination="${1:-local}"
    local backup_path="$BACKUP_DIR/$BACKUP_ID"
    
    log_info "Starting YoForex backup (ID: $BACKUP_ID)"
    mkdir -p "$backup_path"
    
    # Check prerequisites
    check_prerequisites "$destination"
    
    # Stop cron jobs during backup (optional)
    log_info "Pausing background jobs..."
    sudo service cron stop 2>/dev/null || true
    
    # Perform backups
    backup_database "$backup_path"
    backup_files "$backup_path"
    create_metadata "$backup_path"
    
    # Create final archive
    log_info "Creating final archive..."
    cd "$BACKUP_DIR"
    tar -czf "${BACKUP_ID}.tar.gz" "$BACKUP_ID"
    
    # Upload to S3 if requested
    if [ "$destination" == "s3" ]; then
        upload_to_s3 "$backup_path"
        
        # Clean up local copy after successful upload
        rm -rf "$backup_path"
        rm -f "${BACKUP_ID}.tar.gz"
    fi
    
    # Restart cron jobs
    sudo service cron start 2>/dev/null || true
    
    log_success "Backup completed successfully!"
    log_info "Backup location: $BACKUP_DIR/${BACKUP_ID}.tar.gz"
    
    # Clean up old local backups (keep last 7)
    log_info "Cleaning up old backups..."
    ls -t "$BACKUP_DIR"/yoforex-backup-*.tar.gz 2>/dev/null | tail -n +8 | xargs -r rm -f
    
    return 0
}

# Restore database function
restore_database() {
    local backup_file="$1/database.sql.gz"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Database backup not found: $backup_file"
        return 1
    fi
    
    log_info "Restoring database from backup..."
    log_warning "This will overwrite the current database!"
    
    # Confirm restoration
    read -p "Are you sure you want to restore? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log_info "Restoration cancelled"
        return 1
    fi
    
    # Create a temporary backup of current database
    log_info "Creating safety backup of current database..."
    SAFETY_BACKUP="/tmp/safety-backup-$(date +%s).sql.gz"
    pg_dump "$DATABASE_URL" | gzip > "$SAFETY_BACKUP"
    log_info "Safety backup created: $SAFETY_BACKUP"
    
    # Restore database
    if gunzip -c "$backup_file" | pg_restore -d "$DATABASE_URL" \
        --clean \
        --if-exists \
        --no-owner \
        --no-acl \
        --verbose 2>>"$LOG_FILE"; then
        
        log_success "Database restored successfully"
        return 0
    else
        log_error "Database restoration failed"
        log_info "You can restore the safety backup with:"
        echo "gunzip -c $SAFETY_BACKUP | psql $DATABASE_URL"
        return 1
    fi
}

# Restore files function
restore_files() {
    local backup_dir="$1"
    
    log_info "Restoring files from backup..."
    
    # Restore uploads
    if [ -f "$backup_dir/uploads.tar.gz" ]; then
        log_info "Restoring uploads..."
        tar -xzf "$backup_dir/uploads.tar.gz" -C "$(dirname "$UPLOAD_DIR")"
        log_success "Uploads restored"
    fi
    
    # Restore configuration (with confirmation)
    if [ -f "$backup_dir/config.tar.gz" ]; then
        read -p "Restore configuration files? (yes/no): " restore_config
        if [ "$restore_config" == "yes" ]; then
            log_info "Restoring configuration files..."
            tar -xzf "$backup_dir/config.tar.gz" -C "$CONFIG_DIR"
            log_success "Configuration files restored"
        fi
    fi
    
    return 0
}

# Main restore function
perform_restore() {
    local backup_id="$1"
    
    if [ -z "$backup_id" ]; then
        log_error "Backup ID required for restoration"
        echo "Usage: $0 restore <backup-id>"
        list_backups
        return 1
    fi
    
    log_info "Starting restoration from backup: $backup_id"
    
    local backup_path="$BACKUP_DIR/$backup_id"
    
    # Check if backup exists locally
    if [ ! -d "$backup_path" ]; then
        if [ -f "$BACKUP_DIR/${backup_id}.tar.gz" ]; then
            log_info "Extracting backup archive..."
            tar -xzf "$BACKUP_DIR/${backup_id}.tar.gz" -C "$BACKUP_DIR"
        else
            # Try to download from S3
            log_info "Backup not found locally, checking S3..."
            if aws s3 ls "s3://$S3_BUCKET/$backup_id/" >/dev/null 2>&1; then
                log_info "Downloading backup from S3..."
                mkdir -p "$backup_path"
                aws s3 sync "s3://$S3_BUCKET/$backup_id/" "$backup_path/"
            else
                log_error "Backup not found: $backup_id"
                return 1
            fi
        fi
    fi
    
    # Stop services during restoration
    log_info "Stopping services..."
    pm2 stop all 2>/dev/null || true
    
    # Perform restoration
    restore_database "$backup_path"
    restore_files "$backup_path"
    
    # Restart services
    log_info "Restarting services..."
    pm2 restart all 2>/dev/null || true
    
    log_success "Restoration completed successfully!"
    
    # Run migration if needed
    log_info "Running database migrations..."
    cd "$CONFIG_DIR" && npm run db:push || true
    
    return 0
}

# List available backups
list_backups() {
    echo -e "${BLUE}Available Backups:${NC}"
    echo "==================="
    
    # List local backups
    echo -e "\n${GREEN}Local Backups:${NC}"
    if ls -1 "$BACKUP_DIR"/yoforex-backup-*.tar.gz 2>/dev/null; then
        ls -lh "$BACKUP_DIR"/yoforex-backup-*.tar.gz | awk '{print $9, $5, $6, $7, $8}'
    else
        echo "No local backups found"
    fi
    
    # List S3 backups if AWS is configured
    if aws sts get-caller-identity >/dev/null 2>&1; then
        echo -e "\n${GREEN}S3 Backups:${NC}"
        aws s3 ls "s3://$S3_BUCKET/" --recursive | grep "yoforex-backup-" | head -20
    fi
}

# Schedule automatic backups
schedule_backup() {
    log_info "Setting up scheduled backups..."
    
    # Create backup script
    cat > /usr/local/bin/yoforex-backup.sh <<'EOF'
#!/bin/bash
/var/www/yoforex/deploy/backup-restore.sh backup s3 >> /var/log/yoforex/scheduled-backup.log 2>&1
EOF
    
    chmod +x /usr/local/bin/yoforex-backup.sh
    
    # Add cron job for daily backups at 3 AM
    CRON_JOB="0 3 * * * /usr/local/bin/yoforex-backup.sh"
    
    # Check if cron job already exists
    if crontab -l 2>/dev/null | grep -q "yoforex-backup.sh"; then
        log_warning "Scheduled backup already exists"
    else
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        log_success "Daily backup scheduled for 3:00 AM"
    fi
    
    # Also add weekly full backup on Sunday
    WEEKLY_JOB="0 2 * * 0 /var/www/yoforex/deploy/backup-restore.sh backup s3 >> /var/log/yoforex/weekly-backup.log 2>&1"
    
    if ! crontab -l 2>/dev/null | grep -q "weekly-backup"; then
        (crontab -l 2>/dev/null; echo "$WEEKLY_JOB") | crontab -
        log_success "Weekly full backup scheduled for Sunday 2:00 AM"
    fi
    
    echo -e "\n${GREEN}Current backup schedule:${NC}"
    crontab -l | grep yoforex
}

# Main script logic
main() {
    case "${1:-}" in
        backup)
            perform_backup "${2:-local}"
            ;;
        restore)
            perform_restore "$2"
            ;;
        list)
            list_backups
            ;;
        schedule)
            schedule_backup
            ;;
        *)
            echo "YoForex Backup and Restore Utility"
            echo "===================================="
            echo "Usage: $0 {backup|restore|list|schedule} [options]"
            echo ""
            echo "Commands:"
            echo "  backup [s3|local]  - Create a backup (default: local)"
            echo "  restore <backup-id> - Restore from a backup"
            echo "  list               - List available backups"
            echo "  schedule           - Setup automated daily backups"
            echo ""
            echo "Examples:"
            echo "  $0 backup          - Create local backup"
            echo "  $0 backup s3       - Create backup and upload to S3"
            echo "  $0 restore yoforex-backup-20240101-120000"
            echo "  $0 schedule        - Setup daily automated backups"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"