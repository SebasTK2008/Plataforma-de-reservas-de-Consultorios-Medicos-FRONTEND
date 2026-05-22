// src/pages/SpecialtiesPage.jsx
import MainLayout from '../components/layout/MainLayout';
import UnderConstruction from './UnderConstruction';

function SpecialtiesPage() {
  return (
    <MainLayout pageTitle="Especialidades">
      <UnderConstruction
        title="Gestión de Especialidades"
        description="Aquí podrás administrar las especialidades 
                     médicas disponibles en el sistema."
      />
    </MainLayout>
  );
}

export default SpecialtiesPage;