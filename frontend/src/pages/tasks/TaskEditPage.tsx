import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { useTask, useUpdateTask } from '../../hooks/useTasks';
import { TaskForm } from '../../components/tasks/TaskForm';
import { PageHeader } from '../../components/layout/PageHeader';
import { Button } from '../../components/ui/Button';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import type { Task } from '../../types';

const terminalStatuses = ['Completed', 'Cancelled'];

export function TaskEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: task, isLoading } = useTask(id!);
  const updateTask = useUpdateTask();
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (task && terminalStatuses.includes(task.status)) {
      navigate(`/tasks/${id}`, { replace: true });
    }
  }, [task, id, navigate]);

  const handleSubmit = async (data: Partial<Task>) => {
    setServerError('');
    try {
      await updateTask.mutateAsync({ id: id!, data });
      navigate(`/tasks/${id}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const msg = axiosErr?.response?.data?.message;
      setServerError(msg || 'Failed to update task');
    }
  };

  if (isLoading) return <PageLoader />;

  if (!task) {
    return <div className="text-center py-12 text-gray-500">Task not found.</div>;
  }

  if (terminalStatuses.includes(task.status)) {
    return (
      <div className="space-y-4">
        <PageHeader title="Edit Task" />
        <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700">
            This task is <strong>{task.status}</strong> and cannot be edited.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/tasks/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
          Back to Task
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Task"
        subtitle={`Editing: ${task.title}`}
        actions={
          <Button variant="outline" onClick={() => navigate(`/tasks/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        }
      />
      <TaskForm
        defaultValues={task}
        onSubmit={handleSubmit}
        isSubmitting={updateTask.isPending}
        serverError={serverError}
      />
    </div>
  );
}
