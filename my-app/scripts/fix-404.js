#!/usr/bin/env node

/**
 * 404 Error Fix Script for Vercel Deployment
 * This script helps identify and fix common 404 deployment issues
 */

const fs = require('fs');
const https = require('https');

console.log('🔧 404 Error Diagnosis and Fix Tool\n');

// Get Vercel app URL from user
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function main() {
  console.log('Please provide your Vercel app URL (e.g., https://my-app-abc123.vercel.app)');
  const appUrl = await askQuestion('Vercel URL: ');
  
  if (!appUrl.includes('vercel.app')) {
    console.log('❌ Invalid Vercel URL. Please provide a valid Vercel app URL.');
    rl.close();
    return;
  }

  console.log(`\n🔍 Testing deployment at: ${appUrl}\n`);

  // Test endpoints
  const endpoints = [
    { name: 'Homepage', url: `${appUrl}/` },
    { name: 'Health Check', url: `${appUrl}/api/health` },
    { name: 'Dashboard API', url: `${appUrl}/api/dashboard` },
  ];

  for (const endpoint of endpoints) {
    process.stdout.write(`Testing ${endpoint.name}... `);
    const result = await testUrl(endpoint.url);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
    } else if (result.status === 200) {
      console.log(`✅ Working (${result.status})`);
    } else if (result.status === 404) {
      console.log(`❌ 404 Not Found`);
    } else {
      console.log(`⚠️  Status: ${result.status}`);
    }
  }

  console.log('\n📋 Diagnosis:');
  
  // Check local environment file
  try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    if (envLocal.includes('localhost:3000')) {
      console.log('❌ Issue found: .env.local contains localhost URLs');
      console.log('   Solution: Set production environment variables in Vercel dashboard');
    }
  } catch (error) {
    console.log('⚠️  No .env.local file found (this is normal for production)');
  }

  // Check vercel.json
  if (!fs.existsSync('vercel.json')) {
    console.log('⚠️  No vercel.json found');
  } else {
    console.log('✅ vercel.json exists');
  }

  console.log('\n🛠️  Common Fixes:');
  console.log('1. Set environment variables in Vercel dashboard:');
  console.log(`   - NEXTAUTH_URL=${appUrl}`);
  console.log(`   - NEXT_PUBLIC_BASE_URL=${appUrl}`);
  console.log(`   - GOOGLE_REDIRECT_URI=${appUrl}/api/auth/callback/google`);
  console.log('   - All other variables from .env.local');
  
  console.log('\n2. Update Google OAuth redirect URI:');
  console.log(`   - Add: ${appUrl}/api/auth/callback/google`);
  
  console.log('\n3. If issues persist:');
  console.log('   - Check Vercel function logs in dashboard');
  console.log('   - Redeploy from Vercel dashboard');
  console.log('   - Clear build cache and redeploy');

  console.log('\n📖 For detailed troubleshooting, see: 404_TROUBLESHOOTING.md');
  
  rl.close();
}

main().catch(console.error);
