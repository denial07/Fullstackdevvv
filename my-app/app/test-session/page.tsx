"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSession } from '@/components/SessionProvider'

export default function TestSessionPage() {
  const { sessionTimeout, refreshSession, isSessionActive } = useSession()
  const [message, setMessage] = useState('')
  const [lastActivity, setLastActivity] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setLastActivity(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const triggerActivity = () => {
    refreshSession()
    setMessage('Session refreshed!')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Session Timeout Test</CardTitle>
            <CardDescription>
              Test the auto-logout functionality based on session timeout settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-medium">Session Status</h3>
                <p className="text-sm text-gray-600">
                  Active: <span className={isSessionActive ? "text-green-600" : "text-red-600"}>
                    {isSessionActive ? "Yes" : "No"}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Timeout: <span className="font-medium">{sessionTimeout} minutes</span>
                </p>
                <p className="text-sm text-gray-600">
                  Last Activity: <span className="font-mono text-xs">{lastActivity.toLocaleTimeString()}</span>
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="font-medium">Actions</h3>
                <Button onClick={triggerActivity} size="sm">
                  Refresh Session
                </Button>
              </div>
            </div>

            {message && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">How it works:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Auto-logout triggers after {sessionTimeout} minutes of inactivity</li>
                <li>• Activity includes mouse movement, clicks, keyboard input, scrolling</li>
                <li>• When timeout occurs, you&apos;ll be redirected to login page</li>
                <li>• Session timeout can be changed in Settings → Security</li>
                <li>• Try being inactive for {sessionTimeout} minutes to test auto-logout</li>
              </ul>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Note:</strong> The session timeout value from your user settings is: <strong>{sessionTimeout} minutes</strong>. 
                If you stay completely inactive (no mouse movement, clicks, or keyboard input) for this duration, 
                you will be automatically logged out and redirected to the login page.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
