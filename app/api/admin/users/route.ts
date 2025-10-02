import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { requireAdmin } from "@/utils/adminAuth";
import { UserRole } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.userId = {
        contains: search,
        mode: "insensitive",
      };
    }

    if (role !== "all") {
      where.role = role as UserRole;
    }

    // Get users with count of assigned workouts
    const [users, total] = await Promise.all([
      prisma.userInfo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: {
              assignedWorkouts: true,
            },
          },
        },
      }),
      prisma.userInfo.count({ where }),
    ]);

    // Fetch Clerk user data for usernames and emails
    const usersWithClerkData = await Promise.all(
      users.map(async (user) => {
        try {
          const clerkUser = await clerkClient.users.getUser(user.userId);
          return {
            ...user,
            username: clerkUser.username || clerkUser.firstName || clerkUser.emailAddresses[0]?.emailAddress || user.userId,
            email: clerkUser.emailAddresses[0]?.emailAddress,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            imageUrl: clerkUser.imageUrl,
          };
        } catch (error) {
          // If Clerk user not found, return with just userId
          return {
            ...user,
            username: user.userId,
            email: null,
            firstName: null,
            lastName: null,
            imageUrl: null,
          };
        }
      })
    );

    return NextResponse.json({
      users: usersWithClerkData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}