/**
 * Common 404 Issues Beyond Environment Variables
 * Run this to identify the specific problem
 */

// Check if MongoDB connection is working
async function testDatabaseConnection() {
  try {
    const response = await fetch('/api/test-db');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Database connection working:', data);
      return true;
    } else {
      console.log('❌ Database connection failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Database test error:', error.message);
    return false;
  }
}

// Check if basic API routes work
async function testApiRoutes() {
  const routes = [
    '/api/test',
    '/api/health', 
    '/api/dashboard'
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(route);
      console.log(`${route}: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${route}: Error - ${error.message} ❌`);
    }
  }
}

// Check if pages load correctly
async function testPageRoutes() {
  const routes = [
    '/',
    '/login',
    '/dashboard'
  ];
  
  for (const route of routes) {
    try {
      const response = await fetch(route);
      console.log(`${route}: ${response.status} ${response.ok ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`${route}: Error - ${error.message} ❌`);
    }
  }
}

// Run all tests
async function runTests() {
  console.log('🧪 Testing deployment...\n');
  
  console.log('1. Testing API routes:');
  await testApiRoutes();
  
  console.log('\n2. Testing database connection:');
  await testDatabaseConnection();
  
  console.log('\n3. Testing page routes:');
  await testPageRoutes();
  
  console.log('\n📋 If all tests pass but you still get 404:');
  console.log('- Check specific URL that\'s failing');
  console.log('- Check browser console for JavaScript errors');
  console.log('- Check Vercel function logs');
  console.log('- Verify the route actually exists');
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  window.runDeploymentTests = runTests;
  console.log('Run window.runDeploymentTests() to test your deployment');
}
