import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { EmployeeListPage } from './pages/employees/EmployeeListPage';
import { EmployeeAddPage } from './pages/employees/EmployeeAddPage';
import { EmployeeDetailPage } from './pages/employees/EmployeeDetailPage';
import { EmployeeEditPage } from './pages/employees/EmployeeEditPage';
import { TaskListPage } from './pages/tasks/TaskListPage';
import { TaskAddPage } from './pages/tasks/TaskAddPage';
import { TaskDetailPage } from './pages/tasks/TaskDetailPage';
import { TaskEditPage } from './pages/tasks/TaskEditPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="employees" element={<EmployeeListPage />} />
        <Route path="employees/new" element={<EmployeeAddPage />} />
        <Route path="employees/:id" element={<EmployeeDetailPage />} />
        <Route path="employees/:id/edit" element={<EmployeeEditPage />} />
        <Route path="tasks" element={<TaskListPage />} />
        <Route path="tasks/new" element={<TaskAddPage />} />
        <Route path="tasks/:id" element={<TaskDetailPage />} />
        <Route path="tasks/:id/edit" element={<TaskEditPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
