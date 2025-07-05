import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  company: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'Please enter a valid email address'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  role: {
    type: String,
    enum: ['Administrator', 'Manager', 'Employee'],
    default: 'Employee'
  },
  company: {
    type: String,
    default: 'Singapore Pallet Works'
  },
  resetPasswordToken: {
    type: String,
    sparse: true
  },
  resetPasswordExpiry: {
    type: Date,
    sparse: true
  }
}, {
  timestamps: true
});

// Index for reset token lookups (email index is already created by unique: true)
UserSchema.index({ resetPasswordToken: 1, resetPasswordExpiry: 1 });

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
