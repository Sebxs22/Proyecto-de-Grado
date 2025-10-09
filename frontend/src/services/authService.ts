// frontend/src/services/authService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const login = async (correo: string, contrasena: string) => {
  const params = new URLSearchParams();
  params.append('username', correo);
  params.append('password', contrasena);

  try {
    const response = await axios.post(`${API_BASE_URL}/auth/token`, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    if (response.data.access_token) {
      localStorage.setItem('accessToken', response.data.access_token);
    }
    return response.data;
  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('accessToken');
};