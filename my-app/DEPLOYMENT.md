# Deployment Guide for Vercel

## Quick Deploy Steps

### 1. Prepare Environment Variables
Copy your current `.env.local` and update these values for production:

```env
# Database - Use your production MongoDB
MONGODB_URI=mongodb+srv://your-production-db

# URLs - Update to your Vercel domain
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_BASE_URL=https://your-app-name.vercel.app
GOOGLE_REDIRECT_URI=https://your-app-name.vercel.app/api/auth/callback/google

# Keep these secure values
JWT_SECRET=your_super_secret_jwt_key_for_production
NEXTAUTH_SECRET=your_nextauth_secret_for_production
EMAIL_USER=yeexian2007@gmail.com
EMAIL_PASSWORD=iwbn yapr yxgc hqar
GEMINI_API_KEY=AIzaSyD9i0kgc-wOh3OTZmSlcX1eq9mMtM6Ebys
GOOGLE_CLIENT_ID=55719895427-gsfdgtbmai901mp16l4h9ikcg3aroiol.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_ACCESS_TOKEN=ya29.a0AS3H6NyJCox-ZLQ5RyH_LtmtjNxEaN8bGctmxN9BLARrLPG66SzNI8J19_zChNF2TanqtqhHE_i0xSMYTQ5MSiS3nywec0MUEJ1DtIanzEqvHaxxFtLAJGqRF5MCqsyM6x0XsQXqmJiX5gb0tya1wXaucgRwwhng8KBn-cfSaCgYKAQMSARESFQHGX2MioyCq_fpm_KfYyOqGkQA27g0175
GOOGLE_REFRESH_TOKEN=1//0gzvzH0OyBYlrCgYIARAAGBASNwF-L9IrS4JfCsgqjnFKya0vxiqzqpNRKRDeQ7BJXZOpBEN-D9_-_zBCwxZxeicsuc9O4-u396Q
```

### 2. Deploy to Vercel

#### Option A: GitHub Integration (Recommended)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and login
3. Click "Import Project" and select your repository
4. Add all environment variables from above
5. Click "Deploy"

#### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

### 3. Post-Deployment Setup
After deployment:
1. Update Google OAuth redirect URI in Google Console
2. Test the application thoroughly
3. Seed production database if needed

## Important Notes
- The app is already optimized for Vercel with the configuration files created
- All API routes will work automatically
- File uploads are configured for Vercel's limits
- MongoDB connections are optimized for serverless

Your app will be available at: `https://your-app-name.vercel.app`
