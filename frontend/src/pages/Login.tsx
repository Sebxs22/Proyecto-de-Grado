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
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-xl">
        <h2 className="text-2xl font-bold text-center text-gray-800">Sistema de Tutorías</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Correo Electrónico</label>
            <input
              type="text"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700">
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;