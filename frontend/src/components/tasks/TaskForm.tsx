import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useEmployees } from '../../hooks/useEmployees';
import type { Task, Department, Priority } from '../../types';

const taskSchema = z
  .object({
    title: z.string().min(2, 'Title must be at least 2 characters'),
    description: z.string().optional(),
    assignedEmployee: z.string().optional(),
    department: z.enum(['Development', 'Design', 'QA', 'HR', 'Sales'], {
      required_error: 'Department is required',
    }),
    priority: z.enum(['Low', 'Medium', 'High', 'Critical'], {
      required_error: 'Priority is required',
    }),
    startDate: z.string().min(1, 'Start date is required'),
    dueDate: z.string().min(1, 'Due date is required'),
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return new Date(data.dueDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: 'Due date must be after or equal to start date',
      path: ['dueDate'],
    }
  );

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  defaultValues?: Partial<Task>;
  onSubmit: (data: Partial<Task>) => void | Promise<void>;
  isSubmitting?: boolean;
  serverError?: string;
}

const departmentOptions = [
  { value: 'Development', label: 'Development' },
  { value: 'Design', label: 'Design' },
  { value: 'QA', label: 'QA' },
  { value: 'HR', label: 'HR' },
  { value: 'Sales', label: 'Sales' },
];

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return dateStr.slice(0, 10);
  } catch {
    return '';
  }
}

export function TaskForm({ defaultValues, onSubmit, isSubmitting, serverError }: TaskFormProps) {
  const { data: employeesData } = useEmployees({ status: 'Active', limit: 100 });

  const employeeOptions = [
    { value: '', label: '-- Unassigned --' },
    ...(employeesData?.data || []).map((emp) => ({
      value: emp._id,
      label: `${emp.fullName} (${emp.department})`,
    })),
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      assignedEmployee:
        typeof defaultValues?.assignedEmployee === 'object'
          ? defaultValues?.assignedEmployee?._id || ''
          : (defaultValues?.assignedEmployee as unknown as string) || '',
      department: defaultValues?.department as Department | undefined,
      priority: defaultValues?.priority as Priority | undefined,
      startDate: formatDateForInput(defaultValues?.startDate),
      dueDate: formatDateForInput(defaultValues?.dueDate),
    },
  });

  const handleFormSubmit = async (formData: TaskFormData) => {
    const payload: Partial<Task> = {
      title: formData.title,
      description: formData.description,
      department: formData.department as Department,
      priority: formData.priority as Priority,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
    };

    if (formData.assignedEmployee) {
      (payload as Record<string, unknown>).assignedEmployee = formData.assignedEmployee;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Task Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Title"
              required
              {...register('title')}
              error={errors.title?.message}
              placeholder="Task title"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="Task description (optional)"
            />
          </div>
          <Select
            label="Assigned Employee"
            options={employeeOptions}
            {...register('assignedEmployee')}
            error={errors.assignedEmployee?.message}
          />
          <Select
            label="Department"
            required
            options={departmentOptions}
            placeholder="Select department"
            {...register('department')}
            error={errors.department?.message}
          />
          <Select
            label="Priority"
            required
            options={priorityOptions}
            placeholder="Select priority"
            {...register('priority')}
            error={errors.priority?.message}
          />
          <Input
            label="Start Date"
            type="date"
            required
            {...register('startDate')}
            error={errors.startDate?.message}
          />
          <Input
            label="Due Date"
            type="date"
            required
            {...register('dueDate')}
            error={errors.dueDate?.message}
          />
        </div>
      </div>

      {serverError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-md p-4">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>
          {defaultValues?._id ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}
