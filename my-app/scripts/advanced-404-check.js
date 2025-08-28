#!/usr/bin/env node

/**
 * Advanced 404 Diagnostic Tool
 * Since environment variables are set, let's check other common issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Advanced 404 Diagnostic Tool\n');

// Check for common Next.js App Router issues
function checkAppRouterStructure() {
  console.log('📁 Checking App Router Structure...');
  
  const appDir = path.join(process.cwd(), 'app');
  if (!fs.existsSync(appDir)) {
    console.log('❌ app/ directory not found');
    return false;
  }
  
  // Check for page.tsx in root
  const rootPage = path.join(appDir, 'page.tsx');
  if (!fs.existsSync(rootPage)) {
    console.log('❌ app/page.tsx not found - this is required for root route');
    return false;
  }
  
  // Check for layout.tsx in root
  const rootLayout = path.join(appDir, 'layout.tsx');
  if (!fs.existsSync(rootLayout)) {
    console.log('❌ app/layout.tsx not found - this is required');
    return false;
  }
  
  console.log('✅ Basic App Router structure looks good');
  return true;
}

// Check for API route issues
function checkApiRoutes() {
  console.log('\n🔌 Checking API Routes...');
  
  const apiDir = path.join(process.cwd(), 'app', 'api');
  if (!fs.existsSync(apiDir)) {
    console.log('❌ app/api/ directory not found');
    return false;
  }
  
  // Check critical API routes
  const criticalRoutes = [
    'dashboard/route.ts',
    'health/route.ts',
    'auth',
    'login/route.ts'
  ];
  
  let hasIssues = false;
  for (const route of criticalRoutes) {
    const routePath = path.join(apiDir, route);
    if (!fs.existsSync(routePath)) {
      console.log(`⚠️  ${route} not found`);
      hasIssues = true;
    } else {
      console.log(`✅ ${route} exists`);
    }
  }
  
  return !hasIssues;
}

// Check for TypeScript compilation issues
function checkTypeScriptConfig() {
  console.log('\n📝 Checking TypeScript Configuration...');
  
  const tsConfig = path.join(process.cwd(), 'tsconfig.json');
  if (!fs.existsSync(tsConfig)) {
    console.log('❌ tsconfig.json not found');
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(tsConfig, 'utf8'));
    
    if (!config.compilerOptions) {
      console.log('❌ No compilerOptions in tsconfig.json');
      return false;
    }
    
    if (!config.compilerOptions.moduleResolution) {
      console.log('⚠️  No moduleResolution specified');
    }
    
    console.log('✅ TypeScript config looks good');
    return true;
  } catch (error) {
    console.log(`❌ Error reading tsconfig.json: ${error.message}`);
    return false;
  }
}

// Check for build artifacts
function checkBuildArtifacts() {
  console.log('\n🏗️  Checking Build Artifacts...');
  
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    console.log('❌ .next directory not found - build may have failed');
    return false;
  }
  
  const serverDir = path.join(nextDir, 'server');
  if (!fs.existsSync(serverDir)) {
    console.log('❌ .next/server directory not found');
    return false;
  }
  
  console.log('✅ Build artifacts exist');
  return true;
}

// Check for common deployment issues
function checkDeploymentIssues() {
  console.log('\n🚀 Checking Deployment Configuration...');
  
  // Check package.json scripts
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    if (!pkg.scripts || !pkg.scripts.build) {
      console.log('❌ No build script in package.json');
      return false;
    }
    
    if (!pkg.scripts.start) {
      console.log('❌ No start script in package.json');
      return false;
    }
    
    console.log('✅ Package.json scripts look good');
  }
  
  // Check vercel.json if exists
  const vercelConfig = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelConfig)) {
    try {
      const config = JSON.parse(fs.readFileSync(vercelConfig, 'utf8'));
      console.log('✅ vercel.json exists and is valid JSON');
      
      // Check for potential issues
      if (config.functions && Object.keys(config.functions).length > 0) {
        console.log('✅ Function configuration found');
      }
    } catch (error) {
      console.log(`❌ vercel.json has syntax errors: ${error.message}`);
      return false;
    }
  }
  
  return true;
}

// Check for dependency issues
function checkDependencies() {
  console.log('\n📦 Checking Dependencies...');
  
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  
  // Check for Next.js version
  const nextVersion = pkg.dependencies?.next || pkg.devDependencies?.next;
  if (!nextVersion) {
    console.log('❌ Next.js not found in dependencies');
    return false;
  }
  
  console.log(`✅ Next.js version: ${nextVersion}`);
  
  // Check for React version compatibility
  const reactVersion = pkg.dependencies?.react || pkg.devDependencies?.react;
  if (!reactVersion) {
    console.log('❌ React not found in dependencies');
    return false;
  }
  
  console.log(`✅ React version: ${reactVersion}`);
  return true;
}

// Main diagnostic function
async function runDiagnostics() {
  console.log('Running comprehensive 404 diagnostics...\n');
  
  const checks = [
    { name: 'App Router Structure', fn: checkAppRouterStructure },
    { name: 'API Routes', fn: checkApiRoutes },
    { name: 'TypeScript Config', fn: checkTypeScriptConfig },
    { name: 'Build Artifacts', fn: checkBuildArtifacts },
    { name: 'Deployment Config', fn: checkDeploymentIssues },
    { name: 'Dependencies', fn: checkDependencies },
  ];
  
  const results = [];
  
  for (const check of checks) {
    const result = check.fn();
    results.push({ name: check.name, passed: result });
  }
  
  console.log('\n📊 Summary:');
  let allPassed = true;
  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
    if (!result.passed) allPassed = false;
  }
  
  if (allPassed) {
    console.log('\n🎉 All checks passed! The 404 error might be:');
    console.log('1. A specific route that doesn\'t exist');
    console.log('2. A database connection issue');
    console.log('3. A runtime error in your components');
    console.log('4. A client-side routing issue');
    console.log('\nTo debug further:');
    console.log('- Check Vercel function logs');
    console.log('- Test specific routes individually');
    console.log('- Check browser console for JavaScript errors');
  } else {
    console.log('\n❌ Issues found that may be causing 404 errors.');
    console.log('Fix the failing checks above and redeploy.');
  }
}

runDiagnostics().catch(console.error);
