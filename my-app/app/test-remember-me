"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestRememberMePage() {
  const [latestEmail, setLatestEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchLatestEmail = async () => {
    setIsLoading(true)
    setMessage('')
    
    try {
      const response = await fetch('/api/latest-email')
      const data = await response.json()
      
      if (response.ok) {
        setLatestEmail(data.email || 'No email found')
        setMessage(`✅ Latest email: ${data.email || 'None'}`)
      } else {
        setMessage(`❌ Error: ${data.error || 'Failed to fetch'}`)
      }
    } catch {
      setMessage('❌ Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const checkLocalStorage = () => {
    const rememberMe = localStorage.getItem('rememberMe')
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    
    setMessage(`LocalStorage - Remember Me: ${rememberMe}, Email: ${rememberedEmail || 'None'}`)
  }

  const clearLocalStorage = () => {
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('rememberedEmail')
    setMessage('✅ LocalStorage cleared')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Remember Me Functionality</CardTitle>
            <CardDescription>
              Test the remember me feature and latest email API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button onClick={fetchLatestEmail} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Fetch Latest Email'}
                </Button>
                <Button onClick={checkLocalStorage} variant="outline">
                  Check LocalStorage
                </Button>
                <Button onClick={clearLocalStorage} variant="destructive">
                  Clear LocalStorage
                </Button>
              </div>

              {latestEmail && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    <strong>Latest Email from DB:</strong> {latestEmail}
                  </p>
                </div>
              )}

              {message && (
                <Alert className={message.includes('✅') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                  <AlertDescription className={message.includes('✅') ? 'text-green-800' : 'text-red-800'}>
                    {message}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">How Remember Me Works:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>1. On login page, check &quot;Remember me&quot; checkbox</li>
                <li>2. Email field automatically fills with latest email from database</li>
                <li>3. After successful login, email is saved to localStorage</li>
                <li>4. Next time you visit login page, email is auto-filled</li>
                <li>5. Unchecking &quot;Remember me&quot; clears saved email</li>
              </ul>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Test Steps:</strong><br/>
                1. Click &quot;Fetch Latest Email&quot; to see the most recent user email<br/>
                2. Go to <a href="/login" className="text-blue-600 underline">/login</a> page<br/>
                3. Check &quot;Remember me&quot; checkbox - email should auto-fill<br/>
                4. Login successfully and return here<br/>
                5. Click &quot;Check LocalStorage&quot; to verify email is saved
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
