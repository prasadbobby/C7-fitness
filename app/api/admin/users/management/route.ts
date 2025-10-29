import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const { isAdmin } = await checkAdminAuth();

    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get search parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";

    // Build where clause for filtering
    const where: any = {};
    if (role !== "all") {
      where.role = role;
    }

    // Get total count for pagination
    const total = await prisma.userInfo.count({ where });

    // Get all users from Clerk (this approach works like the search API)
    let allClerkUsers: any[] = [];
    try {
      // Get all users from Clerk - use pagination to get all users
      let hasMore = true;
      let offset = 0;
      const clerkLimit = 100; // Clerk's max limit per request

      while (hasMore) {
        const clerkResponse = await clerkClient.users.getUserList({
          limit: clerkLimit,
          offset: offset,
        });

        allClerkUsers.push(...clerkResponse);
        hasMore = clerkResponse.length === clerkLimit;
        offset += clerkLimit;

        // Safety break to avoid infinite loops
        if (offset > 10000) break;
      }

      console.log(`Found ${allClerkUsers.length} users in Clerk`);
    } catch (error) {
      console.warn("Error fetching all Clerk users:", error);
    }

    // Create a map of Clerk users by their ID
    const clerkUserMap = new Map(allClerkUsers.map(user => [user.id, user]));

    // Get users from database and combine with Clerk data
    const userInfos = await prisma.userInfo.findMany({
      where,
      include: {
        _count: {
          select: {
            assignedWorkouts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Filter users to only include those that exist in Clerk and fetch latest measurements
    const validUsers = await Promise.all(
      userInfos
        .filter(userInfo => clerkUserMap.has(userInfo.userId))
        .map(async userInfo => {
          const clerkUser = clerkUserMap.get(userInfo.userId)!;

          // Fetch latest height measurement
          const latestHeightMeasurement = await prisma.bodyMeasurement.findFirst({
            where: {
              userId: userInfo.userId,
              measurementType: 'HEIGHT',
            },
            orderBy: {
              recordedDate: 'desc',
            },
          });

          // Fetch latest weight measurement
          const latestWeightMeasurement = await prisma.bodyMeasurement.findFirst({
            where: {
              userId: userInfo.userId,
              measurementType: 'WEIGHT',
            },
            orderBy: {
              recordedDate: 'desc',
            },
          });

          return {
            id: userInfo.id,
            userId: userInfo.userId,
            role: userInfo.role,
            age: userInfo.age,
            // Use latest measurements from BodyMeasurement table, fallback to UserInfo table
            height: latestHeightMeasurement?.value || userInfo.height,
            weight: latestWeightMeasurement?.value || userInfo.weight,
            createdAt: userInfo.createdAt.toISOString(),
            updatedAt: userInfo.updatedAt.toISOString(),
            _count: userInfo._count,
            // Full Clerk data
            email: clerkUser.emailAddresses?.[0]?.emailAddress || "No email",
            firstName: clerkUser.firstName || "",
            lastName: clerkUser.lastName || "",
            username: clerkUser.username || "",
            imageUrl: clerkUser.imageUrl || "",
            name: clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown User",
          };
        })
    );

    // Filter by search term if provided (BEFORE pagination)
    let filteredUsers = validUsers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = validUsers.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.userId.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination to the filtered results
    const totalFilteredUsers = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

    // This is our final users array
    const users = paginatedUsers;

    // Get pending invitations
    const pendingInvitations = await prisma.pendingInvitation.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Separate users by role for tabs (use paginated results)
    const adminUsers = users.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN");
    const regularUsers = users.filter(u => u.role === "USER");

    return NextResponse.json({
      users: users, // Return paginated results
      adminUsers,
      regularUsers,
      pendingInvitations: pendingInvitations.map(inv => ({
        ...inv,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
      total: totalFilteredUsers, // Use count of filtered users for pagination
      pagination: {
        page,
        limit,
        total: totalFilteredUsers,
        totalPages: Math.ceil(totalFilteredUsers / limit),
      },
    });

  } catch (error) {
    console.error("Error fetching user management data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user management data" },
      { status: 500 }
    );
  }
}