import { AppLayout } from '@/shared/layouts/AppLayout';
import CarcinomeDashboardContent from './CarcinomeDashboardContent';

export default function CarcinomaDashboard() {
  return (
    <AppLayout departmentName="Carcinome">
      <CarcinomeDashboardContent />
    </AppLayout>
  );
}
