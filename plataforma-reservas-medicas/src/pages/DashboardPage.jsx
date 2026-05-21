import MainLayout from "../components/layout/MainLayout";

function DashboardPage() {
  return (
    <MainLayout pageTitle="Dashboard">
      {/* Contenido temporal solo para ver el layout */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}>
        <h2>¡El layout funciona! 🎉</h2>
        <p>Aquí irá el contenido del dashboard.</p>
      </div>
    </MainLayout>
  );
}

export default DashboardPage;