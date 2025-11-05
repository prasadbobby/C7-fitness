import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
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

    const body = await request.json();
    const { id, month, year, category, description, amount, date, notes, action } = body;

    if (!month || !year || !category || !description || !amount || !date) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Find or create the monthly expense record
    const monthlyExpense = await prisma.monthlyExpense.findUnique({
      where: {
        month_year: {
          month: month,
          year: year,
        },
      },
    });

    let customExpenses = monthlyExpense?.customExpenses || [];

    if (action === 'create') {
      // Add new expense
      const newExpense = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        category,
        description,
        amount: parseFloat(amount),
        date,
        notes: notes || '',
        recordedBy: user.id,
        recordedByName: user.firstName && user.lastName ?
          `${user.firstName} ${user.lastName}` :
          user.username || user.emailAddresses?.[0]?.emailAddress || 'Unknown Admin',
        createdAt: new Date().toISOString(),
      };

      customExpenses = [...(customExpenses as any[]), newExpense];
    } else if (action === 'update' && id) {
      // Update existing expense
      customExpenses = (customExpenses as any[]).map((expense: any) =>
        expense.id === id ? {
          ...expense,
          category,
          description,
          amount: parseFloat(amount),
          date,
          notes: notes || '',
          updatedAt: new Date().toISOString(),
        } : expense
      );
    }

    // Calculate total expenses
    const totalExpenses = (customExpenses as any[]).reduce((sum: number, exp: any) => sum + exp.amount, 0);

    // Upsert the monthly expense record
    const updatedMonthlyExpense = await prisma.monthlyExpense.upsert({
      where: {
        month_year: {
          month: month,
          year: year,
        },
      },
      update: {
        customExpenses: customExpenses as any,
        totalExpenses: totalExpenses,
        updatedAt: new Date(),
      },
      create: {
        month: month,
        year: year,
        rent: 0,
        salaries: 0,
        electricity: 0,
        internetMaintenance: 0,
        miscellaneous: 0,
        customExpenses: customExpenses as any,
        totalExpenses: totalExpenses,
      },
    });

    // Return the updated expense data in the format expected by frontend
    const responseExpenses = {
      month: updatedMonthlyExpense.month,
      year: updatedMonthlyExpense.year,
      customExpenses: (updatedMonthlyExpense.customExpenses as any[]) || [],
      totalExpenses: updatedMonthlyExpense.totalExpenses,
    };

    return NextResponse.json({
      success: true,
      monthlyExpense: updatedMonthlyExpense,
      expenseData: responseExpenses,
    });

  } catch (error) {
    console.error('Error managing expense:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(request: Request) {
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

    const body = await request.json();
    const { id, month, year } = body;

    if (!id || !month || !year) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Find the monthly expense record
    const monthlyExpense = await prisma.monthlyExpense.findUnique({
      where: {
        month_year: {
          month: month,
          year: year,
        },
      },
    });

    if (!monthlyExpense) {
      return new NextResponse('Monthly expense record not found', { status: 404 });
    }

    // Remove the expense from customExpenses array
    const customExpenses = (monthlyExpense.customExpenses as any[]).filter(
      (expense: any) => expense.id !== id
    );

    // Calculate new total expenses
    const totalExpenses = customExpenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

    // Update the monthly expense record
    const updatedMonthlyExpense = await prisma.monthlyExpense.update({
      where: {
        month_year: {
          month: month,
          year: year,
        },
      },
      data: {
        customExpenses: customExpenses as any,
        totalExpenses: totalExpenses,
        updatedAt: new Date(),
      },
    });

    // Return the updated expense data in the format expected by frontend
    const responseExpenses = {
      month: updatedMonthlyExpense.month,
      year: updatedMonthlyExpense.year,
      customExpenses: (updatedMonthlyExpense.customExpenses as any[]) || [],
      totalExpenses: updatedMonthlyExpense.totalExpenses,
    };

    return NextResponse.json({
      success: true,
      monthlyExpense: updatedMonthlyExpense,
      expenseData: responseExpenses,
    });

  } catch (error) {
    console.error('Error deleting expense:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}