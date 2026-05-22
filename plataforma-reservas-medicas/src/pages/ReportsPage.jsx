// src/pages/ReportsPage.jsx
import MainLayout from '../components/layout/MainLayout';
import UnderConstruction from './UnderConstruction';

function ReportsPage() {
  return (
    <MainLayout pageTitle="Reportes">
      <UnderConstruction
        title="Reportes Operativos"
        description="Aquí podrás ver reportes de ocupación 
                     de consultorios, productividad médica y más."
      />
    </MainLayout>
  );
}

export default ReportsPage;