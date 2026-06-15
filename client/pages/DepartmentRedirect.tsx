import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/authContext';
import { Loader2 } from 'lucide-react';

export default function DepartmentRedirect() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(`/departments/${user.department}`, { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-jcf-bg-cream">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-jcf-primary-green mx-auto mb-4" />
        <p className="text-jcf-text-secondary">Redirecting to your department...</p>
      </div>
    </div>
  );
}
