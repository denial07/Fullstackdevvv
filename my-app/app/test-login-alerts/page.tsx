"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export default function LoginAlertsTestPage() {
  const [email, setEmail] = useState("manager@palletworks.sg")
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
    newDevice?: boolean;
    deviceId?: string;
    userInfo?: boolean;
    user?: {
      email?: string;
      loginAlerts?: boolean;
      twoFactorEnabled?: boolean;
      name?: string;
      id?: string;
    };
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testLoginAlert = async () => {
    if (!email.trim()) {
      setResult({ error: "Please enter an email" })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/login-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          ipAddress: '192.168.1.999', // Fake IP to force new device detection
          userAgent: `Test Browser - ${new Date().getTime()}` // Unique user agent each time
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          ...data
        })
      } else {
        setResult({
          error: data.error || "Failed to test login alert"
        })
      }
    } catch (error) {
      console.error("Login alert test error:", error)
      setResult({
        error: "Failed to test login alert. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const checkUserDevices = async () => {
    if (!email.trim()) {
      setResult({ error: "Please enter an email" })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          userInfo: true,
          user: data.user
        })
      } else {
        setResult({
          error: data.error || "Failed to fetch user info"
        })
      }
    } catch (error) {
      console.error("User fetch error:", error)
      setResult({
        error: "Failed to fetch user info. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Login Alerts Test Page
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Test the login alerts functionality
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Test Login Alerts</CardTitle>
            <CardDescription>
              This page helps you test if login alerts are working correctly
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email">Test Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email to test"
              />
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={testLoginAlert}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                Test New Device Alert
              </Button>

              <Button 
                onClick={checkUserDevices}
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                Check User Info
              </Button>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Database Verification</h3>
              <p className="text-sm text-gray-600 mb-3">
                Use these buttons to verify the database state after toggling login alerts in settings.
              </p>
              <div className="flex space-x-2">
                <Button 
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      // Just show a message since we can't directly run scripts from frontend
                      setResult({ 
                        success: true, 
                        message: "To verify database state, run: node scripts/test-security-update.js in terminal" 
                      });
                    } catch (err) {
                      console.error("Error:", err);
                      setResult({ error: "Could not show verification instructions" });
                    }
                    setIsLoading(false);
                  }}
                  disabled={isLoading}
                  variant="secondary"
                  size="sm"
                >
                  Verify DB State
                </Button>
              </div>
            </div>

            {result && (
              <Alert className={result.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
                {result.error ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <AlertDescription className={result.error ? "text-red-800" : "text-green-800"}>
                  {result.error ? (
                    result.error
                  ) : result.userInfo ? (
                    <div>
                      <strong>User Info:</strong><br />
                      Email: {result.user?.email}<br />
                      Login Alerts: {result.user?.loginAlerts ? 'Enabled' : 'Disabled'}<br />
                      2FA Enabled: {result.user?.twoFactorEnabled ? 'Yes' : 'No'}
                    </div>
                  ) : (
                    <div>
                      <strong>Login Alert Test Result:</strong><br />
                      Message: {result.message}<br />
                      New Device: {result.newDevice ? 'Yes' : 'No'}<br />
                      {result.deviceId && `Device ID: ${result.deviceId}`}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>How to test login alerts:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Make sure you have a user account with login alerts enabled</li>
                <li>Click &quot;Test New Device Alert&quot; to simulate a login from a new device</li>
                <li>Check the browser console and terminal for login alert messages</li>
                <li>Try logging in from an incognito/private window to test real scenarios</li>
                <li>Each new device should trigger an email alert (currently logged to console)</li>
              </ol>
              
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p><strong>⚠️ Important - Login Alerts Toggle Issue:</strong></p>
                <p className="mt-1">
                  The login alerts toggle in Settings now auto-saves when changed. 
                  Previously, you had to click &quot;Save Security Settings&quot; button 
                  after toggling for changes to persist to the database.
                </p>
                <p className="mt-2 text-xs">
                  To verify database state manually, run: <code>node scripts/test-security-update.js</code>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
