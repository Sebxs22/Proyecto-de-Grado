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
        
        const enRiesgo = dashboard.historial_academico
          .filter(m => m.riesgo_color === 'red' || m.riesgo_color === 'yellow')
          .map(m => m.asignatura);
        setMateriasEnRiesgo(enRiesgo);
        
        // LÓGICA DE AUTO-APERTURA DE PERIODOS
        // Agrupamos temporalmente para decidir qué abrir
        const grupos: Record<string, HistorialAcademico[]> = {};
        dashboard.historial_academico.forEach(m => {
            if (!grupos[m.periodo]) grupos[m.periodo] = [];
            grupos[m.periodo].push(m);
        });

        const initialExpanded: Record<string, boolean> = {};
        Object.entries(grupos).forEach(([periodo, materias]) => {
            // Si alguna materia NO está finalizada (APROBADO/REPROBADO), el periodo está "En Curso" -> Abrir
            const estaEnCurso = materias.some(m => 
                m.situacion !== 'APROBADO' && m.situacion !== 'REPROBADO'
            );
            // También abrimos siempre el periodo más reciente (el primero de la lista si viene ordenado)
            initialExpanded[periodo] = estaEnCurso; 
        });
        
        // Hack: Si nada se abrió (todo finalizado), abrir el primer periodo (el más reciente)
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

  // AGRUPAR MATERIAS POR PERIODO
  // Usamos un objeto donde la clave es el nombre del periodo
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
      <div className="space-y-8 pb-12 animate-in fade-in duration-500">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
            <div>
                <h1 className="text-3xl font-extrabold text-unach-blue flex items-center gap-3">
                    Hola, {nombre} <span className="text-2xl">👋</span>
                </h1>
                <p className="text-gray-500 mt-1 ml-1 flex items-center gap-2 text-sm">
                    <GraduationCap size={16} /> Código: <span className="font-bold text-gray-700">{codigo}</span>
                </p>
            </div>
            <div className="hidden md:block text-right">
               <p className="text-xs font-bold text-unach-blue/60 uppercase tracking-widest">Fecha Actual</p>
               <p className="text-sm font-semibold text-gray-700">
                   {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </p>
            </div>
        </div>

        {/* AVISOS */}
        <div className="grid grid-cols-1 gap-4">
            {materiasEnRiesgo.length > 0 && (
            <div className="bg-white border-l-4 border-unach-red p-5 rounded-lg shadow-sm flex items-start gap-4 transition-all hover:shadow-md cursor-default">
                <div className="p-3 bg-red-50 rounded-full text-unach-red">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-lg">Atención Académica Requerida</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Riesgo potencial detectado en: <span className="font-bold text-unach-red">{materiasEnRiesgo.join(', ')}</span>.
                        Se recomienda agendar tutoría.
                    </p>
                </div>
            </div>
            )}

            {tutoriasProgramadas.length > 0 && (
            <div className="bg-unach-blue text-white p-5 rounded-lg shadow-lg flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="flex items-center gap-4 z-10">
                    <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                        <Calendar size={24} className="text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-wider">Próxima Sesión</p>
                        <p className="font-bold text-lg mt-0.5">"{tutoriasProgramadas[0].tema}"</p>
                        <p className="text-sm text-blue-100 flex items-center gap-2 mt-1">
                           <Clock size={14} /> {new Date(tutoriasProgramadas[0].fecha).toLocaleString()}
                        </p>
                    </div>
                </div>
                <Link to="/tutorias/estudiante" className="z-10 bg-white text-unach-blue px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm">
                    Ver Detalles <ChevronRight size={16} />
                </Link>
            </div>
            )}
        </div>
        
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all duration-300 group">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Promedio General</p>
                    <div className="flex items-end gap-2">
                        <span className="text-6xl font-black text-unach-blue tracking-tighter group-hover:scale-105 transition-transform origin-left">
                            {Number(kpis.promedio_general).toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-400 font-medium mb-1.5">/ 10</span>
                    </div>
                </div>
                <div className="h-20 w-20 bg-blue-50 rounded-2xl flex items-center justify-center text-unach-blue group-hover:bg-unach-blue group-hover:text-white transition-colors shadow-inner">
                    <TrendingUp size={36} strokeWidth={2} />
                </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-lg transition-all duration-300 group">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Materias Cursadas</p>
                    <div className="flex items-end gap-2">
                        <span className="text-6xl font-black text-unach-red tracking-tighter group-hover:scale-105 transition-transform origin-left">
                            {kpis.total_materias}
                        </span>
                        <span className="text-lg text-gray-400 font-medium mb-1.5">asignaturas</span>
                    </div>
                </div>
                <div className="h-20 w-20 bg-red-50 rounded-2xl flex items-center justify-center text-unach-red group-hover:bg-unach-red group-hover:text-white transition-colors shadow-inner">
                    <BookOpen size={36} strokeWidth={2} />
                </div>
            </div>
        </div>

        {/* ACORDEÓN DE MATERIAS POR PERIODO */}
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-unach-blue rounded-lg text-white shadow-md">
                    <Archive size={20} />
                </div>
                <h2 className="text-xl font-bold text-gray-800">Historial Académico</h2>
            </div>

            {Object.entries(materiasPorPeriodo).map(([periodo, materias]) => {
                const isOpen = expandedPeriods[periodo];
                // Calculamos promedio del periodo para mostrar en el header
                const notasFinales = materias.map(m => m.final).filter(n => n !== null) as number[];
                const promedioPeriodo = notasFinales.length > 0 
                    ? (notasFinales.reduce((a, b) => a + b, 0) / notasFinales.length).toFixed(2) 
                    : 'N/A';

                return (
                    <div key={periodo} className={`bg-white border rounded-xl shadow-sm overflow-hidden transition-all ${isOpen ? 'border-unach-blue ring-1 ring-blue-100' : 'border-gray-200 hover:border-blue-300'}`}>
                        
                        {/* HEADER DE LA TARJETA DE PERIODO */}
                        <div 
                            onClick={() => togglePeriod(periodo)}
                            className="p-5 cursor-pointer flex items-center justify-between bg-gray-50 hover:bg-blue-50/50 transition-colors select-none"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${isOpen ? 'bg-unach-blue text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </div>
                                <div>
                                    <h3 className={`text-lg font-bold ${isOpen ? 'text-unach-blue' : 'text-gray-700'}`}>
                                        {periodo}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">
                                        {materias.length} asignaturas registradas
                                    </p>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Promedio Periodo</p>
                                <p className="text-xl font-black text-gray-800">{promedioPeriodo}</p>
                            </div>
                        </div>

                        {/* CONTENIDO (TABLA) - Solo si está abierto */}
                        {isOpen && (
                            <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-100">
                                        <thead className="bg-white text-gray-400">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider w-1/3">Asignatura</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">P1</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">P2</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Final</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Estado</th>
                                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Riesgo</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-50">
                                            {materias.map((materia, index) => {
                                                const situacionKey = (materia.situacion || 'Pendiente') as keyof typeof situacionColorClasses;
                                                const situacionColor = situacionColorClasses[situacionKey] || situacionColorClasses.DEFAULT;
                                                
                                                const riesgoColorMap: Record<string, string> = {
                                                    red: 'text-rose-700 bg-rose-50 border-rose-200 ring-1 ring-rose-100',
                                                    yellow: 'text-amber-700 bg-amber-50 border-amber-200 ring-1 ring-amber-100',
                                                    green: 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100',
                                                    gray: 'text-gray-500 bg-gray-50 border-gray-200'
                                                };
                                                const riesgoStyle = riesgoColorMap[materia.riesgo_color || 'gray'];

                                                return (
                                                    <tr key={index} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-bold text-gray-800 text-sm group-hover:text-unach-blue transition-colors">
                                                                    {materia.asignatura}
                                                                </span>
                                                                <span className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5 font-medium">
                                                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                        {materia.tutor_nombre ? materia.tutor_nombre.charAt(0) : '?'}
                                                                    </div>
                                                                    {materia.tutor_nombre || 'Sin Tutor Asignado'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                                                            {materia.parcial1 ? Number(materia.parcial1).toFixed(2) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                                                            {materia.parcial2 ? Number(materia.parcial2).toFixed(2) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`text-sm font-bold ${materia.final && materia.final >= 7 ? 'text-unach-blue' : 'text-gray-400'}`}>
                                                                {materia.final ? Number(materia.final).toFixed(2) : '-'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`px-3 py-1.5 text-[10px] uppercase tracking-wide font-bold rounded-full shadow-sm ${situacionColor}`}>
                                                                {materia.situacion || 'En Curso'}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div 
                                                                className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border w-full max-w-[140px] mx-auto ${riesgoStyle}`}
                                                                title={`Probabilidad: ${materia.probabilidad_riesgo ? materia.probabilidad_riesgo.toFixed(2) : 0}%`}
                                                            >
                                                                <span className={`relative inline-flex rounded-full h-2 w-2 ${materia.riesgo_color === 'red' ? 'bg-rose-500 animate-pulse' : materia.riesgo_color === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                                <span className="text-xs font-bold">{materia.riesgo_nivel?.replace('Riesgo ', '')}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => handleAgendarClick(materia.matricula_id, materia.tutor_id, materia.tutor_nombre)} 
                                                                className="group/btn relative inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white transition-all duration-200 bg-unach-blue rounded-lg hover:bg-blue-800 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                                                                disabled={!materia.tutor_id}
                                                            >
                                                                <span>Agendar</span>
                                                                <Clock size={14} className="text-blue-200 group-hover/btn:text-white transition-colors" />
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