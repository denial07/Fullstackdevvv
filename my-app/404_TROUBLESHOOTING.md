# 404 Error Troubleshooting Guide

## Common Causes and Solutions

### 1. **Environment Variables Missing**
The most common cause of 404 errors in deployment is missing environment variables.

**Check these in your Vercel dashboard:**
- Go to your project in Vercel
- Navigate to Settings → Environment Variables
- Ensure ALL these variables are set:

```
MONGODB_URI=mongodb+srv://danie3706f:u6NQ46ppfxRyEI55@fullstackwood.zqczk7k.mongodb.net/test
NEXTAUTH_URL=https://your-actual-vercel-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret-here
JWT_SECRET=your-production-jwt-secret-here
NEXT_PUBLIC_BASE_URL=https://your-actual-vercel-domain.vercel.app
EMAIL_USER=yeexian2007@gmail.com
EMAIL_PASSWORD=iwbn yapr yxgc hqar
GEMINI_API_KEY=AIzaSyD9i0kgc-wOh3OTZmSlcX1eq9mMtM6Ebys
GOOGLE_CLIENT_ID=55719895427-gsfdgtbmai901mp16l4h9ikcg3aroiol.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_REDIRECT_URI=https://your-actual-vercel-domain.vercel.app/api/auth/callback/google
GOOGLE_ACCESS_TOKEN=ya29.a0AS3H6NyJCox-ZLQ5RyH_LtmtjNxEaN8bGctmxN9BLARrLPG66SzNI8J19_zChNF2TanqtqhHE_i0xSMYTQ5MSiS3nywec0MUEJ1DtIanzEqvHaxxFtLAJGqRF5MCqsyM6x0XsQXqmJiX5gb0tya1wXaucgRwwhng8KBn-cfSaCgYKAQMSARESFQHGX2MioyCq_fpm_KfYyOqGkQA27g0175
GOOGLE_REFRESH_TOKEN=1//0gzvzH0OyBYlrCgYIARAAGBASNwF-L9IrS4JfCsgqjnFKya0vxiqzqpNRKRDeQ7BJXZOpBEN-D9_-_zBCwxZxeicsuc9O4-u396Q
```

### 2. **Test Your Deployment**
Visit these URLs to test your deployment:

1. **Health Check**: `https://your-app.vercel.app/api/health`
   - Should return JSON with status information

2. **Homepage**: `https://your-app.vercel.app/`
   - Should load your main dashboard

3. **API Test**: `https://your-app.vercel.app/api/dashboard`
   - Should return dashboard data

### 3. **Common URL Issues**

**Replace `your-app` with your actual Vercel app name in:**
- NEXTAUTH_URL
- NEXT_PUBLIC_BASE_URL  
- GOOGLE_REDIRECT_URI

**Find your actual URL:**
- Go to your Vercel dashboard
- Your app URL is shown at the top (something like `https://my-app-abc123.vercel.app`)

### 4. **Google OAuth Setup**
If login is failing:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Update OAuth 2.0 redirect URIs to include:
   `https://your-actual-domain.vercel.app/api/auth/callback/google`

### 5. **Database Connection**
If API endpoints return errors:
- Verify MongoDB URI is correct
- Ensure your IP is whitelisted in MongoDB Atlas
- Check database name matches your collections

## Quick Fixes

### Fix 1: Redeploy with Environment Variables
```bash
# After setting environment variables in Vercel dashboard
git add .
git commit -m "Update for production deployment"
git push origin main
```

### Fix 2: Force New Deployment
In Vercel dashboard:
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

### Fix 3: Clear Build Cache
Add this to your vercel.json:
```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "regions": ["iad1"],
  "buildCommand": "npm run build"
}
```

## Debugging Steps

1. **Check Vercel Function Logs:**
   - Go to Vercel dashboard → Functions tab
   - Look for error messages

2. **Test Locally First:**
   ```bash
   npm run dev
   # Visit http://localhost:3000
   ```

3. **Check Browser Network Tab:**
   - Open Developer Tools → Network
   - Look for failed requests (red status codes)

4. **Verify Build Success:**
   - Check Vercel deployment logs
   - Ensure no build errors

## Contact Information
If you're still experiencing issues, provide:
- Your Vercel app URL
- Screenshot of the 404 error
- Vercel function logs (if available)
- Browser console errors
