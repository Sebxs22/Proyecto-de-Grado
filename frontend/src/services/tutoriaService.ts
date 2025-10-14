// frontend/src/services/tutoriaService.ts
import axiosClient from '../api/axiosClient';

// ✅ CORRECCIÓN: Se añade 'export'
export interface TutoriaPayload { 
  matricula_id: number;
  tutor_id: number;
  fecha: string; // Formato ISO: "2025-10-25T14:00:00"
  duracion_min: number;
  tema: string;
  modalidad: 'Presencial' | 'Virtual';
}

export const crearTutoria = async (payload: TutoriaPayload) => {
  try {
    const response = await axiosClient.post('/tutorias/', payload);
    return response.data;
  } catch (error) {
    console.error("Error al agendar la tutoría:", error);
    throw error;
  }
};