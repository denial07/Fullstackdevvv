import { google } from "googleapis"

// Gmail API configuration
const GMAIL_SCOPES = ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.modify"]

// Initialize Gmail API client
export function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  // Set credentials if available
  if (process.env.GOOGLE_ACCESS_TOKEN && process.env.GOOGLE_REFRESH_TOKEN) {
    auth.setCredentials({
      access_token: process.env.GOOGLE_ACCESS_TOKEN,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    })

    // Set up automatic token refresh
    auth.on('tokens', (tokens) => {
      console.log('🔄 Gmail tokens refreshed automatically')
      if (tokens.refresh_token) {
        // In a production app, you'd save this to your database
        console.log('💾 New refresh token available - update your .env.local if needed')
      }
    })
  }

  return google.gmail({ version: "v1", auth })
}

// Get emails from last 3 days - filtered for shipment-related content
export async function getRecentEmails(maxResults = 50) {
  try {
    const gmail = getGmailClient()

    // Calculate date 3 days ago
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    const dateString = threeDaysAgo.toISOString().split("T")[0].replace(/-/g, "/")

    // Shipment-related keywords for Gmail search
    const shipmentKeywords = [
      "shipment", "shipping", "delivery", "tracking", "package", "parcel",
      "fedex", "ups", "dhl", "usps", "freight", "cargo", "logistics",
      "dispatch", "consignment", "manifest", "warehouse", "transit",
      "pickup", "dropoff", "invoice", "bill of lading", "packing list",
      "order", "purchase", "supplier", "vendor", "carrier", "transport",
      "arrived", "departed", "in transit", "out for delivery", "delivered",
      "customs", "port", "container", "vessel", "truck", "rail",
      "estimated delivery", "tracking number", "eta", "etd"
    ]

    // Build search query with shipment keywords and date filter
    // Use subject and body search for better results
    const keywordQuery = shipmentKeywords.map(keyword => `(subject:"${keyword}" OR "${keyword}")`).join(" OR ")
    const query = `after:${dateString} (${keywordQuery})`

    console.log("🔍 Gmail search query:", query)

    // Get message list
    const response = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults,
    })

    const messages = response.data.messages || []

    // Get detailed message data
    const emailPromises = messages.map(async (message: any) => {
      const messageData = await gmail.users.messages.get({
        userId: "me",
        id: message.id!,
        format: "full",
      })

      return parseGmailMessage(messageData.data)
    })

    const emails = await Promise.all(emailPromises)
    return emails.filter((email: any) => email !== null)
  } catch (error) {
    console.error("Error fetching Gmail messages:", error)
    throw error
  }
}

// Parse Gmail message data
function parseGmailMessage(message: any) {
  try {
    const headers = message.payload?.headers || []
    const getHeader = (name: string) => headers.find((h: any) => h.name === name)?.value || ""

    const from = parseEmailAddress(getHeader("From"))
    const subject = getHeader("Subject")
    const date = new Date(Number.parseInt(message.internalDate))

    // Get message body
    const body = extractMessageBody(message.payload)

    // Determine if message is read
    const isRead = !message.labelIds?.includes("UNREAD")

    // Check for attachments
    const hasAttachments = hasMessageAttachments(message.payload)

    // Determine priority based on headers
    const priority = determinePriority(headers)

    // Categorize email
    const category = categorizeEmail(subject, from.email, body)

    return {
      id: message.id,
      from,
      subject: subject || "(No Subject)",
      preview: generatePreview(body),
      body: body || "",
      timestamp: formatTimestamp(date),
      isRead,
      isStarred: message.labelIds?.includes("STARRED") || false,
      hasAttachments,
      labels: priority === "high" ? ["High Priority"] : [],
      priority,
      category,
      threadId: message.threadId,
    }
  } catch (error) {
    console.error("Error parsing message:", error)
    return null
  }
}

// Parse email address from "Name <email@domain.com>" format
function parseEmailAddress(emailString: string) {
  const match = emailString.match(/^(.+?)\s*<(.+?)>$/)
  if (match) {
    return {
      name: match[1].trim().replace(/"/g, ""),
      email: match[2].trim(),
      avatar: `/placeholder.svg?height=40&width=40`,
    }
  }

  return {
    name: emailString.split("@")[0] || "Unknown",
    email: emailString,
    avatar: `/placeholder.svg?height=40&width=40`,
  }
}

// Extract message body from Gmail payload
function extractMessageBody(payload: any): string {
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, "base64").toString("utf-8")
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64").toString("utf-8")
      }
      if (part.mimeType === "text/html" && part.body?.data) {
        const html = Buffer.from(part.body.data, "base64").toString("utf-8")
        // Basic HTML to text conversion
        return html
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim()
      }
    }
  }

  return ""
}

// Check if message has attachments
function hasMessageAttachments(payload: any): boolean {
  if (payload.parts) {
    return payload.parts.some((part: any) => part.filename && part.filename.length > 0)
  }
  return false
}

// Determine email priority
function determinePriority(headers: any[]): "high" | "normal" | "low" {
  const importance = headers.find((h) => h.name.toLowerCase() === "importance")?.value?.toLowerCase()
  const priority = headers.find((h) => h.name.toLowerCase() === "x-priority")?.value

  if (importance === "high" || priority === "1" || priority === "2") {
    return "high"
  }
  if (importance === "low" || priority === "4" || priority === "5") {
    return "low"
  }
  return "normal"
}

// Categorize email based on content
function categorizeEmail(subject: string, fromEmail: string, body: string): "primary" | "updates" {
  const subjectLower = subject.toLowerCase()
  const bodyLower = body.toLowerCase()

  // Keywords that indicate updates/notifications
  const updateKeywords = [
    "notification",
    "alert",
    "update",
    "reminder",
    "confirmation",
    "receipt",
    "invoice",
    "statement",
    "report",
    "newsletter",
    "unsubscribe",
    "automated",
    "no-reply",
    "noreply",
  ]

  // Check if from automated systems
  const isAutomated = fromEmail.includes("no-reply") || fromEmail.includes("noreply") || fromEmail.includes("automated")

  // Check for update keywords
  const hasUpdateKeywords = updateKeywords.some(
    (keyword) => subjectLower.includes(keyword) || bodyLower.includes(keyword),
  )

  return isAutomated || hasUpdateKeywords ? "updates" : "primary"
}

// Generate email preview
function generatePreview(body: string, maxLength = 150): string {
  if (!body) return ""

  const cleaned = body.replace(/\s+/g, " ").trim()
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) + "..." : cleaned
}

// Format timestamp
function formatTimestamp(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffHours / 24)

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
  } else {
    return date.toLocaleDateString()
  }
}

// Mark email as read
export async function markAsRead(messageId: string) {
  try {
    const gmail = getGmailClient()
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    })
  } catch (error) {
    console.error("Error marking message as read:", error)
    throw error
  }
}

// Mark email as unread
export async function markAsUnread(messageId: string) {
  try {
    const gmail = getGmailClient()
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: {
        addLabelIds: ["UNREAD"],
      },
    })
  } catch (error) {
    console.error("Error marking message as unread:", error)
    throw error
  }
}

// Star/unstar email
export async function toggleStar(messageId: string, isStarred: boolean) {
  try {
    const gmail = getGmailClient()
    await gmail.users.messages.modify({
      userId: "me",
      id: messageId,
      requestBody: isStarred ? { removeLabelIds: ["STARRED"] } : { addLabelIds: ["STARRED"] },
    })
  } catch (error) {
    console.error("Error toggling star:", error)
    throw error
  }
}
