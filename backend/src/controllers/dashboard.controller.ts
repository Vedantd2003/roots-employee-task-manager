import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboard.service';

export async function getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await dashboardService.getDashboardData();
    res.json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
}
