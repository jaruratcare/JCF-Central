import React from 'react';
import { AppLayout } from '@/shared/layouts/AppLayout';

export default function PRDashboard() {
  return (
    <AppLayout departmentName="PR">
      <div className="space-y-6">
        <div className="bg-jcf-card-white rounded-xl shadow p-8 text-center">
          <h3 className="text-2xl font-bold text-jcf-text-primary mb-3">PR Dashboard</h3>
          <p className="text-jcf-text-secondary mb-6">
            Dashboard Integration Point
          </p>
          <p className="text-sm text-jcf-text-secondary">
            This is a placeholder. The PR team will develop and integrate their dashboard here.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
