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


// --- INICIO DE LA MODIFICACIÓN ---

// Definimos la interfaz completa de lo que esperamos recibir
export interface TutoriaEstudiante {
    id: number;
    fecha: string;
    tema: string | null;
    modalidad: string;
    estado: 'solicitada' | 'programada' | 'cancelada' | 'realizada' | 'no_asistio';
    enlace_reunion: string | null;
    evaluacion: any;
    tutor: {
        usuario: {
            nombre: string;
        };
    };
    matricula: {
        asignatura: {
            nombre: string;
        };
    };
}

/**
 * Obtiene la lista de tutorías para el estudiante autenticado.
 */
export const getMisTutorias = async (): Promise<TutoriaEstudiante[]> => {
    try {
        const response = await axiosClient.get('/tutorias/');
        return response.data;
    } catch (error) {
        console.error("Error al obtener las tutorías del estudiante:", error);
        throw error;
    }
};

// --- FIN DE LA MODIFICACIÓN ---