// src/pages/SchedulesPage.jsx
import MainLayout from '../components/layout/MainLayout';
import UnderConstruction from './UnderConstruction';

function SchedulesPage() {
  return (
    <MainLayout pageTitle="Horarios">
      <UnderConstruction
        title="Gestión de Horarios"
        description="Aquí podrás configurar los horarios 
                     de atención de cada doctor."
      />
    </MainLayout>
  );
}

export default SchedulesPage;