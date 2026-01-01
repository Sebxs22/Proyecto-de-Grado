// frontend/src/pages/DashboardEstudiante.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getStudentDashboard, StudentDashboard, HistorialAcademico } from '../services/dashboardService';
import AgendarTutoriaModal from '../components/AgendarTutoriaModal';
import { getMisTutorias, TutoriaEstudiante } from '../services/tutoriaService';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  GraduationCap, 
  Clock, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Archive
} from 'lucide-react';

// --- COMPONENTE VISUAL: CÍRCULO DE PROBABILIDAD (La "Ruedita") ---
const RiskCircle = ({ percent }: { percent: number }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    // Lógica de colores: Rojo (<40%), Amarillo (40-69%), Verde (>=70%)
    let color = 'text-emerald-500'; 
    if (percent < 40) color = 'text-rose-500'; 
    else if (percent < 70) color = 'text-amber-500';

    return (
        <div className="relative w-12 h-12 flex items-center justify-center group cursor-help">
            {/* Fondo gris claro */}
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r={radius} stroke="#f3f4f6" strokeWidth="4" fill="transparent" />
                {/* Círculo de progreso dinámico */}
                <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset} 
                    strokeLinecap="round"
                    className={`${color} transition-all duration-1000 ease-out`} 
                />
            </svg>
            <span className={`absolute text-[10px] font-bold ${color}`}>{Math.round(percent)}%</span>
        </div>
    );
};

