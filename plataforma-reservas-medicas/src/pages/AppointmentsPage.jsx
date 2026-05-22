// src/pages/AppointmentsPage.jsx
import MainLayout from '../components/layout/MainLayout';
import UnderConstruction from './UnderConstruction';

function AppointmentsPage() {
  return (
    <MainLayout pageTitle="Citas Médicas">
      <UnderConstruction
        title="Gestión de Citas"
        description="Aquí podrás agendar, confirmar y 
                     gestionar todas las citas médicas."
      />
    </MainLayout>
  );
}

export default AppointmentsPage;