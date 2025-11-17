// frontend/src/pages/MisTutorias.tsx

import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import EvaluarTutoriaModal from '../components/EvaluarTutoriaModal';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Inbox,
  History,
  UserCircle2,
  ArrowRight,
  AlertCircle,
  MessageSquare,
  Star
} from 'lucide-react';

// --- Interfaces ---
interface TutorDetail {
    usuario: { nombre: string; };
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
    enlace_reunion: string | null;
    evaluacion: any;
}

const getMisTutorias = async (): Promise<TutoriaEstudiante[]> => {
    const response = await axiosClient.get('/tutorias/');
    return response.data;
};

const MisTutorias: React.FC = () => {
    const { user } = useAuth();
    const [tutorias, setTutorias] = useState<TutoriaEstudiante[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Estado de Pestañas
    const [activeTab, setActiveTab] = useState<'proximas' | 'pendientes' | 'historial'>('proximas');

    // Modal Evaluación
    const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
    const [tutoriaAevaluar, setTutoriaAevaluar] = useState<{id: number, asignatura: string} | null>(null);

    const fetchTutorias = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getMisTutorias();
            // Ordenar: las más recientes primero
            const sortedData = data.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
            setTutorias(sortedData);
            setError(null);
        } catch (err) {
            setError('No se pudo cargar el historial.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { if (user?.rol === 'estudiante') fetchTutorias(); }, [user, fetchTutorias]);

    const handleEvaluarClick = (tutoriaId: number, asignatura: string) => {
        setTutoriaAevaluar({ id: tutoriaId, asignatura });
        setIsEvalModalOpen(true);
    };

    const handleEvalModalClose = () => {
        setIsEvalModalOpen(false);
        setTutoriaAevaluar(null);
    };

    // Filtrado de datos
    const pendientes = tutorias.filter(t => t.estado === 'solicitada');
    const proximas = tutorias.filter(t => t.estado === 'programada');
    const historial = tutorias.filter(t => ['realizada', 'no_asistio', 'cancelada'].includes(t.estado));

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96 text-unach-blue animate-pulse">
          <BookOpen size={48} strokeWidth={1} />
          <p className="mt-4 font-medium text-sm tracking-wide">CARGANDO TUS TUTORÍAS...</p>
        </div>
    );

    if (error) return <div className="text-center text-unach-red p-12 font-bold border border-red-100 bg-red-50 rounded-xl mt-10">{error}</div>;

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-unach-blue flex items-center gap-3">
                        Mis Tutorías <span className="text-2xl">📚</span>
                    </h1>
                    <p className="text-gray-500 mt-1 ml-1 text-sm">Gestiona tus sesiones de refuerzo académico.</p>
                </div>
            </div>

            {/* NAVEGACIÓN DE PESTAÑAS */}
            <div className="flex gap-2 bg-gray-100/80 p-1.5 rounded-xl w-fit border border-gray-200">
                <button
                    onClick={() => setActiveTab('proximas')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'proximas' 
                            ? 'bg-white text-unach-blue shadow-md ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                    <Calendar size={18} />
                    Próximas
                    {proximas.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded-full">
                            {proximas.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('pendientes')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'pendientes' 
                            ? 'bg-white text-unach-blue shadow-md ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                    <Inbox size={18} />
                    Solicitadas
                    {pendientes.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-[10px] rounded-full">
                            {pendientes.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('historial')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'historial' 
                            ? 'bg-white text-unach-blue shadow-md ring-1 ring-black/5' 
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
                    }`}
                >
                    <History size={18} />
                    Historial
                </button>
            </div>

            {/* --- CONTENIDO: PRÓXIMAS (Estilo Tarjetas Destacadas) --- */}
            {activeTab === 'proximas' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
                    {proximas.length === 0 ? (
                        <div className="col-span-full text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No tienes tutorías programadas por ahora.</p>
                            <p className="text-sm text-gray-400">Solicita una nueva desde el Dashboard.</p>
                        </div>
                    ) : (
                        proximas.map((t) => (
                            <div key={t.id} className="bg-white rounded-xl shadow-md border-l-4 border-l-unach-blue border-y border-r border-gray-100 overflow-hidden hover:shadow-lg transition-all group">
                                <div className="p-6">
                                    {/* Header Tarjeta */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
                                                Programada
                                            </span>
                                            <h3 className="text-lg font-bold text-gray-800 mt-2 group-hover:text-unach-blue transition-colors">
                                                {t.matricula.asignatura.nombre}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-gray-700 leading-none">
                                                {new Date(t.fecha).getDate()}
                                            </p>
                                            <p className="text-xs font-bold text-gray-400 uppercase">
                                                {new Date(t.fecha).toLocaleString('es-EC', { month: 'short' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Detalles */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-start gap-3">
                                            <UserCircle2 size={18} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">Tutor</p>
                                                <p className="text-sm font-medium text-gray-700">{t.tutor.usuario.nombre}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <Clock size={18} className="text-gray-400 mt-0.5" />
                                            <div>
                                                <p className="text-xs text-gray-400 font-bold uppercase">Hora</p>
                                                <p className="text-sm font-medium text-gray-700">
                                                    {new Date(t.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (60 min)
                                                </p>
                                            </div>
                                        </div>
                                        {t.tema && (
                                            <div className="flex items-start gap-3">
                                                <MessageSquare size={18} className="text-gray-400 mt-0.5" />
                                                <div>
                                                    <p className="text-xs text-gray-400 font-bold uppercase">Tema</p>
                                                    <p className="text-sm text-gray-600 italic">"{t.tema}"</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer / Acción */}
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className={`flex items-center gap-1.5 text-xs font-bold px-2 py-1 rounded ${t.modalidad === 'Virtual' ? 'text-purple-600 bg-purple-50' : 'text-orange-600 bg-orange-50'}`}>
                                            {t.modalidad === 'Virtual' ? <Video size={14} /> : <MapPin size={14} />}
                                            {t.modalidad}
                                        </div>

                                        {t.modalidad === 'Virtual' && t.enlace_reunion ? (
                                            <a 
                                                href={t.enlace_reunion} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="flex items-center gap-2 px-4 py-2 bg-unach-blue text-white text-sm font-bold rounded-lg shadow-md hover:bg-blue-800 hover:shadow-lg transition-all hover:-translate-y-0.5"
                                            >
                                                Unirse Ahora <ArrowRight size={16} />
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400 italic">
                                                {t.modalidad === 'Presencial' ? 'Asistir al aula asignada' : 'Enlace pendiente'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* --- CONTENIDO: PENDIENTES (Lista Compacta) --- */}
            {activeTab === 'pendientes' && (
                <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom-4 duration-300">
                    {pendientes.length === 0 ? (
                        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <Inbox size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No tienes solicitudes pendientes de aprobación.</p>
                        </div>
                    ) : (
                        pendientes.map((t) => (
                            <div key={t.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4 hover:border-amber-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-50 text-amber-500 rounded-full">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800">{t.matricula.asignatura.nombre}</h4>
                                        <p className="text-sm text-gray-500">
                                            Solicitada para: <span className="font-semibold">{new Date(t.fecha).toLocaleString()}</span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">Tutor: {t.tutor.usuario.nombre}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full border border-amber-200 flex items-center gap-1">
                                        <AlertCircle size={12} /> Esperando confirmación
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* --- CONTENIDO: HISTORIAL (Tabla Clásica) --- */}
            {activeTab === 'historial' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-4 duration-300">
                    {historial.length === 0 ? (
                        <div className="text-center py-16">
                            <History size={48} className="mx-auto text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">Aún no tienes historial de tutorías.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Asignatura / Fecha</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Tutor</th>
                                        <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Evaluación</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-50">
                                    {historial.map((t) => {
                                        const yaEvaluada = t.evaluacion !== null;
                                        // ✅ CORRECCIÓN: Definimos explícitamente el tipo para evitar el error de TS
                                        const estadoStyles: Record<string, string> = {
                                            realizada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
                                            cancelada: 'bg-rose-100 text-rose-700 border-rose-200',
                                            no_asistio: 'bg-gray-100 text-gray-600 border-gray-200',
                                            // Agregamos los otros estados por si acaso (aunque no deberían salir en historial)
                                            solicitada: 'bg-amber-100 text-amber-700',
                                            programada: 'bg-blue-100 text-blue-700'
                                        };
                                        
                                        const style = estadoStyles[t.estado] || 'bg-gray-100 text-gray-600 border-gray-200';

                                        return (
                                            <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-800 text-sm">{t.matricula.asignatura.nombre}</span>
                                                        <span className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                            <Calendar size={12} /> {new Date(t.fecha).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {t.tutor.usuario.nombre}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${style}`}>
                                                        {t.estado === 'realizada' && <CheckCircle2 size={10} />}
                                                        {t.estado === 'cancelada' && <XCircle size={10} />}
                                                        {t.estado.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {t.estado === 'realizada' ? (
                                                        <button
                                                            onClick={() => !yaEvaluada && handleEvaluarClick(t.id, t.matricula.asignatura.nombre)}
                                                            disabled={yaEvaluada}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all border ${
                                                                yaEvaluada 
                                                                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200 cursor-default'
                                                                    : 'bg-white text-unach-blue border-blue-200 hover:bg-blue-50 hover:border-blue-300 shadow-sm'
                                                            }`}
                                                        >
                                                            <Star size={14} className={yaEvaluada ? "fill-yellow-500 text-yellow-500" : ""} />
                                                            {yaEvaluada ? 'Evaluada' : 'Evaluar'}
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-300 text-xs italic">--</span>
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

            <EvaluarTutoriaModal
                isOpen={isEvalModalOpen}
                onClose={handleEvalModalClose}
                tutoriaId={tutoriaAevaluar?.id || null}
                asignatura={tutoriaAevaluar?.asignatura || ''}
                onSuccess={fetchTutorias}
            />
        </div>
    );
};

export default MisTutorias;