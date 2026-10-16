import Task from '../models/Task';
import Employee from '../models/Employee';

export interface DashboardData {
  employeeStats: {
    total: number;
    byStatus: Record<string, number>;
  };
  taskStats: {
    total: number;
    byStatus: Record<string, number>;
    overdueCount: number;
  };
  workload: {
    employeeId: string;
    fullName: string;
    department: string;
    activeTasks: number;
  }[];
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    employeeByStatus,
    taskByStatus,
    overdueCount,
    workloadAgg,
  ] = await Promise.all([
    // Employee counts by status
    Employee.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Task counts by status
    Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),

    // Overdue tasks
    Task.countDocuments({
      status: { $nin: ['Completed', 'Cancelled'] },
      dueDate: { $lt: today },
    }),

    // Employee workload for active tasks
    Task.aggregate([
      {
        $match: {
          status: { $in: ['Todo', 'In Progress'] },
          assignedEmployee: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$assignedEmployee',
          activeTasks: { $sum: 1 },
          snapshot: { $first: '$employeeSnapshot' },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeData',
        },
      },
      {
        $unwind: {
          path: '$employeeData',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          employeeId: {
            $ifNull: ['$employeeData.employeeId', '$snapshot.employeeId'],
          },
          fullName: {
            $ifNull: ['$employeeData.fullName', '$snapshot.fullName'],
          },
          department: {
            $ifNull: ['$employeeData.department', '$snapshot.department'],
          },
          activeTasks: 1,
        },
      },
      { $sort: { activeTasks: -1 } },
    ]),
  ]);

  // Build employee stats
  const employeeStatusMap: Record<string, number> = {};
  let totalEmployees = 0;
  for (const item of employeeByStatus) {
    employeeStatusMap[item._id as string] = item.count as number;
    totalEmployees += item.count as number;
  }

  // Build task stats
  const taskStatusMap: Record<string, number> = {};
  let totalTasks = 0;
  for (const item of taskByStatus) {
    taskStatusMap[item._id as string] = item.count as number;
    totalTasks += item.count as number;
  }

  // Format workload
  const workload = workloadAgg.map((item) => ({
    employeeId: item.employeeId as string,
    fullName: item.fullName as string,
    department: item.department as string,
    activeTasks: item.activeTasks as number,
  }));

  return {
    employeeStats: {
      total: totalEmployees,
      byStatus: employeeStatusMap,
    },
    taskStats: {
      total: totalTasks,
      byStatus: taskStatusMap,
      overdueCount,
    },
    workload,
  };
}
