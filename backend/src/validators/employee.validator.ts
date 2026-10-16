import { z } from 'zod';

const departments = ['Development', 'Design', 'QA', 'HR', 'Sales'] as const;
const statuses = ['Active', 'Inactive', 'On Leave'] as const;

export const createEmployeeSchema = z
  .object({
    employeeId: z.string().min(1, 'Employee ID is required').trim(),
    fullName: z.string().min(1, 'Full name is required').trim(),
    email: z.string().email('Invalid email format').toLowerCase().trim(),
    phone: z.string().trim().default(''),
    department: z.enum(departments, {
      errorMap: () => ({ message: 'Invalid department' }),
    }),
    role: z.string().min(1, 'Role is required').trim(),
    joiningDate: z.coerce.date({ invalid_type_error: 'Invalid joining date' }),
    status: z.enum(statuses).default('Active'),
    skills: z.array(z.string().trim()).default([]),
    leaveStartDate: z.coerce.date().optional(),
    leaveEndDate: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'On Leave') {
      if (!data.leaveStartDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'leaveStartDate is required when status is On Leave',
          path: ['leaveStartDate'],
        });
      }
      if (!data.leaveEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'leaveEndDate is required when status is On Leave',
          path: ['leaveEndDate'],
        });
      }
      if (data.leaveStartDate && data.leaveEndDate && data.leaveEndDate < data.leaveStartDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'leaveEndDate must be after leaveStartDate',
          path: ['leaveEndDate'],
        });
      }
    }
  });

export const updateEmployeeSchema = z
  .object({
    fullName: z.string().min(1).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    phone: z.string().trim().optional(),
    department: z.enum(departments).optional(),
    role: z.string().min(1).trim().optional(),
    joiningDate: z.coerce.date().optional(),
    status: z.enum(statuses).optional(),
    skills: z.array(z.string().trim()).optional(),
    leaveStartDate: z.coerce.date().optional().nullable(),
    leaveEndDate: z.coerce.date().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.status === 'On Leave') {
      if (!data.leaveStartDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'leaveStartDate is required when status is On Leave',
          path: ['leaveStartDate'],
        });
      }
      if (!data.leaveEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'leaveEndDate is required when status is On Leave',
          path: ['leaveEndDate'],
        });
      }
    }
  });

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
