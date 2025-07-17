import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  companyName: string;
  registrationNumber: string;
  industry: string;
  established: number;
  address: string;
  phone: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true
  },
  industry: {
    type: String,
    required: [true, 'Industry is required'],
    trim: true
  },
  established: {
    type: Number,
    required: [true, 'Establishment year is required'],
    min: [1800, 'Establishment year must be after 1800'],
    max: [new Date().getFullYear(), 'Establishment year cannot be in the future']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    validate: {
      validator: function(phone: string) {
        return /^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Please enter a valid phone number'
    }
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
  }
}, {
  timestamps: true
});

const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);

export default Company;
