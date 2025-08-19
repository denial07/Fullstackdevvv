/**
 * Quick script to get Gmail API access tokens for testing
 * Run this file to get your access and refresh tokens
 */

const { google } = require('googleapis');

const CLIENT_ID = '55719895427-gsfdgtbmai901mp16l4h9ikcg3aroiol.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/api/auth/callback/google';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.modify'
];

const auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

// Generate the authentication URL
const authUrl = auth.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent'
});

console.log('🔗 Visit this URL to authorize the application:');
console.log(authUrl);
console.log('\n📋 After authorization, you\'ll get a code. Run:');
console.log('node scripts/get-gmail-tokens.js YOUR_AUTHORIZATION_CODE');

// If authorization code is provided as argument
const authCode = process.argv[2];
if (authCode) {
  auth.getAccessToken(authCode, (err, token) => {
    if (err) {
      console.error('❌ Error retrieving access token:', err);
      return;
    }
    
    console.log('\n✅ Success! Add these to your .env.local file:');
    console.log(`GOOGLE_ACCESS_TOKEN=${token.access_token}`);
    console.log(`GOOGLE_REFRESH_TOKEN=${token.refresh_token}`);
  });
}
