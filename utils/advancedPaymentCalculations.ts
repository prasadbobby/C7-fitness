import { differenceInDays, addDays, startOfDay, endOfDay, getMonth, getYear, getDaysInMonth } from 'date-fns';

export interface PaymentCalculation {
  totalAmount: number;
  monthlyBreakdown: Array<{
    month: string;
    year: number;
    amount: number;
    daysCount: number;
    percentage: number;
  }>;
  dailyRate: number;
  proRataAmount: number;
  discountAmount?: number;
  effectiveRate: number;
}

export interface RefundCalculation {
  eligibleRefund: number;
  usedAmount: number;
  usedDays: number;
  remainingDays: number;
  refundPercentage: number;
  processingFee?: number;
  netRefund: number;
}

export interface MembershipExtension {
  originalEndDate: Date;
  newEndDate: Date;
  extensionDays: number;
  additionalPayment: number;
  isComplementary: boolean;
  proRataCalculation: PaymentCalculation;
}

// Calculate pro-rata payment distribution across months
export function calculateProRataPayment(
  startDate: Date,
  endDate: Date,
  totalAmount: number,
  discountAmount: number = 0
): PaymentCalculation {
  const start = startOfDay(startDate);
  const end = endOfDay(endDate);
  const totalDays = differenceInDays(end, start) + 1;
  const effectiveAmount = totalAmount - discountAmount;
  const dailyRate = effectiveAmount / totalDays;

  const monthlyBreakdown: PaymentCalculation['monthlyBreakdown'] = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    const month = getMonth(currentDate) + 1; // 1-based month
    const year = getYear(currentDate);
    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });
    const monthKey = `${monthName} ${year}`;

    // Calculate days in this month for this membership period
    const monthEnd = new Date(year, month - 1, getDaysInMonth(currentDate));
    const periodEndForMonth = end < monthEnd ? end : monthEnd;
    const daysInMonth = differenceInDays(periodEndForMonth, currentDate) + 1;

    if (daysInMonth > 0) {
      const monthAmount = dailyRate * daysInMonth;
      const percentage = (daysInMonth / totalDays) * 100;

      // Check if this month already exists in breakdown
      const existingMonth = monthlyBreakdown.find(m => m.month === monthKey);
      if (existingMonth) {
        existingMonth.amount += monthAmount;
        existingMonth.daysCount += daysInMonth;
        existingMonth.percentage += percentage;
      } else {
        monthlyBreakdown.push({
          month: monthKey,
          year,
          amount: monthAmount,
          daysCount: daysInMonth,
          percentage
        });
      }
    }

    // Move to next month
    currentDate = new Date(year, month, 1);
  }

  return {
    totalAmount: effectiveAmount,
    monthlyBreakdown,
    dailyRate,
    proRataAmount: effectiveAmount,
    discountAmount,
    effectiveRate: dailyRate
  };
}

// Calculate refund for cancelled membership
export function calculateRefund(
  startDate: Date,
  endDate: Date,
  cancellationDate: Date,
  totalPaid: number,
  refundPolicy: {
    minimumUsageDays?: number;
    processingFeePercentage?: number;
    refundPolicyType: 'PROPORTIONAL' | 'POLICY_BASED' | 'NO_REFUND';
  }
): RefundCalculation {
  const totalDays = differenceInDays(endOfDay(endDate), startOfDay(startDate)) + 1;
  const usedDays = Math.max(0, differenceInDays(startOfDay(cancellationDate), startOfDay(startDate)) + 1);
  const remainingDays = Math.max(0, totalDays - usedDays);

  let eligibleRefund = 0;
  let refundPercentage = 0;

  switch (refundPolicy.refundPolicyType) {
    case 'PROPORTIONAL':
      // Pro-rata refund based on unused days
      refundPercentage = (remainingDays / totalDays) * 100;
      eligibleRefund = (totalPaid * remainingDays) / totalDays;
      break;

    case 'POLICY_BASED':
      // Custom policy based on usage
      if (usedDays <= (refundPolicy.minimumUsageDays || 7)) {
        refundPercentage = 100;
        eligibleRefund = totalPaid;
      } else if (usedDays <= 30) {
        refundPercentage = 70;
        eligibleRefund = totalPaid * 0.7;
      } else if (usedDays <= 60) {
        refundPercentage = 50;
        eligibleRefund = totalPaid * 0.5;
      } else {
        refundPercentage = 0;
        eligibleRefund = 0;
      }
      break;

    case 'NO_REFUND':
    default:
      eligibleRefund = 0;
      refundPercentage = 0;
      break;
  }

  // Apply processing fee
  const processingFee = eligibleRefund * (refundPolicy.processingFeePercentage || 0) / 100;
  const netRefund = Math.max(0, eligibleRefund - processingFee);

  return {
    eligibleRefund,
    usedAmount: totalPaid - eligibleRefund,
    usedDays,
    remainingDays,
    refundPercentage,
    processingFee,
    netRefund
  };
}

