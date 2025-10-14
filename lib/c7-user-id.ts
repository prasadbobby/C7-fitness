import prisma from "@/prisma/prisma";

/**
 * Generates a new C7 user ID in the format C7XXXX
 * where XXXX is a 4-digit incremental number starting from 0001
 */
export async function generateC7UserId(): Promise<string> {
  try {
    // Get the current highest C7 user ID number from the c7UserId field
    const lastUser = await prisma.userInfo.findFirst({
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

/**
 * Assigns a C7 user ID to a Clerk user and updates the database
 * Keeps the original userId and adds c7UserId in a new column
 */
export async function assignC7UserId(clerkUserId: string): Promise<string> {
  try {
    // Check if user already has a C7 user ID
    const existingUser = await prisma.userInfo.findUnique({
      where: {
        userId: clerkUserId
      }
    });

    // If user exists and already has C7 format, return it
    if (existingUser && existingUser.c7UserId) {
      return existingUser.c7UserId; // Already has C7 ID
    }

    // Generate new C7 user ID
    const newC7UserId = await generateC7UserId();

    // If user doesn't exist in UserInfo, create them first
    if (!existingUser) {
      await prisma.userInfo.create({
        data: {
          userId: clerkUserId,
          c7UserId: newC7UserId,
        }
      });
      return newC7UserId;
    }

    // Update the user record with C7 ID in the new column
    await prisma.userInfo.update({
      where: {
        userId: clerkUserId
      },
      data: {
        c7UserId: newC7UserId
      }
    });

    return newC7UserId;
  } catch (error) {
    console.error('Error assigning C7 user ID:', error);
    throw error;
  }
}

/**
 * Batch assigns C7 user IDs to all existing users
 * Does not modify existing userIds, only adds c7UserId
 */
export async function batchAssignC7UserIds(): Promise<void> {
  try {
    // Get all users that don't have C7 user IDs yet
    const usersToAssign = await prisma.userInfo.findMany({
      where: {
        c7UserId: null
      }
    });

    console.log(`Found ${usersToAssign.length} users to assign C7 IDs`);

    for (const user of usersToAssign) {
      try {
        const newC7UserId = await assignC7UserId(user.userId);
        console.log(`Assigned ${user.userId} -> ${newC7UserId}`);
      } catch (error) {
        console.error(`Failed to assign C7 ID to user ${user.userId}:`, error);
      }
    }

    console.log('Batch assignment completed');
  } catch (error) {
    console.error('Error in batch assignment:', error);
    throw error;
  }
}

/**
 * Gets the C7 user ID for a given Clerk user ID
 */
export async function getC7UserId(clerkUserId: string): Promise<string | null> {
  try {
    const user = await prisma.userInfo.findUnique({
      where: {
        userId: clerkUserId
      },
      select: {
        c7UserId: true
      }
    });

    return user?.c7UserId || null;
  } catch (error) {
    console.error('Error getting C7 user ID:', error);
    return null;
  }
}

/**
 * Gets the display user ID for admin interfaces
 * Returns C7 format if available, otherwise returns Clerk ID
 */
export async function getDisplayUserId(clerkUserId: string): Promise<string> {
  const c7UserId = await getC7UserId(clerkUserId);
  return c7UserId || clerkUserId;
}

/**
 * Gets user info by C7 user ID
 */
export async function getUserByC7Id(c7UserId: string) {
  try {
    return await prisma.userInfo.findUnique({
      where: {
        c7UserId: c7UserId
      }
    });
  } catch (error) {
    console.error('Error getting user by C7 ID:', error);
    return null;
  }
}

/**
 * Helper function for admin routes to convert URLs from /admin/users/c7UserId to clerkUserId
 */
export async function resolveUserIdFromParam(userIdParam: string): Promise<string | null> {
  // If it's a C7 format ID, look up the corresponding Clerk ID
  if (userIdParam.startsWith('C7')) {
    const user = await getUserByC7Id(userIdParam);
    return user?.userId || null;
  }

  // Otherwise, assume it's already a Clerk ID
  return userIdParam;
}