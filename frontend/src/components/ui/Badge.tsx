import React from 'react';
import type { TaskStatus, Priority, EmployeeStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'status' | 'priority' | 'employee-status' | 'overdue';
  status?: TaskStatus;
  priority?: Priority;
  employeeStatus?: EmployeeStatus;
  className?: string;
}

const taskStatusStyles: Record<TaskStatus, string> = {
  Todo: 'bg-gray-100 text-gray-700 border border-gray-200',
  'In Progress': 'bg-blue-100 text-blue-700 border border-blue-200',
  Completed: 'bg-green-100 text-green-700 border border-green-200',
  Cancelled: 'bg-red-100 text-red-600 border border-red-200',
};

const priorityStyles: Record<Priority, string> = {
  Low: 'bg-gray-100 text-gray-600 border border-gray-200',
  Medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  High: 'bg-orange-100 text-orange-700 border border-orange-200',
  Critical: 'bg-red-100 text-red-700 border border-red-200',
};

const employeeStatusStyles: Record<EmployeeStatus, string> = {
  Active: 'bg-green-100 text-green-700 border border-green-200',
  Inactive: 'bg-gray-100 text-gray-600 border border-gray-200',
  'On Leave': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
};

export function Badge({ children, variant, status, priority, employeeStatus, className = '' }: BadgeProps) {
  let styles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';

  if (variant === 'status' && status) {
    styles += ` ${taskStatusStyles[status]}`;
  } else if (variant === 'priority' && priority) {
    styles += ` ${priorityStyles[priority]}`;
  } else if (variant === 'employee-status' && employeeStatus) {
    styles += ` ${employeeStatusStyles[employeeStatus]}`;
  } else if (variant === 'overdue') {
    styles += ' bg-red-100 text-red-700 border border-red-300';
  } else {
    styles += ' bg-gray-100 text-gray-700 border border-gray-200';
  }

  return <span className={`${styles} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant="status" status={status}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="priority" priority={priority}>
      {priority}
    </Badge>
  );
}

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge variant="employee-status" employeeStatus={status}>
      {status}
    </Badge>
  );
}

export function OverdueBadge() {
  return <Badge variant="overdue">Overdue</Badge>;
}