// Calculate extension payment
export function calculateMembershipExtension(
  currentStartDate: Date,
  currentEndDate: Date,
  extensionDays: number,
  originalPayment: number,
  isComplementary: boolean = false
): MembershipExtension {
  const newEndDate = addDays(currentEndDate, extensionDays);
  const originalDays = differenceInDays(endOfDay(currentEndDate), startOfDay(currentStartDate)) + 1;
  const dailyRate = originalPayment / originalDays;

  const additionalPayment = isComplementary ? 0 : dailyRate * extensionDays;

  // Calculate pro-rata for the extension period
  const proRataCalculation = calculateProRataPayment(
    addDays(currentEndDate, 1),
    newEndDate,
    additionalPayment
  );

  return {
    originalEndDate: currentEndDate,
    newEndDate,
    extensionDays,
    additionalPayment,
    isComplementary,
    proRataCalculation
  };
}

// Calculate partial payment scenarios
export interface PartialPaymentPlan {
  totalAmount: number;
  installments: Array<{
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    description: string;
  }>;
  upfrontAmount: number;
  remainingAmount: number;
  paymentSchedule: string;
}

export function createPartialPaymentPlan(
  totalAmount: number,
  upfrontAmount: number,
  remainingAmount: number,
  paymentStartDate: Date,
  installmentDays: number = 10
): PartialPaymentPlan {
  const installments: PartialPaymentPlan['installments'] = [];

  // Add upfront payment
  installments.push({
    installmentNumber: 1,
    amount: upfrontAmount,
    dueDate: paymentStartDate,
    status: 'PAID',
    description: 'Upfront payment'
  });

  // Add remaining amount as second installment
  if (remainingAmount > 0) {
    installments.push({
      installmentNumber: 2,
      amount: remainingAmount,
      dueDate: addDays(paymentStartDate, installmentDays),
      status: 'PENDING',
      description: `Remaining payment (due in ${installmentDays} days)`
    });
  }

  return {
    totalAmount,
    installments,
    upfrontAmount,
    remainingAmount,
    paymentSchedule: `₹${upfrontAmount} upfront, ₹${remainingAmount} due in ${installmentDays} days`
  };
}

// Early renewal calculations
export interface EarlyRenewalCalculation {
  currentMembershipEnd: Date;
  newMembershipStart: Date;
  newMembershipEnd: Date;
  gapDays: number;
  isAdvancePayment: boolean;
  paymentMonth: string;
  revenueRecognitionMonth: string;
  earlyRenewalDiscount?: number;
}

export function calculateEarlyRenewal(
  currentEndDate: Date,
  renewalDate: Date,
  newDurationDays: number,
  renewalAmount: number,
  earlyRenewalDiscountPercent: number = 0
): EarlyRenewalCalculation {
  const isAdvancePayment = renewalDate < currentEndDate;
  const newStartDate = isAdvancePayment ? addDays(currentEndDate, 1) : renewalDate;
  const newEndDate = addDays(newStartDate, newDurationDays - 1);
  const gapDays = isAdvancePayment ? differenceInDays(newStartDate, renewalDate) : 0;

  const earlyRenewalDiscount = renewalAmount * (earlyRenewalDiscountPercent / 100);

  return {
    currentMembershipEnd: currentEndDate,
    newMembershipStart: newStartDate,
    newMembershipEnd: newEndDate,
    gapDays,
    isAdvancePayment,
    paymentMonth: renewalDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    revenueRecognitionMonth: newStartDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    earlyRenewalDiscount
  };
}

// Membership freeze/pause calculations
export interface MembershipPauseCalculation {
  pauseStartDate: Date;
  pauseEndDate?: Date;
  pauseDays: number;
  originalEndDate: Date;
  adjustedEndDate: Date;
  extensionDays: number;
  dailyRate: number;
  pauseType: 'TEMPORARY' | 'INDEFINITE';
}

