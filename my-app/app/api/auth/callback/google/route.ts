import { NextResponse } from 'next/server'
import { google } from 'googleapis'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    
    if (error) {
      return NextResponse.redirect(`/gmail-setup?error=${encodeURIComponent(error)}`)
    }
    
    if (!code) {
      return NextResponse.redirect('/gmail-setup?error=No authorization code received')
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    )

    try {
      const { tokens } = await auth.getToken(code)
      
      // Redirect to setup page with tokens
      const redirectUrl = new URL('/gmail-setup', request.url)
      redirectUrl.searchParams.set('access_token', tokens.access_token || '')
      redirectUrl.searchParams.set('refresh_token', tokens.refresh_token || '')
      redirectUrl.searchParams.set('success', 'true')
      
      return NextResponse.redirect(redirectUrl.toString())
    } catch (tokenError: any) {
      console.error('Token exchange error:', tokenError)
      return NextResponse.redirect(`/gmail-setup?error=${encodeURIComponent('Failed to exchange code for tokens')}`)
    }
  } catch (error: any) {
    console.error('Callback error:', error)
    return NextResponse.redirect(`/gmail-setup?error=${encodeURIComponent('Callback processing failed')}`)
  }
}
