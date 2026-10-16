export interface Employee {
  _id: string;
  employeeId: string;
  fullName: string;
  email: string;
  phone: string;
  department: Department;
  role: string;
  joiningDate: string;
  status: EmployeeStatus;
  skills: string[];
  leaveStartDate?: string;
  leaveEndDate?: string;
  activeTasks: number;
}

export type EmployeeStatus = 'Active' | 'Inactive' | 'On Leave';
export type Department = 'Development' | 'Design' | 'QA' | 'HR' | 'Sales';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TaskStatus = 'Todo' | 'In Progress' | 'Completed' | 'Cancelled';

export interface Task {
  _id: string;
  taskId: string;
  title: string;
  description?: string;
  assignedEmployee?: Employee;
  employeeSnapshot: {
    employeeId: string;
    fullName: string;
    department: string;
  };
  department: Department;
  priority: Priority;
  status: TaskStatus;
  startDate: string;
  dueDate: string;
  createdDate: string;
  completedDate?: string;
  isOverdue: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardData {
  employees: {
    total: number;
    active: number;
    inactive: number;
    onLeave: number;
  };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    overdue: number;
  };
  workload: Array<{
    employeeId: string;
    fullName: string;
    activeTasks: number;
  }>;
}
