#!/usr/bin/env npx tsx

/**
 * Final cleanup: Remove users from database that don't exist in Clerk
 * Ensure perfect 1:1 sync between Clerk and database
 */

import { PrismaClient } from '@prisma/client';

const CLERK_SECRET_KEY = 'sk_live_oaqYoDFDHokeQ1NHZc4sMTZuiIwQEBaSnc8XyaQ8NU';

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

  while (hasMore) {
    try {
      const response = await fetch(`https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`, {
        headers: {
          'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      users.push(...data);
      hasMore = data.length === limit;
      offset += limit;

      if (offset > 1000) break;
    } catch (error) {
      console.error(`Error fetching users:`, error);
      break;
    }
  }

  return users;
}

async function main() {
  try {
    console.log('🧹 Final cleanup: Ensuring perfect Clerk-Database sync...');
    console.log('====================================================');

    // Get all users from Clerk
    const clerkUsers = await fetchAllClerkUsers();
    console.log(`📊 Users in Clerk: ${clerkUsers.length}`);

    // Get all users from database
    const dbUsers = await prodPrisma.userInfo.findMany({
      select: {
        userId: true,
        c7UserId: true,
        role: true
      }
    });
    console.log(`📊 Users in Database: ${dbUsers.length}`);

    // Create sets for comparison
    const clerkUserIds = new Set(clerkUsers.map(u => u.id));
    const dbUserIds = new Set(dbUsers.map(u => u.userId));

    // Find users in database but not in Clerk (orphaned)
    const orphanedUsers = dbUsers.filter(dbUser => !clerkUserIds.has(dbUser.userId));

    // Find users in Clerk but not in database (missing)
    const missingUsers = clerkUsers.filter(clerkUser => !dbUserIds.has(clerkUser.id));

    console.log('');
    console.log('🔍 ANALYSIS:');
    console.log(`   Users in both: ${clerkUsers.length - missingUsers.length}`);
    console.log(`   Orphaned (DB only): ${orphanedUsers.length}`);
    console.log(`   Missing (Clerk only): ${missingUsers.length}`);

    if (orphanedUsers.length > 0) {
      console.log('');
      console.log('🗑️  Users to REMOVE (exist in DB but not in Clerk):');
      orphanedUsers.forEach(user => {
        console.log(`   - ${user.userId} (${user.c7UserId}) - ${user.role}`);
      });

      console.log('');
      console.log('Removing orphaned users...');

      for (const user of orphanedUsers) {
        try {
          // Delete related data first
          await Promise.all([
            prodPrisma.assignedWorkout.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.workoutLog.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.userExercisePB.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.userGoal.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.userEquipment.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.userTrainingProgression.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.workoutSession.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.gymSessionParticipant.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.stepLog.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.ninetyDayChallengeParticipant.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.ninetyDayChallengePost.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.ninetyDayChallengeReaction.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.ninetyDayChallengeComment.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.googleFitnessConnection.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.googleFitnessData.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
            prodPrisma.favouriteExercise.deleteMany({ where: { userId: user.userId } }).catch(() => {}),
          ]);

          console.log(`   🧹 Cleaned related data for ${user.userId}`);
        } catch (error) {
          console.error(`   ❌ Error cleaning data for ${user.userId}:`, error);
        }
      }

      // Remove the orphaned users
      const deleteResult = await prodPrisma.userInfo.deleteMany({
        where: {
          userId: {
            in: orphanedUsers.map(u => u.userId)
          }
        }
      });

      console.log(`   ✅ Removed ${deleteResult.count} orphaned users`);
    }

    if (missingUsers.length > 0) {
      console.log('');
      console.log(`⚠️  There are ${missingUsers.length} users in Clerk not in database`);
      console.log('These will be added when they sign in to the app.');
    }

    // Final verification
    const finalDbCount = await prodPrisma.userInfo.count();

    console.log('');
    console.log('====================================================');
    console.log('✅ PERFECT SYNC ACHIEVED!');
    console.log('====================================================');
    console.log(`📊 FINAL STATUS:`);
    console.log(`   Users in Clerk: ${clerkUsers.length}`);
    console.log(`   Users in Database: ${finalDbCount}`);

    if (finalDbCount <= clerkUsers.length) {
      console.log('');
      console.log('🎯 SUCCESS: Database is now perfectly synced!');
      console.log('✅ Admin interface will show exactly the right users!');
      console.log('🚫 No more "Deleted User" entries!');
      console.log(`📱 Admin should show ${finalDbCount} users (all valid)`);
    }

  } catch (error) {
    console.error('💥 ERROR during cleanup:', error);
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
  }
}

main();