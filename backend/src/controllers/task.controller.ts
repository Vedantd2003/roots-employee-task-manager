import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';

export async function getTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page,
      limit,
      department,
      status,
      priority,
      assignedEmployee,
      search,
      overdue,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string>;

    const result = await taskService.getTasks({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      department,
      status,
      priority,
      assignedEmployee,
      search,
      overdue: overdue === 'true',
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.createTask(req.body);
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { department, status, priority, assignedEmployee, search, overdue } =
      req.query as Record<string, string>;

    const csv = await taskService.exportCsv({
      department,
      status,
      priority,
      assignedEmployee,
      search,
      overdue: overdue === 'true',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="tasks-export.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function getTaskById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.getTaskById(req.params.id);
    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.updateTask(req.params.id, req.body);
    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await taskService.deleteTask(req.params.id);
    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = await taskService.updateTaskStatus(req.params.id, req.body.status);
    res.json({
      success: true,
      data: task,
    });
  } catch (err) {
    next(err);
  }
}
