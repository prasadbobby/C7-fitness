import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is super admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true },
    });

    if (!userInfo || userInfo.role !== 'SUPER_ADMIN') {
      return new NextResponse('Forbidden - Super Admin access required', { status: 403 });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') || '';
    const paymentStatus = url.searchParams.get('status') || 'all';

    // Get payment status filter for database query
    let whereClause: any = {};

    // Apply payment status filter to database query
    if (paymentStatus !== 'all') {
      switch (paymentStatus) {
        case 'no_pricing':
          whereClause.discountedPrice = null;
          break;
        case 'fully_paid':
          whereClause.AND = [
            { discountedPrice: { not: null } },
            { remainingAmount: { lte: 0 } }
          ];
          break;
        case 'pending':
          whereClause.AND = [
            { discountedPrice: { not: null } },
            { remainingAmount: { gt: 0 } },
            {
              OR: [
                { nextPaymentDue: null },
                { nextPaymentDue: { gte: new Date() } }
              ]
            }
          ];
          break;
        case 'overdue':
          whereClause.AND = [
            { discountedPrice: { not: null } },
            { remainingAmount: { gt: 0 } },
            { nextPaymentDue: { lt: new Date() } }
          ];
          break;
      }
    }

    // Get all users with payment info and payment logs (no search filter yet)
    const allUsers = await prisma.userInfo.findMany({
      where: whereClause,
      select: {
        id: true,
        userId: true,
        packagePrice: true,
        discountedPrice: true,
        totalAmountPaid: true,
        remainingAmount: true,
        nextPaymentDue: true,
        paymentNotes: true,
        createdAt: true,
        updatedAt: true,
        paymentLogs: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            paymentMethod: true,
            transactionId: true,
            notes: true,
            recordedBy: true,
            createdAt: true,
          },
          orderBy: { paymentDate: 'desc' },
          take: 5, // Latest 5 payments per user for overview
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get Clerk user data for all users
    const userIds = allUsers.map(u => u.userId);
    let clerkUsers: any = {};

    try {
      const clerkUserList = await clerkClient.users.getUserList({
        userId: userIds,
        limit: 100,
      });

      clerkUsers = clerkUserList.reduce((acc: any, user: any) => {
        acc[user.id] = user;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching Clerk users:', error);
    }

    // Get admin names for payment logs
    const adminIds = Array.from(new Set(allUsers.flatMap(u => u.paymentLogs.map(log => log.recordedBy))));
    let adminUsers: any = {};

    if (adminIds.length > 0) {
      try {
        const adminUserList = await clerkClient.users.getUserList({
          userId: adminIds,
          limit: 100,
        });

        adminUsers = adminUserList.reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});
      } catch (error) {
        console.error('Error fetching admin users:', error);
      }
    }

    // Enhance users with Clerk data and calculate payment status
    const enhancedUsers = allUsers.map(user => {
      const clerkUser = clerkUsers[user.userId];
      const userName = clerkUser
        ? (clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress || 'Unknown User')
        : 'Unknown User';

      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
      const userImageUrl = clerkUser?.imageUrl || '';

      // Calculate payment status
      let paymentStatus = 'no_pricing';
      if (user.discountedPrice !== null) {
        if ((user.remainingAmount || 0) <= 0) {
          paymentStatus = 'fully_paid';
        } else if (user.nextPaymentDue && new Date(user.nextPaymentDue) < new Date()) {
          paymentStatus = 'overdue';
        } else {
          paymentStatus = 'pending';
        }
      }

      // Enhance payment logs with admin names
      const enhancedPaymentLogs = user.paymentLogs.map(log => {
        const adminUser = adminUsers[log.recordedBy];
        const adminName = adminUser
          ? (adminUser.firstName && adminUser.lastName
            ? `${adminUser.firstName} ${adminUser.lastName}`
            : adminUser.username || adminUser.emailAddresses?.[0]?.emailAddress || 'Unknown Admin')
          : 'Unknown Admin';

        return {
          ...log,
          recordedByName: adminName,
          paymentDate: log.paymentDate.toISOString(),
          createdAt: log.createdAt.toISOString(),
        };
      });

      return {
        id: user.id,
        userId: user.userId,
        userName,
        userEmail,
        userImageUrl,
        packagePrice: user.packagePrice,
        discountedPrice: user.discountedPrice,
        totalAmountPaid: user.totalAmountPaid,
        remainingAmount: user.remainingAmount,
        nextPaymentDue: user.nextPaymentDue?.toISOString() || null,
        paymentNotes: user.paymentNotes,
        paymentStatus,
        recentPayments: enhancedPaymentLogs,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      };
    });

    // Apply search filter to enhanced users (names, emails, and payment notes)
    let filteredUsers = enhancedUsers;
    if (search && search.trim() !== '') {
      const searchLower = search.toLowerCase().trim();
      filteredUsers = enhancedUsers.filter(user =>
        user.userName.toLowerCase().includes(searchLower) ||
        user.userEmail.toLowerCase().includes(searchLower) ||
        (user.paymentNotes && user.paymentNotes.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination to filtered results
    const totalFilteredUsers = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice((page - 1) * limit, page * limit);

    // Calculate summary statistics
    const allUsersForStats = await prisma.userInfo.findMany({
      select: {
        discountedPrice: true,
        totalAmountPaid: true,
        remainingAmount: true,
        nextPaymentDue: true,
      },
    });

    const stats = {
      totalUsers: allUsersForStats.length,
      usersWithPricing: allUsersForStats.filter(u => u.discountedPrice !== null).length,
      usersFullyPaid: allUsersForStats.filter(u => u.discountedPrice !== null && (u.remainingAmount || 0) <= 0).length,
      usersOverdue: allUsersForStats.filter(u =>
        u.discountedPrice !== null &&
        (u.remainingAmount || 0) > 0 &&
        u.nextPaymentDue &&
        new Date(u.nextPaymentDue) < new Date()
      ).length,
      totalRevenue: allUsersForStats.reduce((sum, u) => sum + (u.totalAmountPaid || 0), 0),
      totalPending: allUsersForStats.reduce((sum, u) => sum + (u.remainingAmount || 0), 0),
    };

    return NextResponse.json({
      users: paginatedUsers,
      stats,
      pagination: {
        page,
        limit,
        total: totalFilteredUsers,
        totalPages: Math.ceil(totalFilteredUsers / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching payment info:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}