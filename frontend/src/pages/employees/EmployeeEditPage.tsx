import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useEmployee, useUpdateEmployee } from '../../hooks/useEmployees';
import { EmployeeForm } from '../../components/employees/EmployeeForm';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import type { Employee } from '../../types';

export function EmployeeEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: employee, isLoading } = useEmployee(id!);
  const updateEmployee = useUpdateEmployee();
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (data: Partial<Employee>) => {
    setServerError('');
    try {
      await updateEmployee.mutateAsync({ id: id!, data });
      navigate(`/employees/${id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message;
      setServerError(msg || 'Failed to update employee');
    }
  };

  if (isLoading) return <PageLoader />;

  if (!employee) {
    return (
      <div className="text-center py-12 text-gray-500">Employee not found.</div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Employee"
        subtitle={`Editing: ${employee.fullName}`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/employees/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <EmployeeForm
        defaultValues={employee}
        onSubmit={handleSubmit}
        isSubmitting={updateEmployee.isPending}
        serverError={serverError}
      />
    </div>
  );
}
