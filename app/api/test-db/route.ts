import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET() {
  try {
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;

    // Test actual table query
    const userCount = await prisma.userInfo.count();

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      testQuery: result,
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Database connection error:", error);
    return NextResponse.json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorType: error.constructor.name,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}