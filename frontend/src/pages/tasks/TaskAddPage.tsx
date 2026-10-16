import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateTask } from '../../hooks/useTasks';
import { TaskForm } from '../../components/tasks/TaskForm';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import type { Task } from '../../types';

export function TaskAddPage() {
  const navigate = useNavigate();
  const createTask = useCreateTask();
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (data: Partial<Task>) => {
    setServerError('');
    try {
      await createTask.mutateAsync(data);
      navigate('/tasks');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message;
      setServerError(msg || 'Failed to create task');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Task"
        subtitle="Create a new task"
        actions={
          <Button variant="outline" onClick={() => navigate('/tasks')}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <TaskForm
        onSubmit={handleSubmit}
        isSubmitting={createTask.isPending}
        serverError={serverError}
      />
    </div>
  );
}
