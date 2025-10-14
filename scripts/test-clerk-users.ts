#!/usr/bin/env npx tsx

/**
 * Test script to check if specific users exist in Clerk
 */

import { clerkClient } from '@clerk/nextjs';

const TEST_USER_IDS = [
  'user_343dQFHDp2X8mkNpwO4qwSMisdN', // pranay
  'user_33qQ0c71yW8q2FmepAZbnULfglm', // harshith (showing as deleted)
  'user_342h5fJ1pLQnT0qJ2kXiOWQujZl', // prvn
  'user_33Yi0YdgLeaQqXuoYnjIpXNXrPw', // swaminarayan
  'user_33cByEZ9iUB0zqT5bXQ6Fe3XwzE', // nandu
];

async function main() {
  console.log('🔍 Testing Clerk API for specific users...');
  console.log('==========================================');

  for (const userId of TEST_USER_IDS) {
    try {
      const user = await clerkClient.users.getUser(userId);
      console.log(`✅ FOUND: ${userId}`);
      console.log(`   Name: ${user.firstName} ${user.lastName}`);
      console.log(`   Email: ${user.emailAddresses?.[0]?.emailAddress}`);
      console.log(`   Username: ${user.username}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log('');
    } catch (error: any) {
      console.log(`❌ NOT FOUND: ${userId}`);
      console.log(`   Error: ${error.message}`);
      console.log('');
    }
  }

  console.log('==========================================');
  console.log('Test completed!');
}

main().catch(console.error);