import { NextResponse } from 'next/server';
import { currentUser, clerkClient } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';

export const dynamic = 'force-dynamic';

interface MonthlyPaymentData {
  month: string;
  year: number;
  totalIncome: number;
  totalClients: number;
  averagePayment: number;
  payments: Array<{
    id: string;
    userName: string;
    userEmail: string;
    userImageUrl: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    transactionId: string | null;
    notes: string | null;
  }>;
}

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
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());

    // Fetch all payment logs for the year
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    const paymentLogs = await prisma.paymentLog.findMany({
      where: {
        paymentDate: {
          gte: startOfYear,
          lte: endOfYear,
        },
        // Only include payments from users who are not admins
        userInfo: {
          role: {
            notIn: ['ADMIN', 'SUPER_ADMIN']
          }
        }
      },
      include: {
        userInfo: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });

    // Get user details from Clerk for all unique users
    const uniqueUserIds = new Set(paymentLogs.map(log => log.userInfo.userId));
    const userIds = Array.from(uniqueUserIds);
    let clerkUsers: any = {};

    if (userIds.length > 0) {
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
    }

    // Get all users with payment breakdown info for the year
    const allUsersWithPayments = await prisma.userInfo.findMany({
      where: {
        role: {
          notIn: ['ADMIN', 'SUPER_ADMIN']
        }
      },
      select: {
        id: true,
        userId: true,
        packagePrice: true,
        discountedPrice: true,
        totalAmountPaid: true,
        remainingAmount: true,
        membershipStartDate: true,
        membershipEndDate: true,
        membershipDuration: true,
        membershipStatus: true,
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
          where: {
            paymentDate: {
              gte: startOfYear,
              lte: endOfYear,
            },
          },
          orderBy: { paymentDate: 'desc' },
        },
      },
    });

    // Get Clerk user data for all users
    const allUserIds = allUsersWithPayments.map(u => u.userId);
    let allClerkUsers: any = {};

    if (allUserIds.length > 0) {
      try {
        const clerkUserList = await clerkClient.users.getUserList({
          userId: allUserIds,
          limit: 500,
        });

        allClerkUsers = clerkUserList.reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});
      } catch (error) {
        console.error('Error fetching all Clerk users:', error);
      }
    }

    // Calculate payment breakdown allocations for each user
    const calculateUserPaymentBreakdown = (user: any) => {
      if (!user.discountedPrice || user.discountedPrice <= 0 || !user.membershipStartDate || !user.membershipDuration) {
        return null;
      }

      const totalPackageAmount = user.discountedPrice;
      const membershipDuration = user.membershipDuration;
      const perDayRate = totalPackageAmount / membershipDuration;

      const startDate = new Date(user.membershipStartDate);
      const endDate = user.membershipEndDate ? new Date(user.membershipEndDate) : new Date(startDate);

      if (!user.membershipEndDate) {
        endDate.setDate(startDate.getDate() + membershipDuration - 1);
      }

      const monthBreakdown: any = {};
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const month = currentDate.getMonth();
        const year = currentDate.getFullYear();
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0);

        const rangeStart = currentDate < monthStart ? monthStart : new Date(currentDate);
        const rangeEnd = endDate < monthEnd ? endDate : monthEnd;

        if (rangeStart <= rangeEnd) {
          const daysInMonth = Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const monthAmount = daysInMonth * perDayRate;
          const monthKey = `${year}-${month}`;

          // Find payments for this month
          const monthPayments = user.paymentLogs.filter((payment: any) => {
            const paymentDate = new Date(payment.paymentDate);
            return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
          });

          const totalPaidInMonth = monthPayments.reduce((sum: number, p: any) => sum + p.amount, 0);

          monthBreakdown[monthKey] = {
            allocatedAmount: Math.round(monthAmount * 100) / 100,
            paidAmount: totalPaidInMonth,
            availableForSpending: totalPaidInMonth > 0 ? Math.min(Math.round(monthAmount * 100) / 100, totalPaidInMonth) : 0, // Can only spend what was actually paid
            daysInMonth: daysInMonth,
            payments: monthPayments
          };
        }

        currentDate.setDate(1);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      return monthBreakdown;
    };

    // Group payments by month and calculate available spending budget
    const monthlyData: { [key: string]: any } = {};

    // Initialize all months for the year
    for (let month = 0; month < 12; month++) {
      const monthKey = `${year}-${month}`;
      const monthName = new Date(year, month, 1).toLocaleDateString('en-IN', { month: 'long' });

      monthlyData[monthKey] = {
        month: monthName,
        year: year,
        totalIncome: 0,
        totalClients: 0,
        averagePayment: 0,
        payments: [],
        users: [],
        totalAvailableForSpending: 0,
        budgetAllocation: {}
      };
    }

    // Process each user and their payments
    allUsersWithPayments.forEach(user => {
      const clerkUser = allClerkUsers[user.userId];
      const userName = clerkUser
        ? (clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.username || clerkUser.emailAddresses?.[0]?.emailAddress || 'Unknown User')
        : 'Unknown User';

      const userEmail = clerkUser?.emailAddresses?.[0]?.emailAddress || '';
      const userImageUrl = clerkUser?.imageUrl || '';

      const paymentBreakdown = calculateUserPaymentBreakdown(user);

      user.paymentLogs.forEach((log: any) => {
        const paymentDate = new Date(log.paymentDate);
        const monthKey = `${paymentDate.getFullYear()}-${paymentDate.getMonth()}`;

        if (monthlyData[monthKey]) {
          monthlyData[monthKey].totalIncome += log.amount;
          monthlyData[monthKey].payments.push({
            id: log.id,
            userName,
            userEmail,
            userImageUrl,
            amount: log.amount,
            paymentDate: log.paymentDate.toISOString(),
            paymentMethod: log.paymentMethod,
            transactionId: log.transactionId,
            notes: log.notes,
            recordedByName: 'Admin' // We'll get this from admin users if needed
          });
        }
      });

      // Add user to each month (whether they paid or not)
      for (let month = 0; month < 12; month++) {
        const monthKey = `${year}-${month}`;
        if (monthlyData[monthKey]) {
          const userMonthData = {
            id: user.id,
            userId: user.userId,
            userName,
            userEmail,
            userImageUrl,
            packagePrice: user.packagePrice,
            discountedPrice: user.discountedPrice,
            totalAmountPaid: user.totalAmountPaid,
            remainingAmount: user.remainingAmount,
            membershipStatus: user.membershipStatus,
            paymentBreakdown: paymentBreakdown?.[monthKey] || null,
            monthlyPayments: user.paymentLogs.filter((log: any) => {
              const paymentDate = new Date(log.paymentDate);
              return paymentDate.getMonth() === month && paymentDate.getFullYear() === year;
            })
          };

          monthlyData[monthKey].users.push(userMonthData);

          // Add to available spending budget if user has allocation for this month
          if (paymentBreakdown?.[monthKey]) {
            monthlyData[monthKey].totalAvailableForSpending += paymentBreakdown[monthKey].availableForSpending;
          }
        }
      }
    });

    // Calculate unique clients per month and average payment
    Object.keys(monthlyData).forEach(monthKey => {
      const month = monthlyData[monthKey];
      const uniqueUsers = new Set(month.payments.map((p: any) => p.userEmail));
      month.totalClients = uniqueUsers.size;
      month.averagePayment = month.totalClients > 0 ? month.totalIncome / month.totalClients : 0;
    });

    // Fetch monthly expenses
    const monthlyExpenses = await prisma.monthlyExpense.findMany({
      where: {
        year: year,
      },
      orderBy: {
        month: 'asc',
      },
    });

    // Convert monthly expenses to the format expected by frontend
    const expensesData = monthlyExpenses.map(expense => ({
      month: expense.month,
      year: expense.year,
      customExpenses: (expense.customExpenses as any[]) || [],
      totalExpenses: expense.totalExpenses,
    }));

    return NextResponse.json({
      monthlyData: Object.values(monthlyData),
      monthlyExpenses: expensesData,
    });

  } catch (error) {
    console.error('Error fetching monthly expenses data:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

