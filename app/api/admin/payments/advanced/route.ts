import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs';
import prisma from '@/prisma/prisma';
import {
  calculateProRataPayment,
  calculateRefund,
  calculateMembershipExtension,
  createPartialPaymentPlan,
  calculateEarlyRenewal,
  calculateMembershipPause,
  calculateRevenueRecognition,
  PaymentCalculation,
  RefundCalculation
} from '@/utils/advancedPaymentCalculations';

export const dynamic = 'force-dynamic';

// Handle advanced payment calculations
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
      case 'CALCULATE_PRORATA':
        return handleProRataCalculation(data);

      case 'CALCULATE_REFUND':
        return handleRefundCalculation(data);

      case 'PROCESS_PARTIAL_PAYMENT':
        return handlePartialPayment(data, user.id);

      case 'PROCESS_EARLY_RENEWAL':
        return handleEarlyRenewal(data, user.id);

      case 'PROCESS_MEMBERSHIP_PAUSE':
        return handleMembershipPause(data, user.id);

      case 'CALCULATE_CROSS_MONTH_REVENUE':
        return handleCrossMonthRevenue(data);

      case 'PROCESS_COMPLEMENTARY_EXTENSION':
        return handleComplementaryExtension(data, user.id);

      case 'PROCESS_MEMBERSHIP_CANCELLATION':
        return handleMembershipCancellation(data, user.id);

      default:
        return new NextResponse('Invalid action', { status: 400 });
    }

  } catch (error) {
    console.error('Error in advanced payments API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

// Calculate pro-rata payment breakdown
async function handleProRataCalculation(data: {
  startDate: string;
  endDate: string;
  totalAmount: number;
  discountAmount?: number;
}) {
  try {
    const calculation = calculateProRataPayment(
      new Date(data.startDate),
      new Date(data.endDate),
      data.totalAmount,
      data.discountAmount || 0
    );

    return NextResponse.json({
      success: true,
      calculation
    });
  } catch (error) {
    return new NextResponse('Error calculating pro-rata payment', { status: 400 });
  }
}

// Calculate refund for cancelled membership
async function handleRefundCalculation(data: {
  userInfoId: string;
  cancellationDate: string;
  refundPolicyType: 'PROPORTIONAL' | 'POLICY_BASED' | 'NO_REFUND';
}) {
  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: data.userInfoId },
      include: {
        paymentLogs: {
          orderBy: { paymentDate: 'asc' }
        }
      }
    });

    if (!userInfo || !userInfo.membershipStartDate || !userInfo.membershipEndDate) {
      return new NextResponse('Invalid membership data', { status: 400 });
    }

    const totalPaid = userInfo.totalAmountPaid || 0;
    const refundCalculation = calculateRefund(
      userInfo.membershipStartDate,
      userInfo.membershipEndDate,
      new Date(data.cancellationDate),
      totalPaid,
      {
        refundPolicyType: data.refundPolicyType,
        processingFeePercentage: 5, // 5% processing fee
        minimumUsageDays: 7
      }
    );

    return NextResponse.json({
      success: true,
      refundCalculation,
      userInfo: {
        id: userInfo.id,
        membershipStartDate: userInfo.membershipStartDate,
        membershipEndDate: userInfo.membershipEndDate,
        totalPaid
      }
    });
  } catch (error) {
    return new NextResponse('Error calculating refund', { status: 400 });
  }
}

