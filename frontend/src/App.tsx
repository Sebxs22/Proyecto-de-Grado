// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layout/MainLayout'; // Asumimos que tienes este archivo
import DashboardEstudiante from './pages/DashboardEstudiante'; // Y este también
import DashboardTutor from './pages/DashboardTutor';
import Home from './pages/Home';

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
          {/* AHORA LA RUTA RAÍZ VA A HOME PARA QUE DECIDA A DÓNDE IR */}
          <Route path="/" element={<Home />} />

          {/* MANTENEMOS LAS RUTAS ESPECÍFICAS DE LOS DASHBOARDS */}
          <Route path="/dashboard/estudiante" element={<DashboardEstudiante />} />
          <Route path="/dashboard/tutor" element={<DashboardTutor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;