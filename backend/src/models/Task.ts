import mongoose, { Schema, Document, Model } from 'mongoose';
import { Department } from './Employee';
import { getNextTaskId } from '../utils/taskCounter';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Todo' | 'In Progress' | 'Completed' | 'Cancelled';

export interface IEmployeeSnapshot {
  employeeId: string;
  fullName: string;
  department: string;
}

export interface ITask extends Document {
  taskId: string;
  title: string;
  description?: string;
  assignedEmployee: mongoose.Types.ObjectId | null;
  employeeSnapshot: IEmployeeSnapshot;
  department: Department;
  priority: TaskPriority;
  status: TaskStatus;
  startDate: Date;
  dueDate: Date;
  createdDate: Date;
  completedDate?: Date;
}

const EmployeeSnapshotSchema = new Schema<IEmployeeSnapshot>(
  {
    employeeId: { type: String, default: '' },
    fullName: { type: String, default: '' },
    department: { type: String, default: '' },
  },
  { _id: false }
);

const TaskSchema = new Schema<ITask>(
  {
    taskId: {
      type: String,
      unique: true,
      sparse: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    assignedEmployee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    employeeSnapshot: {
      type: EmployeeSnapshotSchema,
      default: () => ({ employeeId: '', fullName: '', department: '' }),
    },
    department: {
      type: String,
      enum: ['Development', 'Design', 'QA', 'HR', 'Sales'],
      required: [true, 'Department is required'],
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      enum: ['Todo', 'In Progress', 'Completed', 'Cancelled'],
      default: 'Todo',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    createdDate: {
      type: Date,
    },
    completedDate: {
      type: Date,
    },
  },
  { timestamps: false }
);

// Indexes (non-unique — unique taskId index already created by schema field definition)
TaskSchema.index({ assignedEmployee: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ department: 1 });
TaskSchema.index({ priority: 1 });
TaskSchema.index({ dueDate: 1 });

// Pre-save hook: auto-generate taskId and set createdDate
TaskSchema.pre('save', async function (next) {
  if (this.isNew) {
    if (!this.taskId) {
      this.taskId = await getNextTaskId();
    }
    if (!this.createdDate) {
      this.createdDate = new Date();
    }
  }
  next();
});

const Task: Model<ITask> = mongoose.model<ITask>('Task', TaskSchema);
export default Task;
