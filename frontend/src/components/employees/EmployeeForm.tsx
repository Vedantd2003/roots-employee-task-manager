import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import type { Employee, Department, EmployeeStatus } from '../../types';

const employeeSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee ID is required'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(6, 'Phone number is required'),
    department: z.enum(['Development', 'Design', 'QA', 'HR', 'Sales'], {
      required_error: 'Department is required',
    }),
    role: z.string().min(1, 'Role is required'),
    joiningDate: z.string().min(1, 'Joining date is required'),
    status: z.enum(['Active', 'Inactive', 'On Leave'], {
      required_error: 'Status is required',
    }),
    skills: z.string().optional(),
    leaveStartDate: z.string().optional(),
    leaveEndDate: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.status === 'On Leave') {
        return !!data.leaveStartDate && !!data.leaveEndDate;
      }
      return true;
    },
    {
      message: 'Leave start and end dates are required when status is On Leave',
      path: ['leaveStartDate'],
    }
  )
  .refine(
    (data) => {
      if (data.status === 'On Leave' && data.leaveStartDate && data.leaveEndDate) {
        return new Date(data.leaveEndDate) >= new Date(data.leaveStartDate);
      }
      return true;
    },
    {
      message: 'Leave end date must be after or equal to start date',
      path: ['leaveEndDate'],
    }
  );

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface EmployeeFormProps {
  defaultValues?: Partial<Employee>;
  onSubmit: (data: Partial<Employee>) => void | Promise<void>;
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

const statusOptions = [
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'On Leave', label: 'On Leave' },
];

function formatDateForInput(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    return dateStr.slice(0, 10);
  } catch {
    return '';
  }
}

export function EmployeeForm({ defaultValues, onSubmit, isSubmitting, serverError }: EmployeeFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      employeeId: defaultValues?.employeeId || '',
      fullName: defaultValues?.fullName || '',
      email: defaultValues?.email || '',
      phone: defaultValues?.phone || '',
      department: defaultValues?.department as Department | undefined,
      role: defaultValues?.role || '',
      joiningDate: formatDateForInput(defaultValues?.joiningDate),
      status: (defaultValues?.status as EmployeeStatus) || 'Active',
      skills: defaultValues?.skills?.join(', ') || '',
      leaveStartDate: formatDateForInput(defaultValues?.leaveStartDate),
      leaveEndDate: formatDateForInput(defaultValues?.leaveEndDate),
    },
  });

  const status = watch('status');

  const handleFormSubmit = async (formData: EmployeeFormData) => {
    const skills = formData.skills
      ? formData.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const payload: Partial<Employee> = {
      employeeId: formData.employeeId,
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      department: formData.department as Department,
      role: formData.role,
      joiningDate: formData.joiningDate,
      status: formData.status as EmployeeStatus,
      skills,
    };

    if (formData.status === 'On Leave') {
      payload.leaveStartDate = formData.leaveStartDate;
      payload.leaveEndDate = formData.leaveEndDate;
    } else {
      payload.leaveStartDate = undefined;
      payload.leaveEndDate = undefined;
    }

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {serverError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-700">{serverError}</p>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Employee ID"
            required
            {...register('employeeId')}
            error={errors.employeeId?.message}
            placeholder="e.g. EMP001"
          />
          <Input
            label="Full Name"
            required
            {...register('fullName')}
            error={errors.fullName?.message}
            placeholder="John Doe"
          />
          <Input
            label="Email"
            type="email"
            required
            {...register('email')}
            error={errors.email?.message}
            placeholder="john@example.com"
          />
          <Input
            label="Phone"
            required
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+1 234 567 8900"
          />
          <Select
            label="Department"
            required
            options={departmentOptions}
            placeholder="Select department"
            {...register('department')}
            error={errors.department?.message}
          />
          <Input
            label="Role"
            required
            {...register('role')}
            error={errors.role?.message}
            placeholder="e.g. Senior Developer"
          />
          <Input
            label="Joining Date"
            type="date"
            required
            {...register('joiningDate')}
            error={errors.joiningDate?.message}
          />
          <Select
            label="Status"
            required
            options={statusOptions}
            {...register('status')}
            error={errors.status?.message}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Skills</h3>
        <Input
          label="Skills"
          {...register('skills')}
          error={errors.skills?.message}
          placeholder="React, Node.js, TypeScript (comma separated)"
        />
      </div>

      {status === 'On Leave' && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Leave Period</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Leave Start Date"
              type="date"
              required
              {...register('leaveStartDate')}
              error={errors.leaveStartDate?.message}
            />
            <Input
              label="Leave End Date"
              type="date"
              required
              {...register('leaveEndDate')}
              error={errors.leaveEndDate?.message}
            />
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={isSubmitting}>
          {defaultValues?._id ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}
