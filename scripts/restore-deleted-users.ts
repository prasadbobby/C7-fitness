#!/usr/bin/env npx tsx

/**
 * URGENT: Script to restore accidentally deleted users from Clerk data
 * These users were real, valid users that were incorrectly deleted
 * Run with: npx tsx scripts/restore-deleted-users.ts
 */

import prisma from '../prisma/prisma';

const DELETED_USERS = [
  {
    clerkId: "user_343dQFHDp2X8mkNpwO4qwSMisdN",
    email: "pranaykethan.pk@gmail.com",
    firstName: "pranay",
    lastName: "",
    username: "pranay"
  },
  {
    clerkId: "user_343eFvjHMQdgbcY0ms4ej1nu1ys",
    email: "balakodavati04@gmail.com",
    firstName: "balujan04",
    lastName: "",
    username: "balujan04"
  },
  {
    clerkId: "user_342h5fJ1pLQnT0qJ2kXiOWQujZl",
    email: "prvn386@gmail.com",
    firstName: "Satya",
    lastName: "Praveen",
    username: "prvn"
  },
  {
    clerkId: "user_33ggym2J0nIY3g5948wZudAmGoL",
    email: "saikumar.guntuka123@gmail.com",
    firstName: "SAI",
    lastName: "KUMAR",
    username: "saikumar"
  },
  {
    clerkId: "user_33Yi0YdgLeaQqXuoYnjIpXNXrPw",
    email: "swaminarayan1418@gmail.com",
    firstName: "SWAMI",
    lastName: "NARAYAN",
    username: "swaminarayan"
  },
  {
    clerkId: "user_33cByEZ9iUB0zqT5bXQ6Fe3XwzE",
    email: "nandu.9912491659@gmail.com",
    firstName: "Karnati",
    lastName: "Nandu",
    username: "nandu"
  },
  {
    clerkId: "user_33oNpRF2uE4OTpZl4K0K8UbTwuW",
    email: "kodavatibalakrishna1@gmail.com",
    firstName: "balakrishna",
    lastName: "",
    username: "balakrishna"
  },
  {
    clerkId: "user_343vCLYNy7T0jFaUwLO5TKgGgvQ",
    email: "marreddyswamy@gmail.com",
    firstName: "Marreddy",
    lastName: "Swamy",
    username: "marreddyswamy"
  },
  {
    clerkId: "user_33nIQRVWjqG0bFOa9lOpKVN5L6E",
    email: "srijandamarla7@gmail.com",
    firstName: "Srijan",
    lastName: "Damarla",
    username: "srijan"
  },
  {
    clerkId: "user_343e9KhAm99d3IgWKmjOzA7zQAc",
    email: "venkataramana.karnati99@gmail.com",
    firstName: "Venkata",
    lastName: "Ramana",
    username: "venkataramana"
  },
  {
    clerkId: "user_343czSwjlzHXGIVHtlbAhx5cWKV",
    email: "vicky.k17.vk@gmail.com",
    firstName: "vicky",
    lastName: "k",
    username: "vicky"
  },
  {
    clerkId: "user_342pNdDOA7fWGqPn5HgXdZrKQT8",
    email: "subramanyam4862@gmail.com",
    firstName: "Raja",
    lastName: "Subramanyam",
    username: "subramanyam"
  },
  {
    clerkId: "user_33qQ0c71yW8q2FmepAZbnULfglm",
    email: "harshith.0909@gmail.com",
    firstName: "HARSHITH",
    lastName: "KANDAKATLA",
    username: "harshith"
  },
  {
    clerkId: "user_33pVgx1oCgIvJkxrZNcjrG3MZad",
    email: "rajesh.karnati2016@gmail.com",
    firstName: "rajesh",
    lastName: "karnati",
    username: "rajesh"
  },
  {
    clerkId: "user_33r2aJ3OkYoQA1Wf2zjmPz6fvYc",
    email: "pavankumarkarnati@gmail.com",
    firstName: "Pavan",
    lastName: "Kumar",
    username: "pavankumar"
  },
  {
    clerkId: "user_33rLwP8bGZ7Q3JnD9EZdHGk4Tqe",
    email: "aghorsaikumarkarnati@gmail.com",
    firstName: "saikumar",
    lastName: "karnati",
    username: "aghorsaikumar"
  }
];

async function main() {
  try {
    console.log('🚨 URGENT: Starting restoration of accidentally deleted users...');
    console.log('================================================================');

    console.log(`Found ${DELETED_USERS.length} users to restore from Clerk data`);
    console.log('These users were real, valid Clerk users that were incorrectly deleted');
    console.log('');

    let restoredCount = 0;
    let skippedCount = 0;

    for (const userData of DELETED_USERS) {
      try {
        // Check if user already exists (in case they were partially restored)
        const existing = await prisma.userInfo.findUnique({
          where: { userId: userData.clerkId }
        });

        if (existing) {
          console.log(`⚠️  User ${userData.clerkId} (${userData.username}) already exists - skipping`);
          skippedCount++;
          continue;
        }

        // Restore the user with their original Clerk ID
        await prisma.userInfo.create({
          data: {
            userId: userData.clerkId, // Use original Clerk ID
            // Don't set c7UserId yet - this will be assigned separately later
            // Add any other required fields with safe defaults
          }
        });

        console.log(`✅ Restored: ${userData.clerkId} (${userData.username} - ${userData.email})`);
        restoredCount++;

      } catch (error) {
        console.error(`❌ Failed to restore user ${userData.clerkId} (${userData.username}):`, error);
      }
    }

    console.log('');
    console.log('================================================================');
    console.log('🎉 USER RESTORATION COMPLETED!');
    console.log(`✅ Successfully restored: ${restoredCount} users`);
    console.log(`⚠️  Already existed: ${skippedCount} users`);
    console.log(`❌ Failed: ${DELETED_USERS.length - restoredCount - skippedCount} users`);

    // Verify final user count
    const totalUsers = await prisma.userInfo.count();
    const clerkUsers = await prisma.userInfo.count({
      where: {
        userId: {
          startsWith: 'user_'
        }
      }
    });

    console.log('');
    console.log('Final database status:');
    console.log(`Total users: ${totalUsers}`);
    console.log(`Users with Clerk IDs: ${clerkUsers}`);

    // Show sample of restored users
    const restoredUsers = await prisma.userInfo.findMany({
      where: {
        userId: {
          in: DELETED_USERS.map(u => u.clerkId)
        }
      },
      select: {
        userId: true,
        c7UserId: true,
        createdAt: true
      },
      take: 5
    });

    if (restoredUsers.length > 0) {
      console.log('');
      console.log('Sample of restored users:');
      restoredUsers.forEach(user => {
        console.log(`- ${user.userId} (C7 ID: ${user.c7UserId || 'not assigned yet'})`);
      });
    }

    console.log('');
    console.log('================================================================');
    console.log('🔧 NEXT STEPS:');
    console.log('1. ✅ Users have been restored with their original Clerk IDs');
    console.log('2. 🔄 Run C7 ID assignment script to give them C7 format IDs');
    console.log('3. 🧪 Test admin interface to ensure no more "Deleted User" entries');
    console.log('4. 📊 Verify all user data is properly accessible');
    console.log('');
    console.log('⚠️  CRITICAL: The admin should now work properly!');

  } catch (error) {
    console.error('💥 CRITICAL ERROR during user restoration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();