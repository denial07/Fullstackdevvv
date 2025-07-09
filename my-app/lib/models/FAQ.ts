import mongoose, { Document, Schema } from 'mongoose';

export interface IFaq extends Document {
  question: string;
  answer: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FaqSchema: Schema<IFaq> = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String },
  },
  {
    timestamps: true,
  }
);

export const FaqModel = mongoose.model<IFaq>('Faq', FaqSchema);
