// app/api/faq/route.ts
import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import Faq from "@/lib/models/FAQ"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// server-side maps (same semantics as your UI)
const ICON_MAP: Record<string, string> = {
  general: "HelpCircle",
  shipments: "Ship",
  inventory: "Package",
  orders: "ShoppingCart",
  account: "Settings",
  security: "Shield",
}

const COLOR_MAP: Record<string, string> = {
  general: "bg-blue-100 text-blue-800",
  shipments: "bg-green-100 text-green-800",
  inventory: "bg-purple-100 text-purple-800",
  orders: "bg-orange-100 text-orange-800",
  account: "bg-gray-100 text-gray-800",
  security: "bg-red-100 text-red-800",
}

function slugifyCategory(v: string) {
  return v.trim().toLowerCase().replace(/\s+/g, "-")
}
function titleCase(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export async function GET() {
  try {
    await connectToDatabase()
    // Use lean() so we can easily post-process
    const faqs = await Faq.find().sort({ createdAt: -1 }).lean()

    // Ensure 'category' exists for the current UI (fallback to categoryId)
    const result = faqs.map((f: any) => ({
      ...f,
      category: f.category ?? f.categoryId ?? "general",
    }))

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("[FAQ_GET_ERROR]", error)
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const question = String(body?.question ?? "").trim()
    const answer = String(body?.answer ?? "").trim()
    const rawCategory = String(body?.category ?? "general")
    const categoryId = slugifyCategory(rawCategory || "general")
    const categoryTitle = titleCase(categoryId)
    const icon = ICON_MAP[categoryId] ?? "HelpCircle"
    const color = COLOR_MAP[categoryId] ?? "bg-gray-100 text-gray-800"

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Both 'question' and 'answer' are required." },
        { status: 400 }
      )
    }

    await connectToDatabase()

    // Create with all schema-required fields
    const newFaq = await Faq.create({
      question,
      answer,
      categoryId,
      categoryTitle,
      icon,
      color,
      // Optional: include 'category' for old UI; schema will ignore if not defined
      category: categoryId,
    })

    // Also return a 'category' key so the current UI groups correctly
    const json = {
      ...(newFaq.toObject?.() ?? newFaq),
      category: categoryId,
    }

    return NextResponse.json(json, { status: 201 })
  } catch (err: any) {
    console.error("[FAQ_POST_ERROR]", {
      name: err?.name,
      code: err?.code,
      message: err?.message,
      errors: err?.errors,
    })

    if (err?.name === "ValidationError") {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 })
  }
}
