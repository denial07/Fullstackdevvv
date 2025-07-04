"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [isValidToken, setIsValidToken] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  const token = searchParams.get('token')
  const email = searchParams.get('email')

  // Check token validity and get expiry time
  useEffect(() => {
    if (!token || !email) {
      setIsValidToken(false)
      setError("Invalid reset link. Please request a new password reset.")
      return
    }

    const validateToken = async () => {
      try {
        const response = await fetch(`/api/reset-password/validate?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
        const data = await response.json()

        if (response.ok && data.isValid) {
          setTimeRemaining(data.timeRemaining)
        } else {
          setIsValidToken(false)
          setError(data.error || "Reset link has expired or is invalid")
        }
      } catch (error) {
        console.error("Token validation error:", error)
        setIsValidToken(false)
        setError("Failed to validate reset link")
      }
    }

    validateToken()
  }, [token, email])

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev === null || prev <= 1000) {
          setIsValidToken(false)
          setError("Reset link has expired. Please request a new password reset.")
          return 0
        }
        return prev - 1000
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Format time remaining for display
  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Expired"
    
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Validate passwords
    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          newPassword: password
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSuccess(true)
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(data.error || "Failed to reset password. Please try again.")
      }
    } catch (error) {
      console.error("Reset password error:", error)
      setError("Failed to reset password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendLink = async () => {
    if (!email) return
    
    setIsResending(true)
    setResendMessage("")
    
    try {
      const response = await fetch('/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setResendMessage("A new reset link has been sent to your email address.")
      } else {
        setResendMessage("Failed to send reset link. Please try again.")
      }
    } catch (error) {
      console.error("Resend error:", error)
      setResendMessage("Failed to send reset link. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Invalid Reset Link
              </CardTitle>
              <CardDescription className="text-gray-600">
                This password reset link is invalid or has expired.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {error || "The reset link may have expired or been used already."}
                </AlertDescription>
              </Alert>
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={handleResendLink}
                  disabled={isResending}
                  variant="outline" 
                  className="w-full"
                >
                  {isResending ? "Sending..." : "Resend Reset Link"}
                </Button>
                <Link href="/reset" className="w-full">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/login" className="w-full">
                  <Button className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>
              
              {resendMessage && (
                <Alert className={resendMessage.includes("sent") ? "border-green-200 bg-green-50" : ""}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{resendMessage}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Password Reset Successful
              </CardTitle>
              <CardDescription className="text-gray-600">
                Your password has been updated successfully.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  You can now login with your new password. Redirecting to login page...
                </AlertDescription>
              </Alert>
              <Link href="/login" className="w-full">
                <Button className="w-full">
                  Continue to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Set New Password
            </CardTitle>
            <CardDescription className="text-gray-600">
              Enter your new password for {email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Countdown Timer */}
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Link expires in:</span>
                  <span className={`text-sm font-mono font-semibold ${
                    timeRemaining < 300000 ? 'text-red-600' : timeRemaining < 600000 ? 'text-orange-600' : 'text-blue-700'
                  }`}>
                    {formatTimeRemaining(timeRemaining)}
                  </span>
                </div>
                {timeRemaining < 600000 && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-xs text-orange-600">
                      ⚠️ Less than 10 minutes remaining
                    </div>
                    <Button
                      onClick={handleResendLink}
                      disabled={isResending}
                      variant="outline"
                      size="sm"
                      className="text-xs h-6"
                    >
                      {isResending ? "Sending..." : "Get New Link"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Resend Message */}
            {resendMessage && (
              <Alert className={`mb-4 ${resendMessage.includes("sent") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{resendMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? "Updating Password..." : "Update Password"}
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button
                onClick={handleResendLink}
                disabled={isResending}
                variant="outline"
                size="sm"
                className="text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                {isResending ? "Sending new link..." : "🔄 Send me a new reset link"}
              </Button>
            </div>

            <div className="mt-2 text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
