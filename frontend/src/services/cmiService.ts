// frontend/src/services/cmiService.ts

import axiosClient from '../api/axiosClient';

// 1. Definimos la forma de los datos (Interfaces)
export interface PerspectivaEstudiante {
    tasa_asistencia: number;
    satisfaccion_promedio: number;
}

export interface PerspectivaProcesos {
    total_sesiones_realizadas: number;
    distribucion_estados: { name: string; value: number }[];
}

export interface PerspectivaRecursos {
    total_tutores: number;
    total_estudiantes: number;
    ratio_tutor_estudiante: number;
}

// ✅ NUEVA INTERFAZ: Perspectiva Aprendizaje
export interface PerspectivaAprendizaje {
    tasa_adherencia_tutores: number;
    tutores_activos: number;
}

export interface CMI {
    perspectiva_estudiante: PerspectivaEstudiante;
    perspectiva_procesos: PerspectivaProcesos;
    perspectiva_recursos: PerspectivaRecursos;
    perspectiva_aprendizaje?: PerspectivaAprendizaje; // ✅ Agregado (opcional por si falla la carga)
}

export interface CoordinatorDashboard {
    nombre: string;
    cmi: CMI;
}

// 2. Servicio para obtener los datos
export const getCoordinatorDashboard = async (): Promise<CoordinatorDashboard> => {
    // Ajusta la URL si tu endpoint es diferente (ej. /dashboard/coordinator)
    const response = await axiosClient.get('/dashboard/coordinator');
    return response.data;
};