export function calculateMembershipPause(
  membershipStartDate: Date,
  originalEndDate: Date,
  pauseStartDate: Date,
  pauseEndDate: Date | undefined,
  totalMembershipAmount: number
): MembershipPauseCalculation {
  const totalOriginalDays = differenceInDays(endOfDay(originalEndDate), startOfDay(membershipStartDate)) + 1;
  const dailyRate = totalMembershipAmount / totalOriginalDays;

  let pauseDays = 0;
  let pauseType: 'TEMPORARY' | 'INDEFINITE' = 'INDEFINITE';

  if (pauseEndDate) {
    pauseDays = differenceInDays(endOfDay(pauseEndDate), startOfDay(pauseStartDate)) + 1;
    pauseType = 'TEMPORARY';
  } else {
    // For indefinite pause, calculate days from pause start to original end
    pauseDays = differenceInDays(endOfDay(originalEndDate), startOfDay(pauseStartDate)) + 1;
  }

  const adjustedEndDate = addDays(originalEndDate, pauseDays);

  return {
    pauseStartDate,
    pauseEndDate,
    pauseDays,
    originalEndDate,
    adjustedEndDate,
    extensionDays: pauseDays,
    dailyRate,
    pauseType
  };
}

// Monthly expense handling with prepaid/outstanding
export interface MonthlyExpenseCalculation {
  month: string;
  year: number;
  actualExpenses: number;
  prepaidExpenses: number;
  outstandingExpenses: number;
  netCashFlow: number;
  accrualAdjustments: number;
}

export function calculateMonthlyExpenses(
  targetMonth: number,
  targetYear: number,
  expenses: Array<{
    amount: number;
    expenseDate: Date;
    actualPaymentDate: Date;
    category: string;
    type: 'REGULAR' | 'PREPAID' | 'OUTSTANDING';
  }>
): MonthlyExpenseCalculation {
  const monthName = new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' });

  let actualExpenses = 0;
  let prepaidExpenses = 0;
  let outstandingExpenses = 0;

  expenses.forEach(expense => {
    const expenseMonth = getMonth(expense.expenseDate) + 1;
    const expenseYear = getYear(expense.expenseDate);
    const paymentMonth = getMonth(expense.actualPaymentDate) + 1;
    const paymentYear = getYear(expense.actualPaymentDate);

    // If expense belongs to target month
    if (expenseMonth === targetMonth && expenseYear === targetYear) {
      if (paymentMonth === targetMonth && paymentYear === targetYear) {
        // Paid in the same month
        actualExpenses += expense.amount;
      } else if (paymentMonth < targetMonth || paymentYear < targetYear) {
        // Paid in advance (prepaid)
        prepaidExpenses += expense.amount;
      } else {
        // To be paid later (outstanding)
        outstandingExpenses += expense.amount;
      }
    }
  });

  const netCashFlow = actualExpenses; // Only count actual cash movements
  const accrualAdjustments = prepaidExpenses + outstandingExpenses;

  return {
    month: `${monthName} ${targetYear}`,
    year: targetYear,
    actualExpenses,
    prepaidExpenses,
    outstandingExpenses,
    netCashFlow,
    accrualAdjustments
  };
}

// Revenue recognition for cross-month memberships
export interface RevenueRecognition {
  membershipId: string;
  totalRevenue: number;
  monthlyAllocations: Array<{
    month: string;
    year: number;
    allocatedRevenue: number;
    days: number;
    percentage: number;
  }>;
  recognitionMethod: 'STRAIGHT_LINE' | 'ACTUAL_DAYS';
}

export function calculateRevenueRecognition(
  membershipId: string,
  startDate: Date,
  endDate: Date,
  totalRevenue: number,
  method: 'STRAIGHT_LINE' | 'ACTUAL_DAYS' = 'ACTUAL_DAYS'
): RevenueRecognition {
  const monthlyAllocations: RevenueRecognition['monthlyAllocations'] = [];

  if (method === 'ACTUAL_DAYS') {
    // Use pro-rata calculation
    const proRata = calculateProRataPayment(startDate, endDate, totalRevenue);

    proRata.monthlyBreakdown.forEach(month => {
      monthlyAllocations.push({
        month: month.month,
        year: month.year,
        allocatedRevenue: month.amount,
        days: month.daysCount,
        percentage: month.percentage
      });
    });
  } else {
    // Straight line method (equal distribution across months)
    const totalMonths = Math.ceil(differenceInDays(endOfDay(endDate), startOfDay(startDate)) / 30);
    const monthlyAmount = totalRevenue / totalMonths;

    let currentDate = new Date(startDate);
    let monthCount = 0;

    while (currentDate <= endDate && monthCount < totalMonths) {
      const month = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const year = getYear(currentDate);

      monthlyAllocations.push({
        month,
        year,
        allocatedRevenue: monthlyAmount,
        days: 30, // Approximate for straight line
        percentage: 100 / totalMonths
      });

      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      monthCount++;
    }
  }

  return {
    membershipId,
    totalRevenue,
    monthlyAllocations,
    recognitionMethod: method
  };
}