import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  jobTitle: string;
  manager?: string;
  status: 'active' | 'inactive' | 'terminated';
  dateOfJoining: Date;
  dateOfLeaving?: Date;
  salary?: number;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  employeeId: {
    type: String,
    required: [true, 'Employee ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
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
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone: string) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    enum: ['Operations', 'Logistics', 'Sales', 'Finance', 'HR', 'IT', 'Management', 'Other'],
    trim: true
  },
  jobTitle: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  manager: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'terminated'],
    default: 'active',
    required: true
  },
  dateOfJoining: {
    type: Date,
    required: [true, 'Date of joining is required']
  },
  dateOfLeaving: {
    type: Date
  },
  salary: {
    type: Number,
    min: [0, 'Salary cannot be negative']
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'Singapore' }
  },
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { type: String, trim: true }
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
EmployeeSchema.index({ department: 1, status: 1 });
EmployeeSchema.index({ lastName: 1, firstName: 1 });
// Note: employeeId index is automatically created by unique: true

// Virtual for full name
EmployeeSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
EmployeeSchema.set('toJSON', { virtuals: true });

// Force model recompilation by deleting and recreating
if (mongoose.models.Employee) {
  delete mongoose.models.Employee;
}

const Employee = mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
