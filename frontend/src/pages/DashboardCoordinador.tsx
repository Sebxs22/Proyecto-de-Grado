// frontend/src/pages/DashboardCoordinador.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getCoordinatorDashboard, CoordinatorDashboard } from '../services/cmiService';
import axiosClient from '../api/axiosClient'; 
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  CheckCircle2, 
  Star, 
  Briefcase,
  Activity,
  CalendarRange,
  TrendingUp,
  ShieldCheck,
  BookOpen, // Icono para aprendizaje
} from 'lucide-react';

// Colores Institucionales para los gráficos
const COLORS = ['#002F6C', '#E31B23', '#10B981', '#F59E0B', '#6B7280'];

const DashboardCoordinador: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CoordinatorDashboard | null>(null);
  // Estado para datos de calidad (ISO/IEC 25012)
  const [calidadData, setCalidadData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Carga de datos CMI originales
      const data = await getCoordinatorDashboard();
      setDashboardData(data);

      // 2. Carga datos de Calidad ISO/IEC 25012
      try {
        const resCalidad = await axiosClient.get('/reports/data-quality');
        setCalidadData(resCalidad.data);
      } catch (err) {
        console.warn("No se pudo cargar calidad de datos, continuando...", err);
      }

      setError(null);
    } catch (err: any) {
      console.error('❌ Error CMI:', err);
      setError('No se pudo cargar el Cuadro de Mando Integral.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-unach-blue animate-pulse">
      <Activity size={48} strokeWidth={1} />
      <p className="mt-4 font-medium text-sm tracking-wide">CARGANDO DATOS ESTRATÉGICOS...</p>
    </div>
  );

  if (error || !dashboardData) return <div className="text-center text-unach-red p-12 font-bold border border-red-100 bg-red-50 rounded-xl mt-10">{error}</div>;

  const { nombre, cmi } = dashboardData;
  const dataPastel = cmi.perspectiva_procesos.distribucion_estados;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* 1. HEADER EJECUTIVO */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
          <div>
              <h1 className="text-3xl font-extrabold text-unach-blue flex items-center gap-3">
                  Panel de Control CMI <span className="text-2xl">📊</span>
              </h1>
              <p className="text-gray-500 mt-1 ml-1 text-sm">
                  Bienvenido, Coordinador {nombre}. Visión estratégica del periodo.
              </p>
          </div>
          <div className="hidden md:block text-right">
             <div className="px-4 py-2 bg-white border border-blue-100 rounded-lg shadow-sm flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-unach-blue rounded-md">
                    <CalendarRange size={18} />
                </div>
                <div className="text-left">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Periodo Académico</p>
                    <p className="text-sm font-bold text-unach-blue">2025 - 2026</p>
                </div>
             </div>
          </div>
      </div>

      {/* 2. KPI DE CALIDAD DE DATOS (ISO/IEC 25012) */}
      {calidadData && (
        <div className="bg-gradient-to-r from-indigo-50 to-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
                <h2 className="text-sm font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <ShieldCheck size={18} className="text-indigo-600" /> 
                    Calidad de Datos (ISO/IEC 25012)
                </h2>
                <div className="flex items-end gap-3">
                    <span className="text-5xl font-black text-gray-800 tracking-tighter">
                        {calidadData.indice_global}%
                    </span>
                    <div className="mb-2">
                         <span className={`text-xs font-bold px-2 py-1 rounded border ${
                            calidadData.indice_global > 90 
                            ? 'bg-green-100 text-green-700 border-green-200' 
                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }`}>
                            {calidadData.estado}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">Índice de Fiabilidad de Información</p>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 border-t md:border-t-0 md:border-l border-indigo-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-700">{calidadData.metricas.precision}%</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Precisión</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-bold text-gray-700">{calidadData.metricas.completitud}%</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Completitud</p>
                </div>
                <div className="text-center hidden sm:block">
                    <p className="text-2xl font-bold text-gray-700">{calidadData.metricas.registros_auditados}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Auditados</p>
                </div>
            </div>
        </div>
      )}

      {/* 3. PERSPECTIVA ESTUDIANTE */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <GraduationCap size={16} className="text-unach-red" /> Perspectiva Estudiante
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tasa Asistencia */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-unach-blue hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tasa de Asistencia</p>
                        <p className="text-5xl font-black text-unach-blue mt-2 tracking-tight">
                            {cmi.perspectiva_estudiante.tasa_asistencia}%
                        </p>
                        <p className="text-xs text-gray-400 mt-2 font-medium">de tutorías finalizadas con éxito</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-unach-blue">
                        <CheckCircle2 size={32} />
                    </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-4 overflow-hidden">
                    <div 
                        className="bg-unach-blue h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${cmi.perspectiva_estudiante.tasa_asistencia}%` }}
                    ></div>
                </div>
            </div>

            {/* Satisfacción */}
            <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-400 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Satisfacción Promedio</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className="text-5xl font-black text-gray-800 tracking-tight">{cmi.perspectiva_estudiante.satisfaccion_promedio}</p>
                            <p className="text-lg text-gray-400 font-bold">/ 5.0</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 font-medium">basado en evaluaciones estudiantiles</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-xl text-yellow-500">
                        <Star size={32} fill="currentColor" />
                    </div>
                </div>
                <div className="flex gap-1 mt-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star} 
                            size={16} 
                            className={`${star <= Math.round(cmi.perspectiva_estudiante.satisfaccion_promedio) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}`} 
                        />
                    ))}
                </div>
            </div>
        </div>
      </div>

      {/* 4. PERSPECTIVA PROCESOS */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
            <Activity size={16} className="text-unach-red" /> Perspectiva Procesos Internos
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* KPI Total Sesiones */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center lg:col-span-1 hover:shadow-md transition-all">
                <div className="p-4 bg-emerald-50 rounded-full text-emerald-600 mb-4 shadow-sm">
                    <CheckCircle2 size={40} strokeWidth={1.5} />
                </div>
                <p className="text-6xl font-black text-gray-800 tracking-tighter">{cmi.perspectiva_procesos.total_sesiones_realizadas}</p>
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mt-2">Sesiones Realizadas</p>
                <p className="text-xs text-gray-400 mt-2 px-4 leading-relaxed">Total acumulado de tutorías ejecutadas en el periodo.</p>
            </div>

            {/* Gráfico de Pastel */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <LayoutDashboard size={18} className="text-unach-blue" /> Distribución de Estados
                    </p>
                    <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-50 px-2 py-1 rounded">Tiempo Real</span>
                </div>
                
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dataPastel}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {dataPastel.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ 
                                    borderRadius: '12px', 
                                    border: 'none', 
                                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                    padding: '12px'
                                }}
                                itemStyle={{ color: '#374151', fontWeight: 'bold', fontSize: '12px' }}
                            />
                            <Legend 
                                verticalAlign="middle" 
                                align="right" 
                                layout="vertical" 
                                iconType="circle"
                                wrapperStyle={{ fontSize: '12px', fontWeight: 500, color: '#6B7280' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>

      {/* 5. PERSPECTIVA RECURSOS */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
            <Briefcase size={16} className="text-unach-red" /> Perspectiva Recursos
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tutores */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-purple-200 transition-colors group">
                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                    <Briefcase size={24} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-800">{cmi.perspectiva_recursos.total_tutores}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Docentes Tutores</p>
                </div>
            </div>

            {/* Estudiantes */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-blue-200 transition-colors group">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-800">{cmi.perspectiva_recursos.total_estudiantes}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Estudiantes Activos</p>
                </div>
            </div>

            {/* Ratio */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors group">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-800">{cmi.perspectiva_recursos.ratio_tutor_estudiante.toFixed(1)}</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Est. por Tutor</p>
                </div>
            </div>
        </div>
      </div>

      {/* 6. PERSPECTIVA APRENDIZAJE Y CRECIMIENTO (NUEVA SECCIÓN) */}
      <div>
        <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2 mt-8">
            <BookOpen size={16} className="text-unach-red" /> Perspectiva Aprendizaje y Crecimiento
        </h2>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
                <div className="p-4 bg-orange-50 text-orange-600 rounded-full">
                    <Users size={28} />
                </div>
                <div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black text-gray-800">
                            {cmi.perspectiva_aprendizaje?.tasa_adherencia_tutores ?? 0}%
                        </p>
                    </div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Adherencia de Tutores</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                        {cmi.perspectiva_aprendizaje?.tutores_activos ?? 0} tutores activos registrando datos.
                    </p>
                </div>
            </div>
            
            {/* Barra de progreso de adherencia */}
            <div className="w-full md:w-1/2 flex flex-col gap-1">
                <div className="flex justify-between text-xs font-bold text-gray-400">
                    <span>0%</span>
                    <span>Meta: 80%</span>
                    <span>100%</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                     <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000" 
                        style={{ width: `${cmi.perspectiva_aprendizaje?.tasa_adherencia_tutores ?? 0}%` }}
                    ></div>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default DashboardCoordinador;