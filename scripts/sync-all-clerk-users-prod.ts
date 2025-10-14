#!/usr/bin/env npx tsx

/**
 * Script to sync ALL users from Clerk production to database
 * Uses production Clerk credentials to fetch all users
 */

import { PrismaClient } from '@prisma/client';

// Production Clerk credentials
const CLERK_SECRET_KEY = 'sk_live_oaqYoDFDHokeQ1NHZc4sMTZuiIwQEBaSnc8XyaQ8NU';

// Production database client
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://c7pfs:C7pfs.123@c7fitness.ccl6ycgqc7hv.us-east-1.rds.amazonaws.com:5432/fit-forge"
    }
  }
});

async function fetchAllClerkUsers() {
  const users = [];
  let hasMore = true;
  let offset = 0;
  const limit = 100;

  console.log('📥 Fetching all users from Clerk production...');

  while (hasMore) {
    try {
      const response = await fetch(`https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      users.push(...data);

      console.log(`   Fetched ${data.length} users (total: ${users.length})`);

      hasMore = data.length === limit;
      offset += limit;

      // Safety break
      if (offset > 1000) {
        console.log('⚠️  Safety break at 1000 users');
        break;
      }
    } catch (error) {
      console.error(`❌ Error fetching users at offset ${offset}:`, error);
      break;
    }
  }

  return users;
}

async function generateC7UserId(): Promise<string> {
  const lastUser = await prodPrisma.userInfo.findFirst({
    where: {
      c7UserId: {
        startsWith: "C7"
      }
    },
    orderBy: {
      c7UserId: 'desc'
    }
  });

  let nextNumber = 1;
  if (lastUser && lastUser.c7UserId) {
    const lastNumber = parseInt(lastUser.c7UserId.substring(2));
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `C7${nextNumber.toString().padStart(4, '0')}`;
}

async function main() {
  try {
    console.log('🔄 PRODUCTION: Syncing ALL users from Clerk to database...');
    console.log('=======================================================');

    // Fetch all users from Clerk production
    const allClerkUsers = await fetchAllClerkUsers();
    console.log(`✅ Found ${allClerkUsers.length} users in Clerk production`);

    if (allClerkUsers.length === 0) {
      console.log('❌ No users found in Clerk - check API credentials');
      return;
    }

    // Get existing users from production database
    const existingDbUsers = await prodPrisma.userInfo.findMany({
      select: {
        userId: true,
        c7UserId: true,
        role: true,
        createdAt: true
      }
    });

    console.log(`📊 Current production database: ${existingDbUsers.length} users`);

    // Create lookup maps
    const dbUserIds = new Set(existingDbUsers.map(u => u.userId));
    const missingUsers = allClerkUsers.filter(clerkUser => !dbUserIds.has(clerkUser.id));

    console.log('');
    console.log('📋 SYNCHRONIZATION PLAN:');
    console.log(`   Users in Clerk: ${allClerkUsers.length}`);
    console.log(`   Users in Database: ${existingDbUsers.length}`);
    console.log(`   Users to ADD: ${missingUsers.length}`);
    console.log(`   Users already synced: ${allClerkUsers.length - missingUsers.length}`);

    if (missingUsers.length === 0) {
      console.log('');
      console.log('✅ ALL USERS ALREADY SYNCED!');
      console.log('🎯 Admin interface should show all users correctly');
      await prodPrisma.$disconnect();
      return;
    }

    console.log('');
    console.log('➕ Users to be ADDED to database:');
    missingUsers.forEach(user => {
      const name = user.first_name && user.last_name
        ? `${user.first_name} ${user.last_name}`
        : user.username || user.email_addresses?.[0]?.email_address || 'Unknown';
      console.log(`   + ${user.id} - ${name}`);
    });

    console.log('');
    console.log('🚀 Adding missing users to production database...');

    let addedCount = 0;

    for (const clerkUser of missingUsers) {
      try {
        // Double-check user doesn't exist
        const existing = await prodPrisma.userInfo.findUnique({
          where: { userId: clerkUser.id }
        });

        if (existing) {
          console.log(`   ⚠️  ${clerkUser.id} already exists - skipping`);
          continue;
        }

        // Create user in database
        await prodPrisma.userInfo.create({
          data: {
            userId: clerkUser.id,
            updatedAt: new Date(),
            role: 'USER' // Default role
          }
        });

        // Generate and assign C7 user ID
        const c7UserId = await generateC7UserId();
        await prodPrisma.userInfo.update({
          where: { userId: clerkUser.id },
          data: { c7UserId }
        });

        const name = clerkUser.first_name && clerkUser.last_name
          ? `${clerkUser.first_name} ${clerkUser.last_name}`
          : clerkUser.username || clerkUser.email_addresses?.[0]?.email_address || 'Unknown';

        console.log(`   ✅ Added: ${clerkUser.id} -> ${c7UserId} (${name})`);
        addedCount++;

      } catch (error) {
        console.error(`   ❌ Failed to add ${clerkUser.id}:`, error);
      }
    }

    // Final verification
    console.log('');
    console.log('=======================================================');
    console.log('🎉 PRODUCTION SYNC COMPLETED!');
    console.log('=======================================================');

    const finalDbCount = await prodPrisma.userInfo.count();
    console.log(`📊 FINAL RESULTS:`);
    console.log(`   Users in Clerk: ${allClerkUsers.length}`);
    console.log(`   Users in Database: ${finalDbCount}`);
    console.log(`   Users added: ${addedCount}`);

    if (finalDbCount >= allClerkUsers.length) {
      console.log('');
      console.log('🎯 SUCCESS: Database now contains all Clerk users!');
      console.log('✅ Admin interface should show all users correctly!');
      console.log('🚫 No more missing users or "Deleted User" entries!');
    } else {
      console.log('');
      console.log('⚠️  There may still be some discrepancy - manual review recommended');
    }

    // Show sample of synced users
    const sampleUsers = await prodPrisma.userInfo.findMany({
      select: {
        userId: true,
        c7UserId: true,
        role: true
      },
      orderBy: {
        c7UserId: 'asc'
      },
      take: 5
    });

    if (sampleUsers.length > 0) {
      console.log('');
      console.log('👥 Sample synced users:');
      sampleUsers.forEach(user => {
        console.log(`   ${user.c7UserId} | ${user.userId} | ${user.role}`);
      });
    }

  } catch (error) {
    console.error('💥 ERROR during production sync:', error);
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
  }
}

main();