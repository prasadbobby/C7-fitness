import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "Middleware test successful! This route is publicly accessible.",
    timestamp: new Date().toISOString(),
    url: request.url
  });
}