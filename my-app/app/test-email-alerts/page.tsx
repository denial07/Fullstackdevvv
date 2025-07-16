"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw, Mail } from "lucide-react"

export default function TestEmailAlertsPage() {
  const [email, setEmail] = useState("manager@palletworks.sg")
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    message?: string;
    emailSent?: boolean;
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const testEmailAlert = async () => {
    if (!email.trim()) {
      setResult({ error: "Please enter an email" })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      // Simulate a login from a new device to trigger email alert
      const response = await fetch('/api/login-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Random IP
          userAgent: `Test Browser Email Alert - ${new Date().getTime()}` // Unique user agent
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          emailSent: data.newDevice // Email is sent when new device is detected
        })
      } else {
        setResult({
          error: data.error || "Failed to test email alert"
        })
      }
    } catch (error) {
      console.error("Email alert test error:", error)
      setResult({
        error: "Failed to test email alert. Please try again."
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
            📧 Email Login Alerts Test
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Test email notifications for new device logins
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Test Email Login Alerts
            </CardTitle>
            <CardDescription>
              This will simulate a login from a new device and send an email alert if login alerts are enabled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="email">User Email to Test</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email to test email alerts"
              />
            </div>

            <Button 
              onClick={testEmailAlert}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              {isLoading ? "Sending Email Alert..." : "Test Email Alert"}
            </Button>

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
                  ) : (
                    <div>
                      <strong>✅ Email Alert Test Result:</strong><br />
                      {result.message}<br />
                      {result.emailSent ? (
                        <span className="text-blue-600">📧 Email notification sent to {email}</span>
                      ) : (
                        <span className="text-yellow-600">📴 No email sent (trusted device or alerts disabled)</span>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>📧 How email alerts work:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Login alerts must be <strong>enabled</strong> in user settings</li>
                <li>Email is sent only for <strong>new devices/IP addresses</strong></li>
                <li>Trusted devices don&apos;t trigger email alerts</li>
                <li>Each test generates a new random IP to simulate new device</li>
                <li>Check your email inbox for the security alert</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p><strong>🔧 Email Configuration:</strong></p>
                <p className="mt-1 text-xs">
                  Emails are sent using Gmail SMTP with the credentials configured in .env.local
                </p>
                <p className="mt-1 text-xs">
                  <strong>Note:</strong> Make sure you&apos;re using an App Password for Gmail, not your regular password
                </p>
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p><strong>📝 To test the complete flow:</strong></p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>Go to <a href="/settings" className="text-blue-600 underline">Settings</a> and enable login alerts</li>
                  <li>Come back here and test with your email</li>
                  <li>Check your email inbox for the security alert</li>
                  <li>Try logging in from an incognito/private window to test real scenarios</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
