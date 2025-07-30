import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: string;
  company: string;
  phone?: string;
  department?: string;
  bio?: string;
  status: string; // 'active', 'suspended', 'inactive'
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  loginAlerts: boolean;
  sessionTimeout?: number; // Session timeout in minutes
  trustedDevices?: Array<{
    deviceId: string;
    ipAddress: string;
    userAgent: string;
    location?: string;
    lastUsed: Date;
  }>;
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
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active',
    required: true
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
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        // Allow empty/undefined or valid phone formats
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  department: {
    type: String,
    enum: ['Operations', 'Logistics', 'Sales', 'Finance', 'HR', 'IT', 'Management', 'Other'],
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    trim: true
  },
  resetPasswordToken: {
    type: String,
    sparse: true
  },
  resetPasswordExpiry: {
    type: Date,
    sparse: true
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
    type: String
  },
  twoFactorBackupCodes: {
    type: [String],
    default: []
  },
  loginAlerts: {
    type: Boolean,
    default: true
  },
  sessionTimeout: {
    type: Number,
    default: 30,
    min: [5, 'Session timeout must be at least 5 minutes'],
    max: [1440, 'Session timeout cannot exceed 24 hours (1440 minutes)']
  },
  trustedDevices: [{
    deviceId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    location: { type: String },
    lastUsed: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

// Index for reset token lookups (email index is already created by unique: true)
UserSchema.index({ resetPasswordToken: 1, resetPasswordExpiry: 1 });

// Force model recompilation by deleting and recreating
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model<IUser>('User', UserSchema);

export default User;