// Process partial payment scenario
async function handlePartialPayment(data: {
  userInfoId: string;
  totalAmount: number;
  upfrontAmount: number;
  installmentDays: number;
  paymentMethod: string;
  notes?: string;
}, adminUserId: string) {
  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: data.userInfoId }
    });

    if (!userInfo) {
      return new NextResponse('User not found', { status: 404 });
    }

    const remainingAmount = data.totalAmount - data.upfrontAmount;
    const paymentPlan = createPartialPaymentPlan(
      data.totalAmount,
      data.upfrontAmount,
      remainingAmount,
      new Date(),
      data.installmentDays
    );

    // Record the upfront payment
    const paymentLog = await prisma.paymentLog.create({
      data: {
        userInfoId: data.userInfoId,
        amount: data.upfrontAmount,
        paymentDate: new Date(),
        paymentMethod: data.paymentMethod as any,
        notes: `Partial payment: ${data.notes || 'Upfront payment'} (${paymentPlan.paymentSchedule})`,
        recordedBy: adminUserId
      }
    });

    // Update payment info
    const updatedUserInfo = await prisma.userInfo.update({
      where: { id: data.userInfoId },
      data: {
        discountedPrice: data.totalAmount,
        totalAmountPaid: { increment: data.upfrontAmount },
        remainingAmount: remainingAmount,
        nextPaymentDue: paymentPlan.installments[1]?.dueDate || null,
        paymentNotes: `Partial payment plan: ${paymentPlan.paymentSchedule}`
      }
    });

    return NextResponse.json({
      success: true,
      paymentPlan,
      paymentLog,
      updatedUserInfo: {
        id: updatedUserInfo.id,
        totalAmountPaid: updatedUserInfo.totalAmountPaid,
        remainingAmount: updatedUserInfo.remainingAmount,
        nextPaymentDue: updatedUserInfo.nextPaymentDue
      }
    });
  } catch (error) {
    console.error('Error processing partial payment:', error);
    return new NextResponse('Error processing partial payment', { status: 400 });
  }
}

// Process early renewal
async function handleEarlyRenewal(data: {
  userInfoId: string;
  renewalAmount: number;
  newDurationDays: number;
  paymentMethod: string;
  earlyDiscountPercent?: number;
  notes?: string;
}, adminUserId: string) {
  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: data.userInfoId }
    });

    if (!userInfo || !userInfo.membershipEndDate) {
      return new NextResponse('Invalid membership data', { status: 400 });
    }

    const renewalCalculation = calculateEarlyRenewal(
      userInfo.membershipEndDate,
      new Date(),
      data.newDurationDays,
      data.renewalAmount,
      data.earlyDiscountPercent || 0
    );

    const finalAmount = data.renewalAmount - (renewalCalculation.earlyRenewalDiscount || 0);

    // Record the renewal payment
    const paymentLog = await prisma.paymentLog.create({
      data: {
        userInfoId: data.userInfoId,
        amount: finalAmount,
        paymentDate: new Date(),
        paymentMethod: data.paymentMethod as any,
        notes: `Early renewal: ${data.notes || ''} (${renewalCalculation.isAdvancePayment ? 'Advance payment' : 'Regular renewal'})`,
        recordedBy: adminUserId
      }
    });

    // Update membership dates
    const updatedUserInfo = await prisma.userInfo.update({
      where: { id: data.userInfoId },
      data: {
        membershipEndDate: renewalCalculation.newMembershipEnd,
        membershipDuration: { increment: data.newDurationDays },
        totalAmountPaid: { increment: finalAmount },
        paymentNotes: `Early renewal - Revenue recognition from ${renewalCalculation.revenueRecognitionMonth}`
      }
    });

    // Log membership change
    await prisma.membershipLog.create({
      data: {
        userInfoId: data.userInfoId,
        changeType: 'RENEWAL',
        previousEndDate: userInfo.membershipEndDate,
        newEndDate: renewalCalculation.newMembershipEnd,
        previousDuration: userInfo.membershipDuration,
        newDuration: (userInfo.membershipDuration || 0) + data.newDurationDays,
        changeDate: new Date(),
        notes: `Early renewal with ${renewalCalculation.gapDays} gap days. ${renewalCalculation.isAdvancePayment ? 'Advance payment processed.' : ''}`,
        recordedBy: adminUserId
      }
    });

    return NextResponse.json({
      success: true,
      renewalCalculation,
      paymentLog,
      finalAmount,
      updatedUserInfo: {
        id: updatedUserInfo.id,
        membershipEndDate: updatedUserInfo.membershipEndDate,
        totalAmountPaid: updatedUserInfo.totalAmountPaid
      }
    });
  } catch (error) {
    console.error('Error processing early renewal:', error);
    return new NextResponse('Error processing early renewal', { status: 400 });
  }
}

