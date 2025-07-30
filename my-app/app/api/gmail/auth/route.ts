import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

export async function GET() {
  try {
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });

    return NextResponse.json({
      success: true,
      authUrl,
      message: 'Visit the authUrl to get your authorization code'
    });
  } catch (error: any) {
    console.error('❌ OAuth Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate auth URL',
        details: error.message
      },
      { status: 500 }
    );
  }
}
