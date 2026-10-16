import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Calendar, User, Tag, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTask } from '../../hooks/useTasks';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { StatusBadge, PriorityBadge, OverdueBadge } from '../../components/ui/Badge';
import { PageLoader } from '../../components/ui/LoadingSpinner';

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
        <Icon className="h-4 w-4 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="mt-0.5 text-sm text-gray-900">{value}</div>
      </div>
    </div>
  );
}

const terminalStatuses = ['Completed', 'Cancelled'];

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);

  if (isLoading) return <PageLoader />;

  if (!task) {
    return <div className="text-center py-12 text-gray-500">Task not found.</div>;
  }

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try {
      return format(new Date(d), 'MMM d, yyyy');
    } catch {
      return d;
    }
  };

  const isTerminal = terminalStatuses.includes(task.status);
  const employeeName = task.assignedEmployee
    ? task.assignedEmployee.fullName
    : task.employeeSnapshot?.fullName || 'Unassigned';
  const isDeleted = !task.assignedEmployee && task.employeeSnapshot?.fullName;

  return (
    <div className="space-y-6">
      <PageHeader
        title={task.title}
        subtitle={`Task ${task.taskId} · ${task.department}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/tasks')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              onClick={() => navigate(`/tasks/${id}/edit`)}
              disabled={isTerminal}
              title={isTerminal ? 'Terminal tasks cannot be edited' : 'Edit task'}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </div>
        }
      />

      {isTerminal && (
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 text-gray-400" />
          <p className="text-sm text-gray-500">
            This task is <strong>{task.status}</strong>. Editing is disabled.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-base font-semibold text-gray-900">Task Details</h3>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={task.priority} />
              <StatusBadge status={task.status} />
              {task.isOverdue && <OverdueBadge />}
            </div>
          </div>
          <div>
            <DetailRow icon={Tag} label="Task ID" value={<span className="font-mono">{task.taskId}</span>} />
            <DetailRow icon={Tag} label="Department" value={task.department} />
            <DetailRow
              icon={Calendar}
              label="Start Date"
              value={formatDate(task.startDate)}
            />
            <DetailRow
              icon={Calendar}
              label="Due Date"
              value={
                <span className={task.isOverdue ? 'text-red-600 font-medium' : ''}>
                  {formatDate(task.dueDate)}
                  {task.isOverdue && ' (Overdue)'}
                </span>
              }
            />
            <DetailRow icon={Calendar} label="Created" value={formatDate(task.createdDate)} />
            {task.completedDate && (
              <DetailRow icon={Calendar} label="Completed" value={formatDate(task.completedDate)} />
            )}
          </div>
        </div>

        {/* Employee + Description */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Assigned To</h3>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center flex-shrink-0">
                <User className="h-5 w-5 text-brand-dark" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{employeeName}</p>
                {task.employeeSnapshot?.department && (
                  <p className="text-sm text-gray-500">{task.employeeSnapshot.department}</p>
                )}
                {isDeleted && (
                  <p className="text-xs text-red-400 mt-1">Employee deleted from system</p>
                )}
              </div>
            </div>
          </div>

          {task.description && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
