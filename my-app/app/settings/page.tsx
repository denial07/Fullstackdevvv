"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Bell, Shield, Building, Save, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

interface UserData {
  id: string
  email: string
  name: string
  role: string
  company: string
  phone?: string
  department?: string
  joinDate?: string
}

interface CompanyData {
  companyName: string
  registrationNumber: string
  industry: string
  established: number
  address: string
  phone: string
  email: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [company, setCompany] = useState<CompanyData | null>(null)
  const [isLoadingCompany, setIsLoadingCompany] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    bio: "",
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    shipmentAlerts: true,
    inventoryAlerts: true,
    paymentReminders: true,
    systemUpdates: false,
    weeklyReports: true,
  })

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30",
    loginAlerts: true,
  })

  // 2FA setup state
  const [showQRCode, setShowQRCode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [verificationError, setVerificationError] = useState(false)

  useEffect(() => {
    // Load user data from localStorage for display purposes
    const userData = localStorage.getItem("user")
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
    }

    // Load profile data from database to pre-fill form
    const loadProfileFromDatabase = async () => {
      try {
        const response = await fetch('/api/user/profile')
        const data = await response.json()

        if (response.ok) {
          // Pre-fill the form with existing database data
          setProfileForm({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            department: data.user.department || "",
            bio: data.user.bio || "",
          })

          // Update security settings with 2FA status
          setSecurity(prev => ({
            ...prev,
            twoFactorAuth: data.user.twoFactorEnabled || false
          }))
        } else {
          console.log("Could not load profile data:", data.error)
        }
      } catch (error) {
        console.error("Failed to load profile data:", error)
      }
    }

    // Load company data from database
    const loadCompanyFromDatabase = async () => {
      try {
        console.log("🏢 Fetching company data...");
        setIsLoadingCompany(true);
        const response = await fetch('/api/company')
        const data = await response.json()

        console.log("📊 Company API response:", { response: response.ok, data });

        if (response.ok) {
          setCompany(data.company)
          console.log("✅ Company data loaded:", data.company);
        } else {
          console.log("❌ Could not load company data:", data.error)
        }
      } catch (error) {
        console.error("❌ Failed to load company data:", error)
      } finally {
        setIsLoadingCompany(false);
      }
    }

    loadProfileFromDatabase()
    loadCompanyFromDatabase()
  }, [])

  const handleProfileSave = async () => {
    setIsLoading(true)
    setSaveMessage("")
    
    // Validate required fields
    if (!profileForm.name.trim()) {
      setSaveMessage("Name is required")
      setIsLoading(false)
      return
    }
    
    if (!profileForm.email.trim()) {
      setSaveMessage("Email is required")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name.trim(),
          email: profileForm.email.trim(),
          phone: profileForm.phone.trim() || undefined,
          department: profileForm.department.trim() || undefined,
          bio: profileForm.bio.trim() || undefined
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSaveMessage("Profile saved successfully!")
        
        // Update localStorage with new user data
        if (user) {
          const updatedUser = {
            ...user,
            name: data.user.name,
            email: data.user.email,
            phone: data.user.phone,
            department: data.user.department
          }
          localStorage.setItem("user", JSON.stringify(updatedUser))
          setUser(updatedUser)
        }
        
        setTimeout(() => setSaveMessage(""), 3000)
        console.log("✅ Profile saved successfully")
      } else {
        setSaveMessage(data.error || "Failed to save profile")
      }
    } catch (err) {
      console.error("Profile save error:", err)
      setSaveMessage("Failed to save profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveMessage("New passwords do not match.")
      return
    }

    if (passwordForm.newPassword.length < 6) {
      setSaveMessage("Password must be at least 6 characters long.")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSaveMessage("Password changed successfully!")
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
        setTimeout(() => setSaveMessage(""), 3000)
      } else {
        setSaveMessage(data.error || "Failed to change password.")
      }
    } catch (error) {
      console.error("Password change error:", error)
      setSaveMessage("Failed to change password. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationSave = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSaveMessage("Notification preferences saved!")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSecuritySave = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSaveMessage("Security settings saved!")
      setTimeout(() => setSaveMessage(""), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const handle2FAToggle = async (enabled: boolean) => {
    if (!user) return

    if (enabled) {
      // Setup 2FA
      setIsLoading(true)
      try {
        const response = await fetch('/api/2fa-raw/setup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: user.email }),
        })

        const data = await response.json()

        if (response.ok) {
          setQrCodeUrl(data.qrCode)
          setShowQRCode(true)
          setVerificationError(false) // Clear any previous error
          setSaveMessage("Scan the QR code with your authenticator app, then enter the verification code below.")
        } else {
          setSaveMessage(data.error || "Failed to setup 2FA")
          setSecurity(prev => ({ ...prev, twoFactorAuth: false }))
        }
      } catch (error) {
        console.error("2FA setup error:", error)
        setSaveMessage("Failed to setup 2FA. Please try again.")
        setSecurity(prev => ({ ...prev, twoFactorAuth: false }))
      } finally {
        setIsLoading(false)
      }
    } else {
      // Disable 2FA
      setIsLoading(true)
      try {
        const response = await fetch('/api/2fa-raw/setup', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: user.email, 
            token: "000000", // Dummy token for disable
            enable: false 
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setSaveMessage("2FA has been disabled successfully.")
          setShowQRCode(false)
          setQrCodeUrl("")
          setVerificationCode("")
          setBackupCodes([])
          setShowBackupCodes(false)
        } else {
          setSaveMessage(data.error || "Failed to disable 2FA")
          setSecurity(prev => ({ ...prev, twoFactorAuth: true }))
        }
      } catch (error) {
        console.error("2FA disable error:", error)
        setSaveMessage("Failed to disable 2FA. Please try again.")
        setSecurity(prev => ({ ...prev, twoFactorAuth: true }))
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleVerify2FA = async () => {
    if (!user || !verificationCode.trim()) {
      setSaveMessage("Please enter the verification code")
      setVerificationError(true)
      return
    }

    setIsLoading(true)
    setVerificationError(false) // Clear any previous error
    try {
      const response = await fetch('/api/2fa-raw/setup', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: user.email, 
          token: verificationCode.trim(),
          enable: true 
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSaveMessage("2FA has been enabled successfully!")
        setBackupCodes(data.backupCodes || [])
        setShowBackupCodes(true)
        setShowQRCode(false)
        setVerificationCode("")
        setVerificationError(false)
        setTimeout(() => {
          setSaveMessage("")
          setShowBackupCodes(false)
        }, 10000)
      } else {
        setSaveMessage(data.error || "Invalid verification code")
        setVerificationError(true)
      }
    } catch (error) {
      console.error("2FA verification error:", error)
      setSaveMessage("Failed to verify 2FA code. Please try again.")
      setVerificationError(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Please log in to access settings.</p>
          <Button asChild className="mt-4">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
                <p className="text-gray-600">Manage your account preferences and security</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{user.role}</Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {saveMessage && (
          <Alert
            className={`mb-6 ${saveMessage.includes("successfully") || saveMessage.includes("saved") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}
          >
            {saveMessage.includes("successfully") || saveMessage.includes("saved") ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription
              className={
                saveMessage.includes("successfully") || saveMessage.includes("saved")
                  ? "text-green-800"
                  : "text-red-800"
              }
            >
              {saveMessage}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>Update your personal information and profile details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="+65 XXXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Select value={profileForm.department} onValueChange={(value) => setProfileForm({ ...profileForm, department: value })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Logistics">Logistics</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder="Tell us about yourself, your role, and experience..."
                    rows={3}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500">
                    {profileForm.bio.length}/500 characters
                  </p>
                </div>
                <Button onClick={handleProfileSave} disabled={isLoading || !profileForm.name.trim() || !profileForm.email.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Profile"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Change Password
                </CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Enter new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Confirm new password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Configure additional security options for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                  </div>
                  <Switch
                    checked={security.twoFactorAuth}
                    onCheckedChange={(checked) => {
                      setSecurity({ ...security, twoFactorAuth: checked })
                      handle2FAToggle(checked)
                    }}
                    disabled={isLoading}
                  />
                </div>

                {/* QR Code Setup */}
                {showQRCode && (
                  <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                    <div className="text-center">
                      <h4 className="font-medium">Set up your authenticator app</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                      </p>
                    </div>
                    {qrCodeUrl && (
                      <div className="flex justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="verificationCode">Enter verification code</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="verificationCode"
                          type="text"
                          value={verificationCode}
                          onChange={(e) => {
                            setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                            setVerificationError(false) // Clear error when user starts typing
                          }}
                          placeholder="000000"
                          className={`text-center text-lg tracking-widest ${
                            verificationError 
                              ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500" 
                              : ""
                          }`}
                          maxLength={6}
                        />
                        <Button onClick={handleVerify2FA} disabled={isLoading || !verificationCode.trim()}>
                          {isLoading ? "Verifying..." : "Verify"}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Enter the 6-digit code from your authenticator app
                      </p>
                      {verificationError && (
                        <p className="text-xs text-red-600 flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Invalid verification code. Please try again.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Backup Codes */}
                {showBackupCodes && backupCodes.length > 0 && (
                  <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                    <div className="text-center">
                      <h4 className="font-medium text-green-800">Backup Codes Generated</h4>
                      <p className="text-sm text-green-700 mt-1">
                        Save these backup codes in a safe place. Each code can only be used once.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="p-2 bg-white rounded border text-center">
                          {code}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-green-700 text-center">
                      You can use these codes to log in if you lose access to your authenticator app.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Login Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified when someone logs into your account</p>
                  </div>
                  <Switch
                    checked={security.loginAlerts}
                    onCheckedChange={(checked) => setSecurity({ ...security, loginAlerts: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={security.sessionTimeout}
                    onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                    className="w-32"
                  />
                </div>
                <Button onClick={handleSecuritySave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Security Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose what notifications you want to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-gray-500">Receive notifications via email</p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, emailNotifications: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Shipment Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified about shipment delays and arrivals</p>
                    </div>
                    <Switch
                      checked={notifications.shipmentAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, shipmentAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Inventory Alerts</Label>
                      <p className="text-sm text-gray-500">Receive alerts for low stock and expiring items</p>
                    </div>
                    <Switch
                      checked={notifications.inventoryAlerts}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, inventoryAlerts: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Payment Reminders</Label>
                      <p className="text-sm text-gray-500">Get notified about overdue payments</p>
                    </div>
                    <Switch
                      checked={notifications.paymentReminders}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, paymentReminders: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>System Updates</Label>
                      <p className="text-sm text-gray-500">Receive notifications about system maintenance</p>
                    </div>
                    <Switch
                      checked={notifications.systemUpdates}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                    />
                  </div>
                </div>
                <Button onClick={handleNotificationSave} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Company Information
                </CardTitle>
                <CardDescription>View and manage company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {isLoadingCompany ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading company information...</p>
                  </div>
                ) : company ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input value={company.companyName || ""} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Registration Number</Label>
                        <Input value={company.registrationNumber || ""} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Industry</Label>
                        <Input value={company.industry || ""} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Established</Label>
                        <Input value={company.established?.toString() || ""} disabled />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Address</Label>
                      <Textarea value={company.address || ""} disabled rows={2} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={company.phone || ""} disabled />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={company.email || ""} disabled />
                      </div>
                    </div>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Company information can only be updated by administrators. Contact your system administrator for
                        changes.
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No company information found. Please contact your administrator.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
