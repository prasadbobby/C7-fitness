import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/utils/adminAuth";
import { clerkClient } from "@clerk/nextjs";
import prisma from "@/prisma/prisma";

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

    // Get users with pagination
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
      skip: (page - 1) * limit,
      take: limit,
    });

    // Get Clerk user data for each user
    const userIds = userInfos.map(u => u.userId);
    const clerkUsers = await clerkClient.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });

    // Create a map for easy lookup
    const clerkUserMap = new Map(clerkUsers.map(user => [user.id, user]));

    // Combine data
    const users = userInfos.map(userInfo => {
      const clerkUser = clerkUserMap.get(userInfo.userId);
      return {
        id: userInfo.id,
        userId: userInfo.userId,
        role: userInfo.role,
        age: userInfo.age,
        height: userInfo.height,
        weight: userInfo.weight,
        createdAt: userInfo.createdAt.toISOString(),
        updatedAt: userInfo.updatedAt.toISOString(),
        _count: userInfo._count,
        // Clerk data
        email: clerkUser?.emailAddresses?.[0]?.emailAddress || "",
        firstName: clerkUser?.firstName || "",
        lastName: clerkUser?.lastName || "",
        username: clerkUser?.username || "",
        imageUrl: clerkUser?.imageUrl || "",
        name: clerkUser?.firstName && clerkUser?.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress || "Unknown User",
      };
    });

    // Filter by search term if provided
    let filteredUsers = users;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = users.filter(user =>
        user.email.toLowerCase().includes(searchLower) ||
        user.name.toLowerCase().includes(searchLower) ||
        user.firstName?.toLowerCase().includes(searchLower) ||
        user.lastName?.toLowerCase().includes(searchLower) ||
        user.username?.toLowerCase().includes(searchLower) ||
        user.userId.toLowerCase().includes(searchLower)
      );
    }

    // Get pending invitations
    const pendingInvitations = await prisma.pendingInvitation.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Separate users by role for tabs
    const adminUsers = filteredUsers.filter(u => u.role === "ADMIN" || u.role === "SUPER_ADMIN");
    const regularUsers = filteredUsers.filter(u => u.role === "USER");

    return NextResponse.json({
      users: filteredUsers,
      adminUsers,
      regularUsers,
      pendingInvitations: pendingInvitations.map(inv => ({
        ...inv,
        createdAt: inv.createdAt.toISOString(),
        updatedAt: inv.updatedAt.toISOString(),
      })),
      total: filteredUsers.length,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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