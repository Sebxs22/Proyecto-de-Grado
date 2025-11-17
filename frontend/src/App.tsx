// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy } from 'react'; // Nota: Ya no importamos Suspense aquí
import { AuthProvider, useAuth } from './context/AuthContext';
import PageLoader from './components/PageLoader'; // Usamos el mismo loader para la carga inicial

// Importaciones estáticas para lo crítico (Login y Layout)
import Login from './pages/Login';
import MainLayout from './layout/MainLayout';

// Lazy Loading para las páginas internas
const DashboardEstudiante = lazy(() => import('./pages/DashboardEstudiante'));
const DashboardTutor = lazy(() => import('./pages/DashboardTutor'));
const DashboardCoordinador = lazy(() => import('./pages/DashboardCoordinador'));
const MisTutorias = lazy(() => import('./pages/MisTutorias'));
const TutoriasTutor = lazy(() => import('./pages/TutoriasTutor'));
const ReportesCoordinador = lazy(() => import('./pages/ReportesCoordinador'));
const Home = lazy(() => import('./pages/Home'));

// Componente para proteger rutas
const PrivateRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return isAuthenticated ? <MainLayout /> : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
        <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* El Layout maneja su propio Suspense internamente ahora */}
              <Route element={<PrivateRoutes />}>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard/estudiante" element={<DashboardEstudiante />} />
                <Route path="/dashboard/tutor" element={<DashboardTutor />} />
                <Route path="/dashboard/coordinador" element={<DashboardCoordinador />} />
                <Route path="/tutorias/estudiante" element={<MisTutorias />} /> 
                <Route path="/tutorias/tutor" element={<TutoriasTutor />} /> 
                <Route path="/reportes/coordinador" element={<ReportesCoordinador />} />
              </Route>
            </Routes>
        </AuthProvider>
    </BrowserRouter>
  );
}

export default App;