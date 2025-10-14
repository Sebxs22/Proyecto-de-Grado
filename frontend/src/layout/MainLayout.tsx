// frontend/src/layout/MainLayout.tsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
// import { logout } from '../services/authService'; // ✅ ELIMINADO
import { useAuth } from '../context/AuthContext'; // ✅ AGREGADO

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth(); // ✅ USANDO CONTEXT

  const handleLogout = () => {
    logout();
    navigate('/login');
    // ✅ ELIMINADO: Ya no necesitamos window.location.reload()
  };

  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-4">Tutorías UNACH</h2>
        {user && ( // ✅ OPCIONAL: Mostrar nombre y rol
            <p className="text-sm text-gray-400 mb-4">
                {user.nombre} ({user.rol})
            </p>
        )}
        <nav>
          <ul>
            {/* El link al dashboard redirige a la raíz para que Home.tsx maneje el rol */}
            <li 
              className="mb-2 p-2 rounded hover:bg-gray-700 cursor-pointer transition-colors"
              onClick={() => navigate('/')}
            >
                Dashboard
            </li>
          </ul>
        </nav>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="w-full text-left p-2 rounded bg-red-600 hover:bg-red-700 font-semibold transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

const MainLayout: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
};

export default MainLayout;