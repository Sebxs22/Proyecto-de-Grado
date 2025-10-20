// frontend/src/pages/Home.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // ✅ AGREGADO

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth(); // ✅ USANDO CONTEXT

  useEffect(() => {
    // Si todavía está cargando, esperamos
    if (loading) return;
    
    // Si no está autenticado o no hay datos de usuario
    if (!isAuthenticated || !user) {
        navigate('/login');
        return;
    }

    // Redirección basada en el rol, obtenido del contexto
    if (user.rol === 'tutor') {
        navigate('/dashboard/tutor');
    } else if (user.rol === 'estudiante') {
        navigate('/dashboard/estudiante');
    } else if (user.rol === 'coordinador') { // ✅ AÑADIDO
        navigate('/dashboard/coordinador'); // ✅ AÑADIDO
    } else {
        // Redirección por defecto si el rol no es manejado
        navigate('/login');
    }

  }, [navigate, user, loading, isAuthenticated]); 

  // Muestra un mensaje de carga mientras se determina la ruta
  return <div className="text-center p-12">Cargando...</div>;
};

export default Home;