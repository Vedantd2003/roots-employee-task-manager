import mongoose from 'mongoose';
import Employee, { IEmployee } from '../models/Employee';
import Task from '../models/Task';
import { AppError } from '../middleware/errorHandler';
import { CreateEmployeeInput, UpdateEmployeeInput } from '../validators/employee.validator';

export interface EmployeeQuery {
  page?: number;
  limit?: number;
  department?: string;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function createEmployee(data: CreateEmployeeInput): Promise<IEmployee> {
  // Check uniqueness manually for better error messages
  const existingById = await Employee.findOne({ employeeId: data.employeeId });
  if (existingById) {
    throw new AppError(409, `Employee with ID '${data.employeeId}' already exists`);
  }

  const existingByEmail = await Employee.findOne({ email: data.email.toLowerCase() });
  if (existingByEmail) {
    throw new AppError(409, `Employee with email '${data.email}' already exists`);
  }

  const employee = new Employee(data);
  return employee.save();
}

export async function getEmployees(query: EmployeeQuery): Promise<{
  data: IEmployee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const {
    page = 1,
    limit = 10,
    department,
    status,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = query;

  const filter: mongoose.FilterQuery<IEmployee> = {};

  if (department) filter.department = department;
  if (status) filter.status = status;
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { employeeId: searchRegex },
      { role: searchRegex },
    ];
  }

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  const [data, total] = await Promise.all([
    Employee.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit),
    Employee.countDocuments(filter),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getEmployeeById(id: string): Promise<IEmployee> {
  let employee: IEmployee | null = null;

  // Try by MongoDB _id first
  if (mongoose.Types.ObjectId.isValid(id)) {
    employee = await Employee.findById(id);
  }

  // Fall back to employeeId
  if (!employee) {
    employee = await Employee.findOne({ employeeId: id });
  }

  if (!employee) {
    throw new AppError(404, 'Employee not found');
  }

  return employee;
}

export async function updateEmployee(id: string, data: UpdateEmployeeInput): Promise<IEmployee> {
  const employee = await getEmployeeById(id);

  // If status is being changed away from 'On Leave', clear leave dates
  const newStatus = data.status ?? employee.status;
  if (newStatus !== 'On Leave') {
    (data as Record<string, unknown>).leaveStartDate = undefined;
    (data as Record<string, unknown>).leaveEndDate = undefined;
  }

  // Apply updates
  Object.assign(employee, data);

  // Clear leave dates if set to undefined explicitly
  if (newStatus !== 'On Leave') {
    employee.leaveStartDate = undefined;
    employee.leaveEndDate = undefined;
  }

  await employee.save();
  return employee;
}

export async function deleteEmployee(id: string): Promise<void> {
  const employee = await getEmployeeById(id);

  // Check for active tasks
  const activeTasks = await Task.countDocuments({
    assignedEmployee: employee._id,
    status: { $in: ['Todo', 'In Progress'] },
  });

  if (activeTasks > 0) {
    throw new AppError(
      400,
      `Cannot delete employee with ${activeTasks} active task(s). Complete or cancel tasks first.`
    );
  }

  await Employee.findByIdAndDelete(employee._id);
}
