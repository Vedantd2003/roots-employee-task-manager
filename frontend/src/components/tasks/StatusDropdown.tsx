import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { StatusBadge } from '../ui/Badge';
import { useUpdateTaskStatus } from '../../hooks/useTasks';
import type { TaskStatus } from '../../types';

const validTransitions: Record<TaskStatus, TaskStatus[]> = {
  Todo: ['In Progress', 'Cancelled'],
  'In Progress': ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

const statusColorMap: Record<TaskStatus, string> = {
  Todo: 'text-gray-700 hover:bg-gray-50',
  'In Progress': 'text-blue-700 hover:bg-blue-50',
  Completed: 'text-green-700 hover:bg-green-50',
  Cancelled: 'text-red-600 hover:bg-red-50',
};

interface StatusDropdownProps {
  taskId: string;
  currentStatus: TaskStatus;
}

export function StatusDropdown({ taskId, currentStatus }: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const updateStatus = useUpdateTaskStatus();

  const nextStatuses = validTransitions[currentStatus];

  if (nextStatuses.length === 0) {
    return <StatusBadge status={currentStatus} />;
  }

  const handleSelect = async (status: TaskStatus) => {
    setOpen(false);
    await updateStatus.mutateAsync({ id: taskId, status });
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        disabled={updateStatus.isPending}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
          border transition-colors
          ${currentStatus === 'Todo' ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : ''}
          ${currentStatus === 'In Progress' ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200' : ''}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {currentStatus}
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[140px]">
            {nextStatuses.map((status) => (
              <button
                key={status}
                onClick={() => handleSelect(status)}
                className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${statusColorMap[status]}`}
              >
                {status}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
