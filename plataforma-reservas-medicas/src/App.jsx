import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      {/* Redirige la raíz "/" al dashboard */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;