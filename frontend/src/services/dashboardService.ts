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
    parcial2: number | null;
    final: number | null;
    situacion: string | null;
    riesgo_nivel: 'BAJO' | 'MEDIO' | 'ALTO';
    riesgo_color: 'green' | 'yellow' | 'red';
    matricula_id: number;
    tutor_id: number;
    tutor_nombre: string; // ✅ AGREGADO
}

export interface StudentDashboard {
    nombre: string;
    kpis: KpiData;
    historial_academico: HistorialAcademico[]; // Cambiado de "historial" a "historial_academico"
}

export const getStudentDashboard = async (): Promise<StudentDashboard> => {
    try {
        const response = await axiosClient.get('/dashboard/student');
        console.log("Datos recibidos del backend:", response.data); // Para debug
        return response.data;
    } catch (error) {
        console.error("Error al obtener el dashboard del estudiante:", error);
        throw error;
    }
};