// frontend/src/services/cmiService.ts
import axiosClient from '../api/axiosClient';

interface CmiData {
  perspectiva_estudiante: {
    tasa_asistencia: number;
    satisfaccion_promedio: number;
  };
  perspectiva_procesos: {
    total_sesiones_realizadas: number;
    distribucion_estados: { name: string; value: number }[];
  };
  perspectiva_recursos: {
    total_tutores: number;
    total_estudiantes: number;
    ratio_tutor_estudiante: number;
  };
}

export interface CoordinatorDashboard {
  nombre: string;
  cmi: CmiData;
}

export const getCoordinatorDashboard = async (): Promise<CoordinatorDashboard> => {
  try {
    const response = await axiosClient.get('/dashboard/coordinator');
    return response.data;
  } catch (error) {
    console.error("Error al obtener el dashboard del coordinador:", error);
    throw error;
  }
};