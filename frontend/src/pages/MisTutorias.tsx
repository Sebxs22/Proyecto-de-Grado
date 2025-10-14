// frontend/src/pages/MisTutorias.tsx

import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
// ✅ NO SE NECESITAN IMPORTACIONES ADICIONALES (El tipado se hace directo)

// 1. Define las interfaces que recibimos del endpoint GET /tutorias/
interface TutorDetail {
    usuario: {
        nombre: string;
    };
}

interface AsignaturaDetail {
    nombre: string;
}

interface MatriculaDetail {
    asignatura: AsignaturaDetail;
}

interface TutoriaEstudiante {
    id: number;
    fecha: string;
    duracion_min: number;
    tema: string | null;
    modalidad: string;
    estado: 'solicitada' | 'programada' | 'cancelada' | 'realizada' | 'no_asistio';
    tutor: TutorDetail;
    matricula: MatriculaDetail;
}

// Función para obtener las tutorías del estudiante (ENDPOINT: GET /tutorias/)
const getMisTutorias = async (): Promise<TutoriaEstudiante[]> => {
    try {
        const response = await axiosClient.get('/tutorias/');
        return response.data;
    } catch (error) {
        console.error("Error al obtener las tutorías del estudiante:", error);
        throw error;
    }
};

// Mapeo de estados para la interfaz de usuario
const EstadoClases = {
    solicitada: 'bg-yellow-100 text-yellow-800',
    programada: 'bg-green-100 text-green-800',
    cancelada: 'bg-red-100 text-red-800',
    realizada: 'bg-blue-100 text-blue-800',
    no_asistio: 'bg-gray-100 text-gray-800',
};

const MisTutorias: React.FC = () => {
    const { user } = useAuth();
    const [tutorias, setTutorias] = useState<TutoriaEstudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTutorias = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMisTutorias();
            setTutorias(data);
            setError(null);
        } catch (err) {
            setError('No se pudo cargar tu historial de tutorías. Si eres estudiante, asegúrate de tener una matrícula asignada.');
            console.error("❌ Error en fetchTutorias:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Ejecutar la carga para estudiantes y tutores
        if (user?.rol === 'estudiante' || user?.rol === 'tutor') {
            fetchTutorias();
        }
    }, [user, fetchTutorias]);

    if (loading) return <div className="text-center p-12">Cargando tutorías...</div>;
    if (error) return <div className="text-center text-red-500 p-12">{error}</div>;

    const esEstudiante = user?.rol === 'estudiante';
    const titulo = esEstudiante ? 'Mis Tutorías Solicitadas' : 'Tutorías Asignadas (Historial)';

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">{titulo}</h1>

            <div className="bg-white p-6 rounded-lg shadow-md">
                {tutorias.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tema</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tutorias.map((tutoria) => (
                                    <tr key={tutoria.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{tutoria.matricula.asignatura.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{tutoria.tutor.usuario.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {/* ✅ CORREGIDO: Acceso directo a fecha */}
                                            {new Date(tutoria.fecha).toLocaleString()}
                                        </td>
                                        {/* ✅ CORREGIDO: Acceso directo a tema */}
                                        <td className="px-6 py-4">{tutoria.tema || 'N/A'}</td>
                                        {/* ✅ CORREGIDO: Acceso directo a modalidad */}
                                        <td className="px-6 py-4 whitespace-nowrap">{tutoria.modalidad}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${EstadoClases[tutoria.estado as keyof typeof EstadoClases]}`}>
                                                {tutoria.estado.toUpperCase().replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-600">No tienes tutorías pendientes o en historial.</p>
                )}
            </div>
        </div>
    );
};

export default MisTutorias;