// Process membership pause/freeze
async function handleMembershipPause(data: {
  userInfoId: string;
  pauseStartDate: string;
  pauseEndDate?: string;
  pauseReason: string;
  adjustEndDate: boolean;
}, adminUserId: string) {
  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: data.userInfoId }
    });

    if (!userInfo || !userInfo.membershipStartDate || !userInfo.membershipEndDate) {
      return new NextResponse('Invalid membership data', { status: 400 });
    }

    const pauseCalculation = calculateMembershipPause(
      userInfo.membershipStartDate,
      userInfo.membershipEndDate,
      new Date(data.pauseStartDate),
      data.pauseEndDate ? new Date(data.pauseEndDate) : undefined,
      userInfo.discountedPrice || 0
    );

    // Update membership with pause information
    const updatedUserInfo = await prisma.userInfo.update({
      where: { id: data.userInfoId },
      data: {
        membershipStatus: 'PAUSED',
        pausedFrom: new Date(data.pauseStartDate),
        pausedUntil: data.pauseEndDate ? new Date(data.pauseEndDate) : null,
        pauseReason: data.pauseReason,
        totalPausedDays: { increment: pauseCalculation.pauseDays },
        membershipEndDate: data.adjustEndDate ? pauseCalculation.adjustedEndDate : userInfo.membershipEndDate,
        membershipNotes: `Membership paused from ${data.pauseStartDate}${data.pauseEndDate ? ` to ${data.pauseEndDate}` : ' (indefinite)'}`
      }
    });

    // Log membership change
    await prisma.membershipLog.create({
      data: {
        userInfoId: data.userInfoId,
        changeType: 'PAUSE',
        previousStatus: userInfo.membershipStatus,
        newStatus: 'PAUSED',
        previousEndDate: userInfo.membershipEndDate,
        newEndDate: data.adjustEndDate ? pauseCalculation.adjustedEndDate : userInfo.membershipEndDate,
        changeDate: new Date(),
        notes: `Membership paused: ${data.pauseReason}. ${data.adjustEndDate ? `End date extended by ${pauseCalculation.pauseDays} days.` : 'No adjustment to end date.'}`,
        recordedBy: adminUserId
      }
    });

    return NextResponse.json({
      success: true,
      pauseCalculation,
      updatedUserInfo: {
        id: updatedUserInfo.id,
        membershipStatus: updatedUserInfo.membershipStatus,
        pausedFrom: updatedUserInfo.pausedFrom,
        pausedUntil: updatedUserInfo.pausedUntil,
        membershipEndDate: updatedUserInfo.membershipEndDate,
        totalPausedDays: updatedUserInfo.totalPausedDays
      }
    });
  } catch (error) {
    console.error('Error processing membership pause:', error);
    return new NextResponse('Error processing membership pause', { status: 400 });
  }
}

// Calculate cross-month revenue recognition
async function handleCrossMonthRevenue(data: {
  userInfoId: string;
  method?: 'STRAIGHT_LINE' | 'ACTUAL_DAYS';
}) {
  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: data.userInfoId }
    });

    if (!userInfo || !userInfo.membershipStartDate || !userInfo.membershipEndDate) {
      return new NextResponse('Invalid membership data', { status: 400 });
    }

    const revenueRecognition = calculateRevenueRecognition(
      userInfo.id,
      userInfo.membershipStartDate,
      userInfo.membershipEndDate,
      userInfo.discountedPrice || 0,
      data.method || 'ACTUAL_DAYS'
    );

    return NextResponse.json({
      success: true,
      revenueRecognition,
      userInfo: {
        id: userInfo.id,
        membershipStartDate: userInfo.membershipStartDate,
        membershipEndDate: userInfo.membershipEndDate,
        totalRevenue: userInfo.discountedPrice
      }
    });
  } catch (error) {
    return new NextResponse('Error calculating revenue recognition', { status: 400 });
  }
}

