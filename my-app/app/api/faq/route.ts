import { connectToDatabase } from "@/lib/mongodb"
import Faq from "@/lib/models/FAQ"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    await connectToDatabase();
    const faqs = await Faq.find().sort({ createdAt: -1 });
    return NextResponse.json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await connectToDatabase();
    const newFaq = await Faq.create(body);
    return NextResponse.json(newFaq, { status: 201 });
  } catch (error) {
    console.error("Error creating FAQ:", error);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}
// create a path to the db, db link in .env
// create a model for the faq