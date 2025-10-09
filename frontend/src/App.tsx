// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layout/MainLayout'; // Asumimos que tienes este archivo
import DashboardEstudiante from './pages/DashboardEstudiante'; // Y este también

// Guardia para proteger rutas
const PrivateRoutes = () => {
  const isAuthenticated = !!localStorage.getItem('accessToken');
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Navigate to="/dashboard/estudiante" replace />} />
          <Route path="/dashboard/estudiante" element={<DashboardEstudiante />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;