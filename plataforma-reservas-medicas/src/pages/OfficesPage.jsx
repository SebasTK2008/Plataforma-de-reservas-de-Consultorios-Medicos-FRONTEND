// src/pages/OfficesPage.jsx
import MainLayout from '../components/layout/MainLayout';
import UnderConstruction from './UnderConstruction';

function OfficesPage() {
  return (
    <MainLayout pageTitle="Consultorios">
      <UnderConstruction
        title="Gestión de Consultorios"
        description="Aquí podrás administrar los consultorios 
                     y su disponibilidad."
      />
    </MainLayout>
  );
}

export default OfficesPage;