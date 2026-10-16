import mongoose from 'mongoose';
import Task, { ITask, TaskStatus } from '../models/Task';
import Employee from '../models/Employee';
import { AppError } from '../middleware/errorHandler';
import { isOverdue } from '../utils/overdue';
import { CreateTaskInput, UpdateTaskInput } from '../validators/task.validator';
// No external CSV library — using inline serializer to avoid @types issues

export interface TaskQuery {
  page?: number;
  limit?: number;
  department?: string;
  status?: string;
  priority?: string;
  assignedEmployee?: string;
  search?: string;
  overdue?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  Todo: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

function checkAssignmentEligibility(
  employee: InstanceType<typeof Employee>,
  startDate: Date
): void {
  if (employee.status === 'Inactive') {
    throw new AppError(400, 'Employee is inactive');
  }
  if (employee.status === 'On Leave') {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const ls = new Date(employee.leaveStartDate!);
    ls.setHours(0, 0, 0, 0);
    const le = new Date(employee.leaveEndDate!);
    le.setHours(0, 0, 0, 0);
    if (start >= ls && start <= le) {
      throw new AppError(400, 'Employee is on leave during task start date');
    }
  }
}

function buildTaskFilter(query: TaskQuery): mongoose.FilterQuery<ITask> {
  const filter: mongoose.FilterQuery<ITask> = {};

  if (query.department) filter.department = query.department;
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  if (query.assignedEmployee) {
    if (mongoose.Types.ObjectId.isValid(query.assignedEmployee)) {
      filter.assignedEmployee = new mongoose.Types.ObjectId(query.assignedEmployee);
    } else {
      filter['employeeSnapshot.employeeId'] = query.assignedEmployee;
    }
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search, 'i');
    filter.$or = [{ title: searchRegex }, { 'employeeSnapshot.fullName': searchRegex }];
  }

  if (query.overdue) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    filter.dueDate = { $lt: today };
    filter.status = { $nin: ['Completed', 'Cancelled'] };
  }

  return filter;
}

export async function createTask(data: CreateTaskInput): Promise<ITask> {
  // Find employee
  let employee = null;
  if (mongoose.Types.ObjectId.isValid(data.assignedEmployee)) {
    employee = await Employee.findById(data.assignedEmployee);
  }
  if (!employee) {
    employee = await Employee.findOne({ employeeId: data.assignedEmployee });
  }
  if (!employee) {
    throw new AppError(404, 'Assigned employee not found');
  }

  // Eligibility check
  checkAssignmentEligibility(employee, data.startDate);

  // Capacity check (atomic)
  const updated = await Employee.findOneAndUpdate(
    { _id: employee._id, activeTasks: { $lt: 3 } },
    { $inc: { activeTasks: 1 } },
    { new: true }
  );
  if (!updated) {
    throw new AppError(400, 'Employee already has 3 active tasks');
  }

  const task = new Task({
    title: data.title,
    description: data.description,
    assignedEmployee: employee._id,
    employeeSnapshot: {
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      department: employee.department,
    },
    department: data.department,
    priority: data.priority ?? 'Medium',
    status: 'Todo',
    startDate: data.startDate,
    dueDate: data.dueDate,
  });

  return task.save();
}

export async function getTasks(query: TaskQuery): Promise<{
  data: (ITask & { overdue: boolean })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const { page = 1, limit = 10, sortBy = 'createdDate', sortOrder = 'desc' } = query;

  const filter = buildTaskFilter(query);
  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assignedEmployee', 'employeeId fullName department email status')
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit),
    Task.countDocuments(filter),
  ]);

  const data = tasks.map((t) => ({
    ...t.toObject(),
    overdue: isOverdue(t.dueDate, t.status),
  })) as unknown as (ITask & { overdue: boolean })[];

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getTaskById(id: string): Promise<ITask & { overdue: boolean }> {
  let task: ITask | null = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    task = await Task.findById(id).populate(
      'assignedEmployee',
      'employeeId fullName department email status'
    );
  }

  if (!task) {
    task = await Task.findOne({ taskId: id }).populate(
      'assignedEmployee',
      'employeeId fullName department email status'
    );
  }

  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  return { ...task.toObject(), overdue: isOverdue(task.dueDate, task.status) } as ITask & {
    overdue: boolean;
  };
}

