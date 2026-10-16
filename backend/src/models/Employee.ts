import mongoose, { Schema, Document, Model } from 'mongoose';

export type Department = 'Development' | 'Design' | 'QA' | 'HR' | 'Sales';
export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';

export interface IEmployee extends Document {
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: Department;
  role: string;
  joiningDate: Date;
  status: EmployeeStatus;
  skills: string[];
  leaveStartDate?: Date;
  leaveEndDate?: Date;
  activeTasks: number;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    department: {
      type: String,
      enum: ['Development', 'Design', 'QA', 'HR', 'Sales'],
      required: [true, 'Department is required'],
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave'],
      default: 'Active',
    },
    skills: {
      type: [String],
      default: [],
    },
    leaveStartDate: {
      type: Date,
    },
    leaveEndDate: {
      type: Date,
    },
    activeTasks: {
      type: Number,
      default: 0,
      min: 0,
      max: 3,
    },
  },
  { timestamps: true }
);

// Indexes (non-unique ones — unique indexes already created by schema field definitions)
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ status: 1 });

// Pre-save hook
EmployeeSchema.pre('save', function (next) {
  // Normalize email
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }

  // Validate leave dates when status is 'On Leave'
  if (this.status === 'On Leave') {
    if (!this.leaveStartDate) {
      return next(new Error('leaveStartDate is required when status is On Leave'));
    }
    if (!this.leaveEndDate) {
      return next(new Error('leaveEndDate is required when status is On Leave'));
    }
    if (this.leaveEndDate < this.leaveStartDate) {
      return next(new Error('leaveEndDate must be after leaveStartDate'));
    }
  }

  next();
});

const Employee: Model<IEmployee> = mongoose.model<IEmployee>('Employee', EmployeeSchema);
export default Employee;
