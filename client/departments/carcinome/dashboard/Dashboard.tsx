import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/shared/layouts/AppLayout';
import CarcinomeDashboardContent from './CarcinomeDashboardContent';
import { CarcinomeProvider, useCarcinome } from '../context/CarcinomeContext';
import { CarcinomeNav } from '../components/CarcinomeNav';

function CarcinomaDashboardWithNav() {
  const { activeTab, setActiveTab } = useCarcinome();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/patients')) {
      setActiveTab('patients');
    } else if (path.includes('/sessions')) {
      setActiveTab('sessions');
    } else if (path.includes('/tasks')) {
      setActiveTab('tasks');
    } else if (path.includes('/billing')) {
      setActiveTab('billing');
    } else if (path.includes('/payments')) {
      setActiveTab('payments');
    } else if (path.includes('/reports')) {
      setActiveTab('reports');
    } else if (path.includes('/outreach')) {
      setActiveTab('outreach');
    } else if (path.includes('/master-data')) {
      setActiveTab('master-data');
    } else if (path.includes('/audit')) {
      setActiveTab('audit');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname, setActiveTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);

    const pathMap: Record<string, string> = {
      dashboard: '/departments/carcinome/dashboard',
      patients: '/departments/carcinome/patients',
      sessions: '/departments/carcinome/sessions',
      tasks: '/departments/carcinome/tasks',
      billing: '/departments/carcinome/billing',
      payments: '/departments/carcinome/payments',
      reports: '/departments/carcinome/reports',
      outreach: '/departments/carcinome/outreach',
      'master-data': '/departments/carcinome/master-data',
      audit: '/departments/carcinome/audit',
    };

    navigate(pathMap[tabId] ?? '/departments/carcinome/dashboard');
  };

  return (
    <AppLayout
      departmentName="Carcinome"
      secondaryNav={<CarcinomeNav activeTab={activeTab} onTabChange={handleTabChange} />}
    >
      <CarcinomeDashboardContent />
    </AppLayout>
  );
}

export default function CarcinomaDashboard() {
  return (
    <CarcinomeProvider>
      <CarcinomaDashboardWithNav />
    </CarcinomeProvider>
  );
}
