#!/usr/bin/env npx tsx

/**
 * Script to assign C7 user IDs to all users in production database
 * Run with: npx tsx scripts/assign-c7-ids-production.ts
 */

import { PrismaClient } from '@prisma/client';

// Create a new Prisma client for production
const prodPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://c7pfs:C7pfs.123@c7fitness.ccl6ycgqc7hv.us-east-1.rds.amazonaws.com:5432/fit-forge"
    }
  }
});

async function generateC7UserId(): Promise<string> {
  try {
    // Get the current highest C7 user ID number from the c7UserId field
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
      // Extract the number from the last C7 ID (e.g., "C70005" -> 5)
      const lastNumber = parseInt(lastUser.c7UserId.substring(2));
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Format with zero padding to 4 digits
    const formattedNumber = nextNumber.toString().padStart(4, '0');

    return `C7${formattedNumber}`;
  } catch (error) {
    console.error('Error generating C7 user ID:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting C7 ID assignment for production database...');
    console.log('===================================================');

    // Get all users that don't have C7 user IDs yet
    const usersToAssign = await prodPrisma.userInfo.findMany({
      where: {
        c7UserId: null
      },
      select: {
        userId: true
      }
    });

    console.log(`Found ${usersToAssign.length} users to assign C7 IDs`);

    if (usersToAssign.length === 0) {
      console.log('No users need C7 ID assignment. All users already have C7 IDs.');
      return;
    }

    let assignedCount = 0;

    for (const user of usersToAssign) {
      try {
        const newC7UserId = await generateC7UserId();

        await prodPrisma.userInfo.update({
          where: {
            userId: user.userId
          },
          data: {
            c7UserId: newC7UserId
          }
        });

        console.log(`✅ Assigned ${user.userId} -> ${newC7UserId}`);
        assignedCount++;

      } catch (error) {
        console.error(`❌ Failed to assign C7 ID to user ${user.userId}:`, error);
      }
    }

    console.log('');
    console.log('===================================================');
    console.log('🎉 C7 ID ASSIGNMENT COMPLETED!');
    console.log(`✅ Successfully assigned: ${assignedCount} users`);

    // Verify final counts
    const totalUsers = await prodPrisma.userInfo.count();
    const usersWithC7Id = await prodPrisma.userInfo.count({
      where: {
        c7UserId: {
          not: null
        }
      }
    });

    console.log('');
    console.log('Final production database status:');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with C7 IDs: ${usersWithC7Id}`);

    // Show sample assignments
    const sampleUsers = await prodPrisma.userInfo.findMany({
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
      console.log('');
      console.log('Sample user ID assignments:');
      sampleUsers.forEach(user => {
        console.log(`- ${user.userId} -> ${user.c7UserId}`);
      });
    }

    console.log('');
    console.log('✅ PRODUCTION DATABASE IS NOW READY!');
    console.log('🔧 Admin interface should now work without "Deleted User" entries');

  } catch (error) {
    console.error('💥 ERROR during C7 ID assignment:', error);
    process.exit(1);
  } finally {
    await prodPrisma.$disconnect();
  }
}

main();