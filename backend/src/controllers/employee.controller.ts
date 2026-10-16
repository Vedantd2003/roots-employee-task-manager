import { Request, Response, NextFunction } from 'express';
import * as employeeService from '../services/employee.service';

export async function getEmployees(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      page,
      limit,
      department,
      status,
      search,
      sortBy,
      sortOrder,
    } = req.query as Record<string, string>;

    const result = await employeeService.getEmployees({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      department,
      status,
      search,
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

export async function createEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employee = await employeeService.createEmployee(req.body);
    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEmployeeById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({
      success: true,
      data: employee,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const employee = await employeeService.updateEmployee(req.params.id, req.body);
    res.json({
      success: true,
      data: employee,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
