// frontend/src/pages/DashboardTutor.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getTutorDashboard, TutorDashboard } from '../services/tutorDashboardService'; 
import { Link } from 'react-router-dom';
import { 
  TrendingUp, AlertCircle, Star, Clock, BookOpen, School, Calendar, 
  ChevronDown, ChevronUp, ArrowRightCircle, Users, 
  Activity, BrainCircuit
} from 'lucide-react';

const safeParseFloat = (value: number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

// Componente Circular
const RiskCircle = ({ percent }: { percent: number }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    // LOGICA VISUAL:
    // < 40% = Rojo (Peligro de reprobar)
    // 40-69% = Amarillo (En la cuerda floja)
    // > 70% = Verde (Aprobación probable)
    let color = 'text-rose-500'; 
    if (percent >= 70) color = 'text-emerald-500';
    else if (percent >= 40) color = 'text-amber-500';

    return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
                <circle cx="24" cy="24" r={radius} stroke="#f3f4f6" strokeWidth="4" fill="transparent" />
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

const DashboardTutor: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<TutorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [showAllRisks, setShowAllRisks] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTutorDashboard();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error("Error dashboard:", err);
      setError('No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const toggleCourse = (key: string) => {
      setExpandedCourses(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50/50 text-unach-blue animate-pulse">
      <School size={64} strokeWidth={1} className="drop-shadow-sm" />
      <p className="mt-6 font-semibold text-sm tracking-widest text-gray-400">CARGANDO ECOSISTEMA DOCENTE...</p>
    </div>
  );

  if (error || !dashboardData) return (
    <div className="flex justify-center items-center h-96">
        <div className="text-center text-red-500 p-8 font-bold border border-red-100 bg-red-50 rounded-2xl shadow-sm max-w-md">
            <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
            <p>{error || 'No se encontraron datos.'}</p>
        </div>
    </div>
  );

  const { nombre, cursos, tutorias_pendientes, average_rating = 0.0 } = dashboardData as any;

  // 1. FILTRADO
  const estudiantesEnRiesgo = cursos.filter((c: any) => 
      c.riesgo_nivel === 'ALTO' || 
      c.riesgo_nivel === 'MEDIO' || 
      c.riesgo_nivel === 'Riesgo Alto (Finalizado)' ||
      (c.probabilidad_riesgo && c.probabilidad_riesgo > 40)
  ).sort((a: any, b: any) => (b.probabilidad_riesgo || 0) - (a.probabilidad_riesgo || 0));

  const visibleRisks = showAllRisks ? estudiantesEnRiesgo : estudiantesEnRiesgo.slice(0, 5);

  // 2. AGRUPACIÓN
  const cursosAgrupados = cursos.reduce((acc: any, curso: any) => {
    const key = `${curso.periodo} - ${curso.asignatura}`;
    if (!acc[key]) {
      acc[key] = {
        periodo: curso.periodo,
        asignatura: curso.asignatura,
        estudiantes: []
      };
    }
    acc[key].estudiantes.push(curso);
    return acc;
  }, {});

  const calcularEstadisticas = (estudiantes: any[]) => {
    const estudiantesConNota = estudiantes.filter(e => e.final !== null);
    const notasValidas = estudiantesConNota.map(e => safeParseFloat(e.final));
    const aprobados = estudiantes.filter(e => e.situacion === 'APROBADO').length;
    const reprobados = estudiantes.filter(e => e.situacion === 'REPROBADO').length;
    const promedioFinal = notasValidas.length > 0
        ? (notasValidas.reduce((sum: number, n: number) => sum + n, 0) / notasValidas.length).toFixed(2)
        : 'N/A';
    return { total: estudiantes.length, aprobados, reprobados, promedioFinal };
  };

  const situacionColorClasses: Record<string, string> = {
      APROBADO: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
      REPROBADO: 'bg-rose-50 text-rose-700 border border-rose-100',
      Pendiente: 'bg-gray-50 text-gray-500 border border-gray-200',
  };

  const riesgoColorMap: Record<string, string> = {
      red: 'text-rose-600 bg-rose-50 border-rose-200',
      yellow: 'text-amber-600 bg-amber-50 border-amber-200',
      green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      gray: 'text-gray-400 bg-gray-50 border-gray-100'
  };

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-700 font-sans">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-gray-100 pb-6 gap-4">
          <div>
              <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-unach-blue uppercase tracking-wider">Docente</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-50 text-gray-400 uppercase tracking-wider">Dashboard</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-800 tracking-tight flex items-center gap-3">
                  Hola, {nombre ? nombre.split(' ')[0] : 'Tutor'} <span className="animate-wave origin-bottom-right inline-block">👋</span>
              </h1>
              <p className="text-gray-500 mt-2 text-sm max-w-lg leading-relaxed">
                  Sistema de Monitoreo Académico y Alerta Temprana.
              </p>
          </div>
          <div className="hidden md:block text-right">
             <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm font-medium text-gray-600">
                <Calendar size={14} className="text-unach-blue" />
                <span>Nov 2025 - Abr 2026</span>
             </div>
          </div>
      </div>

      {/* --- MÓDULO DE ALERTA TEMPRANA --- */}
      {estudiantesEnRiesgo.length > 0 ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-rose-50 border border-rose-100 shadow-xl shadow-rose-100/50 group">
            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500"></div>
            
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-6">
                    <div className="flex-shrink-0">
                        <div className="relative">
                            <div className="absolute inset-0 bg-rose-200 rounded-full blur animate-pulse"></div>
                            <div className="relative p-4 bg-white text-rose-500 rounded-full shadow-md ring-4 ring-rose-50">
                                <BrainCircuit size={32} strokeWidth={1.5} />
                            </div>
                            <div className="absolute -top-1 -right-1 bg-rose-600 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                                {estudiantesEnRiesgo.length}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            Predicción de Riesgo Académico (IA)
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] uppercase font-bold rounded-full tracking-wider">Alta Prioridad</span>
                        </h3>
                        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
                            Intervención sugerida basada en <strong>Notas</strong> y <strong>Tutorías</strong>.
                        </p>
                    </div>

                    <div className="flex-shrink-0">
                        <Link to="/tutorias/tutor" className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl shadow-md shadow-rose-200 transition-all transform hover:-translate-y-0.5">
                            Agendar Tutorías
                            <ArrowRightCircle size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* --- LISTA DE DETALLE (TITULO UNICO: Estudiante ID) --- */}
                <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-1 divide-y divide-gray-100">
                        {visibleRisks.map((est: any, idx: number) => (
                            <div key={idx} className="p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-rose-50/30 transition-colors animate-in fade-in duration-300">
                                
                                {/* Info Estudiante */}
                                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm ${est.riesgo_nivel === 'ALTO' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                        E
                                    </div>
                                    <div>
                                        {/* ✅ TITULO ÚNICO DIRECTO */}
                                        <h4 className="text-sm font-bold text-gray-800">
                                            Estudiante {est.estudiante_id}
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                                            <BookOpen size={10} /> {est.asignatura}
                                        </p>
                                    </div>
                                </div>

                                {/* Diagnóstico */}
                                <div className="flex-1 md:border-l md:border-r border-gray-100 md:px-4 py-2 md:py-0 w-full md:w-auto">
                                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                        <span className="font-bold text-gray-400 uppercase text-[9px] block mb-1">Diagnóstico:</span>
                                        {est.mensaje_explicativo || "Riesgo detectado por inactividad académica."}
                                    </p>
                                </div>

                                {/* Métricas Clave */}
                                <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto">
                                    <div className="text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Nota</p>
                                        <p className="text-sm font-black text-gray-700">{est.parcial1 ?? '-'}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase">Tutorías</p>
                                        <p className={`text-sm font-black ${est.tutorias_acumuladas > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                                            {est.tutorias_acumuladas ?? 0}
                                        </p>
                                    </div>
                                    
                                    <div className="relative w-12 h-12 flex items-center justify-center ml-2">
                                        <RiskCircle percent={est.probabilidad_riesgo || 0} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* BOTÓN VER MÁS */}
                    {estudiantesEnRiesgo.length > 5 && (
                        <div 
                            onClick={() => setShowAllRisks(!showAllRisks)}
                            className="bg-rose-50/50 p-3 text-center border-t border-rose-100 cursor-pointer hover:bg-rose-100 transition-colors group select-none"
                        >
                            <span className="text-xs font-bold text-rose-600 flex items-center justify-center gap-2">
                                {showAllRisks 
                                    ? <>Ver menos <ChevronUp size={14} /></> 
                                    : <>Ver {estudiantesEnRiesgo.length - 5} estudiantes más <ChevronDown size={14} /></>
                                }
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-50 to-white border border-emerald-100 p-6 flex items-center gap-4 shadow-sm">
            <div className="p-3 bg-white text-emerald-500 rounded-full shadow-sm ring-1 ring-emerald-100">
                <Activity size={24} />
            </div>
            <div>
                <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wide">Sin Alertas Críticas</h3>
                <p className="text-sm text-emerald-600/80">Todos tus estudiantes mantienen un nivel de riesgo controlado.</p>
            </div>
        </div>
      )}

      {/* --- KPIS GENERALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-emerald-200 transition-colors">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Calificación Docente</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-800 group-hover:text-emerald-600 transition-colors">
                        {Number(average_rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-400 font-bold">/ 5.0</span>
                </div>
                <div className="mt-2 flex gap-1">
                     {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} size={12} className={`${star <= Math.round(average_rating) ? 'text-emerald-400 fill-emerald-400' : 'text-gray-200 fill-gray-200'}`} />
                     ))}
                </div>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-500 rounded-full">
                <TrendingUp size={28} />
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:border-amber-200 transition-colors">
            <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Solicitudes Pendientes</p>
                <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-800 group-hover:text-amber-600 transition-colors">
                        {tutorias_pendientes.length}
                    </span>
                    <span className="text-sm text-gray-400 font-bold">por revisar</span>
                </div>
                {tutorias_pendientes.length > 0 ? (
                    <Link to="/tutorias/tutor" className="mt-2 text-xs font-bold text-amber-600 flex items-center gap-1 hover:underline">
                        Gestionar ahora <ArrowRightCircle size={12} />
                    </Link>
                ) : (
                    <span className="mt-2 text-xs font-bold text-emerald-500 flex items-center gap-1">
                        ¡Todo al día! <Activity size={12} />
                    </span>
                )}
            </div>
            <div className="p-4 bg-amber-50 text-amber-500 rounded-full">
                <Clock size={28} />
            </div>
        </div>
      </div>

      {/* --- ACORDEÓN DE ASIGNATURAS --- */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
            <div className="p-2 bg-unach-blue rounded-lg text-white shadow-md shadow-blue-200">
                <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Mis Asignaturas</h2>
        </div>
        
        {Object.entries(cursosAgrupados).map(([key, data]: any) => (
            <div key={key} className={`bg-white border rounded-2xl transition-all duration-300 ${expandedCourses[key] ? 'border-blue-100 shadow-md ring-1 ring-blue-50' : 'border-gray-200 shadow-sm hover:border-blue-200'}`}>
                <div onClick={() => toggleCourse(key)} className="p-5 cursor-pointer select-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h3 className={`text-lg font-bold transition-colors ${expandedCourses[key] ? 'text-unach-blue' : 'text-gray-700'}`}>
                            {data.asignatura}
                        </h3>
                        <div className={`p-1 rounded-full transition-colors ${expandedCourses[key] ? 'bg-blue-50 text-unach-blue' : 'bg-gray-50 text-gray-400'}`}>
                            {expandedCourses[key] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                             <Calendar size={10} /> {data.periodo}
                        </span>
                        <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                             <Users size={10} /> {data.estudiantes.length} Estudiantes
                        </span>
                    </div>
                  </div>
                  
                  {/* MINI DASHBOARD */}
                  <div className="flex items-center gap-6 text-sm">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Promedio</p>
                            <p className="font-black text-gray-800">{calcularEstadisticas(data.estudiantes).promedioFinal}</p>
                        </div>
                        <div className="h-8 w-px bg-gray-100"></div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Aprob.</p>
                            <p className="font-bold text-emerald-600">{calcularEstadisticas(data.estudiantes).aprobados}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Reprob.</p>
                            <p className="font-bold text-rose-600">{calcularEstadisticas(data.estudiantes).reprobados}</p>
                        </div>
                  </div>
                </div>

                {expandedCourses[key] && (
                    <div className="border-t border-gray-100 bg-gray-50/30">
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50 text-gray-400">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-widest w-1/3">Estudiante</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">P1</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">P2</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Final</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Riesgo IA</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                            {data.estudiantes.map((est: any, idx: number) => {
                                const situacionColor = situacionColorClasses[est.situacion || 'Pendiente'] || situacionColorClasses.Pendiente;
                                const riesgoStyle = riesgoColorMap[est.riesgo_color || 'gray'];

                                return (
                                <tr key={idx} className="group hover:bg-blue-50/10 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${est.riesgo_nivel === 'ALTO' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                            E
                                        </div>
                                        <div className="flex flex-col">
                                            {/* ✅ TITULO ÚNICO: "Estudiante 12345" */}
                                            <span className="font-bold text-sm text-gray-700 group-hover:text-unach-blue transition-colors">
                                                Estudiante {est.estudiante_id}
                                            </span>
                                            
                                            {est.riesgo_nivel === 'ALTO' && (
                                                <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                                                    <AlertCircle size={9} /> ALERTA DE RIESGO
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">{est.parcial1 ?? '-'}</td>
                                <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">{est.parcial2 ?? '-'}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-sm font-black ${est.final && est.final >= 7 ? 'text-unach-blue' : 'text-gray-300'}`}>
                                        {est.final ?? '-'}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border shadow-sm ${situacionColor}`}>
                                        {est.situacion || 'En Curso'}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${riesgoStyle}`} title={`Probabilidad: ${est.probabilidad_riesgo || 0}%`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${est.riesgo_color === 'red' ? 'bg-rose-500' : est.riesgo_color === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                        <span className="text-[10px] font-bold uppercase">
                                            {est.riesgo_nivel?.replace('Riesgo ', '') || 'N/A'}
                                        </span>
                                    </div>
                                </td>
                                </tr>
                            )})}
                            </tbody>
                        </table>
                        </div>
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardTutor;