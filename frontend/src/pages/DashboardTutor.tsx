// frontend/src/pages/DashboardTutor.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getTutorDashboard, TutorDashboard } from '../services/tutorDashboardService'; 
import { Link } from 'react-router-dom';
import { 
  Users, 
  TrendingUp, 
  AlertCircle, 
  Star, 
  Clock,
  BookOpen,
  School,
  ChevronRight,
  Calendar,
  ChevronDown, // Para el acordeón
  ChevronUp
} from 'lucide-react';

// Función Helper para formatear nombre
const formatName = (fullName: string) => {
    if (!fullName) return "Tutor";
    const parts = fullName.split(' ').filter(Boolean);
    if (parts.length >= 3) {
        const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        const surname = parts[2].charAt(0).toUpperCase() + parts[2].slice(1).toLowerCase();
        return `${name} ${surname}`;
    }
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase(); // Fallback
};

// Función auxiliar para parseo seguro
const safeParseFloat = (value: number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
};

const DashboardTutor: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<TutorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para controlar qué cursos están expandidos (Abiertos)
  // Usamos un objeto donde la clave es el ID del curso y el valor es true/false
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTutorDashboard();
      setDashboardData(data);
      
      // Opcional: Si quieres que el PRIMER curso aparezca abierto por defecto
      /*
      if (data.cursos.length > 0) {
          const firstKey = `${data.cursos[0].periodo} - ${data.cursos[0].asignatura}`;
          setExpandedCourses({ [firstKey]: true });
      }
      */
     
      setError(null);
    } catch (err) {
      console.error("❌ Error al cargar dashboard tutor:", err);
      setError('No se pudo cargar la información.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  // Función para abrir/cerrar una tarjeta
  const toggleCourse = (key: string) => {
      setExpandedCourses(prev => ({
          ...prev,
          [key]: !prev[key] // Invierte el valor actual (true -> false, false -> true)
      }));
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-unach-blue animate-pulse">
      <School size={48} strokeWidth={1} />
      <p className="mt-4 font-medium text-sm tracking-wide">CARGANDO PANEL DOCENTE...</p>
    </div>
  );

  if (error || !dashboardData) return <div className="text-center text-unach-red p-12 font-bold border border-red-100 bg-red-50 rounded-xl mt-10">{error || 'No se encontraron datos.'}</div>;

  const { nombre, cursos, tutorias_pendientes, average_rating = 0.0 } = dashboardData as TutorDashboard & { average_rating: number };

  // Agrupación por cursos
  const cursosAgrupados = cursos.reduce((acc, curso) => {
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
  }, {} as Record<string, { periodo: string; asignatura: string; estudiantes: typeof cursos }>);

  const calcularEstadisticas = (estudiantes: typeof cursos) => {
    const estudiantesConNota = estudiantes.filter(e => e.final !== null);
    const notasValidas = estudiantesConNota.map(e => safeParseFloat(e.final));
    const aprobados = estudiantes.filter(e => e.situacion === 'APROBADO').length;
    const reprobados = estudiantes.filter(e => e.situacion === 'REPROBADO').length;
    const promedioFinal = notasValidas.length > 0
        ? (notasValidas.reduce((sum, n) => sum + n, 0) / notasValidas.length).toFixed(2)
        : 'N/A';
    return { total: estudiantes.length, aprobados, reprobados, promedioFinal };
  };

  // Mapeo de colores
  const riesgoColorMap: Record<string, string> = {
      red: 'text-rose-700 bg-rose-50 border-rose-200 ring-1 ring-rose-100',
      yellow: 'text-amber-700 bg-amber-50 border-amber-200 ring-1 ring-amber-100',
      green: 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-1 ring-emerald-100',
      gray: 'text-gray-400 bg-gray-50 border-gray-200'
  };

  const situacionColorClasses: Record<string, string> = {
      APROBADO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      REPROBADO: 'bg-rose-100 text-rose-700 border border-rose-200',
      Pendiente: 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
          <div>
              <h1 className="text-3xl font-extrabold text-unach-blue flex items-center gap-3">
                  {/* AQUI APLICAMOS EL FORMATO */}
                  Hola, Tutor {formatName(nombre)} <span className="text-2xl">👨‍🏫</span>
              </h1>
              <p className="text-gray-500 mt-1 ml-1 flex items-center gap-2 text-sm">
                  <School size={16} /> Gestión Académica y Tutorial
              </p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-xs font-bold text-unach-blue/60 uppercase tracking-widest">Periodo Activo</p>
             <p className="text-sm font-semibold text-gray-700">Noviembre 2025 - Abril 2026</p>
          </div>
      </div>

      {/* TARJETAS KPI (Sin cambios) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-100 flex items-center justify-between hover:shadow-md transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-110"></div>
            <div className="z-10">
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Star size={14} className="fill-emerald-600" /> Calificación Promedio
                </p>
                <div className="flex items-end gap-2">
                    <span className="text-5xl font-black text-gray-800 tracking-tighter">
                        {Number(average_rating).toFixed(2)}
                    </span>
                    <span className="text-lg text-gray-400 font-medium mb-1.5">/ 5.0</span>
                </div>
            </div>
            <div className="h-16 w-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm z-10">
                <TrendingUp size={32} strokeWidth={2} />
            </div>
        </div>
        
        <div className={`p-6 rounded-xl shadow-sm border flex items-center justify-between hover:shadow-md transition-all group relative overflow-hidden ${tutorias_pendientes.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'}`}>
            <div className="z-10">
                <p className={`text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2 ${tutorias_pendientes.length > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                    <Clock size={14} /> Solicitudes Pendientes
                </p>
                <div className="flex items-center gap-4">
                    <span className={`text-5xl font-black tracking-tighter ${tutorias_pendientes.length > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
                        {tutorias_pendientes.length}
                    </span>
                    {tutorias_pendientes.length > 0 && (
                        <Link 
                            to="/tutorias/tutor"
                            className="px-4 py-2 bg-white text-amber-700 text-xs font-bold rounded-lg shadow-sm hover:shadow hover:bg-amber-50 border border-amber-200 transition-all flex items-center gap-1"
                        >
                            Gestionar <ChevronRight size={14} />
                        </Link>
                    )}
                </div>
            </div>
            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm z-10 ${tutorias_pendientes.length > 0 ? 'bg-white text-amber-500' : 'bg-gray-50 text-gray-300'}`}>
                <AlertCircle size={32} strokeWidth={2} />
            </div>
        </div>
      </div>

      {/* SECCIÓN DE CURSOS (ACORDEÓN) */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-unach-blue rounded-lg text-white shadow-md">
                <BookOpen size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Mis Asignaturas</h2>
        </div>
        
        {Object.keys(cursosAgrupados).length > 0 ? (
          Object.entries(cursosAgrupados).map(([key, cursoData]) => {
            const stats = calcularEstadisticas(cursoData.estudiantes);
            const isExpanded = !!expandedCourses[key]; // ¿Está abierta esta tarjeta?
            
            return (
              // Contenedor principal de la tarjeta
              <div key={key} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md">
                
                {/* HEADER DEL CURSO (Ahora es clicable) */}
                <div 
                    onClick={() => toggleCourse(key)}
                    className="p-6 bg-white cursor-pointer group select-none flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-extrabold text-unach-blue group-hover:text-blue-700 transition-colors">
                            {cursoData.asignatura}
                        </h3>
                        {/* Indicador de estado abierto/cerrado */}
                        {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mt-1 flex items-center gap-1">
                        <Calendar size={12} /> {cursoData.periodo}
                    </p>
                  </div>
                  
                  {/* MINI STATS (Incluyendo Promedio) */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <div className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center min-w-[80px]">
                        <p className="text-[9px] text-gray-400 font-bold uppercase">Total Est.</p>
                        <p className="text-base font-bold text-gray-700">{stats.total}</p>
                    </div>
                    {/* ✅ AQUÍ AGREGAMOS EL PROMEDIO */}
                    <div className="px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100 flex flex-col items-center min-w-[80px]">
                        <p className="text-[9px] text-indigo-600 font-bold uppercase flex items-center gap-1">Promedio</p>
                        <p className="text-base font-bold text-indigo-700">{stats.promedioFinal}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100 flex flex-col items-center min-w-[80px]">
                        <p className="text-[9px] text-emerald-600 font-bold uppercase">Aprobados</p>
                        <p className="text-base font-bold text-emerald-700">{stats.aprobados}</p>
                    </div>
                    <div className="px-3 py-1.5 bg-rose-50 rounded-lg border border-rose-100 flex flex-col items-center min-w-[80px]">
                        <p className="text-[9px] text-rose-600 font-bold uppercase">Reprobados</p>
                        <p className="text-base font-bold text-rose-700">{stats.reprobados}</p>
                    </div>
                  </div>
                </div>

                {/* CUERPO DEL CURSO (Tabla) - Solo se muestra si isExpanded es true */}
                {isExpanded && (
                    <div className="border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider w-1/3">Estudiante</th>
                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">P1</th>
                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">P2</th>
                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Final</th>
                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">Riesgo Predictivo</th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                            {cursoData.estudiantes.map((estudiante, idx) => {
                                const situacionColor = situacionColorClasses[estudiante.situacion || 'Pendiente'] || situacionColorClasses.Pendiente;
                                const riesgoStyle = riesgoColorMap[estudiante.riesgo_color || 'gray'];

                                return (
                                <tr key={`${estudiante.estudiante_id}-${idx}`} className="hover:bg-blue-50/30 transition-colors">
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                            {estudiante.estudiante_nombre.charAt(0)}
                                        </div>
                                        <span className="font-medium text-sm text-gray-700">
                                            {estudiante.estudiante_nombre}
                                        </span>
                                    </div>
                                </td>
                                
                                <td className="px-6 py-3 text-center text-sm text-gray-500">
                                    {estudiante.parcial1 !== null ? Number(estudiante.parcial1).toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-3 text-center text-sm text-gray-500">
                                    {estudiante.parcial2 !== null ? Number(estudiante.parcial2).toFixed(2) : '-'}
                                </td>
                                <td className="px-6 py-3 text-center">
                                    <span className={`text-sm font-bold ${estudiante.final && estudiante.final >= 7 ? 'text-unach-blue' : 'text-gray-400'}`}>
                                        {estudiante.final !== null ? Number(estudiante.final).toFixed(2) : '-'}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-3 text-center">
                                    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-full shadow-sm ${situacionColor}`}>
                                        {estudiante.situacion || 'En Curso'}
                                    </span>
                                </td>
                                
                                <td className="px-6 py-3 text-center">
                                    <div 
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border ${riesgoStyle}`}
                                        title={`Probabilidad: ${estudiante.probabilidad_riesgo || 0}%`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${estudiante.riesgo_color === 'red' ? 'bg-rose-500 animate-pulse' : estudiante.riesgo_color === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                        <span className="text-[10px] font-bold">{estudiante.riesgo_nivel?.replace('Riesgo ', '') || 'N/A'}</span>
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
            );
          })
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <Users size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No tienes asignaturas ni estudiantes asignados actualmente.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTutor;