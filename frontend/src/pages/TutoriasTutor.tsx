// frontend/src/pages/TutoriasTutor.tsx

import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { actualizarEstadoTutoria } from '../services/tutorDashboardService';
import EnlaceZoomModal from '../components/EnlaceZoomModal'; 

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
    enlace_reunion: string | null; // ✅ AGREGADO
    matricula: MatriculaDetail; 
    evaluacion: any; // Para verificar si ya fue evaluada
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
    programada: 'bg-blue-100 text-blue-800 border-blue-600',
    cancelada: 'bg-red-100 text-red-800 border-red-600',
    realizada: 'bg-green-100 text-green-800 border-green-600',
    no_asistio: 'bg-gray-100 text-gray-800 border-gray-600',
};

// Mapeo para priorizar las solicitudes
const PrioridadEstado = {
    solicitada: 1,
    programada: 2,
    realizada: 3,
    no_asistio: 4,
    cancelada: 5,
};

const TutoriasTutor: React.FC = () => {
    const { user } = useAuth();
    const [tutorias, setTutorias] = useState<TutoriaTutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estados para el modal de Zoom
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState<TutoriaTutor | null>(null);

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

    // Lógica para ACEPTAR y GESTIONAR EL ENLACE
    const handleAceptar = (tutoria: TutoriaTutor) => {
        if (tutoria.modalidad === 'Virtual') {
            setTutoriaSeleccionada(tutoria);
            setIsZoomModalOpen(true);
        } else {
            // Tutoría presencial: se acepta sin necesidad de enlace
            handleActualizarEstado(tutoria.id, 'programada');
        }
    };

    // Lógica para ACTUALIZAR el estado (Rechazar/Finalizar)
    const handleActualizarEstado = async (tutoriaId: number, estado: 'programada' | 'cancelada' | 'realizada' | 'no_asistio', enlace: string | null = null) => {
        const action = {
            programada: 'Aceptar',
            cancelada: 'Rechazar',
            realizada: 'Finalizar (Asistió)',
            no_asistio: 'Finalizar (No Asistió)',
        }[estado];
        
        if (!window.confirm(`¿Estás seguro de que quieres ${action} la tutoría ID ${tutoriaId}?`)) return;

        try {
            await actualizarEstadoTutoria(tutoriaId, estado, enlace); // ✅ Ahora enviamos el enlace
            alert(`Tutoría ${action.toLowerCase()} con éxito.`);
            fetchTutorias(); // Refresca la lista
        } catch (err) {
            alert(`Error al ${action.toLowerCase()} la tutoría. Asegúrate de tener permisos y completar todos los campos.`);
        }
    };
    
    // Función de callback del modal de Zoom
    const handleZoomAceptar = (tutoriaId: number, enlace: string) => {
        handleActualizarEstado(tutoriaId, 'programada', enlace);
        setIsZoomModalOpen(false);
        setTutoriaSeleccionada(null);
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
    
    const pendientes = tutorias.filter(t => t.estado === 'solicitada');
    const programadas = tutorias.filter(t => t.estado === 'programada');
    const historial = tutorias.filter(t => t.estado !== 'solicitada' && t.estado !== 'programada');


    return (
        <div className="space-y-10">
            <h1 className="text-3xl font-bold text-gray-800">Gestión de Tutorías Asignadas</h1>

            {/* SECCIÓN SOLICITUDES PENDIENTES */}
            <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-yellow-500">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Solicitudes Pendientes ({pendientes.length})</h2>
                {pendientes.length === 0 ? (
                    <p className="text-gray-600">No hay nuevas solicitudes de tutoría.</p>
                ) : (
                    <TablaTutorias 
                        tutorias={pendientes} 
                        handleAceptar={handleAceptar}
                        handleActualizarEstado={handleActualizarEstado} 
                        tipoAccion="solicitud"
                    />
                )}
            </div>

            {/* SECCIÓN PROGRAMADAS Y ACTIVAS */}
            <div className="bg-white p-6 rounded-lg shadow-xl border-t-4 border-blue-500">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Tutorías Programadas ({programadas.length})</h2>
                {programadas.length === 0 ? (
                    <p className="text-gray-600">No hay tutorías programadas activas.</p>
                ) : (
                    <TablaTutorias 
                        tutorias={programadas} 
                        handleAceptar={handleAceptar}
                        handleActualizarEstado={handleActualizarEstado} 
                        tipoAccion="finalizar"
                    />
                )}
            </div>

            {/* SECCIÓN HISTORIAL */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial Finalizado ({historial.length})</h2>
                 {historial.length === 0 ? (
                    <p className="text-gray-600">No hay tutorías finalizadas o canceladas.</p>
                ) : (
                    <TablaTutorias 
                        tutorias={historial} 
                        handleAceptar={handleAceptar}
                        handleActualizarEstado={handleActualizarEstado} 
                        tipoAccion="historial"
                    />
                )}
            </div>

            {/* Modal de Zoom */}
            {tutoriaSeleccionada && (
                <EnlaceZoomModal
                    isOpen={isZoomModalOpen}
                    onClose={() => setIsZoomModalOpen(false)}
                    tutoria={tutoriaSeleccionada}
                    onAceptar={handleZoomAceptar}
                />
            )}
        </div>
    );
};

// Sub-Componente de la Tabla
interface TablaProps {
    tutorias: TutoriaTutor[];
    handleAceptar: (tutoria: TutoriaTutor) => void;
    handleActualizarEstado: (tutoriaId: number, estado: 'programada' | 'cancelada' | 'realizada' | 'no_asistio', enlace?: string | null) => void;
    tipoAccion: 'solicitud' | 'finalizar' | 'historial';
}

const TablaTutorias: React.FC<TablaProps> = ({ tutorias, handleAceptar, handleActualizarEstado, tipoAccion }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha y Hora</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        {tipoAccion !== 'historial' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>}
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
                            <td className="px-6 py-4 whitespace-nowrap text-gray-700">{tutoria.modalidad}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${EstadoClases[tutoria.estado]}`}>
                                    {tutoria.estado.toUpperCase().replace('_', ' ')}
                                </span>
                                {tutoria.estado === 'programada' && tutoria.enlace_reunion && (
                                    <a 
                                        href={tutoria.enlace_reunion} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="block mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                    >
                                        🔗 Enlace Reunión
                                    </a>
                                )}
                            </td>
                            {tipoAccion === 'solicitud' && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleAceptar(tutoria)} 
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
                            {tipoAccion === 'finalizar' && (
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                        <button 
                                            onClick={() => handleActualizarEstado(tutoria.id, 'realizada')} 
                                            className="bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 text-xs transition-colors"
                                        >
                                            Marcar Realizada
                                        </button>
                                        <button 
                                            onClick={() => handleActualizarEstado(tutoria.id, 'no_asistio')} 
                                            className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600 text-xs transition-colors"
                                        >
                                            Marcar No Asistió
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