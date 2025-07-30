"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

export default function GmailSetupPage() {
  const searchParams = useSearchParams()
  const [authUrl, setAuthUrl] = useState('')
  const [authCode, setAuthCode] = useState('')
  const [tokens, setTokens] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Check if tokens were passed via URL parameters (from callback)
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (error) {
      toast.error('Authorization failed', {
        description: error
      })
    } else if (success && accessToken && refreshToken) {
      setTokens({
        accessToken,
        refreshToken,
        success: true
      })
      toast.success('Tokens received! Copy them to your .env.local file.')
    }
  }, [searchParams])

  const getAuthUrl = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/gmail/auth')
      const data = await response.json()
      
      if (data.success) {
        setAuthUrl(data.authUrl)
        toast.success('Auth URL generated! Click the link below.')
      } else {
        toast.error(data.error || 'Failed to generate auth URL')
      }
    } catch (error) {
      toast.error('Failed to generate auth URL')
    } finally {
      setLoading(false)
    }
  }

  const exchangeCode = async () => {
    if (!authCode.trim()) {
      toast.error('Please enter the authorization code')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/gmail/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authCode.trim() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTokens(data)
        toast.success('Tokens generated! Copy them to your .env.local file.')
      } else {
        toast.error(data.error || 'Failed to exchange code for tokens')
      }
    } catch (error) {
      toast.error('Failed to exchange code for tokens')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Gmail API Setup</h1>
          <p className="text-gray-600">Get your Gmail API access tokens to enable email fetching</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Generate Auth URL */}
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Generate Authorization URL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Click the button below to generate an authorization URL for Gmail API access.
              </p>
              <Button onClick={getAuthUrl} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Auth URL'}
              </Button>
              
              {authUrl && (
                <div className="space-y-2">
                  <Label>Authorization URL:</Label>
                  <div className="p-3 bg-gray-100 rounded border text-sm">
                    <a 
                      href={authUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline break-all"
                    >
                      {authUrl}
                    </a>
                  </div>
                  <p className="text-xs text-gray-500">
                    Click the link above to authorize the application. You'll be redirected to Google's consent screen.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Enter Authorization Code */}
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Enter Authorization Code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="authCode">Authorization Code</Label>
                <Input
                  id="authCode"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Paste the authorization code from Google here..."
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  After authorizing, Google will redirect you. Copy the 'code' parameter from the URL and paste it above.
                </p>
              </div>
              <Button onClick={exchangeCode} disabled={loading || !authCode.trim()}>
                {loading ? 'Exchanging...' : 'Get Access Tokens'}
              </Button>
            </CardContent>
          </Card>

          {/* Step 3: Copy Tokens */}
          {tokens && (
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Update Environment Variables</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Copy these values to your <code className="bg-gray-200 px-1 rounded">.env.local</code> file:
                </p>
                <div className="space-y-2">
                  <Label>Environment Variables:</Label>
                  <Textarea
                    value={`GOOGLE_ACCESS_TOKEN=${tokens.accessToken}
GOOGLE_REFRESH_TOKEN=${tokens.refreshToken}`}
                    readOnly
                    className="font-mono text-sm h-20"
                  />
                </div>
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Replace the placeholder values in your .env.local file with the tokens above, 
                    then restart your development server for the changes to take effect.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>1.</strong> Click "Generate Auth URL" above</p>
                <p><strong>2.</strong> Visit the generated URL and sign in to your Google account</p>
                <p><strong>3.</strong> Grant permissions for Gmail access</p>
                <p><strong>4.</strong> Copy the authorization code from the redirect URL</p>
                <p><strong>5.</strong> Paste the code above and click "Get Access Tokens"</p>
                <p><strong>6.</strong> Copy the generated tokens to your .env.local file</p>
                <p><strong>7.</strong> Restart your development server</p>
                <p><strong>8.</strong> Your "Get Gmail" button should now work!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
