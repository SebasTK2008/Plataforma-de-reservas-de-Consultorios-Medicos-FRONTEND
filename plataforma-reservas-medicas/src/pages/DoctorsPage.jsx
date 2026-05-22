// src/pages/DoctorsPage.jsx
import MainLayout from '../components/layout/MainLayout';
import UnderConstruction from './UnderConstruction';

function DoctorsPage() {
  return (
    <MainLayout pageTitle="Doctores">
      <UnderConstruction
        title="Gestión de Doctores"
        description="Aquí podrás registrar y gestionar 
                     los médicos y sus especialidades."
      />
    </MainLayout>
  );
}

export default DoctorsPage;