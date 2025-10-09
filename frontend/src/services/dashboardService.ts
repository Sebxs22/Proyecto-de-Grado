// frontend/src/services/dashboardService.ts

import axiosClient from '../api/axiosClient';

// Definimos las "interfaces" o contratos de los datos que esperamos
interface KpiData {
    promedio_general: number;
    total_materias: number;
}

interface HistorialAcademico {
    asignatura: string;
    parcial1: number | null;
    parcial2: number | null; // Añadimos parcial2
    final: number | null;
    situacion: string | null;
    riesgo_nivel: 'BAJO' | 'MEDIO' | 'ALTO';
    riesgo_color: 'green' | 'yellow' | 'red';
    matricula_id: number; // ID para agendar tutoría
    tutor_id: number;     // ID para agendar tutoría
}

export interface StudentDashboard {
    nombre: string;
    kpis: KpiData;
    historial: HistorialAcademico[];
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