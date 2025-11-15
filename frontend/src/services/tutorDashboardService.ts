// frontend/src/services/tutorDashboardService.ts

import axiosClient from '../api/axiosClient';

// --- Interfaces para tipar los datos que recibimos de la API ---
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
  // ✅ INICIO DE CAMPOS AÑADIDOS
  riesgo_nivel: string | null;
  riesgo_color: string | null;
  probabilidad_riesgo: number | null;
  // ✅ FIN DE CAMPOS AÑADIDOS
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
  average_rating: number;
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
export const actualizarEstadoTutoria = async (
    tutoriaId: number, 
    estadoFinal: 'programada' | 'cancelada' | 'realizada' | 'no_asistio', 
    enlaceReunion: string | null = null // ✅ CORREGIDO: AGREGAR ARGUMENTO OPCIONAL
) => {
  try {
    const payload: { estado: string; enlace_reunion?: string } = {
        estado: estadoFinal,
    };
    
    // Solo incluimos el enlace si es proporcionado
    if (enlaceReunion) {
        payload.enlace_reunion = enlaceReunion;
    }
    
    const response = await axiosClient.patch(`/tutorias/${tutoriaId}/estado`, payload);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar la tutoría:", error);
    throw error;
  }
};