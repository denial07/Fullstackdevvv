// Health check endpoint for deployment testing
import { NextResponse } from 'next/server';

export async function GET() {
  const envVars = {
    MONGODB_URI: process.env.MONGODB_URI ? '✅ Set' : '❌ Missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ Set' : '❌ Missing',
  };

  const timestamp = new Date().toISOString();
  
  return NextResponse.json({
    status: 'healthy',
    timestamp,
    environment: process.env.NODE_ENV,
    nextjsVersion: process.env.npm_package_version,
    runtime: 'nodejs',
    envVars,
    message: 'API is working correctly'
  }, { status: 200 });
}
