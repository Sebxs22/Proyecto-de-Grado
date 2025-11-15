// frontend/src/services/dashboardService.ts

import axiosClient from '../api/axiosClient';

// Definimos las "interfaces" o contratos de los datos que esperamos
interface KpiData {
    promedio_general: number;
    total_materias: number;
}

// ✅ INTERFAZ ACTUALIZADA
interface HistorialAcademico {
    asignatura: string;
    parcial1: number | null;
    parcial2: number | null;
    final: number | null;
    situacion: string | null;

    // Se cambiaron a 'string' para aceptar 'N/A' y 'gray'
    riesgo_nivel: string | null; 
    riesgo_color: string | null;
    
    // ✅ AÑADIDO: La propiedad que faltaba y causaba el error
    probabilidad_riesgo: number | null; 

    matricula_id: number;
    tutor_id: number;
    tutor_nombre: string;
}

export interface StudentDashboard {
    nombre: string;
    kpis: KpiData;
    historial_academico: HistorialAcademico[];
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