export async function updateTask(id: string, data: UpdateTaskInput): Promise<ITask> {
  let task: ITask | null = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    task = await Task.findById(id);
  }
  if (!task) {
    task = await Task.findOne({ taskId: id });
  }
  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  // Reject updates on terminal statuses
  if (task.status === 'Completed' || task.status === 'Cancelled') {
    throw new AppError(400, `Cannot update a task with status '${task.status}'`);
  }

  // Check if reassigning employee
  const isReassigning =
    data.assignedEmployee !== undefined &&
    data.assignedEmployee !== String(task.assignedEmployee);

  let newEmployee = null;

  if (isReassigning && data.assignedEmployee) {
    if (mongoose.Types.ObjectId.isValid(data.assignedEmployee)) {
      newEmployee = await Employee.findById(data.assignedEmployee);
    }
    if (!newEmployee) {
      newEmployee = await Employee.findOne({ employeeId: data.assignedEmployee });
    }
    if (!newEmployee) {
      throw new AppError(404, 'Assigned employee not found');
    }

    const startDate = data.startDate ?? task.startDate;
    checkAssignmentEligibility(newEmployee, startDate);

    // Atomic capacity check for new employee
    const updatedEmployee = await Employee.findOneAndUpdate(
      { _id: newEmployee._id, activeTasks: { $lt: 3 } },
      { $inc: { activeTasks: 1 } },
      { new: true }
    );
    if (!updatedEmployee) {
      throw new AppError(400, 'Employee already has 3 active tasks');
    }

    // Decrement old employee's activeTasks if task was active
    if (task.assignedEmployee && (task.status === 'Todo' || task.status === 'In Progress')) {
      await Employee.findByIdAndUpdate(task.assignedEmployee, { $inc: { activeTasks: -1 } });
    }

    task.assignedEmployee = newEmployee._id as mongoose.Types.ObjectId;
    task.employeeSnapshot = {
      employeeId: newEmployee.employeeId,
      fullName: newEmployee.fullName,
      department: newEmployee.department,
    };
  }

  // Validate new dates
  const newStartDate = data.startDate ?? task.startDate;
  const newDueDate = data.dueDate ?? task.dueDate;
  if (newDueDate <= newStartDate) {
    throw new AppError(400, 'dueDate must be after startDate');
  }

  if (data.title !== undefined) task.title = data.title;
  if (data.description !== undefined) task.description = data.description;
  if (data.department !== undefined) task.department = data.department;
  if (data.priority !== undefined) task.priority = data.priority;
  if (data.startDate !== undefined) task.startDate = data.startDate;
  if (data.dueDate !== undefined) task.dueDate = data.dueDate;

  return task.save();
}

export async function updateTaskStatus(id: string, newStatus: string): Promise<ITask> {
  let task: ITask | null = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    task = await Task.findById(id);
  }
  if (!task) {
    task = await Task.findOne({ taskId: id });
  }
  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  const allowed = VALID_TRANSITIONS[task.status];
  if (!allowed) {
    throw new AppError(400, `Unknown current status: ${task.status}`);
  }
  if (!allowed.includes(newStatus)) {
    throw new AppError(
      400,
      `Invalid transition from '${task.status}' to '${newStatus}'. Allowed: ${allowed.join(', ') || 'none'}`
    );
  }

  const previousStatus = task.status;
  task.status = newStatus as TaskStatus;

  if (newStatus === 'Completed') {
    task.completedDate = new Date();
  }

  await task.save();

  // Decrement activeTasks when moving to terminal status
  if (
    (newStatus === 'Completed' || newStatus === 'Cancelled') &&
    (previousStatus === 'Todo' || previousStatus === 'In Progress') &&
    task.assignedEmployee
  ) {
    await Employee.findByIdAndUpdate(task.assignedEmployee, { $inc: { activeTasks: -1 } });
  }

  return task;
}

export async function deleteTask(id: string): Promise<void> {
  let task: ITask | null = null;

  if (mongoose.Types.ObjectId.isValid(id)) {
    task = await Task.findById(id);
  }
  if (!task) {
    task = await Task.findOne({ taskId: id });
  }
  if (!task) {
    throw new AppError(404, 'Task not found');
  }

  if (task.status !== 'Completed' && task.status !== 'Cancelled') {
    throw new AppError(
      400,
      `Cannot delete a task with status '${task.status}'. Only Completed or Cancelled tasks can be deleted.`
    );
  }

  await Task.findByIdAndDelete(task._id);
}

export async function exportCsv(query: TaskQuery): Promise<string> {
  const filter = buildTaskFilter(query);

  const tasks = await Task.find(filter)
    .populate('assignedEmployee', 'employeeId fullName department')
    .sort({ createdDate: -1 })
    .lean();

  const rows = tasks.map((t) => ({
    taskId: t.taskId,
    title: t.title,
    description: t.description ?? '',
    department: t.department,
    priority: t.priority,
    status: t.status,
    assignedEmployeeId: t.employeeSnapshot?.employeeId ?? '',
    assignedEmployeeName: t.employeeSnapshot?.fullName ?? '',
    startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
    dueDate: t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
    createdDate: t.createdDate ? new Date(t.createdDate).toISOString().split('T')[0] : '',
    completedDate: t.completedDate ? new Date(t.completedDate).toISOString().split('T')[0] : '',
    overdue: isOverdue(t.dueDate, t.status) ? 'Yes' : 'No',
  }));

  const fields = [
    'taskId',
    'title',
    'description',
    'department',
    'priority',
    'status',
    'assignedEmployeeId',
    'assignedEmployeeName',
    'startDate',
    'dueDate',
    'createdDate',
    'completedDate',
    'overdue',
  ];

  const escape = (v: unknown): string => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = fields.join(',');
  const lines = rows.map(row =>
    fields.map(f => escape((row as Record<string, unknown>)[f])).join(',')
  );
  return [header, ...lines].join('\r\n');
}
