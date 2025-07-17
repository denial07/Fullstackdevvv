"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestSessionTimeoutPage() {
  const [sessionTimeout, setSessionTimeout] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentTimeout, setCurrentTimeout] = useState<number | null>(null)

  const loadCurrentTimeout = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      
      if (response.ok) {
        setCurrentTimeout(data.user.sessionTimeout || 30)
        setMessage(`✅ Current session timeout: ${data.user.sessionTimeout || 30} minutes`)
      } else {
        setMessage('❌ Failed to load current session timeout')
      }
    } catch {
      setMessage('❌ Error loading session timeout')
    } finally {
      setIsLoading(false)
    }
  }

  const saveSessionTimeout = async () => {
    if (!sessionTimeout.trim()) {
      setMessage('Please enter a session timeout value')
      return
    }

    const timeoutValue = parseInt(sessionTimeout)
    if (isNaN(timeoutValue) || timeoutValue < 5 || timeoutValue > 1440) {
      setMessage('Session timeout must be between 5 and 1440 minutes')
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/user/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionTimeout: timeoutValue,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(`✅ Session timeout saved successfully: ${timeoutValue} minutes`)
        setCurrentTimeout(timeoutValue)
        setSessionTimeout('')
      } else {
        setMessage(`❌ Failed to save: ${data.error || 'Unknown error'}`)
      }
    } catch {
      setMessage('❌ Error saving session timeout')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Session Timeout</CardTitle>
            <CardDescription>
              Test saving session timeout values to the database
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Button onClick={loadCurrentTimeout} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Load Current Session Timeout'}
              </Button>
              
              {currentTimeout !== null && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800">
                    Current session timeout in database: <strong>{currentTimeout} minutes</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="sessionTimeout" className="text-sm font-medium">
                  New Session Timeout (minutes)
                </label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={sessionTimeout}
                  onChange={(e) => setSessionTimeout(e.target.value)}
                  placeholder="Enter timeout in minutes (5-1440)"
                  min="5"
                  max="1440"
                />
                <p className="text-xs text-gray-500">
                  Valid range: 5 to 1440 minutes (24 hours)
                </p>
              </div>
              
              <Button onClick={saveSessionTimeout} disabled={isLoading || !sessionTimeout.trim()}>
                {isLoading ? 'Saving...' : 'Save Session Timeout'}
              </Button>
            </div>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}

            <div className="space-y-2">
              <h3 className="font-medium">Test Values:</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSessionTimeout('15')}
                >
                  15 min
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSessionTimeout('30')}
                >
                  30 min
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSessionTimeout('60')}
                >
                  60 min
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSessionTimeout('120')}
                >
                  120 min
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSessionTimeout('480')}
                >
                  480 min
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSessionTimeout('1440')}
                >
                  1440 min
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
