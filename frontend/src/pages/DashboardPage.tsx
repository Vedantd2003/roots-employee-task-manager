import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Calendar,
  ClipboardList,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  CircleDot,
} from 'lucide-react';
import { useDashboard } from '../hooks/useDashboard';
import { StatCard } from '../components/dashboard/StatCard';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/LoadingSpinner';
import { Table, Thead, Tbody, Th, Td, Tr } from '../components/ui/Table';

export function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <PageLoader />;

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600">Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  const employees = data?.employees ?? { total: 0, active: 0, inactive: 0, onLeave: 0 };
  const tasks = data?.tasks ?? {
    total: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0,
    overdue: 0,
  };
  const workload = data?.workload ?? [];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Overview of employees and tasks" />

      {/* Employee Stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Employees
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Employees" value={employees.total} icon={Users} color="default" />
          <StatCard label="Active" value={employees.active} icon={UserCheck} color="green" />
          <StatCard label="Inactive" value={employees.inactive} icon={UserX} color="gray" />
          <StatCard label="On Leave" value={employees.onLeave} icon={Calendar} color="yellow" />
        </div>
      </section>

      {/* Task Stats */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Tasks
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard label="Total Tasks" value={tasks.total} icon={ClipboardList} color="default" />
          <StatCard label="Todo" value={tasks.todo} icon={CircleDot} color="gray" />
          <StatCard label="In Progress" value={tasks.inProgress} icon={Clock} color="blue" />
          <StatCard label="Completed" value={tasks.completed} icon={CheckCircle2} color="green" />
          <StatCard label="Cancelled" value={tasks.cancelled} icon={XCircle} color="gray" />
          <StatCard label="Overdue" value={tasks.overdue} icon={AlertTriangle} color="red" />
        </div>
      </section>

      {/* Employee Workload */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Employee Workload
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          {workload.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">No workload data available</div>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>#</Th>
                  <Th>Employee</Th>
                  <Th>Active Tasks</Th>
                  <Th>Workload</Th>
                </tr>
              </Thead>
              <Tbody>
                {workload.map((emp, idx) => {
                  const maxTasks = Math.max(...workload.map((e) => e.activeTasks), 1);
                  const pct = Math.round((emp.activeTasks / maxTasks) * 100);
                  return (
                    <Tr key={emp.employeeId}>
                      <Td className="text-gray-400 w-12">{idx + 1}</Td>
                      <Td className="font-medium text-gray-900">{emp.fullName}</Td>
                      <Td>
                        <span
                          className={`font-semibold ${
                            emp.activeTasks >= 5
                              ? 'text-red-600'
                              : emp.activeTasks >= 3
                              ? 'text-orange-500'
                              : 'text-gray-900'
                          }`}
                        >
                          {emp.activeTasks}
                        </span>
                      </Td>
                      <Td className="w-48">
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              pct >= 80
                                ? 'bg-red-500'
                                : pct >= 50
                                ? 'bg-orange-400'
                                : 'bg-brand'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </div>
      </section>
    </div>
  );
}
