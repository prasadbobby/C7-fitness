#!/bin/bash

# Exercise Migration Script to PostgreSQL
# This script runs the TypeScript migration command for exercises

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Function to check if required tools are installed
check_prerequisites() {
    log "Checking prerequisites..."

    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        error "Node.js is required but not installed."
        exit 1
    fi

    # Check if npm/npx is installed
    if ! command -v npx &> /dev/null; then
        error "npx is required but not installed."
        exit 1
    fi

    # Check if ts-node is available
    if ! npx ts-node --version &> /dev/null; then
        warn "ts-node not found, attempting to install..."
        npm install -g ts-node
    fi

    log "Prerequisites check completed successfully"
}

# Function to check if migration script exists
check_migration_script() {
    local script_path="prisma/scripts/MigrateExercises.ts"

    if [ ! -f "$script_path" ]; then
        error "Migration script not found at: $script_path"
        error "Please ensure the TypeScript migration script exists"
        exit 1
    fi

    log "Migration script found: $script_path"
}

# Function to check if exercise JSON files exist
check_exercise_files() {
    if [ ! -d "public/images/exercises" ]; then
        error "Exercise directory not found: public/images/exercises"
        exit 1
    fi

    local exercise_count=$(find public/images/exercises -name "exercise.json" 2>/dev/null | wc -l)

    if [ "$exercise_count" -eq 0 ]; then
        error "No exercise JSON files found in public/images/exercises"
        exit 1
    fi

    log "Found $exercise_count exercise files to migrate"
}

# Function to run the TypeScript migration
run_migration() {
    log "Starting exercise migration using TypeScript script..."

    info "Running command: npx ts-node --compiler-options '{\"module\":\"commonjs\"}' prisma/scripts/MigrateExercises.ts"

    # Run the TypeScript migration command
    if npx ts-node --compiler-options '{"module":"commonjs"}' prisma/scripts/MigrateExercises.ts; then
        log "✓ Migration completed successfully!"
    else
        error "✗ Migration failed!"
        exit 1
    fi
}

# Function to verify migration results
verify_migration() {
    log "Verifying migration results..."

    # Check if Prisma is available
    if command -v npx &> /dev/null && npx prisma --version &> /dev/null; then
        info "You can verify the migration by checking your database or running:"
        info "npx prisma studio"
    fi
}

# Main function
main() {
    log "=== Exercise Migration Script ==="
    log "This script will migrate exercise JSON files to PostgreSQL using the TypeScript migration script"

    # Run all checks
    check_prerequisites
    check_migration_script
    check_exercise_files

    # Run the migration
    run_migration

    # Verify results
    verify_migration

    log "=== Migration process completed ==="
}

# Run the main function
main "$@"