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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
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
  AlertCircle,
  Download,
  Eye,
  EyeOff,
  X,
  Inbox,
  Bell,
  Loader2,
  CloudDownload,
} from "lucide-react"
import { Navbar } from "@/components/navbar"
import { toast } from "sonner"

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
  category: "primary" | "updates"
  threadId?: string
}

const categories = [
  { key: "primary", label: "Primary", icon: Inbox, count: 0 },
  { key: "updates", label: "Updates", icon: Bell, count: 0 },
]

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null)
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("primary")
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoadingGmail, setIsLoadingGmail] = useState(false)
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)

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

  // Update category counts
  const primaryCount = emails.filter((email) => email.category === "primary").length
  const updatesCount = emails.filter((email) => email.category === "updates").length

  categories[0].count = primaryCount
  categories[1].count = updatesCount

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

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email)
    setIsEmailDialogOpen(true)
    if (!email.isRead) {
      // Mark as read locally
      setEmails((prev) => prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e)))

      // Mark as read on Gmail
      try {
        await fetch("/api/gmail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "markRead",
            messageId: email.id,
          }),
        })
      } catch (error) {
        console.error("Failed to mark email as read:", error)
      }
    }
  }

  const handleStarToggle = async (emailId: string, event: React.MouseEvent) => {
    event.stopPropagation()

    const email = emails.find((e) => e.id === emailId)
    if (!email) return

    // Update locally
    setEmails((prev) => prev.map((email) => (email.id === emailId ? { ...email, isStarred: !email.isStarred } : email)))

    // Update on Gmail
    try {
      await fetch("/api/gmail", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggleStar",
          messageId: emailId,
          isStarred: email.isStarred,
        }),
      })
    } catch (error) {
      console.error("Failed to toggle star:", error)
      // Revert local change on error
      setEmails((prev) =>
        prev.map((email) => (email.id === emailId ? { ...email, isStarred: !email.isStarred } : email)),
      )
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    toast.success("Inbox refreshed")
  }

  const fetchGmailEmails = async () => {
    setIsLoadingGmail(true)

    const loadingToast = toast.loading("Fetching emails from Gmail...", {
      description: "Retrieving emails from the last 3 days",
    })

    try {
      const response = await fetch("/api/gmail")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.details || data.error || "Failed to fetch emails")
      }

      if (data.success) {
        setEmails(data.emails)
        setLastSyncTime(data.timestamp)

        toast.dismiss(loadingToast)
        toast.success(`Successfully loaded ${data.count} emails! 📧`, {
          description: `Retrieved emails from the last 3 days via Gmail API`,
        })
      } else {
        throw new Error(data.error || "Failed to fetch emails")
      }
    } catch (error: any) {
      console.error("Error fetching Gmail emails:", error)

      toast.dismiss(loadingToast)
      toast.error("Failed to fetch Gmail emails", {
        description: error.message || "Please check your Gmail API configuration",
      })
    } finally {
      setIsLoadingGmail(false)
    }
  }

  const handleArchive = () => {
    setEmails((prev) => prev.filter((email) => !selectedEmails.includes(email.id)))
    setSelectedEmails([])
    toast.success(`Archived ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""}`)
  }

  const handleDelete = () => {
    setEmails((prev) => prev.filter((email) => !selectedEmails.includes(email.id)))
    setSelectedEmails([])
    toast.success(`Deleted ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""}`)
  }

  const handleMarkAsRead = async () => {
    setEmails((prev) => prev.map((email) => (selectedEmails.includes(email.id) ? { ...email, isRead: true } : email)))

    // Update on Gmail for each selected email
    for (const emailId of selectedEmails) {
      try {
        await fetch("/api/gmail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "markRead",
            messageId: emailId,
          }),
        })
      } catch (error) {
        console.error("Failed to mark email as read:", error)
      }
    }

    setSelectedEmails([])
    toast.success(`Marked ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""} as read`)
  }

  const handleMarkAsUnread = async () => {
    setEmails((prev) => prev.map((email) => (selectedEmails.includes(email.id) ? { ...email, isRead: false } : email)))

    // Update on Gmail for each selected email
    for (const emailId of selectedEmails) {
      try {
        await fetch("/api/gmail", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "markUnread",
            messageId: emailId,
          }),
        })
      } catch (error) {
        console.error("Failed to mark email as unread:", error)
      }
    }

    setSelectedEmails([])
    toast.success(`Marked ${selectedEmails.length} email${selectedEmails.length !== 1 ? "s" : ""} as unread`)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Navbar />
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gmail Inbox</h1>
              <p className="text-gray-600">
                {unreadCount} unread message{unreadCount !== 1 ? "s" : ""} • {emails.length} total
                {lastSyncTime && (
                  <span className="ml-2 text-sm">• Last sync: {new Date(lastSyncTime).toLocaleTimeString()}</span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchGmailEmails}
                disabled={isLoadingGmail}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoadingGmail ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CloudDownload className="h-4 w-4 mr-2" />
                )}
                {isLoadingGmail ? "Loading..." : "Get Gmail (3 days)"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
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

            {/* Gmail API Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Gmail Integration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  Click "Get Gmail" to fetch your latest emails from the last 3 days using Google's Gmail API.
                </div>
                {lastSyncTime && (
                  <div className="text-xs text-gray-500">Last synced: {new Date(lastSyncTime).toLocaleString()}</div>
                )}
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
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {emails.length === 0 ? "No emails loaded" : "No emails found"}
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {emails.length === 0
                          ? "Click 'Get Gmail' to fetch your emails from the last 3 days"
                          : "Try adjusting your search or filter criteria"}
                      </p>
                      {emails.length === 0 && (
                        <Button onClick={fetchGmailEmails} disabled={isLoadingGmail}>
                          {isLoadingGmail ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CloudDownload className="h-4 w-4 mr-2" />
                          )}
                          Get Gmail Emails
                        </Button>
                      )}
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
                              {email.labels.includes("High Priority") && (
                                <div className="w-2 h-2 rounded-full bg-red-500" title="High Priority"></div>
                              )}
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

        </div>

        {/* Email Detail Dialog */}
        <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedEmail && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold pr-8">{selectedEmail.subject}</DialogTitle>
                  <div className="flex items-center space-x-3 mt-4">
                    <Avatar className="size-10">
                      <AvatarImage src={selectedEmail.from.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{selectedEmail.from.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">{selectedEmail.from.name}</div>
                      <div className="text-sm text-gray-500">{selectedEmail.from.email}</div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <span>{selectedEmail.timestamp}</span>
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
                </DialogHeader>
                
                <Separator className="my-4" />
                
                <div className="space-y-6">
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
                    <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                      {selectedEmail.body}
                    </div>
                  </div>

                  {/* Attachments */}
                  {selectedEmail.hasAttachments && (
                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="text-sm font-medium mb-3 flex items-center">
                        <Paperclip className="h-4 w-4 mr-2" />
                        Attachments
                      </h4>
                      <div className="flex items-center justify-between p-3 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-red-700">PDF</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium">attachment.pdf</div>
                            <div className="text-xs text-gray-500">Size unknown</div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-4 border-t">
                    <Button size="sm" className="flex-1">
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <ReplyAll className="h-4 w-4 mr-2" />
                      Reply All
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="h-4 w-4 mr-2" />
                      Forward
                    </Button>
                    <Button variant="outline" size="sm">
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
