// frontend/src/pages/TutoriasTutor.tsx

import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { actualizarEstadoTutoria } from '../services/tutorDashboardService';

// 1. Define las interfaces que recibimos del endpoint GET /tutorias/
interface EstudianteDetail {
    usuario: {
        nombre: string;
    };
}

interface AsignaturaDetail {
    nombre: string;
}

interface MatriculaDetail {
    estudiante: EstudianteDetail;
    asignatura: AsignaturaDetail;
}

interface TutoriaTutor {
    id: number;
    fecha: string;
    duracion_min: number;
    tema: string | null;
    modalidad: string;
    estado: 'solicitada' | 'programada' | 'cancelada' | 'realizada' | 'no_asistio';
    // tutor ya viene implicito o se puede anidar, pero lo importante es la matrícula
    matricula: MatriculaDetail; 
}

// Función para obtener las tutorías del tutor (ENDPOINT: GET /tutorias/)
const getMisTutoriasTutor = async (): Promise<TutoriaTutor[]> => {
    try {
        const response = await axiosClient.get('/tutorias/');
        return response.data;
    } catch (error) {
        console.error("Error al obtener las tutorías del tutor:", error);
        throw error;
    }
};

// Mapeo de estados para la interfaz de usuario
const EstadoClases = {
    solicitada: 'bg-yellow-100 text-yellow-800 border-yellow-600',
    programada: 'bg-blue-100 text-blue-800 border-blue-600', // Azul para programada para distinguirla de APROBADO
    cancelada: 'bg-red-100 text-red-800 border-red-600',
    realizada: 'bg-green-100 text-green-800 border-green-600',
    no_asistio: 'bg-gray-100 text-gray-800 border-gray-600',
};

// Mapeo para priorizar
const PrioridadEstado = {
    solicitada: 1,
    programada: 2,
    no_asistio: 3,
    realizada: 4,
    cancelada: 5,
};

const TutoriasTutor: React.FC = () => {
    const { user } = useAuth();
    const [tutorias, setTutorias] = useState<TutoriaTutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTutorias = useCallback(async () => {
        if (user?.rol !== 'tutor') return;
        try {
            setLoading(true);
            const data = await getMisTutoriasTutor();
            // Ordenar: primero las solicitadas, luego las programadas, luego las demás por fecha
            const sortedData = data.sort((a, b) => {
                const diff = PrioridadEstado[a.estado] - PrioridadEstado[b.estado];
                if (diff !== 0) return diff;
                return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
            });
            setTutorias(sortedData);
            setError(null);
        } catch (err) {
            setError('No se pudo cargar el historial de tutorías asignadas.');
            console.error("❌ Error en fetchTutorias:", err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchTutorias();
    }, [fetchTutorias]);

    // Función que ya tienes en DashboardTutor, ahora centralizada
    const handleActualizarEstado = async (tutoriaId: number, estado: 'programada' | 'cancelada') => {
        const action = estado === 'programada' ? 'Aceptar' : 'Rechazar';
        if (!window.confirm(`¿Estás seguro de que quieres ${action} la tutoría ID ${tutoriaId}?`)) return;

        try {
            await actualizarEstadoTutoria(tutoriaId, estado);
            alert(`Tutoría ${action.toLowerCase()} con éxito.`);
            fetchTutorias(); // Refresca la lista
        } catch (err) {
            alert(`Error al ${action.toLowerCase()} la tutoría. Asegúrate de tener permisos.`);
        }
    };
    
    if (loading) return <div className="text-center p-12">Cargando gestión de tutorías...</div>;
    if (error) return <div className="text-center text-red-500 p-12">{error}</div>;

    if (tutorias.length === 0) {
        return (
            <div className="p-8 bg-white rounded-lg shadow-md">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Gestión de Tutorías</h1>
                <p className="text-gray-600">No tienes tutorías asignadas en este momento.</p>
            </div>
        );
    }
    
    // Separamos las pendientes de las demás
    const pendientes = tutorias.filter(t => t.estado === 'solicitada');
    const gestionadas = tutorias.filter(t => t.estado !== 'solicitada');


    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Tutorías Asignadas</h1>

            {/* SECCIÓN PENDIENTES */}
            <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-yellow-500">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Solicitudes Pendientes ({pendientes.length})</h2>
                {pendientes.length === 0 ? (
                    <p className="text-gray-600">No hay nuevas solicitudes de tutoría.</p>
                ) : (
                    <TablaTutorias 
                        tutorias={pendientes} 
                        handleActualizarEstado={handleActualizarEstado} 
                        mostrarAcciones={true}
                    />
                )}
            </div>

            {/* SECCIÓN HISTORIAL */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Tutorías ({gestionadas.length})</h2>
                 {gestionadas.length === 0 ? (
                    <p className="text-gray-600">No hay tutorías programadas o finalizadas.</p>
                ) : (
                    <TablaTutorias 
                        tutorias={gestionadas} 
                        handleActualizarEstado={handleActualizarEstado} 
                        mostrarAcciones={false}
                    />
                )}
            </div>
        </div>
    );
};

// Sub-Componente de la Tabla para reutilizar la vista
interface TablaProps {
    tutorias: TutoriaTutor[];
    handleActualizarEstado: (tutoriaId: number, estado: 'programada' | 'cancelada') => void;
    mostrarAcciones: boolean;
}

const TablaTutorias: React.FC<TablaProps> = ({ tutorias, handleActualizarEstado, mostrarAcciones }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tema</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        {mostrarAcciones && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {tutorias.map((tutoria) => (
                        <tr key={tutoria.id}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                {tutoria.matricula.estudiante.usuario.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                {tutoria.matricula.asignatura.nombre}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                                {new Date(tutoria.fecha).toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-gray-700">{tutoria.tema || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">{tutoria.modalidad}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${EstadoClases[tutoria.estado]}`}>
                                    {tutoria.estado.toUpperCase().replace('_', ' ')}
                                </span>
                            </td>
                            {mostrarAcciones && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleActualizarEstado(tutoria.id, 'programada')} 
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm transition-colors"
                                        >
                                            Aceptar
                                        </button>
                                        <button 
                                            onClick={() => handleActualizarEstado(tutoria.id, 'cancelada')} 
                                            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm transition-colors"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TutoriasTutor;