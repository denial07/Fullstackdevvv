import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await auth.getToken(code);

    return NextResponse.json({
      success: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      message: 'Add these tokens to your .env.local file'
    });
  } catch (error: any) {
    console.error('❌ Token Exchange Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to exchange authorization code for tokens',
        details: error.message
      },
      { status: 500 }
    );
  }
}
