"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Building2, Edit3, Save, X, Trash2, Eye, AlertCircle, Mail, User, Clock, CheckCircle, RefreshCw, Users, Settings, Shield, UserPlus, Key, Pause, Play, UserCheck, UserX } from "lucide-react"

interface CompanyData {
  id: string;
  companyName: string;
  registrationNumber: string;
  industry: string;
  established: number;
  address: string;
  phone: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserProfile {
  email: string;
  role: string;
  name: string;
}

interface ContactRequest {
  _id: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'reviewed' | 'responded';
  createdAt: string;
  updatedAt: string;
}

interface UserAccount {
  _id: string;
  email: string;
  name: string;
  role: string;
  company: string;
  phone?: string;
  department?: string;
  bio?: string;
  twoFactorEnabled: boolean;
  loginAlerts: boolean;
  sessionTimeout?: number;
  status: 'active' | 'suspended' | 'inactive';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CompanyManagementPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([])
  const [contactRequestsLoading, setContactRequestsLoading] = useState(false)
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
  const [userAccountsLoading, setUserAccountsLoading] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "Employee",
    company: "Singapore Pallet Works",
    phone: "",
    department: "",
    bio: ""
  })
  const [formData, setFormData] = useState<Omit<CompanyData, 'id'>>({
    companyName: "",
    registrationNumber: "",
    industry: "",
    established: new Date().getFullYear(),
    address: "",
    phone: "",
    email: ""
  })

  const isAdmin = userProfile?.email === "admin@palletworks.sg" || userProfile?.role === "Administrator"

  // Load user profile
  useEffect(() => {
    loadUserProfile()
  }, [])

  // Load companies
  useEffect(() => {
    if (userProfile) {
      loadCompanies()
      if (isAdmin) {
        loadContactRequests()
        loadUserAccounts()
      }
    }
  }, [userProfile, isAdmin])

  const loadUserProfile = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      
      if (response.ok) {
        setUserProfile(data.user)
      } else {
        setError("Failed to load user profile")
      }
    } catch (error) {
      console.error("Error loading user profile:", error)
      setError("Failed to load user profile")
    }
  }

  const loadCompanies = async () => {
    try {
      setIsLoading(true)
      // Try to get all companies first (admin endpoint)
      let response = await fetch('/api/companies')
      
      if (response.status === 403 || response.status === 404) {
        // Fall back to single company endpoint for non-admin users
        response = await fetch('/api/company')
        const data = await response.json()
        
        if (response.ok && data.company) {
          setCompanies([data.company])
        } else {
          setError("No company data found")
        }
      } else if (response.ok) {
        const data = await response.json()
        setCompanies(data.companies || [])
      } else {
        setError("Failed to load companies")
      }
    } catch (error) {
      console.error("Error loading companies:", error)
      setError("Failed to load companies")
    } finally {
      setIsLoading(false)
    }
  }

  const loadContactRequests = async () => {
    try {
      setContactRequestsLoading(true)
      const response = await fetch('/api/contact')
      
      if (response.ok) {
        const data = await response.json()
        setContactRequests(data)
      } else {
        console.error("Failed to load contact requests")
      }
    } catch (error) {
      console.error("Error loading contact requests:", error)
    } finally {
      setContactRequestsLoading(false)
    }
  }

  const loadUserAccounts = async () => {
    try {
      setUserAccountsLoading(true)
      const response = await fetch('/api/users')
      
      if (response.ok) {
        const data = await response.json()
        setUserAccounts(data)
      } else {
        console.error("Failed to load user accounts")
      }
    } catch (error) {
      console.error("Error loading user accounts:", error)
    } finally {
      setUserAccountsLoading(false)
    }
  }

  const handleEdit = (company: CompanyData) => {
    setEditingId(company.id)
    setFormData({
      companyName: company.companyName,
      registrationNumber: company.registrationNumber,
      industry: company.industry,
      established: company.established,
      address: company.address,
      phone: company.phone,
      email: company.email
    })
  }

  const handleSave = async (companyId: string) => {
    try {
      const body = { ...formData, id: companyId }

      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        await loadCompanies() // Reload companies
        setEditingId(null)
        setFormData({
          companyName: "",
          registrationNumber: "",
          industry: "",
          established: new Date().getFullYear(),
          address: "",
          phone: "",
          email: ""
        })
      } else {
        setError(data.error || "Failed to save company")
      }
    } catch (error) {
      console.error("Error saving company:", error)
      setError("Failed to save company")
    }
  }

  const handleDelete = async (companyId: string) => {
    if (!confirm("Are you sure you want to delete this company? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/company?id=${companyId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        await loadCompanies() // Reload companies
      } else {
        setError(data.error || "Failed to delete company")
      }
    } catch (error) {
      console.error("Error deleting company:", error)
      setError("Failed to delete company")
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      companyName: "",
      registrationNumber: "",
      industry: "",
      established: new Date().getFullYear(),
      address: "",
      phone: "",
      email: ""
    })
  }

  const getContactStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'responded': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getContactStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'reviewed': return <User className="h-4 w-4" />;
      case 'responded': return <CheckCircle className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  }

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrator': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'employee': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrator': return <Shield className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <UserCheck className="h-4 w-4" />;
      case 'suspended': return <UserX className="h-4 w-4" />;
      case 'inactive': return <Pause className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  }

  const handleEditUser = (user: UserAccount) => {
    setEditingUserId(user._id)
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      phone: user.phone || "",
      department: user.department || "",
      bio: user.bio || ""
    })
  }

  const handleUserFormCancel = () => {
    setEditingUserId(null)
    setCreatingUser(false)
    setUserFormData({
      name: "",
      email: "",
      role: "Employee",
      company: "Singapore Pallet Works",
      phone: "",
      department: "",
      bio: ""
    })
  }

  const handleCreateUser = async () => {
    try {
      if (!userFormData.name || !userFormData.email || !userFormData.role || !userFormData.company) {
        alert("Please fill in all required fields")
        return
      }

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userFormData),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`User created successfully! Temporary password: ${data.temporaryPassword}`)
        await loadUserAccounts() // Reload users
        handleUserFormCancel() // Close form
      } else {
        alert(data.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Failed to create user")
    }
  }

  const handleUpdateUser = async () => {
    try {
      if (!userFormData.name || !userFormData.email || !userFormData.role || !userFormData.company) {
        alert("Please fill in all required fields")
        return
      }

      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: editingUserId,
          ...userFormData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("User updated successfully!")
        await loadUserAccounts() // Reload users
        handleUserFormCancel() // Close form
      } else {
        alert(data.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Failed to update user")
    }
  }

  const handleResetPassword = async (userId: string, email: string) => {
    if (!confirm(`Reset password for ${email}? A new temporary password will be generated.`)) {
      return
    }
    
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          resetPassword: true
        }),
      })

      const data = await response.json()

      if (response.ok && data.newPassword) {
        alert(`Password reset successfully! New temporary password: ${data.newPassword}`)
        await loadUserAccounts() // Reload users
      } else {
        alert(data.error || "Failed to reset password")
      }
    } catch (error) {
      console.error("Error resetting password:", error)
      alert("Failed to reset password")
    }
  }

  const handleSuspendUser = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'suspend' : 'reactivate';

    if (!confirm(`Are you sure you want to ${action} this user account?`)) {
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          status: newStatus
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`User ${action}d successfully!`);
        // Optimistically update userAccounts state for instant UI feedback
        setUserAccounts((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, status: newStatus } : u
          )
        );
      } else {
        alert(data.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      alert(`Failed to ${action} user`);
    }
  }

  const handleDeleteUser = async (userId: string, email: string) => {
    if (email === "admin@palletworks.sg") {
      alert("Cannot delete the main administrator account")
      return
    }
    
    if (!confirm(`Are you sure you want to permanently delete this user account? This action cannot be undone.`)) {
      return
    }
    
    try {
      const response = await fetch(`/api/users?id=${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        alert("User deleted successfully!")
        await loadUserAccounts() // Reload users
      } else {
        alert(data.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Failed to delete user")
    }
  }

  const handleUpdateContactStatus = async (requestId: string, newStatus: 'reviewed' | 'responded') => {
    try {
      const response = await fetch('/api/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: requestId,
          status: newStatus
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Contact request marked as ${newStatus}!`)
        await loadContactRequests() // Reload contact requests
      } else {
        alert(data.error || `Failed to update status to ${newStatus}`)
      }
    } catch (error) {
      console.error("Error updating contact status:", error)
      alert("Failed to update contact status")
    }
  }

  const renderUserForm = (user?: UserAccount) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="userName">Full Name</Label>
          <Input
            id="userName"
            value={userFormData.name}
            onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="userEmail">Email Address</Label>
          <Input
            id="userEmail"
            type="email"
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="userRole">Role</Label>
          <select
            id="userRole"
            value={userFormData.role}
            onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="Employee">Employee</option>
            <option value="Manager">Manager</option>
            <option value="Administrator">Administrator</option>
          </select>
        </div>
        <div>
          <Label htmlFor="userCompany">Company</Label>
          <Input
            id="userCompany"
            value={userFormData.company}
            onChange={(e) => setUserFormData({ ...userFormData, company: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="userPhone">Phone</Label>
          <Input
            id="userPhone"
            value={userFormData.phone}
            onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="userDepartment">Department</Label>
          <Input
            id="userDepartment"
            value={userFormData.department}
            onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="userBio">Bio</Label>
          <Input
            id="userBio"
            value={userFormData.bio}
            onChange={(e) => setUserFormData({ ...userFormData, bio: e.target.value })}
            placeholder="Brief description about the user"
          />
        </div>
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button onClick={user ? handleUpdateUser : handleCreateUser}>
          <Save className="mr-2 h-4 w-4" />
          {user ? 'Update User' : 'Create User'}
        </Button>
        <Button variant="outline" onClick={handleUserFormCancel}>
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </div>
  )

  const renderCompanyForm = (company?: CompanyData) => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="companyName">Company Name</Label>
          <Input
            id="companyName"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
            disabled={!isAdmin}
            required
          />
        </div>
        <div>
          <Label htmlFor="registrationNumber">Registration Number</Label>
          <Input
            id="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            disabled={!isAdmin}
            required
          />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            disabled={!isAdmin}
            required
          />
        </div>
        <div>
          <Label htmlFor="established">Year Established</Label>
          <Input
            id="established"
            type="number"
            value={formData.established}
            onChange={(e) => setFormData({ ...formData, established: parseInt(e.target.value) })}
            disabled={!isAdmin}
            min="1800"
            max={new Date().getFullYear()}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            disabled={!isAdmin}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isAdmin}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled={!isAdmin}
            required
          />
        </div>
      </div>
      
      {isAdmin && (
        <div className="flex gap-2 pt-4">
          <Button onClick={() => company && handleSave(company.id)}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  )

  const renderCompanyCard = (company: CompanyData) => {
    const isEditing = editingId === company.id

    return (
      <Card key={company.id} className="mb-4">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {company.companyName}
              </CardTitle>
              <CardDescription>
                {company.registrationNumber} • {company.industry}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isAdmin && (
                <Badge variant="secondary">
                  <Eye className="mr-1 h-3 w-3" />
                  View Only
                </Badge>
              )}
              {isAdmin && !isEditing && (
                <>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(company)}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(company.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            renderCompanyForm(company)
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Company Name</Label>
                <p className="text-sm text-gray-600">{company.companyName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Registration Number</Label>
                <p className="text-sm text-gray-600">{company.registrationNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Industry</Label>
                <p className="text-sm text-gray-600">{company.industry}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Year Established</Label>
                <p className="text-sm text-gray-600">{company.established}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="text-sm font-medium">Address</Label>
                <p className="text-sm text-gray-600">{company.address}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                <p className="text-sm text-gray-600">{company.phone}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm text-gray-600">{company.email}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Loading companies...</h3>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="h-8 w-8" />
                Company Management
              </h1>
              <p className="mt-2 text-gray-600">
                {isAdmin ? "Manage company information" : "View company information"}
              </p>
              {userProfile && (
                <div className="mt-2 flex gap-2">
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {userProfile.role}
                  </Badge>
                  <Badge variant="outline">
                    {userProfile.email}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Access Warning for Non-Admin Users */}
        {!isAdmin && (
          <Alert className="mb-6">
            <Eye className="h-4 w-4" />
            <AlertDescription>
              You have view-only access to company information. Contact admin@palletworks.sg for edit permissions.
            </AlertDescription>
          </Alert>
        )}

        {/* Companies List */}
        {companies.length > 0 ? (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Company
            </h2>
            {companies.map(renderCompanyCard)}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No companies found</h3>
              <p className="mt-2 text-gray-600">
                No company data available.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Contact Requests Section - Admin Only */}
        {isAdmin && (
          <div className="mt-12">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Contact Requests</h2>
                  <p className="text-gray-600">Dashboard access requests from users</p>
                </div>
                <Button onClick={loadContactRequests} disabled={contactRequestsLoading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${contactRequestsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
              
              <div className="mt-4 flex space-x-2">
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  {contactRequests.filter(r => r.status === 'pending').length} Pending
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {contactRequests.filter(r => r.status === 'reviewed').length} Reviewed
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {contactRequests.filter(r => r.status === 'responded').length} Responded
                </Badge>
              </div>
            </div>

            {/* Contact Requests List */}
            {contactRequestsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                <p className="mt-2 text-gray-600">Loading contact requests...</p>
              </div>
            ) : contactRequests.length > 0 ? (
              <div className="space-y-4">
                {contactRequests.map((request) => (
                  <Card key={request._id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Mail className="h-5 w-5" />
                            {request.name}
                          </CardTitle>
                          <CardDescription>{request.email}</CardDescription>
                        </div>
                        <div className="flex gap-2 items-center">
                          <Badge className={getContactStatusColor(request.status)}>
                            {getContactStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">Message:</Label>
                          <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded border">
                            {request.message}
                          </p>
                        </div>
                        <div className="text-xs text-gray-500">
                          Request ID: {request._id}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2 pt-2 border-t">
                          {request.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateContactStatus(request._id, 'reviewed')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <User className="mr-2 h-4 w-4" />
                              Mark as Reviewed
                            </Button>
                          )}
                          {(request.status === 'pending' || request.status === 'reviewed') && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleUpdateContactStatus(request._id, 'responded')}
                              className="text-green-600 hover:text-green-700"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark as Responded
                            </Button>
                          )}
                          {request.status === 'responded' && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Mail className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No contact requests</h3>
                  <p className="mt-2 text-gray-600">
                    No dashboard access requests have been submitted yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Accounts and Settings Section - Admin Only */}
        {isAdmin && (
          <div className="mt-12">
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Accounts and Settings</h2>
                  <p className="text-gray-600">Manage user accounts and system settings</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setCreatingUser(true)} disabled={creatingUser}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add User
                  </Button>
                  <Button onClick={loadUserAccounts} disabled={userAccountsLoading}>
                    <RefreshCw className={`mr-2 h-4 w-4 ${userAccountsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {userAccounts.filter(u => u.role === 'Administrator').length} Admins
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {userAccounts.filter(u => u.role === 'Manager').length} Managers
                </Badge>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  {userAccounts.filter(u => u.role === 'Employee').length} Employees
                </Badge>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  {userAccounts.filter(u => u.status === 'active').length} Active
                </Badge>
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  {userAccounts.filter(u => u.status === 'suspended').length} Suspended
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                  {userAccounts.filter(u => u.twoFactorEnabled).length} 2FA Enabled
                </Badge>
              </div>
            </div>

            {/* Create User Form */}
            {creatingUser && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Create New User Account</CardTitle>
                  <CardDescription>
                    Add a new user to the system. They will receive an email with login instructions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {renderUserForm()}
                </CardContent>
              </Card>
            )}

            {/* User Accounts List */}
            {userAccountsLoading ? (
              <div className="text-center py-8">
                <RefreshCw className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                <p className="mt-2 text-gray-600">Loading user accounts...</p>
              </div>
            ) : userAccounts.length > 0 ? (
              <div className="space-y-4">
                {userAccounts.map((account) => {
                  const isEditingUser = editingUserId === account._id
                  
                  return (
                    <Card key={account._id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-lg">
                              <Users className="h-5 w-5" />
                              {account.name}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2">
                              {account.email}
                              {account.lastLogin && (
                                <span className="text-xs">
                                  • Last login: {new Date(account.lastLogin).toLocaleDateString()}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2 items-center flex-wrap">
                            <Badge className={getRoleColor(account.role)}>
                              {getRoleIcon(account.role)}
                              <span className="ml-1">{account.role}</span>
                            </Badge>
                            <Badge className={getStatusColor(account.status || 'active')}>
                              {getStatusIcon(account.status || 'active')}
                              <span className="ml-1 capitalize">{account.status || 'active'}</span>
                            </Badge>
                            {account.twoFactorEnabled && (
                              <Badge variant="outline" className="bg-green-50 text-green-700">
                                <Shield className="mr-1 h-3 w-3" />
                                2FA
                              </Badge>
                            )}
                            <span className="text-sm text-gray-500">
                              {new Date(account.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isEditingUser ? (
                          renderUserForm(account)
                        ) : (
                          <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div>
                                <Label className="text-sm font-medium">Company</Label>
                                <p className="text-sm text-gray-600">{account.company}</p>
                              </div>
                              {account.department && (
                                <div>
                                  <Label className="text-sm font-medium">Department</Label>
                                  <p className="text-sm text-gray-600">{account.department}</p>
                                </div>
                              )}
                              {account.phone && (
                                <div>
                                  <Label className="text-sm font-medium">Phone</Label>
                                  <p className="text-sm text-gray-600">{account.phone}</p>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm font-medium">Login Alerts</Label>
                                <p className="text-sm text-gray-600">
                                  {account.loginAlerts ? 'Enabled' : 'Disabled'}
                                </p>
                              </div>
                              {account.sessionTimeout && (
                                <div>
                                  <Label className="text-sm font-medium">Session Timeout</Label>
                                  <p className="text-sm text-gray-600">{account.sessionTimeout} minutes</p>
                                </div>
                              )}
                              <div>
                                <Label className="text-sm font-medium">Account Status</Label>
                                <p className="text-sm text-gray-600 capitalize">{account.status || 'active'}</p>
                              </div>
                            </div>
                            {account.bio && (
                              <div className="mt-4">
                                <Label className="text-sm font-medium">Bio</Label>
                                <p className="text-sm text-gray-600 mt-1 p-3 bg-gray-50 rounded border">
                                  {account.bio}
                                </p>
                              </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(account)}>
                                <Edit3 className="mr-2 h-4 w-4" />
                                Edit Profile
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleResetPassword(account._id, account.email)}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSuspendUser(account._id, account.status || 'active')}
                                className={account.status === 'suspended' ? 'text-green-600 hover:text-green-700' : 'text-orange-600 hover:text-orange-700'}
                              >
                                {account.status === 'suspended' ? (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Reactivate
                                  </>
                                ) : (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    Suspend
                                  </>
                                )}
                              </Button>
                              {account.email !== "admin@palletworks.sg" && (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => handleDeleteUser(account._id, account.email)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No user accounts</h3>
                  <p className="mt-2 text-gray-600">
                    No user accounts have been created yet.
                  </p>
                  <Button className="mt-4">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add First User
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
