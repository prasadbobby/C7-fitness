#!/usr/bin/env npx tsx

/**
 * Script to remove users from database who don't exist in Clerk
 * This fixes the "Deleted User" entries in admin interface
 * Run with: npx tsx scripts/cleanup-orphaned-users.ts
 */

import { clerkClient } from '@clerk/nextjs';
import prisma from '../prisma/prisma';

async function main() {
  try {
    console.log('🔍 Starting cleanup of orphaned users (users in DB but not in Clerk)...');
    console.log('================================================================');

    // Get all users from our database
    const dbUsers = await prisma.userInfo.findMany({
      select: {
        id: true,
        userId: true,
        c7UserId: true,
        createdAt: true
      }
    });

    console.log(`Found ${dbUsers.length} users in database`);

    // Check which users exist in Clerk
    const userIds = dbUsers.map(u => u.userId);
    const validUsers = [];
    const orphanedUsers = [];

    console.log('Checking Clerk for each user...');
    for (const dbUser of dbUsers) {
      try {
        // Try to get user from Clerk
        const clerkUser = await clerkClient.users.getUser(dbUser.userId);
        if (clerkUser) {
          validUsers.push(dbUser);
          console.log(`✅ Valid: ${dbUser.userId} (${dbUser.c7UserId || 'no C7 ID'})`);
        }
      } catch (error) {
        // If user doesn't exist in Clerk, mark as orphaned
        orphanedUsers.push(dbUser);
        console.log(`❌ Orphaned: ${dbUser.userId} (${dbUser.c7UserId || 'no C7 ID'}) - doesn't exist in Clerk`);
      }
    }

    console.log('');
    console.log('================================================================');
    console.log('📊 ANALYSIS RESULTS:');
    console.log(`✅ Valid users (exist in both DB and Clerk): ${validUsers.length}`);
    console.log(`❌ Orphaned users (DB only, not in Clerk): ${orphanedUsers.length}`);

    if (orphanedUsers.length === 0) {
      console.log('');
      console.log('🎉 No orphaned users found! Database is clean.');
      return;
    }

    console.log('');
    console.log('⚠️  Users to be removed (they don\'t exist in Clerk):');
    orphanedUsers.forEach(user => {
      console.log(`- ${user.userId} (${user.c7UserId || 'no C7 ID'}) - created: ${user.createdAt}`);
    });

    console.log('');
    console.log('🧹 Removing orphaned users from database...');

    // Remove orphaned users and their related data
    for (const user of orphanedUsers) {
      const userId = user.userId;

      try {
        // Delete related records first to avoid foreign key constraints
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

        console.log(`🧹 Cleaned related data for ${userId}`);
      } catch (error) {
        console.error(`❌ Error cleaning related data for ${userId}:`, error);
      }
    }

    // Delete the orphaned user records themselves
    const deleteResult = await prisma.userInfo.deleteMany({
      where: {
        userId: {
          in: orphanedUsers.map(u => u.userId)
        }
      }
    });

    console.log('');
    console.log('================================================================');
    console.log('🎉 CLEANUP COMPLETED!');
    console.log(`🗑️  Removed ${deleteResult.count} orphaned user records`);

    // Show final count
    const finalUserCount = await prisma.userInfo.count();
    console.log(`👥 Remaining users in database: ${finalUserCount}`);

    // Show remaining users
    const remainingUsers = await prisma.userInfo.findMany({
      select: {
        userId: true,
        c7UserId: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (remainingUsers.length > 0) {
      console.log('');
      console.log('✅ Remaining valid users (exist in both DB and Clerk):');
      remainingUsers.forEach(user => {
        console.log(`- ${user.userId} (${user.c7UserId || 'no C7 ID'}) - created: ${user.createdAt}`);
      });
    }

    console.log('');
    console.log('================================================================');
    console.log('✅ DATABASE CLEANUP COMPLETED SUCCESSFULLY!');
    console.log('🎯 Admin interface should now only show users that exist in Clerk');
    console.log('🚫 No more "Deleted User" entries should appear');

  } catch (error) {
    console.error('💥 ERROR during orphaned users cleanup:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();