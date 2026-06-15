import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/auth/authContext';
import { Department } from '@/auth/types';

interface DepartmentGuardProps {
  allowedDepartment: Department;
  children: React.ReactNode;
}

export const DepartmentGuard: React.FC<DepartmentGuardProps> = ({ allowedDepartment, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.department !== allowedDepartment) {
    return <Navigate to={`/departments/${user.department}`} replace />;
  }

  return <>{children}</>;
};
