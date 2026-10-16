import { z } from 'zod';

const departments = ['Development', 'Design', 'QA', 'HR', 'Sales'] as const;
const priorities = ['Low', 'Medium', 'High', 'Critical'] as const;
const statuses = ['Todo', 'In Progress', 'Completed', 'Cancelled'] as const;

export const createTaskSchema = z
  .object({
    title: z.string().min(1, 'Title is required').trim(),
    description: z.string().trim().optional(),
    assignedEmployee: z.string().min(1, 'Assigned employee is required'),
    department: z.enum(departments, {
      errorMap: () => ({ message: 'Invalid department' }),
    }),
    priority: z.enum(priorities).default('Medium'),
    startDate: z.coerce.date({ invalid_type_error: 'Invalid start date' }),
    dueDate: z.coerce.date({ invalid_type_error: 'Invalid due date' }),
  })
  .superRefine((data, ctx) => {
    if (data.dueDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dueDate must be after startDate',
        path: ['dueDate'],
      });
    }
  });

export const updateTaskSchema = z
  .object({
    title: z.string().min(1).trim().optional(),
    description: z.string().trim().optional(),
    assignedEmployee: z.string().optional(),
    department: z.enum(departments).optional(),
    priority: z.enum(priorities).optional(),
    startDate: z.coerce.date().optional(),
    dueDate: z.coerce.date().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.dueDate && data.dueDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dueDate must be after startDate',
        path: ['dueDate'],
      });
    }
  });

export const updateStatusSchema = z.object({
  status: z.enum(statuses, {
    errorMap: () => ({ message: 'Invalid status value' }),
  }),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
