// frontend/src/layout/MainLayout.tsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../services/authService';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    window.location.reload(); // Forzamos un refresco para limpiar el estado
  };

  return (
    <div className="w-64 bg-gray-800 text-white p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-xl font-bold mb-4">Tutorías UNACH</h2>
        <nav>
          <ul>
            <li className="mb-2 p-2 rounded bg-gray-700 cursor-pointer">Dashboard</li>
          </ul>
        </nav>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="w-full text-left p-2 rounded hover:bg-red-500 font-semibold"
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