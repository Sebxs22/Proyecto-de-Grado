// frontend/src/services/tutorDashboardService.ts

import axiosClient from '../api/axiosClient';

// --- Interfaces para tipar los datos que recibimos de la API ---

export interface CursoTutor {
  matricula_id: number;
  estudiante_id: number;
  estudiante_nombre: string; // ✅ Nombre real del estudiante
  asignatura: string;
  periodo: string;
  
  parcial1: number | null;
  parcial2: number | null;
  final: number | null;
  situacion: string | null;
  
  // ✅ DATOS DE IA (Agregados para que funcionen las tarjetas)
  riesgo_nivel: string | null;
  riesgo_color: string | null;
  probabilidad_riesgo: number | null;
  mensaje_explicativo: string | null;
  tutorias_acumuladas: number | null;
}

export interface TutoriaPendiente {
  id: number;
  fecha_solicitada: string;
  tema: string;
  estudiante: string; 
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
    enlaceReunion: string | null = null 
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