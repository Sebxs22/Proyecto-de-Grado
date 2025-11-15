// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import MainLayout from './layout/MainLayout';
import DashboardEstudiante from './pages/DashboardEstudiante'; 
import DashboardTutor from './pages/DashboardTutor';
import Home from './pages/Home';
import { useAuth } from './context/AuthContext'; // ✅ AGREGADO
import MisTutorias from './pages/MisTutorias'; // ✅ AGREGADO
import TutoriasTutor from './pages/TutoriasTutor'; // ✅ AGREGADO
import DashboardCoordinador from './pages/DashboardCoordinador'; // ✅ AÑADIDO
import ReportesCoordinador from './pages/ReportesCoordinador';

// Guardia para proteger rutas
const PrivateRoutes = () => {
  const { isAuthenticated, loading } = useAuth(); // ✅ USANDO CONTEXT

  if (loading) {
    // Muestra un loader mientras se verifica el token
    return <div className="text-center p-12">Verificando sesión...</div>; 
  }

  // Si no está autenticado, redirige a login
  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" />;
};


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<PrivateRoutes />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard/estudiante" element={<DashboardEstudiante />} />
          <Route path="/dashboard/tutor" element={<DashboardTutor />} />
          <Route path="/dashboard/coordinador" element={<DashboardCoordinador />} /> {/* ✅ AÑADIDO */}
          <Route path="/tutorias/estudiante" element={<MisTutorias />} /> 
          <Route path="/tutorias/tutor" element={<TutoriasTutor />} /> 
          <Route path="/reportes/coordinador" element={<ReportesCoordinador />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;