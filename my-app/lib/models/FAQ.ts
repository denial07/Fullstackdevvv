// models/faq.ts
import mongoose, { Schema, Document } from "mongoose"

export interface FAQ extends Document {
  categoryId: string
  categoryTitle: string
  icon: string // Store as string, e.g., "HelpCircle"
  color: string
  questions: {
    question: string
    answer: string
  }[]
}

const FAQSchema = new Schema<FAQ>({
  categoryId: { type: String, required: true },
  categoryTitle: { type: String, required: true },
  icon: { type: String, required: true },
  color: { type: String, required: true },
  questions: [
    {
      question: { type: String, required: true },
      answer: { type: String, required: true },
    },
  ],
})

export default mongoose.models.FAQ || mongoose.model<FAQ>("FAQ", FAQSchema)
