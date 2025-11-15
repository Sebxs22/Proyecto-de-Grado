// frontend/src/services/reportService.ts
import axiosClient from '../api/axiosClient';

export interface ReportData {
  periodo: string;
  // ✅ CAMBIADO: de 'departamento' a 'carrera'
  carrera: string;
  tutor_nombre: string;
  asignatura: string;
  total_estudiantes: number;
  total_aprobados: number;
  total_reprobados: number;
  total_tutorias_registradas: number;
  tutorias_realizadas: number;
  tutorias_canceladas: number;
  tutorias_no_asistidas: number;
  satisfaccion_promedio: number;
}

/**
 * Llama al endpoint del backend para obtener el reporte detallado
 * para el coordinador.
 */
export const getCoordinatorReport = async (): Promise<ReportData[]> => {
  try {
    const response = await axiosClient.get('/reports/coordinator');
    return response.data;
  } catch (error) {
    console.error("Error al obtener el reporte del coordinador:", error);
    throw error;
  }
};