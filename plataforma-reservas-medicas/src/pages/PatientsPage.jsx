// src/pages/PatientsPage.jsx
import MainLayout from '../components/layout/MainLayout';
import UnderConstruction from './UnderConstruction';

function PatientsPage() {
  return (
    <MainLayout pageTitle="Pacientes">
      <UnderConstruction
        title="Gestión de Pacientes"
        description="Aquí podrás registrar, buscar y gestionar 
                     la información de todos los pacientes."
      />
    </MainLayout>
  );
}

export default PatientsPage;