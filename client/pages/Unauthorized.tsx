import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/authContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-jcf-bg-cream p-4">
      <div className="text-center max-w-md">
        <Lock className="w-16 h-16 text-jcf-danger mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-jcf-text-primary mb-2">
          403 Unauthorized
        </h1>
        <p className="text-jcf-text-secondary mb-6">
          You don't have permission to access this department. You've been assigned to the <span className="font-semibold text-jcf-text-primary">{user?.department}</span> department.
        </p>
        <Button
          onClick={() => user ? navigate(`/departments/${user.department}`) : navigate('/login')}
          className="bg-jcf-primary-green hover:bg-opacity-90 text-white"
        >
          Go to Your Department
        </Button>
      </div>
    </div>
  );
}
