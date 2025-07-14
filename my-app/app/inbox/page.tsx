"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Archive,
  Trash2,
  Star,
  StarOff,
  Mail,
  MailOpen,
  Reply,
  ReplyAll,
  Forward,
  MoreHorizontal,
  Paperclip,
  Users,
  Tag,
  Filter,
  Settings,
  Inbox,
  Send,
  FileText,
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  X,
} from "lucide-react"
import Link from "next/link"

interface Email {
  id: string
  from: {
    name: string
    email: string
    avatar?: string
  }
  subject: string
  preview: string
  body: string
  timestamp: string
  isRead: boolean
  isStarred: boolean
  hasAttachments: boolean
  labels: string[]
  priority: "high" | "normal" | "low"
  category: "primary" | "social" | "promotions" | "updates" | "forums"
}

// Mock email data
const mockEmails: Email[] = [
  {
    id: "1",
    from: {
      name: "Malaysian Timber Co.",
      email: "orders@malaytimber.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    subject: "Order Confirmation - Teak Wood Planks (INV-001)",
    preview:
      "Thank you for your order! Your teak wood planks order has been confirmed and will be shipped within 3-5 business days...",
    body: "Dear Valued Customer,\n\nThank you for your recent order of Teak Wood Planks (INV-001). We are pleased to confirm that your order has been received and is being processed.\n\nOrder Details:\n- Item: Teak Wood Planks\n- Quantity: 100 m³\n- Unit Price: S$850\n- Total: S$85,000\n\nEstimated delivery: 3-5 business days\n\nBest regards,\nMalaysian Timber Co.",
    timestamp: "2 hours ago",
    isRead: false,
    isStarred: true,
    hasAttachments: true,
    labels: ["Orders", "Suppliers"],
    priority: "high",
    category: "primary",
  },
  {
    id: "2",
    from: {
      name: "Indonesian Wood Supply",
      email: "support@indowood.co.id",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    subject: "Price Update - Pine Wood Boards",
    preview: "We're writing to inform you about updated pricing for our pine wood boards effective next month...",
    body: "Dear Partner,\n\nWe hope this email finds you well. We're writing to inform you about updated pricing for our pine wood boards, effective from next month.\n\nNew pricing:\n- Pine Wood Boards: S$450 per m³ (previously S$420)\n\nThis adjustment reflects current market conditions and ensures we continue to provide you with the highest quality materials.\n\nThank you for your understanding.\n\nBest regards,\nIndonesian Wood Supply Team",
    timestamp: "5 hours ago",
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    labels: ["Pricing", "Suppliers"],
    priority: "normal",
    category: "primary",
  },
  {
    id: "3",
    from: {
      name: "Warehouse Management System",
      email: "alerts@warehouse.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    subject: "Low Stock Alert - Multiple Items",
    preview:
      "URGENT: Several items in your inventory have fallen below minimum stock levels and require immediate attention...",
    body: "URGENT STOCK ALERT\n\nThe following items have fallen below minimum stock levels:\n\n1. Plywood Sheets (INV-006) - Current: 15 m³, Minimum: 25 m³\n2. Mahogany Boards (INV-005) - Current: 10 m³, Minimum: 20 m³\n3. Birch Wood Panels (INV-008) - Current: 18 m³, Minimum: 20 m³\n\nImmediate action required to prevent stockouts.\n\nWarehouse Management System",
    timestamp: "1 day ago",
    isRead: false,
    isStarred: true,
    hasAttachments: false,
    labels: ["Alerts", "Inventory"],
    priority: "high",
    category: "updates",
  },
  {
    id: "4",
    from: {
      name: "Thai Forest Products",
      email: "sales@thaiforest.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    subject: "New Product Catalog - Premium Hardwoods",
    preview: "Discover our latest collection of premium hardwoods sourced from sustainable Thai forests...",
    body: "Dear Valued Customer,\n\nWe're excited to share our new product catalog featuring premium hardwoods sourced from sustainable Thai forests.\n\nNew additions include:\n- Premium Teak (Grade A+)\n- Exotic Rosewood\n- Sustainable Bamboo Products\n\nSpecial launch pricing available for the first 30 days.\n\nBest regards,\nThai Forest Products",
    timestamp: "2 days ago",
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    labels: ["Catalogs", "Suppliers"],
    priority: "normal",
    category: "promotions",
  },
  {
    id: "5",
    from: {
      name: "Logistics Partner",
      email: "tracking@logistics.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    subject: "Shipment Delivered - Tracking #LP789456",
    preview: "Your shipment has been successfully delivered to Warehouse A-1. Please confirm receipt...",
    body: "Delivery Confirmation\n\nTracking Number: LP789456\nDelivery Date: Today, 2:30 PM\nLocation: Warehouse A-1\nRecipient: Warehouse Manager\n\nItems delivered:\n- Cedar Planks (28 m³)\n- Delivery in good condition\n\nPlease confirm receipt in your system.\n\nLogistics Partner",
    timestamp: "3 days ago",
    isRead: true,
    isStarred: false,
    hasAttachments: false,
    labels: ["Logistics", "Deliveries"],
    priority: "normal",
    category: "updates",
  },
  {
    id: "6",
    from: {
      name: "Quality Assurance Team",
      email: "qa@company.com",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    subject: "Monthly Quality Report - December 2024",
    preview: "Please find attached the monthly quality assurance report for all incoming materials...",
    body: "Monthly Quality Report - December 2024\n\nDear Team,\n\nPlease find attached our comprehensive quality assurance report for December 2024.\n\nKey highlights:\n- 98.5% pass rate for incoming materials\n- 3 minor quality issues resolved\n- New testing protocols implemented\n\nDetailed analysis and recommendations are included in the attached report.\n\nQuality Assurance Team",
    timestamp: "1 week ago",
    isRead: true,
    isStarred: false,
    hasAttachments: true,
    labels: ["Reports", "Quality"],
    priority: "normal",
    category: "primary",
  },
]

const categories = [
  { key: "primary", label: "Primary", icon: Inbox, count: 4 },
  { key: "social", label: "Social", icon: Users, count: 0 },
  { key: "promotions", label: "Promotions", icon: Tag, count: 1 },
  { key: "updates", label: "Updates", icon: AlertCircle, count: 2 },
  { key: "forums", label: "Forums", icon: FileText, count: 0 },
]

const labels = [
  { name: "Orders", color: "bg-blue-500" },
  { name: "Suppliers", color: "bg-green-500" },
  { name: "Alerts", color: "bg-red-500" },
  { name: "Inventory", color: "bg-yellow-500" },
  { name: "Pricing", color: "bg-purple-500" },
  { name: "Catalogs", color: "bg-pink-500" },
  { name: "Logistics", color: "bg-indigo-500" },
  { name: "Deliveries", color: "bg-orange-500" },
  { name: "Reports", color: "bg-teal-500" },
  { name: "Quality", color: "bg-cyan-500" },
]

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>(mockEmails)
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("primary")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const filteredEmails = emails.filter((email) => {
    const matchesSearch =
      !searchTerm ||
      email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.from.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.preview.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = email.category === selectedCategory
    const matchesReadStatus = !showUnreadOnly || !email.isRead

    return matchesSearch && matchesCategory && matchesReadStatus
  })

  const unreadCount = emails.filter((email) => !email.isRead).length

  const handleEmailSelect = (emailId: string) => {
    setSelectedEmails((prev) => (prev.includes(emailId) ? prev.filter((id) => id !== emailId) : [...prev, emailId]))
  }

  const handleSelectAll = () => {
    if (selectedEmails.length === filteredEmails.length) {
      setSelectedEmails([])
    } else {
      setSelectedEmails(filteredEmails.map((email) => email.id))
    }
  }

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email)
    if (!email.isRead) {
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)))
    }
  }

  const handleStarToggle = (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setEmails((prev) => prev.map((email) => (email.id === emailId ? { ...email, isStarred: !email.isStarred } : email)))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
  }

  const handleArchive = () => {
    setEmails((prev) => prev.filter((email) => !selectedEmails.includes(email.id)))
    setSelectedEmails([])
  }

  const handleDelete = () => {
    setEmails((prev) => prev.filter((email) => !selectedEmails.includes(email.id)))
    setSelectedEmails([])
  }

  const handleMarkAsRead = () => {
    setEmails((prev) => prev.map((email) => (selectedEmails.includes(email.id) ? { ...email, isRead: true } : email)))
    setSelectedEmails([])
  }

  const handleMarkAsUnread = () => {
    setEmails((prev) => prev.map((email) => (selectedEmails.includes(email.id) ? { ...email, isRead: false } : email)))
    setSelectedEmails([])
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-500"
      case "low":
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getLabelColor = (labelName: string) => {
    const label = labels.find((l) => l.name === labelName)
    return label?.color || "bg-gray-500"
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
                <h1 className="text-3xl font-bold text-gray-900">Inbox</h1>
                <p className="text-gray-600">
                  {unreadCount} unread message{unreadCount !== 1 ? "s" : ""} • {emails.length} total
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Compose Button */}
            <Button className="w-full" size="lg">
              <Send className="h-4 w-4 mr-2" />
              Compose
            </Button>

            {/* Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon
                  return (
                    <button
                      key={category.key}
                      onClick={() => setSelectedCategory(category.key)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.key
                          ? "bg-blue-100 text-blue-700"
                          : "hover:bg-gray-100 text-gray-700"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium">{category.label}</span>
                      </div>
                      {category.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {category.count}
                        </Badge>
                      )}
                    </button>
                  )
                })}
              </CardContent>
            </Card>

            {/* Labels */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Labels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {labels.map((label) => (
                  <div key={label.name} className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${label.color}`}></div>
                    <span className="text-sm text-gray-700">{label.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Email List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="h-5 w-5" />
                    <span>{categories.find((c) => c.key === selectedCategory)?.label}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                      className={showUnreadOnly ? "bg-blue-100 text-blue-700" : ""}
                    >
                      {showUnreadOnly ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Filter className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48">
                        <div className="space-y-2">
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <Star className="h-4 w-4 mr-2" />
                            Starred
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <Paperclip className="h-4 w-4 mr-2" />
                            Has attachments
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <AlertCircle className="h-4 w-4 mr-2" />
                            High priority
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search emails..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Toolbar */}
                {selectedEmails.length > 0 && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 border-b">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-blue-700">{selectedEmails.length} selected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={handleMarkAsRead}>
                        <MailOpen className="h-4 w-4 mr-1" />
                        Mark as read
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleMarkAsUnread}>
                        <Mail className="h-4 w-4 mr-1" />
                        Mark as unread
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleArchive}>
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}

                {/* Select All */}
                <div className="flex items-center p-4 border-b bg-gray-50">
                  <Checkbox
                    checked={selectedEmails.length === filteredEmails.length && filteredEmails.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-600">
                    {filteredEmails.length} email{filteredEmails.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Email List */}
                <div className="divide-y">
                  {filteredEmails.length === 0 ? (
                    <div className="text-center py-12">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
                      <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`flex items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          !email.isRead ? "bg-blue-50" : ""
                        } ${selectedEmails.includes(email.id) ? "bg-blue-100" : ""}`}
                        onClick={() => handleEmailClick(email)}
                      >
                        <Checkbox
                          checked={selectedEmails.includes(email.id)}
                          onCheckedChange={() => handleEmailSelect(email.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-3"
                        />
                        <button
                          onClick={(e) => handleStarToggle(email.id, e)}
                          className="mr-3 text-gray-400 hover:text-yellow-500 transition-colors"
                        >
                          {email.isStarred ? (
                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </button>
                        <Avatar className="mr-3">
                          <AvatarImage src={email.from.avatar || "/placeholder.svg"} />
                          <AvatarFallback>{email.from.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm ${!email.isRead ? "font-semibold" : "font-medium"}`}>
                                {email.from.name}
                              </span>
                              {email.priority === "high" && <AlertCircle className="h-3 w-3 text-red-500" />}
                              {email.hasAttachments && <Paperclip className="h-3 w-3 text-gray-400" />}
                            </div>
                            <span className="text-xs text-gray-500">{email.timestamp}</span>
                          </div>
                          <div className="mb-1">
                            <span className={`text-sm ${!email.isRead ? "font-semibold" : ""} text-gray-900`}>
                              {email.subject}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600 truncate">{email.preview}</p>
                            <div className="flex items-center space-x-1 ml-2">
                              {email.labels.slice(0, 2).map((label) => (
                                <div
                                  key={label}
                                  className={`w-2 h-2 rounded-full ${getLabelColor(label)}`}
                                  title={label}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Email Detail */}
          <div className="lg:col-span-1">
            {selectedEmail ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{selectedEmail.subject}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Avatar className="size-10">
                      <AvatarImage src={selectedEmail.from.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{selectedEmail.from.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{selectedEmail.from.name}</div>
                      <div className="text-sm text-gray-500">{selectedEmail.from.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{selectedEmail.timestamp}</span>
                    <div className="flex items-center space-x-2">
                      {selectedEmail.priority === "high" && <AlertCircle className="h-4 w-4 text-red-500" />}
                      {selectedEmail.hasAttachments && <Paperclip className="h-4 w-4" />}
                      <button onClick={(e) => handleStarToggle(selectedEmail.id, e)}>
                        {selectedEmail.isStarred ? (
                          <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Labels */}
                    {selectedEmail.labels.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.labels.map((label) => (
                          <Badge key={label} variant="secondary" className="text-xs">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Email Body */}
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-sm text-gray-700">{selectedEmail.body}</div>
                    </div>

                    {/* Attachments */}
                    {selectedEmail.hasAttachments && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Paperclip className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">order-confirmation.pdf</span>
                            <span className="text-xs text-gray-500">(245 KB)</span>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-4">
                      <Button size="sm" className="flex-1">
                        <Reply className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button variant="outline" size="sm">
                        <ReplyAll className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Forward className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select an email</h3>
                    <p className="text-gray-500">Choose an email from the list to view its contents</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
