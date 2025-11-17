// frontend/src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext'; // ✅ AGREGADO

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { checkAuth } = useAuth(); // ✅ AGREGADO
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(correo, contrasena);
      // ✅ IMPORTANTE: Forzamos la actualización del estado del usuario en el Context
      await checkAuth(); 
      
      // Navegamos a la raíz. Home.tsx ahora podrá leer el rol inmediatamente del context.
      navigate('/'); 
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
    }
  };


  return (
    // 1. Fondo con degradado institucional (Azul a Rojo)
    <div className="flex items-center justify-center h-screen bg-unach-gradient">
      
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-xl shadow-2xl border-t-4 border-unach-red">
        
        {/* 2. Encabezado más corporativo */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-unach-blue">
            Sistema de Tutorías
          </h2>
          <p className="text-sm text-gray-500 mt-2">Universidad Nacional de Chimborazo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Correo Institucional
            </label>
            <input
              type="text"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@unach.edu.ec"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unach-blue focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-unach-blue focus:border-transparent outline-none transition-all"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded bg-red-50 text-unach-red text-sm font-medium text-center border border-red-100">
              {error}
            </div>
          )}

          {/* 3. Botón con el color primario (Azul) y hover secundario (Rojo) */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-unach-blue text-white font-bold rounded-lg hover:bg-unach-red transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Iniciar Sesión
          </button>
        </form>
        
        <div className="text-center mt-4">
          <p className="text-xs text-gray-400">
            © 2025 Facultad de Ingeniería - UNACH
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;