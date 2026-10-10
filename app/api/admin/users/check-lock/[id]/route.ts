import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/prisma/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if user is locked in our database
    const userInfo = await prisma.userInfo.findUnique({
      where: { userId: id },
      select: { locked: true }
    });

    return NextResponse.json({
      locked: userInfo?.locked || false
    });

  } catch (error) {
    console.error('Error checking lock status:', error);
    return NextResponse.json(
      { locked: false }, // Default to not locked if error
      { status: 500 }
    );
  }
}