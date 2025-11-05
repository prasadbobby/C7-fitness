import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';
import { calculateMonthlyExpenses } from '@/utils/advancedPaymentCalculations';

export const dynamic = 'force-dynamic';

// Handle advanced expense management
export async function POST(request: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Check if user is admin
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: user.id },
      select: { role: true },
    });

    if (!userInfo || !['ADMIN', 'SUPER_ADMIN'].includes(userInfo.role)) {
      return new NextResponse('Forbidden - Admin access required', { status: 403 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'ADD_PREPAID_EXPENSE':
        return handlePrepaidExpense(data);

      case 'ADD_OUTSTANDING_EXPENSE':
        return handleOutstandingExpense(data);

      case 'CALCULATE_MONTHLY_SUMMARY':
        return handleMonthlySummary(data);

      case 'PROCESS_EXPENSE_PAYMENT':
        return handleExpensePayment(data);

      case 'GET_ACCRUAL_REPORT':
        return handleAccrualReport(data);

      default:
        return new NextResponse('Invalid action', { status: 400 });
    }

  } catch (error) {
    console.error('Error in advanced expenses API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Add prepaid expense (paid in advance)
async function handlePrepaidExpense(data: {
  month: string;
  year: number;
  category: string;
  amount: number;
  description: string;
  actualPaymentDate: string;
  expenseMonth: number; // Which month this expense belongs to
  expenseYear: number;
}) {
  try {
    // Find or create the target month's expense record
    const targetMonthExpense = await prisma.monthlyExpense.upsert({
      where: {
        month_year: {
          month: data.month,
          year: data.year
        }
      },
      create: {
        month: data.month,
        year: data.year,
        rent: 0,
        salaries: 0,
        electricity: 0,
        internetMaintenance: 0,
        miscellaneous: 0,
        customExpenses: [],
        totalExpenses: 0
      },
      update: {}
    });

    // Add to custom expenses with prepaid flag
    const customExpenses = Array.isArray(targetMonthExpense.customExpenses)
      ? targetMonthExpense.customExpenses as any[]
      : [];

    customExpenses.push({
      id: `prepaid_${Date.now()}`,
      category: data.category,
      amount: data.amount,
      description: data.description,
      type: 'PREPAID',
      actualPaymentDate: data.actualPaymentDate,
      expenseMonth: data.expenseMonth,
      expenseYear: data.expenseYear,
      createdAt: new Date().toISOString()
    });

    // Update the record
    const updatedExpense = await prisma.monthlyExpense.update({
      where: { id: targetMonthExpense.id },
      data: {
        customExpenses: customExpenses,
        totalExpenses: {
          increment: 0 // Don't add to total since it's prepaid
        },
        notes: `${targetMonthExpense.notes || ''}\nPrepaid: ${data.description} - ₹${data.amount} (paid in ${data.month} ${data.year} for ${data.expenseMonth}/${data.expenseYear})`
      }
    });

    return NextResponse.json({
      success: true,
      updatedExpense,
      message: `Prepaid expense of ₹${data.amount} recorded for ${data.month} ${data.year}`
    });

  } catch (error) {
    console.error('Error adding prepaid expense:', error);
    return new NextResponse('Error adding prepaid expense', { status: 400 });
  }
}

// Add outstanding expense (to be paid later)
async function handleOutstandingExpense(data: {
  month: string;
  year: number;
  category: string;
  amount: number;
  description: string;
  dueDate: string;
}) {
  try {
    // Find or create the month's expense record
    const monthlyExpense = await prisma.monthlyExpense.upsert({
      where: {
        month_year: {
          month: data.month,
          year: data.year
        }
      },
      create: {
        month: data.month,
        year: data.year,
        rent: 0,
        salaries: 0,
        electricity: 0,
        internetMaintenance: 0,
        miscellaneous: 0,
        customExpenses: [],
        totalExpenses: 0
      },
      update: {}
    });

    // Add to custom expenses with outstanding flag
    const customExpenses = Array.isArray(monthlyExpense.customExpenses)
      ? monthlyExpense.customExpenses as any[]
      : [];

    customExpenses.push({
      id: `outstanding_${Date.now()}`,
      category: data.category,
      amount: data.amount,
      description: data.description,
      type: 'OUTSTANDING',
      dueDate: data.dueDate,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });

    // Update the record
    const updatedExpense = await prisma.monthlyExpense.update({
      where: { id: monthlyExpense.id },
      data: {
        customExpenses: customExpenses,
        totalExpenses: {
          increment: data.amount // Add to total as accrued expense
        },
        notes: `${monthlyExpense.notes || ''}\nOutstanding: ${data.description} - ₹${data.amount} (due: ${data.dueDate})`
      }
    });

    return NextResponse.json({
      success: true,
      updatedExpense,
      message: `Outstanding expense of ₹${data.amount} recorded for ${data.month} ${data.year}`
    });

  } catch (error) {
    console.error('Error adding outstanding expense:', error);
    return new NextResponse('Error adding outstanding expense', { status: 400 });
  }
}

// Calculate comprehensive monthly summary
async function handleMonthlySummary(data: {
  month: number;
  year: number;
}) {
  try {
    const monthName = new Date(data.year, data.month - 1).toLocaleString('default', { month: 'long' });

    // Get all expense records that might affect this month
    const allExpenses = await prisma.monthlyExpense.findMany({
      where: {
        year: {
          gte: data.year - 1, // Look at previous year too for prepaid expenses
          lte: data.year + 1   // Look at next year too for outstanding expenses
        }
      }
    });

    // Collect all expenses that impact the target month
    const expensesToAnalyze: Array<{
      amount: number;
      expenseDate: Date;
      actualPaymentDate: Date;
      category: string;
      type: 'REGULAR' | 'PREPAID' | 'OUTSTANDING';
    }> = [];

    allExpenses.forEach(expense => {
      // Regular expenses for the target month
      if (expense.month === monthName && expense.year === data.year) {
        expensesToAnalyze.push({
          amount: expense.rent,
          expenseDate: new Date(data.year, data.month - 1, 1),
          actualPaymentDate: new Date(data.year, data.month - 1, 1),
          category: 'rent',
          type: 'REGULAR'
        });
        expensesToAnalyze.push({
          amount: expense.salaries,
          expenseDate: new Date(data.year, data.month - 1, 1),
          actualPaymentDate: new Date(data.year, data.month - 1, 1),
          category: 'salaries',
          type: 'REGULAR'
        });
        expensesToAnalyze.push({
          amount: expense.electricity,
          expenseDate: new Date(data.year, data.month - 1, 1),
          actualPaymentDate: new Date(data.year, data.month - 1, 1),
          category: 'electricity',
          type: 'REGULAR'
        });
      }

      // Custom expenses that might affect this month
      const customExpenses = Array.isArray(expense.customExpenses) ? expense.customExpenses as any[] : [];
      customExpenses.forEach((customExp: any) => {
        if (customExp.type === 'PREPAID' &&
            customExp.expenseMonth === data.month &&
            customExp.expenseYear === data.year) {
          expensesToAnalyze.push({
            amount: customExp.amount,
            expenseDate: new Date(data.year, data.month - 1, 1),
            actualPaymentDate: new Date(customExp.actualPaymentDate),
            category: customExp.category,
            type: 'PREPAID'
          });
        } else if (customExp.type === 'OUTSTANDING' &&
                   expense.month === monthName &&
                   expense.year === data.year) {
          expensesToAnalyze.push({
            amount: customExp.amount,
            expenseDate: new Date(data.year, data.month - 1, 1),
            actualPaymentDate: new Date(customExp.dueDate),
            category: customExp.category,
            type: 'OUTSTANDING'
          });
        }
      });
    });

    const monthlyCalculation = calculateMonthlyExpenses(data.month, data.year, expensesToAnalyze);

    return NextResponse.json({
      success: true,
      monthlyCalculation,
      expenseBreakdown: expensesToAnalyze
    });

  } catch (error) {
    console.error('Error calculating monthly summary:', error);
    return new NextResponse('Error calculating monthly summary', { status: 400 });
  }
}

// Process payment for outstanding expense
async function handleExpensePayment(data: {
  expenseId: string;
  month: string;
  year: number;
  paymentDate: string;
  paymentAmount: number;
  paymentMethod: string;
  notes?: string;
}) {
  try {
    // Find the expense record
    const expense = await prisma.monthlyExpense.findUnique({
      where: {
        month_year: {
          month: data.month,
          year: data.year
        }
      }
    });

    if (!expense) {
      return new NextResponse('Expense record not found', { status: 404 });
    }

    const customExpenses = Array.isArray(expense.customExpenses) ? expense.customExpenses as any[] : [];
    const expenseIndex = customExpenses.findIndex((exp: any) => exp.id === data.expenseId);

    if (expenseIndex === -1) {
      return new NextResponse('Expense item not found', { status: 404 });
    }

    // Update the expense status
    customExpenses[expenseIndex] = {
      ...customExpenses[expenseIndex],
      status: 'PAID',
      actualPaymentDate: data.paymentDate,
      paymentAmount: data.paymentAmount,
      paymentMethod: data.paymentMethod,
      paymentNotes: data.notes,
      paidAt: new Date().toISOString()
    };

    // Update the record
    const updatedExpense = await prisma.monthlyExpense.update({
      where: { id: expense.id },
      data: {
        customExpenses: customExpenses,
        notes: `${expense.notes || ''}\nPaid: ${customExpenses[expenseIndex].description} - ₹${data.paymentAmount} on ${data.paymentDate}`
      }
    });

    return NextResponse.json({
      success: true,
      updatedExpense,
      paidExpense: customExpenses[expenseIndex],
      message: `Payment of ₹${data.paymentAmount} recorded for ${customExpenses[expenseIndex].description}`
    });

  } catch (error) {
    console.error('Error processing expense payment:', error);
    return new NextResponse('Error processing expense payment', { status: 400 });
  }
}

// Generate accrual accounting report
async function handleAccrualReport(data: {
  year: number;
  includeMonths?: number[];
}) {
  try {
    const monthsToInclude = data.includeMonths || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const report: Array<{
      month: string;
      cashBasis: number;
      accrualBasis: number;
      prepaidAdjustments: number;
      outstandingAdjustments: number;
      netDifference: number;
    }> = [];

    for (const month of monthsToInclude) {
      const monthName = new Date(data.year, month - 1).toLocaleString('default', { month: 'long' });

      // Get the actual expense record
      const expense = await prisma.monthlyExpense.findUnique({
        where: {
          month_year: {
            month: monthName,
            year: data.year
          }
        }
      });

      let cashBasis = 0;
      let accrualBasis = 0;
      let prepaidAdjustments = 0;
      let outstandingAdjustments = 0;

      if (expense) {
        // Regular expenses (cash basis)
        cashBasis = expense.rent + expense.salaries + expense.electricity +
                   expense.internetMaintenance + expense.miscellaneous;

        // Start with cash basis for accrual
        accrualBasis = cashBasis;

        // Analyze custom expenses
        const customExpenses = Array.isArray(expense.customExpenses) ? expense.customExpenses as any[] : [];

        customExpenses.forEach((customExp: any) => {
          if (customExp.type === 'PREPAID') {
            // If this is a prepaid expense for this month, add to accrual but subtract from cash
            if (customExp.expenseMonth === month && customExp.expenseYear === data.year) {
              accrualBasis += customExp.amount;
              prepaidAdjustments += customExp.amount;
            }
          } else if (customExp.type === 'OUTSTANDING') {
            // Outstanding expenses are already in accrual, check if they were paid
            if (customExp.status === 'PAID') {
              // Remove from accrual if paid in different month
              const paymentDate = new Date(customExp.actualPaymentDate);
              if (paymentDate.getMonth() + 1 !== month || paymentDate.getFullYear() !== data.year) {
                accrualBasis -= customExp.amount;
                outstandingAdjustments -= customExp.amount;
              }
            } else {
              // Still outstanding
              outstandingAdjustments += customExp.amount;
            }
          }
        });
      }

      const netDifference = accrualBasis - cashBasis;

      report.push({
        month: monthName,
        cashBasis,
        accrualBasis,
        prepaidAdjustments,
        outstandingAdjustments,
        netDifference
      });
    }

    // Calculate totals
    const totals = report.reduce((acc, month) => ({
      cashBasis: acc.cashBasis + month.cashBasis,
      accrualBasis: acc.accrualBasis + month.accrualBasis,
      prepaidAdjustments: acc.prepaidAdjustments + month.prepaidAdjustments,
      outstandingAdjustments: acc.outstandingAdjustments + month.outstandingAdjustments,
      netDifference: acc.netDifference + month.netDifference
    }), {
      cashBasis: 0,
      accrualBasis: 0,
      prepaidAdjustments: 0,
      outstandingAdjustments: 0,
      netDifference: 0
    });

    return NextResponse.json({
      success: true,
      report,
      totals,
      year: data.year,
      summary: {
        totalMonths: report.length,
        averageMonthlyCash: totals.cashBasis / report.length,
        averageMonthlyAccrual: totals.accrualBasis / report.length,
        totalAdjustments: totals.prepaidAdjustments + totals.outstandingAdjustments
      }
    });

  } catch (error) {
    console.error('Error generating accrual report:', error);
    return new NextResponse('Error generating accrual report', { status: 400 });
  }
}