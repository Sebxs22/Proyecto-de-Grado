// frontend/src/services/tutorDashboardService.ts

import axiosClient from '../api/axiosClient';

// --- Interfaces para tipar los datos que recibimos de la API ---
interface CursoTutor {
  periodo: string;
  asignatura: string;
  estudiante_id: number;
  estudiante_nombre: string;
  parcial1: number | null;
  parcial2: number | null;
  final: number | null;
  situacion: string | null;
}

interface TutoriaPendiente {
  tutoria_id: number;
  fecha: string;
  tema: string;
  modalidad: string;
  estudiante_nombre: string;
  asignatura: string;
}

export interface TutorDashboard {
  nombre: string;
  cursos: CursoTutor[];
  tutorias_pendientes: TutoriaPendiente[];
}

// --- Funciones del Servicio ---

/**
 * Obtiene todos los datos necesarios para el dashboard del tutor.
 */
export const getTutorDashboard = async (): Promise<TutorDashboard> => {
  try {
    const response = await axiosClient.get('/dashboard/tutor');
    return response.data;
  } catch (error) {
    console.error("Error al obtener el dashboard del tutor:", error);
    throw error;
  }
};

/**
 * Actualiza el estado de una tutoría a 'programada' (aceptar) o 'cancelada' (rechazar).
 */
export const actualizarEstadoTutoria = async (tutoriaId: number, estado: 'programada' | 'cancelada') => {
  try {
    const response = await axiosClient.patch(`/tutorias/${tutoriaId}/estado`, { estado });
    return response.data;
  } catch (error) {
    console.error("Error al actualizar la tutoría:", error);
    throw error;
  }
};