import { AppLayout } from '@/shared/layouts/AppLayout';
import CarcinomeDashboardContent from './CarcinomeDashboardContent';
import { CarcinomeProvider, useCarcinome } from '../context/CarcinomeContext';
import { CarcinomeNav } from '../components/CarcinomeNav';

function CarcinomaDashboardWithNav() {
  const { activeTab, setActiveTab } = useCarcinome();

  return (
    <AppLayout
      departmentName="Carcinome"
      secondaryNav={<CarcinomeNav activeTab={activeTab} onTabChange={setActiveTab} />}
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
