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

    // We'll filter by role after getting all users since we're now showing all Clerk users

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

    // Get all users from our database (for role and locked status)
    const userInfosInDb = await prisma.userInfo.findMany({
      include: {
        _count: {
          select: {
            assignedWorkouts: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Create a map of database users by userId for quick lookup
    const dbUserMap = new Map(userInfosInDb.map(user => [user.userId, user]));

    // Process ALL Clerk users (not just those in database)
    const validUsers = await Promise.all(
      allClerkUsers.map(async clerkUser => {
        const userInfo = dbUserMap.get(clerkUser.id);

        // Fetch latest measurements if user exists in database
        let latestHeightMeasurement = null;
        let latestWeightMeasurement = null;

        if (userInfo) {
          latestHeightMeasurement = await prisma.bodyMeasurement.findFirst({
            where: {
              userId: clerkUser.id,
              measurementType: 'HEIGHT',
            },
            orderBy: {
              recordedDate: 'desc',
            },
          });

          latestWeightMeasurement = await prisma.bodyMeasurement.findFirst({
            where: {
              userId: clerkUser.id,
              measurementType: 'WEIGHT',
            },
            orderBy: {
              recordedDate: 'desc',
            },
          });
        }

        return {
          id: userInfo?.id || `temp-${clerkUser.id}`, // Temporary ID for users not in DB
          userId: clerkUser.id,
          role: userInfo?.role || 'USER', // Default role for users not in DB
          age: userInfo?.age || null,
          // Use latest measurements from BodyMeasurement table, fallback to UserInfo table
          height: latestHeightMeasurement?.value || userInfo?.height || null,
          weight: latestWeightMeasurement?.value || userInfo?.weight || null,
          createdAt: userInfo?.createdAt.toISOString() || (clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : new Date().toISOString()),
          updatedAt: userInfo?.updatedAt.toISOString() || (clerkUser.updatedAt ? new Date(clerkUser.updatedAt).toISOString() : new Date().toISOString()),
          _count: userInfo?._count || { assignedWorkouts: 0 },
          // Full Clerk data
          email: clerkUser.emailAddresses?.[0]?.emailAddress || "No email",
          firstName: clerkUser.firstName || "",
          lastName: clerkUser.lastName || "",
          username: clerkUser.username || "",
          imageUrl: clerkUser.imageUrl || "",
          name: clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress || "Unknown User",
          // Use locked status from our database, default to false if not in DB
          locked: userInfo?.locked || false,
        };
      })
    );

    // Filter by role if provided
    let filteredUsers = validUsers;
    if (role !== "all") {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Filter by search term if provided (AFTER role filtering, BEFORE pagination)
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
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