// frontend/src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { getMyUserData } from '../services/userService';
import { logout as apiLogout } from '../services/authService';



// 1. Define las interfaces
interface User {
  nombre: string;
  correo: string;
  rol: 'estudiante' | 'tutor' | 'coordinador';
  id: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

// 2. Crea el Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 3. Define el Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Función para verificar el token y cargar el usuario
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const userData = await getMyUserData();
        setUser(userData);
      } catch (error) {
        // Token inválido o expirado, lo limpiamos
        localStorage.removeItem('accessToken');
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = () => {
    apiLogout();
    setUser(null); // Limpiamos el estado local del usuario
    setLoading(false); // No estamos cargando después del logout
  };

  const contextValue = {
    user,
    isAuthenticated: !!user,
    loading,
    checkAuth,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 4. Custom Hook para usar el Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};