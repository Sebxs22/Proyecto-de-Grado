// frontend/src/pages/TutoriasTutor.tsx

import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import { actualizarEstadoTutoria } from '../services/tutorDashboardService';
import EnlaceZoomModal from '../components/EnlaceZoomModal'; 
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  Video, 
  MapPin, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  History,
  Inbox,
  FileText,
  Star,
  ExternalLink,
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';

// --- Interfaces ---
interface EstudianteDetail {
    usuario: { nombre: string; };
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
    enlace_reunion: string | null;
    matricula: MatriculaDetail; 
    evaluacion: any; 
}

// --- Servicio local ---
const getMisTutoriasTutor = async (): Promise<TutoriaTutor[]> => {
    const response = await axiosClient.get('/tutorias/');
    return response.data;
};

const TutoriasTutor: React.FC = () => {
    const { user } = useAuth();
    const [tutorias, setTutorias] = useState<TutoriaTutor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pendientes' | 'programadas' | 'historial'>('pendientes');

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9; 

    // Modal Zoom
    const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
    const [tutoriaSeleccionada, setTutoriaSeleccionada] = useState<TutoriaTutor | null>(null);

    const fetchTutorias = useCallback(async () => {
        if (user?.rol !== 'tutor') return;
        try {
            setLoading(true);
            const data = await getMisTutoriasTutor();
            setTutorias(data.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()));
            setError(null);
        } catch (err) {
            setError('No se pudo cargar el historial de tutorías.');
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchTutorias(); }, [fetchTutorias]);

    // Resetear página al cambiar de pestaña
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    // Handlers
    const handleAceptar = (tutoria: TutoriaTutor) => {
        if (tutoria.modalidad === 'Virtual') {
            setTutoriaSeleccionada(tutoria);
            setIsZoomModalOpen(true);
        } else {
            handleActualizarEstado(tutoria.id, 'programada');
        }
    };

    const handleActualizarEstado = async (tutoriaId: number, estado: 'programada' | 'cancelada' | 'realizada' | 'no_asistio', enlace: string | null = null) => {
        if (!window.confirm(`¿Confirmar acción sobre la tutoría?`)) return;
        try {
            await actualizarEstadoTutoria(tutoriaId, estado, enlace);
            fetchTutorias();
        } catch (err) {
            alert('Error al actualizar la tutoría.');
        }
    };
    
    const handleZoomAceptar = (tutoriaId: number, enlace: string) => {
        handleActualizarEstado(tutoriaId, 'programada', enlace);
        setIsZoomModalOpen(false);
        setTutoriaSeleccionada(null);
    };

    // Filtrado de datos GENERAL
    const pendientes = tutorias.filter(t => t.estado === 'solicitada');
    const programadas = tutorias.filter(t => t.estado === 'programada');
    const historial = tutorias.filter(t => ['realizada', 'no_asistio', 'cancelada'].includes(t.estado)).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); 

    // --- LÓGICA DE PAGINACIÓN ---
    let currentDataList: TutoriaTutor[] = [];
    if (activeTab === 'pendientes') currentDataList = pendientes;
    else if (activeTab === 'programadas') currentDataList = programadas;
    else currentDataList = historial;

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    // ✅ CORRECCIÓN: Esta es la lista que debemos usar en los .map() de abajo
    const currentItems = currentDataList.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(currentDataList.length / itemsPerPage);

    // Estilos de estado
    const estadoConfig: Record<string, { color: string; label: string }> = {
        solicitada: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Por Aprobar' },
        programada: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Programada' },
        cancelada: { color: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Rechazada' },
        realizada: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Finalizada' },
        no_asistio: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'No Asistió' },
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 text-unach-blue animate-pulse">
          <FileText size={48} strokeWidth={1} />
          <p className="mt-4 font-medium text-sm tracking-wide">CARGANDO GESTIÓN...</p>
        </div>
    );

    if (error) return <div className="text-center text-unach-red p-12 font-bold border border-red-100 bg-red-50 rounded-xl">{error}</div>;

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-unach-blue flex items-center gap-3">
                        Gestión de Tutorías <span className="text-2xl">📋</span>
                    </h1>
                    <p className="text-gray-500 mt-1 ml-1 text-sm">Administra solicitudes y sesiones académicas.</p>
                </div>
            </div>

            {/* NAVEGACIÓN DE PESTAÑAS (Tabs) */}
            <div className="flex gap-2 bg-gray-100/50 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('pendientes')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'pendientes' 
                            ? 'bg-white text-unach-blue shadow-md ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <Inbox size={18} />
                    Pendientes
                    {pendientes.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-unach-red text-white text-[10px] rounded-full">
                            {pendientes.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('programadas')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'programadas' 
                            ? 'bg-white text-unach-blue shadow-md ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <Calendar size={18} />
                    Programadas
                    {programadas.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-[10px] rounded-full">
                            {programadas.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('historial')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'historial' 
                            ? 'bg-white text-unach-blue shadow-md ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                >
                    <History size={18} />
                    Historial
                </button>
            </div>

            {/* CONTENIDO DE PESTAÑAS */}
            
            {/* 1. PESTAÑA PENDIENTES */}
            {activeTab === 'pendientes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-300">
                    {pendientes.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">¡Todo al día! No tienes solicitudes pendientes.</p>
                        </div>
                    ) : (
                        // ✅ CORRECCIÓN: Usamos currentItems
                        currentItems.map((t) => (
                            <div key={t.id} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 flex flex-col justify-between group hover:border-blue-200 transition-colors">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                            <AlertCircle size={24} />
                                        </div>
                                        <span className="text-[10px] font-bold uppercase bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            Solicitud #{t.id}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">
                                        {t.matricula.estudiante.usuario.nombre}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium mb-4">{t.matricula.asignatura.nombre}</p>
                                    
                                    <div className="space-y-2 mb-6">
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <MessageSquare size={16} className="text-unach-blue" /> 
                                            <span className="italic">"{t.tema}"</span>
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Calendar size={16} className="text-unach-blue" /> 
                                            {new Date(t.fecha).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            {t.modalidad === 'Virtual' ? <Video size={16} className="text-purple-500" /> : <MapPin size={16} className="text-orange-500" />}
                                            <span className="font-semibold">{t.modalidad}</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <button 
                                        onClick={() => handleActualizarEstado(t.id, 'cancelada')}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition-colors"
                                    >
                                        <X size={16} /> Rechazar
                                    </button>
                                    <button 
                                        onClick={() => handleAceptar(t)}
                                        className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-unach-blue text-white font-bold text-xs hover:bg-blue-800 shadow-md hover:shadow-lg transition-all"
                                    >
                                        <Check size={16} /> Aceptar
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* 2. PESTAÑA PROGRAMADAS */}
            {activeTab === 'programadas' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
                    {programadas.length === 0 ? (
                        <div className="text-center py-16">
                            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No tienes sesiones programadas próximamente.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Fecha y Hora</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Tema</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Modalidad</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Finalizar</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {/* ✅ CORRECCIÓN: Usamos currentItems */}
                                {currentItems.map((t) => (
                                    <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-800 text-sm">{t.matricula.estudiante.usuario.nombre}</span>
                                                <span className="text-xs text-gray-400">{t.matricula.asignatura.nombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-unach-blue" />
                                                {new Date(t.fecha).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={t.tema || ''}>
                                            {t.tema}
                                        </td>
                                        
                                        <td className="px-6 py-4 text-center align-middle">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold ${
                                                    t.modalidad === 'Virtual' 
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-100' 
                                                        : 'bg-orange-50 text-orange-700 border border-orange-100'
                                                }`}>
                                                    {t.modalidad === 'Virtual' ? <Video size={12} /> : <MapPin size={12} />}
                                                    {t.modalidad}
                                                </span>

                                                {t.modalidad === 'Virtual' && t.enlace_reunion && (
                                                    <a 
                                                        href={t.enlace_reunion} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-blue-200 rounded-md text-[10px] font-bold text-unach-blue hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm group"
                                                        title="Abrir sala de reunión"
                                                    >
                                                        <ExternalLink size={10} className="group-hover:scale-110 transition-transform" /> 
                                                        Abrir Sala
                                                    </a>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleActualizarEstado(t.id, 'no_asistio')}
                                                    title="Marcar como No Asistió"
                                                    className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                                                >
                                                    <X size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleActualizarEstado(t.id, 'realizada')}
                                                    title="Finalizar con Éxito"
                                                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm hover:shadow transition-all text-xs font-bold"
                                                >
                                                    <CheckCircle2 size={16} /> Concluir
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            )}

            {/* 3. PESTAÑA HISTORIAL */}
            {activeTab === 'historial' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
                    {historial.length === 0 ? (
                         <div className="text-center py-16">
                            <History size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No hay historial registrado.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Estudiante</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Evaluación</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {/* ✅ CORRECCIÓN: Usamos currentItems */}
                                {currentItems.map((t) => {
                                    const config = estadoConfig[t.estado] || estadoConfig.no_asistio;
                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(t.fecha).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-gray-700 text-sm">{t.matricula.estudiante.usuario.nombre}</span>
                                                    <span className="text-xs text-gray-400">{t.matricula.asignatura.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-block px-3 py-1 text-[10px] font-bold rounded-full border ${config.color}`}>
                                                    {config.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {t.evaluacion ? (
                                                    <div className="flex justify-center items-center gap-1 text-yellow-500" title={t.evaluacion.comentario_estudiante}>
                                                        <span className="font-bold text-sm text-gray-700">{t.evaluacion.estrellas}</span>
                                                        <Star size={14} className="fill-yellow-500" />
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-300 italic">--</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>
            )}

            {/* FOOTER DE PAGINACIÓN (Común para todas las pestañas) */}
            {currentDataList.length > 0 && (
                <div className="flex justify-between items-center p-4 bg-gray-50/50 rounded-xl border border-gray-200">
                    <div className="text-xs text-gray-500 font-medium">
                        Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, currentDataList.length)} de {currentDataList.length}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-unach-blue">
                            {currentPage}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Modal Zoom */}
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

export default TutoriasTutor;