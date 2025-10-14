# Scripts Documentation

This folder contains utility scripts for user management and database synchronization.

## Available Scripts

### 🔄 `sync-all-clerk-users-prod.ts`
**Purpose:** Main synchronization script to sync all users from Clerk production to database
**Usage:** `npx tsx scripts/sync-all-clerk-users-prod.ts`
**What it does:**
- Fetches all users from Clerk production using API credentials
- Adds missing users to the production database
- Assigns C7 user IDs to new users
- Reports sync status and results

**When to use:**
- When admin interface shows fewer users than exist in Clerk
- After major Clerk changes or migrations
- For periodic maintenance to ensure perfect sync

### 🧹 `cleanup-final-sync.ts`
**Purpose:** Cleanup script to remove orphaned users and achieve perfect Clerk-Database sync
**Usage:** `npx tsx scripts/cleanup-final-sync.ts`
**What it does:**
- Compares users in Clerk vs Database
- Removes users that exist in DB but not in Clerk (orphaned users)
- Reports final sync status
- Ensures 1:1 match between Clerk and Database

**When to use:**
- When database has more users than Clerk (orphaned users)
- After user cleanup in Clerk dashboard
- To resolve "Deleted User" entries in admin interface

### 🏷️ `convert-user-ids.ts`
**Purpose:** Assigns C7 format user IDs to users who don't have them
**Usage:** `npx tsx scripts/convert-user-ids.ts`
**What it does:**
- Finds users without C7 user IDs
- Assigns sequential C7 IDs (C70001, C70002, etc.)
- Preserves original Clerk user IDs
- Updates the c7UserId column only

**When to use:**
- After adding new users to database
- When users are missing C7 IDs
- For initial setup of C7 ID system

## Script Safety

⚠️ **Important Notes:**
- All scripts work with **production database**
- Always ensure you have database backups before running
- Scripts use production Clerk API credentials
- Test scripts in development environment first when possible

## Common Workflows

### 1. Users missing from admin interface
```bash
npx tsx scripts/sync-all-clerk-users-prod.ts
```

### 2. "Deleted User" entries appearing
```bash
npx tsx scripts/cleanup-final-sync.ts
```

### 3. New users without C7 IDs
```bash
npx tsx scripts/convert-user-ids.ts
```

### 4. Complete sync and cleanup
```bash
npx tsx scripts/sync-all-clerk-users-prod.ts
npx tsx scripts/cleanup-final-sync.ts
npx tsx scripts/convert-user-ids.ts
```

## Expected Results

After running the sync scripts:
- **Admin interface shows exact number of users as in Clerk**
- **No "Deleted User" entries**
- **All users have proper names, emails, and data from Clerk**
- **All users have C7 format IDs for admin display**
- **Perfect 1:1 sync between Clerk and Database**