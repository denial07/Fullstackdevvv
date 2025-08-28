// Simple test route to debug 404 issues
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      message: 'Test route is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL ? 'true' : 'false',
      urls: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
        NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'not set'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ method: 'POST', working: true });
}
