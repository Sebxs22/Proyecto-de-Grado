// frontend/src/pages/Home.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyUserData } from '../services/userService';

const Home: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserRoleAndRedirect = async () => {
      try {
        const user = await getMyUserData();
        if (user.rol === 'tutor') {
          navigate('/dashboard/tutor');
        } else if (user.rol === 'estudiante') {
          navigate('/dashboard/estudiante');
        } else {
          // Redirección por defecto si el rol no es manejado
          navigate('/login');
        }
      } catch (error) {
        // Si hay un error (ej. token inválido), enviar al login
        navigate('/login');
      }
    };

    checkUserRoleAndRedirect();
  }, [navigate]);

  // Muestra un mensaje de carga mientras se determina la ruta
  return <div className="text-center p-12">Cargando...</div>;
};

export default Home;