// Process complementary extension
async function handleComplementaryExtension(data: {
  userInfoId: string;
  extensionDays: number;
  reason: string;
}, adminUserId: string) {
  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: data.userInfoId }
    });

    if (!userInfo || !userInfo.membershipStartDate || !userInfo.membershipEndDate) {
      return new NextResponse('Invalid membership data', { status: 400 });
    }

    const extensionCalculation = calculateMembershipExtension(
      userInfo.membershipStartDate,
      userInfo.membershipEndDate,
      data.extensionDays,
      userInfo.discountedPrice || 0,
      true // isComplementary
    );

    // Update membership
    const updatedUserInfo = await prisma.userInfo.update({
      where: { id: data.userInfoId },
      data: {
        membershipEndDate: extensionCalculation.newEndDate,
        membershipDuration: { increment: data.extensionDays },
        membershipNotes: `Extended by ${data.extensionDays} days (complementary) - ${data.reason}`
      }
    });

    // Log membership change
    await prisma.membershipLog.create({
      data: {
        userInfoId: data.userInfoId,
        changeType: 'EXTENSION',
        previousEndDate: userInfo.membershipEndDate,
        newEndDate: extensionCalculation.newEndDate,
        previousDuration: userInfo.membershipDuration,
        newDuration: (userInfo.membershipDuration || 0) + data.extensionDays,
        changeDate: new Date(),
        notes: `Complementary extension: ${data.reason}. No additional payment required.`,
        recordedBy: adminUserId
      }
    });

    return NextResponse.json({
      success: true,
      extensionCalculation,
      updatedUserInfo: {
        id: updatedUserInfo.id,
        membershipEndDate: updatedUserInfo.membershipEndDate,
        membershipDuration: updatedUserInfo.membershipDuration
      }
    });
  } catch (error) {
    console.error('Error processing complementary extension:', error);
    return new NextResponse('Error processing complementary extension', { status: 400 });
  }
}

// Process membership cancellation with refund
async function handleMembershipCancellation(data: {
  userInfoId: string;
  cancellationDate: string;
  cancellationReason: string;
  refundPolicyType: 'PROPORTIONAL' | 'POLICY_BASED' | 'NO_REFUND';
  processRefund: boolean;
}, adminUserId: string) {
  try {
    const userInfo = await prisma.userInfo.findUnique({
      where: { id: data.userInfoId },
      include: {
        paymentLogs: true
      }
    });

    if (!userInfo || !userInfo.membershipStartDate || !userInfo.membershipEndDate) {
      return new NextResponse('Invalid membership data', { status: 400 });
    }

    const refundCalculation = calculateRefund(
      userInfo.membershipStartDate,
      userInfo.membershipEndDate,
      new Date(data.cancellationDate),
      userInfo.totalAmountPaid || 0,
      {
        refundPolicyType: data.refundPolicyType,
        processingFeePercentage: 5,
        minimumUsageDays: 7
      }
    );

    // Update membership status
    const updatedUserInfo = await prisma.userInfo.update({
      where: { id: data.userInfoId },
      data: {
        membershipStatus: 'CANCELLED',
        membershipNotes: `Cancelled on ${data.cancellationDate} - ${data.cancellationReason}`,
        remainingAmount: 0 // Clear remaining amount since membership is cancelled
      }
    });

    // Process refund if requested and eligible
    let refundLog = null;
    if (data.processRefund && refundCalculation.netRefund > 0) {
      refundLog = await prisma.paymentLog.create({
        data: {
          userInfoId: data.userInfoId,
          amount: -refundCalculation.netRefund, // Negative amount for refund
          paymentDate: new Date(),
          paymentMethod: 'CASH', // Assuming cash refund
          notes: `Refund for cancelled membership. Refund calculation: ₹${refundCalculation.eligibleRefund} eligible - ₹${refundCalculation.processingFee} processing fee = ₹${refundCalculation.netRefund} net refund`,
          recordedBy: adminUserId
        }
      });

      // Update total paid amount
      await prisma.userInfo.update({
        where: { id: data.userInfoId },
        data: {
          totalAmountPaid: { decrement: refundCalculation.netRefund }
        }
      });
    }

    // Log membership change
    await prisma.membershipLog.create({
      data: {
        userInfoId: data.userInfoId,
        changeType: 'CANCELLATION',
        previousStatus: userInfo.membershipStatus,
        newStatus: 'CANCELLED',
        changeDate: new Date(),
        notes: `Membership cancelled: ${data.cancellationReason}. ${refundCalculation.netRefund > 0 ? `Refund processed: ₹${refundCalculation.netRefund}` : 'No refund processed.'}`,
        recordedBy: adminUserId
      }
    });

    return NextResponse.json({
      success: true,
      refundCalculation,
      refundLog,
      updatedUserInfo: {
        id: updatedUserInfo.id,
        membershipStatus: updatedUserInfo.membershipStatus,
        totalAmountPaid: data.processRefund ? (userInfo.totalAmountPaid || 0) - refundCalculation.netRefund : userInfo.totalAmountPaid
      }
    });
  } catch (error) {
    console.error('Error processing membership cancellation:', error);
    return new NextResponse('Error processing membership cancellation', { status: 400 });
  }
}