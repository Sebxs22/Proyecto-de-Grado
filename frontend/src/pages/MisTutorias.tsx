// frontend/src/pages/MisTutorias.tsx

import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import EvaluarTutoriaModal from '../components/EvaluarTutoriaModal'; // ✅ AGREGADO

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

// ✅ Extiendo la interfaz para incluir el enlace_reunion del esquema Tutoria
interface TutoriaEstudiante {
    id: number;
    fecha: string;
    duracion_min: number;
    tema: string | null;
    modalidad: string;
    estado: 'solicitada' | 'programada' | 'cancelada' | 'realizada' | 'no_asistio';
    tutor: TutorDetail;
    matricula: MatriculaDetail;
    enlace_reunion: string | null; // ✅ AGREGADO
    evaluacion: any; // Para verificar si ya fue evaluada (retorna null o el objeto Evaluacion)
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
    solicitada: 'bg-yellow-100 text-yellow-800 border-yellow-600',
    programada: 'bg-green-100 text-green-800 border-green-600',
    cancelada: 'bg-red-100 text-red-800 border-red-600',
    realizada: 'bg-blue-100 text-blue-800 border-blue-600',
    no_asistio: 'bg-gray-100 text-gray-800 border-gray-600',
};

const MisTutorias: React.FC = () => {
    const { user } = useAuth();
    const [tutorias, setTutorias] = useState<TutoriaEstudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Estado para el modal de evaluación
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [tutoriaAevaluar, setTutoriaAevaluar] = useState<{id: number, asignatura: string} | null>(null);

    const fetchTutorias = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMisTutorias();
            setTutorias(data);
            setError(null);
        } catch (err) {
            setError('No se pudo cargar tu historial de tutorías.');
            console.error("❌ Error en fetchTutorias:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user?.rol === 'estudiante') {
            fetchTutorias();
        } 
    }, [user, fetchTutorias]);

    // Lógica para abrir el modal de evaluación
    const handleEvaluarClick = (tutoriaId: number, asignatura: string) => {
        setTutoriaAevaluar({ id: tutoriaId, asignatura });
        setIsEvalModalOpen(true);
    };

    const handleEvalModalClose = () => {
        setIsEvalModalOpen(false);
        setTutoriaAevaluar(null);
    };

    if (loading) return <div className="text-center p-12">Cargando tutorías...</div>;
    if (error) return <div className="text-center text-red-500 p-12">{error}</div>;

    const esEstudiante = user?.rol === 'estudiante';
    const titulo = esEstudiante ? 'Mis Tutorías Solicitadas' : 'Tutorías Asignadas'; // Esto debería ser 'Mis Tutorías' si solo se usa para estudiantes.

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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th> {/* ✅ AGREGADO */}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {tutorias.map((tutoria) => {
                                    // Comprobamos si la tutoría ha sido calificada
                                    const yaEvaluada = tutoria.evaluacion !== null && tutoria.evaluacion !== undefined; 
                                    
                                    return (
                                    <tr key={tutoria.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{tutoria.matricula.asignatura.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{tutoria.tutor.usuario.nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(tutoria.fecha).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">{tutoria.tema || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{tutoria.modalidad}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${EstadoClases[tutoria.estado as keyof typeof EstadoClases]}`}>
                                                {tutoria.estado.toUpperCase().replace('_', ' ')}
                                            </span>
                                            {/* ✅ MOSTRAR ENLACE DE REUNIÓN si está programada y es virtual */}
                                            {tutoria.estado === 'programada' && tutoria.modalidad === 'Virtual' && tutoria.enlace_reunion && (
                                                <a 
                                                    href={tutoria.enlace_reunion} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="block mt-1 text-xs text-blue-600 hover:text-blue-800 underline"
                                                >
                                                    🔗 Unirse a Zoom
                                                </a>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {tutoria.estado === 'realizada' ? (
                                                <button
                                                    onClick={() => handleEvaluarClick(tutoria.id, tutoria.matricula.asignatura.nombre)}
                                                    className={`px-3 py-1 text-sm rounded transition-colors font-medium ${
                                                        yaEvaluada 
                                                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                            : 'bg-purple-600 text-white hover:bg-purple-700'
                                                    }`}
                                                    disabled={yaEvaluada}
                                                >
                                                    {yaEvaluada ? 'Ya Evaluada' : 'Evaluar'}
                                                </button>
                                            ) : tutoria.estado === 'no_asistio' ? (
                                                <span className="text-xs text-gray-500">No asistida</span>
                                            ) : (
                                                <span className="text-xs text-gray-500">Pendiente Tutor</span>
                                            )}
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-600">No tienes tutorías pendientes o en historial.</p>
                )}
            </div>
            
            {/* Modal de Evaluación */}
            <EvaluarTutoriaModal
                isOpen={isEvalModalOpen}
                onClose={handleEvalModalClose}
                tutoriaId={tutoriaAevaluar?.id || null}
                asignatura={tutoriaAevaluar?.asignatura || ''}
                onSuccess={fetchTutorias} // Para refrescar la lista después de evaluar
            />
        </div>
    );
};

export default MisTutorias;