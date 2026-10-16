import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../lib/api';
import type { Employee, PaginatedResponse } from '../types';

interface EmployeeParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

function extractMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response &&
    error.response.data &&
    typeof error.response.data === 'object' &&
    'message' in error.response.data
  ) {
    return String((error.response.data as { message: string }).message);
  }
  return 'An unexpected error occurred';
}

export function useEmployees(params: EmployeeParams = {}) {
  return useQuery<PaginatedResponse<Employee>>({
    queryKey: ['employees', params],
    queryFn: async () => {
      const { data } = await api.get('/employees', { params });
      return data;
    },
  });
}

export function useEmployee(id: string) {
  return useQuery<Employee>({
    queryKey: ['employees', id],
    queryFn: async () => {
      const { data } = await api.get(`/employees/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (employeeData: Omit<Employee, '_id' | 'activeTasks'>) => {
      const { data } = await api.post('/employees', employeeData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee created successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractMessage(error));
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Employee> }) => {
      const { data: responseData } = await api.put(`/employees/${id}`, data);
      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractMessage(error));
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/employees/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractMessage(error));
    },
  });
}
