"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function TwoFactorPage() {
  const [token, setToken] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Get email from URL params or localStorage
    const emailParam = searchParams.get("email")
    const storedEmail = localStorage.getItem("2fa-email")
    
    if (emailParam) {
      setEmail(emailParam)
      localStorage.setItem("2fa-email", emailParam)
    } else if (storedEmail) {
      setEmail(storedEmail)
    } else {
      // No email found, redirect to login
      router.push("/login")
    }
  }, [searchParams, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token.trim()) {
      setError("Please enter your 2FA code")
      return
    }

    if (!email) {
      setError("Email not found. Please login again.")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          token: token.trim()
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Complete the login process
        const loginResponse = await fetch('/api/login/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email
          }),
        })

        const loginData = await loginResponse.json()

        if (loginResponse.ok) {
          // Store user data in localStorage
          localStorage.setItem("user", JSON.stringify(loginData.user))
          
          // Clear 2FA email from localStorage
          localStorage.removeItem("2fa-email")
          
          // Redirect to dashboard
          router.push("/")
        } else {
          setError("Failed to complete login. Please try again.")
        }
      } else {
        setError(data.error || "Invalid 2FA code. Please try again.")
      }
    } catch (error) {
      console.error("2FA verification error:", error)
      setError("Failed to verify 2FA code. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackupCode = () => {
    // Could implement backup code flow here
    setError("Backup codes are entered in the same field. Enter your backup code instead of the 6-digit code.")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Two-Factor Authentication
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Verify Your Identity</CardTitle>
            <CardDescription className="text-center">
              {email && `Verifying for ${email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleVerify} className="space-y-6">
              <div>
                <Label htmlFor="token">Authentication Code</Label>
                <Input
                  id="token"
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="text-center text-lg tracking-widest"
                  maxLength={10} // Allow backup codes which are longer
                  autoComplete="one-time-code"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the 6-digit code from your authenticator app or a backup code
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || !token.trim()}
              >
                {isLoading ? "Verifying..." : "Verify"}
              </Button>
            </form>

            <div className="mt-6 space-y-3">
              <Button 
                variant="outline" 
                className="w-full text-sm" 
                onClick={handleBackupCode}
                type="button"
              >
                Use Backup Code
              </Button>
              
              <div className="text-center">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-600">
          <p>Don&apos;t have access to your authenticator app?</p>
          <p>Contact your administrator for assistance.</p>
        </div>
      </div>
    </div>
  )
}
