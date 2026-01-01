// frontend/src/pages/DashboardTutor.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getTutorDashboard, TutorDashboard, CursoTutor } from '../services/tutorDashboardService'; 
import { Link } from 'react-router-dom';
import { 
  TrendingUp, AlertCircle, Star, Clock, BookOpen, School, Calendar, 
  ChevronDown, ChevronUp, ArrowRightCircle, Users, 
  Activity, BrainCircuit, CheckCircle
} from 'lucide-react';

const safeParseFloat = (value: number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

// Componente Circular (Lógica Tutor: Ver progreso de aprobación)
const RiskCircle = ({ percent }: { percent: number }) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    
    // < 40 Rojo (Critico), < 70 Amarillo (Riesgo), > 70 Verde (Bien)
    let color = 'text-emerald-500'; 
    if (percent < 40) color = 'text-rose-500'; 
    else if (percent < 70) color = 'text-amber-500';

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
  
  // Control de tarjetas de grupos
  const [groupsOpen, setGroupsOpen] = useState({
      critical: true, // Prioritarios abiertos por defecto
      normal: false   // Normales cerrados para no saturar
  });

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
  
  const toggleGroup = (group: 'critical' | 'normal') => {
      setGroupsOpen(prev => ({ ...prev, [group]: !prev[group] }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50/50 text-unach-blue animate-pulse">
      <School size={64} strokeWidth={1} />
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

  const { nombre, cursos, tutorias_pendientes, average_rating = 0.0 } = dashboardData;

  // 1. FILTRADO INTELIGENTE (IA)
  // Filtramos estudiantes que NO estén aprobados ni reprobados (solo los activos/en curso)
  // OJO: Si 'situacion' viene null, asumimos que está en curso.
  const estudiantesActivos = cursos.filter(c => 
      c.situacion !== 'APROBADO' && c.situacion !== 'REPROBADO'
  );
  
  // Grupo Prioritario: Probabilidad < 70%
  const grupoPrioritario = estudiantesActivos.filter(c => (c.probabilidad_riesgo || 0) < 70)
      .sort((a, b) => (a.probabilidad_riesgo || 0) - (b.probabilidad_riesgo || 0));
      
  // Grupo Normal: Probabilidad >= 70%
  const grupoNormal = estudiantesActivos.filter(c => (c.probabilidad_riesgo || 0) >= 70);

  // 2. AGRUPACIÓN POR MATERIAS
  const cursosAgrupados = cursos.reduce((acc: any, curso: CursoTutor) => {
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

  const calcularEstadisticas = (estudiantes: CursoTutor[]) => {
    const notasValidas = estudiantes.filter(e => e.final !== null).map(e => safeParseFloat(e.final));
    const aprobados = estudiantes.filter(e => e.situacion === 'APROBADO').length;
    const reprobados = estudiantes.filter(e => e.situacion === 'REPROBADO').length;
    const promedioFinal = notasValidas.length > 0
        ? (notasValidas.reduce((sum: number, n: number) => sum + n, 0) / notasValidas.length).toFixed(2)
        : 'N/A';
    return { total: estudiantes.length, aprobados, reprobados, promedioFinal };
  };

  // Helper para renderizar tabla de grupos (Tarjetas Superiores)
  const RenderGroupList = ({ students }: { students: CursoTutor[] }) => (
      <div className="grid grid-cols-1 divide-y divide-gray-100">
        {students.map((est, idx) => (
            <div key={idx} className="p-4 flex flex-col md:flex-row items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold bg-gray-100 text-gray-500 border border-white shadow-sm uppercase">
                        {est.estudiante_nombre ? est.estudiante_nombre.charAt(0) : 'E'}
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-gray-800">{est.estudiante_nombre}</h4>
                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                            <BookOpen size={10} /> {est.asignatura}
                        </p>
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                     <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">
                        {est.mensaje_explicativo || "Sin diagnóstico disponible."}
                     </p>
                </div>
                <div className="flex items-center gap-6 justify-between md:justify-end w-full md:w-auto">
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Nota</p>
                        <p className="text-sm font-black text-gray-700">{est.final ?? (est.parcial1 ?? '-')}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Tutorías</p>
                        <p className="text-sm font-black text-emerald-600">{est.tutorias_acumuladas ?? 0}</p>
                    </div>
                    <div className="relative w-12 h-12 flex items-center justify-center ml-2" title="Probabilidad de Aprobación">
                        <RiskCircle percent={est.probabilidad_riesgo || 0} />
                    </div>
                </div>
            </div>
        ))}
      </div>
  );

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
                <span>Periodo Actual</span>
             </div>
          </div>
      </div>

      {/* --- MÓDULO DE SEGUIMIENTO (TARJETAS DE GRUPOS) --- */}
      <div className="space-y-4">
        
        {/* GRUPO 1: ATENCIÓN PRIORITARIA */}
        {/* Siempre renderizamos la tarjeta, aunque tenga 0, para mostrar que no hay riesgo */}
        <div className={`border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${groupsOpen.critical ? 'bg-white border-rose-200 ring-1 ring-rose-100' : 'bg-white border-gray-200'}`}>
            <div onClick={() => toggleGroup('critical')} className="p-5 cursor-pointer flex items-center justify-between bg-gradient-to-r from-rose-50 to-white select-none">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-rose-200 rounded-full blur animate-pulse"></div>
                        <div className="relative p-3 bg-white text-rose-500 rounded-full shadow-sm">
                            <BrainCircuit size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Atención Prioritaria (IA)</h3>
                        <p className="text-xs text-rose-600 font-bold mt-0.5">
                            {grupoPrioritario.length} estudiantes con probabilidad baja de aprobación
                        </p>
                    </div>
                </div>
                <div className={`p-2 rounded-full transition-colors ${groupsOpen.critical ? 'bg-rose-100 text-rose-600' : 'bg-gray-50 text-gray-400'}`}>
                    {groupsOpen.critical ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>
            {groupsOpen.critical && (
                <div className="border-t border-rose-100 bg-white">
                    <RenderGroupList students={grupoPrioritario} />
                </div>
            )}
        </div>

        {/* GRUPO 2: SEGUIMIENTO NORMAL */}
        <div className={`border rounded-2xl shadow-sm overflow-hidden transition-all duration-300 ${groupsOpen.normal ? 'bg-white border-emerald-200' : 'bg-white border-gray-200'}`}>
            <div onClick={() => toggleGroup('normal')} className="p-5 cursor-pointer flex items-center justify-between bg-white hover:bg-gray-50 transition-colors select-none">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-500 rounded-full shadow-sm">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800">Buen Pronóstico</h3>
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                            {grupoNormal.length} estudiantes con buen rendimiento
                        </p>
                    </div>
                </div>
                <div className={`p-2 rounded-full transition-colors ${groupsOpen.normal ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                    {groupsOpen.normal ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
            </div>
            {groupsOpen.normal && (
                <div className="border-t border-gray-100 bg-white">
                    <RenderGroupList students={grupoNormal} />
                </div>
            )}
        </div>
      </div>

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

      {/* --- SECCIÓN MIS ASIGNATURAS --- */}
      <div className="space-y-6 pt-8 border-t border-gray-100">
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
                  
                  {/* MINI DASHBOARD ASIGNATURA */}
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
                                {/* ✅ CAMBIO: Columnas P1, P2 y Final separadas */}
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">P1</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">P2</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Final</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Estado</th>
                                <th className="px-6 py-4 text-center text-[10px] font-bold uppercase tracking-widest">Prob. Aprobación</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                            {data.estudiantes.map((est: any, idx: number) => {
                                return (
                                <tr key={idx} className="group hover:bg-blue-50/10 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 uppercase">
                                            {est.estudiante_nombre ? est.estudiante_nombre.charAt(0) : 'E'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-gray-700 group-hover:text-unach-blue transition-colors">
                                                {est.estudiante_nombre}
                                            </span>
                                            {(est.probabilidad_riesgo || 0) < 60 && est.situacion !== 'APROBADO' && (
                                                <span className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-0.5 animate-pulse">
                                                    <AlertCircle size={9} /> REQUIERE ATENCIÓN
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                
                                {/* ✅ CAMBIO: Celdas separadas */}
                                <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                    {est.parcial1 ?? '-'}
                                </td>
                                <td className="px-6 py-4 text-center text-sm font-medium text-gray-500">
                                    {est.parcial2 ?? '-'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-sm font-black ${est.final && est.final >= 7 ? 'text-unach-blue' : 'text-gray-300'}`}>
                                        {est.final ?? '-'}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border shadow-sm ${est.situacion === 'APROBADO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                        {est.situacion || 'En Curso'}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-4 text-center">
                                    <div className="flex justify-center">
                                        <RiskCircle percent={est.probabilidad_riesgo || 0} />
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