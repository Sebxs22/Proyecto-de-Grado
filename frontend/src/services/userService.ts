// frontend/src/services/userService.ts
import axiosClient from '../api/axiosClient';

interface User {
  nombre: string;
  correo: string;
  rol: 'estudiante' | 'tutor' | 'coordinador';
  id: number;
}

export const getMyUserData = async (): Promise<User> => {
  try {
    const response = await axiosClient.get('/users/me');
    return response.data;
  } catch (error) {
    console.error("Error al obtener los datos del usuario:", error);
    throw error;
  }
};