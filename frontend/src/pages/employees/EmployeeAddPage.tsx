import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateEmployee } from '../../hooks/useEmployees';
import { EmployeeForm } from '../../components/employees/EmployeeForm';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import type { Employee } from '../../types';

export function EmployeeAddPage() {
  const navigate = useNavigate();
  const createEmployee = useCreateEmployee();
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (data: Partial<Employee>) => {
    setServerError('');
    try {
      await createEmployee.mutateAsync(data as Omit<Employee, '_id' | 'activeTasks'>);
      navigate('/employees');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message;
      setServerError(msg || 'Failed to create employee');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Employee"
        subtitle="Create a new team member"
        actions={
          <Button variant="outline" onClick={() => navigate('/employees')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <EmployeeForm
        onSubmit={handleSubmit}
        isSubmitting={createEmployee.isPending}
        serverError={serverError}
      />
    </div>
  );
}
