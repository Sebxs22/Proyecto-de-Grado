// frontend/src/services/dashboardService.ts

import axiosClient from '../api/axiosClient';

// Definimos las interfaces de los datos que esperamos del backend
interface KpiData {
    promedio_general: number;
    total_materias: number;
}

export interface HistorialAcademico {
    asignatura: string;
    periodo: string;
    parcial1: number | null;
    parcial2: number | null;
    final: number | null;
    situacion: string | null;

    // Campos de la IA
    riesgo_nivel: string | null; 
    riesgo_color: string | null;
    probabilidad_riesgo: number | null; 
    
    // ✅ ESTA ES LA LÍNEA QUE FALTABA
    mensaje_explicativo: string | null;

    matricula_id: number;
    tutor_id: number;
    tutor_nombre: string;
}

export interface StudentDashboard {
    nombre: string;
    codigo: string;
    kpis: KpiData;
    historial_academico: HistorialAcademico[];
}

export const getStudentDashboard = async (): Promise<StudentDashboard> => {
    try {
        const response = await axiosClient.get('/dashboard/student');
        return response.data;
    } catch (error) {
        console.error("Error al obtener el dashboard del estudiante:", error);
        throw error;
    }
};