import mongoose, { Document, Schema } from 'mongoose';

export interface IContactRequest extends Document {
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'reviewed' | 'responded';
  createdAt: Date;
  updatedAt: Date;
}

const ContactRequestSchema = new Schema<IContactRequest>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'responded'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Index for faster email lookups
ContactRequestSchema.index({ email: 1 });
ContactRequestSchema.index({ status: 1 });
ContactRequestSchema.index({ createdAt: -1 });

const ContactRequest = mongoose.models.ContactRequest || mongoose.model<IContactRequest>('ContactRequest', ContactRequestSchema);

export default ContactRequest;