const DashboardEstudiante: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estados para modal
  const [selectedMatriculaId, setSelectedMatriculaId] = useState<number | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [selectedTutorNombre, setSelectedTutorNombre] = useState<string | null>(null);
  
  const [tutoriasProgramadas, setTutoriasProgramadas] = useState<TutoriaEstudiante[]>([]);
  const [materiasEnRiesgo, setMateriasEnRiesgo] = useState<string[]>([]);

  // Estado para controlar qué periodos están abiertos (Acordeón)
  const [expandedPeriods, setExpandedPeriods] = useState<Record<string, boolean>>({});

  const fetchDashboardData = useCallback(async () => {
      try {
        setLoading(true);
        const [dashboard, tutorias] = await Promise.all([
          getStudentDashboard(),
          getMisTutorias() 
        ]);
        setDashboardData(dashboard);
        setTutoriasProgramadas(tutorias.filter(t => t.estado === 'programada'));
        
        // Alertas de riesgo
        const enRiesgo = dashboard.historial_academico
          .filter(m => (m.probabilidad_riesgo || 0) < 60 && m.situacion !== 'APROBADO' && m.situacion !== 'REPROBADO')
          .map(m => m.asignatura);
        setMateriasEnRiesgo(enRiesgo);
        
        // Auto-apertura de periodos
        const grupos: Record<string, HistorialAcademico[]> = {};
        dashboard.historial_academico.forEach(m => {
            if (!grupos[m.periodo]) grupos[m.periodo] = [];
            grupos[m.periodo].push(m);
        });

        const initialExpanded: Record<string, boolean> = {};
        Object.entries(grupos).forEach(([periodo, materias]) => {
            const estaEnCurso = materias.some(m => 
                m.situacion !== 'APROBADO' && m.situacion !== 'REPROBADO'
            );
            initialExpanded[periodo] = estaEnCurso; 
        });
        
        const periodos = Object.keys(grupos);
        if (periodos.length > 0 && !Object.values(initialExpanded).some(Boolean)) {
            initialExpanded[periodos[0]] = true;
        }

        setExpandedPeriods(initialExpanded);
        setError(null);

      } catch (err: any) {
        setError(err.response?.data?.detail || 'No se pudo cargar la información.');
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const handleAgendarClick = (matriculaId: number, tutorId: number, tutorNombre: string) => {
    setSelectedMatriculaId(matriculaId);
    setSelectedTutorId(tutorId);
    setSelectedTutorNombre(tutorNombre);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => { setIsModalOpen(false); };
  const handleSuccessAgendar = () => { handleModalClose(); fetchDashboardData(); }
  
  const togglePeriod = (periodo: string) => {
      setExpandedPeriods(prev => ({ ...prev, [periodo]: !prev[periodo] }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-unach-blue animate-pulse">
      <GraduationCap size={48} strokeWidth={1} />
      <p className="mt-4 font-medium text-sm tracking-wide">CARGANDO TU PANEL ACADÉMICO...</p>
    </div>
  );
  
  if (error || !dashboardData) return <div className="text-center text-unach-red p-12 font-bold border border-red-100 bg-red-50 rounded-xl mt-10">{error || 'No se encontraron datos.'}</div>;
  
  const { kpis, nombre, codigo, historial_academico } = dashboardData;

  const materiasPorPeriodo = historial_academico.reduce((acc, materia) => {
      const key = materia.periodo || 'Periodo Desconocido';
      if (!acc[key]) acc[key] = [];
      acc[key].push(materia);
      return acc;
  }, {} as Record<string, HistorialAcademico[]>);

  const situacionColorClasses = {
    APROBADO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    REPROBADO: 'bg-rose-100 text-rose-700 border border-rose-200',
    Pendiente: 'bg-gray-100 text-gray-600 border border-gray-200',
    DEFAULT: 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  return (
    <>
      <div className="space-y-8 pb-12 animate-in fade-in duration-500 font-sans">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
            <div>
                <h1 className="text-3xl font-black text-unach-blue flex items-center gap-3">
                    Hola, {nombre.split(' ')[0]} <span className="text-2xl animate-wave">👋</span>
                </h1>
                <p className="text-gray-500 mt-1 flex items-center gap-2 text-sm font-medium">
                    <GraduationCap size={16} /> Estudiante: <span className="font-bold text-gray-700">{codigo}</span>
                </p>
            </div>
            <div className="hidden md:block text-right">
               <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm font-bold text-gray-600">
                   <Calendar size={14} className="text-unach-blue" />
                   {new Date().toLocaleDateString('es-EC', { year: 'numeric', month: 'long' })}
               </div>
            </div>
        </div>

        {/* AVISOS / ALERTAS */}
        <div className="grid grid-cols-1 gap-4">
            {materiasEnRiesgo.length > 0 && (
            <div className="bg-gradient-to-r from-rose-50 to-white border-l-4 border-rose-500 p-5 rounded-r-xl shadow-sm flex items-start gap-4 transition-all hover:shadow-md cursor-default">
                <div className="p-2 bg-white rounded-full text-rose-500 shadow-sm">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <p className="font-black text-gray-800 text-lg">Alerta de Rendimiento</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Probabilidad baja en: <span className="font-bold text-rose-600">{materiasEnRiesgo.join(', ')}</span>.
                        <br/>Agenda una tutoría para mejorar tu pronóstico.
                    </p>
                </div>
            </div>
            )}

            {tutoriasProgramadas.length > 0 && (
            <div className="bg-unach-blue text-white p-5 rounded-xl shadow-lg shadow-blue-200 flex flex-col md:flex-row items-center justify-between relative overflow-hidden gap-4">
                <div className="flex items-center gap-4 z-10">
                    <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Calendar size={28} className="text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Próxima Sesión</p>
                        <p className="font-bold text-lg">"{tutoriasProgramadas[0].tema}"</p>
                        <p className="text-sm text-blue-100 flex items-center gap-2 mt-0.5">
                           <Clock size={14} /> {new Date(tutoriasProgramadas[0].fecha).toLocaleString()}
                        </p>
                    </div>
                </div>
                <Link to="/tutorias/estudiante" className="z-10 bg-white text-unach-blue px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-50 transition-all transform hover:-translate-y-0.5 shadow-md flex items-center gap-2">
                    Ver Detalles <ChevronRight size={16} />
                </Link>
            </div>
            )}
        </div>
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-blue-200 transition-all">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Promedio General</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-unach-blue">
                            {Number(kpis.promedio_general).toFixed(2)}
                        </span>
                        <span className="text-sm text-gray-400 font-bold">/ 10</span>
                    </div>
                </div>
                <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-unach-blue">
                    <TrendingUp size={32} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-red-200 transition-all">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Asignaturas</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black text-unach-red">
                            {kpis.total_materias}
                        </span>
                        <span className="text-sm text-gray-400 font-bold">cursadas</span>
                    </div>
                </div>
                <div className="h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center text-unach-red">
                    <BookOpen size={32} />
                </div>
            </div>
        </div>

        {/* ACORDEÓN DE MATERIAS POR PERIODO */}
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-1">
                <div className="p-2 bg-gray-800 rounded-lg text-white shadow-md">
                    <Archive size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Historial Académico</h2>
            </div>

            {Object.entries(materiasPorPeriodo).map(([periodo, materias]) => {
                const isOpen = expandedPeriods[periodo];
                const notasFinales = materias.map(m => m.final).filter(n => n !== null) as number[];
                const promedioPeriodo = notasFinales.length > 0 
                    ? (notasFinales.reduce((a, b) => a + b, 0) / notasFinales.length).toFixed(2) 
                    : '-';

                return (
                    <div key={periodo} className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${isOpen ? 'border-blue-200 shadow-md' : 'border-gray-200 hover:border-blue-300'}`}>
                        
                        <div onClick={() => togglePeriod(periodo)} className="p-5 cursor-pointer flex items-center justify-between bg-white select-none">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full transition-colors ${isOpen ? 'bg-blue-50 text-unach-blue' : 'bg-gray-100 text-gray-400'}`}>
                                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{periodo}</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">{materias.length} asignaturas</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Promedio</p>
                                <p className="text-xl font-black text-gray-800">{promedioPeriodo}</p>
                            </div>
                        </div>

                        {isOpen && (
                            <div className="border-t border-gray-100 bg-gray-50/30">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-gray-50/50 text-gray-400">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest w-1/3">Asignatura</th>
                                                {/* ✅ CORRECCIÓN: Separamos las columnas P1 y P2 en el encabezado */}
                                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">P1</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">P2</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Final</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Estado</th>
                                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Prob. Aprobación</th>
                                                <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-widest">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-50">
                                            {materias.map((materia, index) => {
                                                const situacionKey = (materia.situacion || 'Pendiente') as keyof typeof situacionColorClasses;
                                                const situacionColor = situacionColorClasses[situacionKey] || situacionColorClasses.DEFAULT;
                                                // Bloquear si no hay tutor (null) o si ya aprobó
                                                const isBlocked = !materia.tutor_id || materia.situacion === 'APROBADO';

                                                return (
                                                    <tr key={index} className="hover:bg-blue-50/10 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-sm text-gray-700">{materia.asignatura}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Tutor: {materia.tutor_nombre || 'No asignado'}</span>
                                                            </div>
                                                        </td>
                                                        {/* ✅ CORRECCIÓN: Separamos los datos P1 y P2 en dos celdas */}
                                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                                            {materia.parcial1 ?? '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                                            {materia.parcial2 ?? '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`text-sm font-black ${materia.final && materia.final >= 7 ? 'text-unach-blue' : 'text-gray-300'}`}>
                                                                {materia.final ?? '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border shadow-sm ${situacionColor}`}>
                                                                {materia.situacion || 'En Curso'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {/* Ruedita de Probabilidad sin Tooltip complejo */}
                                                            <div className="flex justify-center" title="Probabilidad de éxito">
                                                                <RiskCircle percent={materia.probabilidad_riesgo || 0} />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => handleAgendarClick(materia.matricula_id, materia.tutor_id, materia.tutor_nombre)} 
                                                                className="group/btn inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:border-unach-blue hover:text-unach-blue hover:shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                                disabled={isBlocked}
                                                                title={isBlocked ? "No disponible (Sin tutor o Aprobada)" : "Agendar Tutoría"}
                                                            >
                                                                Agendar <Clock size={12} className="text-gray-400 group-hover/btn:text-unach-blue" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
      </div>

      <AgendarTutoriaModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        matriculaId={selectedMatriculaId}
        tutorId={selectedTutorId}
        tutorNombre={selectedTutorNombre}
        onSuccess={handleSuccessAgendar} 
      />
    </>
  );
};

export default DashboardEstudiante;