import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Eye, Pencil, Trash2, Users } from 'lucide-react';
import { useEmployees, useDeleteEmployee } from '../../hooks/useEmployees';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, Thead, Tbody, Th, Td, Tr } from '../../components/ui/Table';
import { EmployeeStatusBadge } from '../../components/ui/Badge';
import { Pagination } from '../../components/ui/Pagination';
import { Modal } from '../../components/ui/Modal';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { toast } from 'sonner';

const departmentOptions = [
  { value: '', label: 'All Departments' },
  { value: 'Development', label: 'Development' },
  { value: 'Design', label: 'Design' },
  { value: 'QA', label: 'QA' },
  { value: 'HR', label: 'HR' },
  { value: 'Sales', label: 'Sales' },
];

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'On Leave', label: 'On Leave' },
];

export function EmployeeListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';
  const department = searchParams.get('department') || '';
  const status = searchParams.get('status') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading } = useEmployees({ page, limit: 10, search, department, status });
  const deleteEmployee = useDeleteEmployee();

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
      await deleteEmployee.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch {
      // error toast handled in hook
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle="Manage your team members"
        actions={
          <Button onClick={() => navigate('/employees/new')}>
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search by name or email..."
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
            options={statusOptions}
            value={status}
            onChange={(e) => updateParams({ status: e.target.value, page: '1' })}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {isLoading ? (
          <PageLoader />
        ) : !data || data.data.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No employees found"
            description="Try adjusting your filters or add a new employee."
            action={
              <Button onClick={() => navigate('/employees/new')}>
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            }
          />
        ) : (
          <>
            <Table>
              <Thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Full Name</Th>
                  <Th>Email</Th>
                  <Th>Department</Th>
                  <Th>Status</Th>
                  <Th>Active Tasks</Th>
                  <Th>Actions</Th>
                </tr>
              </Thead>
              <Tbody>
                {data.data.map((emp) => (
                  <Tr key={emp._id}>
                    <Td className="font-mono text-xs text-gray-500">{emp.employeeId}</Td>
                    <Td className="font-medium text-gray-900">{emp.fullName}</Td>
                    <Td className="text-gray-500">{emp.email}</Td>
                    <Td>{emp.department}</Td>
                    <Td>
                      <EmployeeStatusBadge status={emp.status} />
                    </Td>
                    <Td>
                      <span
                        className={`font-semibold ${
                          emp.activeTasks > 0 ? 'text-brand-dark' : 'text-gray-400'
                        }`}
                      >
                        {emp.activeTasks}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/employees/${emp._id}`)}
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/employees/${emp._id}/edit`)}
                          className="p-1.5 rounded text-gray-500 hover:bg-gray-100 hover:text-brand"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (emp.activeTasks > 0) {
                              toast.error(`Cannot delete ${emp.fullName}: employee has ${emp.activeTasks} active task(s).`);
                              return;
                            }
                            setDeleteTarget({ id: emp._id, name: emp.fullName });
                          }}
                          className="p-1.5 rounded text-gray-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
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
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteEmployee.isPending}
      />
    </div>
  );
}
