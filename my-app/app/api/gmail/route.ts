import { NextResponse } from "next/server"
import { getRecentEmails, markAsRead, markAsUnread, toggleStar } from "@/lib/gmail"

export async function GET() {
  try {
    console.log("🔄 Fetching emails from Gmail API...")

    const emails = await getRecentEmails(50)

    console.log(`✅ Successfully fetched ${emails.length} emails from Gmail`)

    return NextResponse.json({
      success: true,
      emails,
      count: emails.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Gmail API Error:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch emails from Gmail",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { action, messageId, isStarred } = body

    switch (action) {
      case "markRead":
        await markAsRead(messageId)
        break
      case "markUnread":
        await markAsUnread(messageId)
        break
      case "toggleStar":
        await toggleStar(messageId, isStarred)
        break
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("❌ Gmail API Error:", error)

    return NextResponse.json(
      {
        error: "Failed to update email",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
