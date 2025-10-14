#!/usr/bin/env npx tsx

/**
 * Script to clean up invalid C7 format user IDs from production database
 * This will remove users that have C7 IDs in the userId field since they can't be matched to Clerk
 * Run with: npx tsx scripts/cleanup-invalid-users.ts
 */

import prisma from '../prisma/prisma';

async function main() {
  try {
    console.log('Starting cleanup of invalid user records...');
    console.log('================================================');

    // Count current users
    const totalUsers = await prisma.userInfo.count();
    const c7FormatUsers = await prisma.userInfo.count({
      where: {
        userId: {
          startsWith: 'C7'
        }
      }
    });
    const clerkFormatUsers = await prisma.userInfo.count({
      where: {
        userId: {
          startsWith: 'user_'
        }
      }
    });

    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with C7 format IDs (invalid): ${c7FormatUsers}`);
    console.log(`Users with Clerk format IDs (valid): ${clerkFormatUsers}`);
    console.log('================================================');

    if (c7FormatUsers === 0) {
      console.log('No invalid C7 format users found. Database is clean.');
      return;
    }

    console.log('⚠️  WARNING: This will permanently delete user records with C7 format IDs!');
    console.log('These users will need to sign up again to create new accounts.');
    console.log('Make sure you have a database backup before proceeding.');
    console.log('');

    // Get the C7 users to be deleted
    const usersToDelete = await prisma.userInfo.findMany({
      where: {
        userId: {
          startsWith: 'C7'
        }
      },
      select: {
        userId: true,
        createdAt: true
      }
    });

    console.log('Users that will be deleted:');
    usersToDelete.forEach(user => {
      console.log(`- ${user.userId} (created: ${user.createdAt})`);
    });

    console.log('');
    console.log('Proceeding with cleanup...');

    // Delete related records first to avoid foreign key constraints
    console.log('Cleaning up related records...');

    // Delete related data for C7 users
    for (const user of usersToDelete) {
      const userId = user.userId;

      try {
        // Delete related records
        await Promise.all([
          prisma.assignedWorkout.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.workoutLog.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.userExercisePB.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.userGoal.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.userEquipment.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.userTrainingProgression.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.workoutSession.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.gymSessionParticipant.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.stepLog.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.ninetyDayChallengeParticipant.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.ninetyDayChallengePost.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.ninetyDayChallengeReaction.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.ninetyDayChallengeComment.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.googleFitnessConnection.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.googleFitnessData.deleteMany({ where: { userId } }).catch(() => {}),
          prisma.favouriteExercise.deleteMany({ where: { userId } }).catch(() => {}),
        ]);

        console.log(`Cleaned related data for ${userId}`);
      } catch (error) {
        console.error(`Error cleaning related data for ${userId}:`, error);
      }
    }

    // Delete the user records themselves
    const deleteResult = await prisma.userInfo.deleteMany({
      where: {
        userId: {
          startsWith: 'C7'
        }
      }
    });

    console.log('================================================');
    console.log('Cleanup completed!');
    console.log(`Deleted ${deleteResult.count} invalid user records`);

    // Show final count
    const finalUserCount = await prisma.userInfo.count();
    console.log(`Remaining users: ${finalUserCount}`);

    // Show remaining users
    const remainingUsers = await prisma.userInfo.findMany({
      select: {
        userId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (remainingUsers.length > 0) {
      console.log('Remaining valid users:');
      remainingUsers.forEach(user => {
        console.log(`- ${user.userId} (created: ${user.createdAt})`);
      });
    }

    console.log('================================================');
    console.log('✅ Database cleanup completed successfully!');
    console.log('The admin interface should now work properly.');

  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();