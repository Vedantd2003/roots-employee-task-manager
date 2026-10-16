import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Download, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import { useTasks, useDeleteTask } from '../../hooks/useTasks';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, Thead, Tbody, Th, Td, Tr } from '../../components/ui/Table';
import { PriorityBadge, OverdueBadge } from '../../components/ui/Badge';
import { StatusDropdown } from '../../components/tasks/StatusDropdown';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'sonner';
import type { TaskStatus } from '../../types';

const departmentOptions = [
  { value: '', label: 'All Departments' },
  { value: 'Development', label: 'Development' },
  { value: 'Design', label: 'Design' },
  { value: 'QA', label: 'QA' },
  { value: 'HR', label: 'HR' },
  { value: 'Sales', label: 'Sales' },
];

const priorityOptions = [
  { value: '', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Todo', label: 'Todo' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const terminalStatuses: TaskStatus[] = ['Completed', 'Cancelled'];

export function TaskListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const priority = searchParams.get('priority') || '';
  const status = searchParams.get('status') || '';
  const dueDateFrom = searchParams.get('dueDateFrom') || '';
  const dueDateTo = searchParams.get('dueDateTo') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; status: TaskStatus } | null>(null);

  const { data, isLoading } = useTasks({
    page,
    limit: 10,
    search,
    department,
    priority,
    status,
    dueDateFrom,
    dueDateTo,
  });

  const deleteTask = useDeleteTask();

  const updateParams = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v);
      else next.delete(k);
    });
    setSearchParams(next);
  };

  const handleSearch = () => {
    updateParams({ search: searchInput, page: '1' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTask.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error handled in hook
    }
  };

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (department) params.set('department', department);
    if (priority) params.set('priority', priority);
    if (status) params.set('status', status);
    if (dueDateFrom) params.set('dueDateFrom', dueDateFrom);
    if (dueDateTo) params.set('dueDateTo', dueDateTo);
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    window.open(`${baseUrl}/tasks/export.csv?${params}`, '_blank');
  };

  const formatDate = (d: string) => {
    try {
      return format(new Date(d), 'MMM d, yyyy');
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        subtitle="Manage and track all tasks"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4" />
              Export To CSV
            </Button>
            <Button onClick={() => navigate('/tasks/new')}>
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by title..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button variant="secondary" onClick={handleSearch}>
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Select
            options={departmentOptions}
            value={department}
            onChange={(e) => updateParams({ department: e.target.value, page: '1' })}
          />
          <Select
            options={priorityOptions}
            value={priority}
            onChange={(e) => updateParams({ priority: e.target.value, page: '1' })}
          />
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          />
        </div>
        {/* Date Range */}
        <div className="flex flex-wrap gap-3 mt-3 items-end">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">Due From:</label>
            <input
              type="date"
              value={dueDateFrom}
              onChange={(e) => updateParams({ dueDateFrom: e.target.value, page: '1' })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 whitespace-nowrap">Due To:</label>
            <input
              type="date"
              value={dueDateTo}
              onChange={(e) => updateParams({ dueDateTo: e.target.value, page: '1' })}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          {(dueDateFrom || dueDateTo || search || department || priority || status) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput('');
                setSearchParams(new URLSearchParams());
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <PageLoader />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No tasks found"
            description="Try adjusting your filters or add a new task."
            action={
              <Button onClick={() => navigate('/tasks/new')}>
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Title</Th>
                  <Th>Employee</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Due Date</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {data.data.map((task) => {
                  const employeeName = task.assignedEmployee
                    ? task.assignedEmployee.fullName
                    : task.employeeSnapshot?.fullName || 'Unassigned';
                  const isDeleted = !task.assignedEmployee && task.employeeSnapshot?.fullName;

                  return (
                    <Tr key={task._id}>
                      <Td className="font-mono text-xs text-gray-500">{task.taskId}</Td>
                      <Td>
                        <div>
                          <p className="font-medium text-gray-900">{task.title}</p>
                          {task.department && (
                            <p className="text-xs text-gray-400">{task.department}</p>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <div>
                          <p className="text-gray-700">{employeeName}</p>
                          {isDeleted && (
                            <p className="text-xs text-red-400">(deleted)</p>
                          )}
                        </div>
                      </Td>
                      <Td>
                        <PriorityBadge priority={task.priority} />
                      </Td>
                      <Td>
                        <StatusDropdown taskId={task._id} currentStatus={task.status} />
                      </Td>
                      <Td>
                        <div className="flex flex-col gap-1">
                          <span className={task.isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}>
                            {formatDate(task.dueDate)}
                          </span>
                          {task.isOverdue && <OverdueBadge />}
                        </div>
                      </Td>
                      <Td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => navigate(`/tasks/${task._id}`)}
                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/tasks/${task._id}/edit`)}
                            className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-brand"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (!terminalStatuses.includes(task.status)) {
                                toast.error('Tasks can only be deleted when Completed or Cancelled.');
                                return;
                              }
                              setDeleteTarget({ id: task._id, title: task.title, status: task.status });
                            }}
                            className={`p-1.5 rounded transition-colors ${
                              terminalStatuses.includes(task.status)
                                ? 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={
                              terminalStatuses.includes(task.status)
                                ? 'Delete'
                                : 'Only Completed or Cancelled tasks can be deleted'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
            <div className="px-4 border-t border-gray-100">
              <Pagination
                page={page}
                totalPages={data.pagination.totalPages}
                total={data.pagination.total}
                limit={data.pagination.limit}
                onPageChange={(p) => updateParams({ page: String(p) })}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteTask.isPending}
      />
    </div>
  );
}
