#!/usr/bin/env npx tsx

/**
 * Script to convert all existing Clerk user IDs to C7 format
 * Run with: npx tsx scripts/convert-user-ids.ts
 */

import { batchAssignC7UserIds } from '../lib/c7-user-id';
import prisma from '../prisma/prisma';

async function main() {
  try {
    console.log('Starting user ID conversion to C7 format...');
    console.log('================================================');

    // Show current user count
    const totalUsers = await prisma.userInfo.count();
    const usersWithC7Id = await prisma.userInfo.count({
      where: {
        c7UserId: {
          not: null
        }
      }
    });

    console.log(`Total users: ${totalUsers}`);
    console.log(`Users already with C7 IDs: ${usersWithC7Id}`);
    console.log(`Users to assign C7 IDs: ${totalUsers - usersWithC7Id}`);
    console.log('================================================');

    if (totalUsers - usersWithC7Id === 0) {
      console.log('No users need C7 ID assignment. All users already have C7 IDs.');
      return;
    }

    // Confirm before proceeding
    console.log('This will assign C7 user IDs (C70001, C70002, etc.) to users who don\'t have them yet.');
    console.log('This operation will NOT modify existing user IDs, only add C7 IDs in a new column.');
    console.log('Make sure you have a database backup before proceeding.');
    console.log('');

    // In a real environment, you might want to add a prompt here
    // For automation, we'll proceed automatically
    console.log('Proceeding with C7 ID assignment...');

    await batchAssignC7UserIds();

    // Show results
    const updatedUsersWithC7Id = await prisma.userInfo.count({
      where: {
        c7UserId: {
          not: null
        }
      }
    });

    console.log('================================================');
    console.log('C7 ID assignment completed!');
    console.log(`Users now with C7 IDs: ${updatedUsersWithC7Id}`);
    console.log('================================================');

    // Show some examples
    const sampleUsers = await prisma.userInfo.findMany({
      where: {
        c7UserId: {
          not: null
        }
      },
      take: 5,
      orderBy: {
        c7UserId: 'asc'
      },
      select: {
        userId: true,
        c7UserId: true
      }
    });

    if (sampleUsers.length > 0) {
      console.log('Sample user ID assignments:');
      sampleUsers.forEach(user => {
        console.log(`- ${user.userId} -> ${user.c7UserId}`);
      });
    }

  } catch (error) {
    console.error('Error during conversion:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();