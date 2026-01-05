// frontend/src/pages/ReportesCoordinador.tsx

import React, { useEffect, useState, useMemo, useDeferredValue } from 'react';
import { getCoordinatorReport, ReportData } from '../services/reportService';
import * as XLSX from 'xlsx'; // Importamos librería de Excel
import { 
  FileText, Filter, Download, Search, Users, BookOpen, 
  Star, ChevronLeft, ChevronRight, BarChart3, PieChart as PieChartIcon 
} from 'lucide-react';
// Importamos componentes de gráficos
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

// --- COLORES UNACH ---
const COLORS = {
  blue: '#002F6C',    // Azul oscuro institucional
  red: '#E01728',     // Rojo institucional
  gray: '#E5E7EB',
  green: '#10B981',
  yellow: '#F59E0B'
};

// --- COMPONENTE SKELETON (Mantenemos tu diseño de carga) ---
const TableSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
       {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>)}
    </div>
    <div className="h-64 bg-gray-200 rounded-xl"></div>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="h-14 bg-gray-100 border-b border-gray-200"></div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 border-b border-gray-100 bg-white"></div>
      ))}
    </div>
  </div>
);

const ReportesCoordinador: React.FC = () => {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('');
  const [filtroTutor, setFiltroTutor] = useState<string>('');
  const [filtroCarrera, setFiltroCarrera] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>(''); 
  const busquedaDiferida = useDeferredValue(busqueda); 

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const report = await getCoordinatorReport();
        setData(report);
        setError(null);
      } catch (err) {
        console.error("Error al cargar reporte:", err);
        setError('No se pudieron cargar los reportes. Verifica la conexión.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []); 

  useEffect(() => { setCurrentPage(1); }, [filtroPeriodo, filtroCarrera, filtroTutor, busquedaDiferida]);

  // --- LÓGICA DE FILTROS ---
  const periodosUnicos = useMemo(() => [...new Set(data.map(i => i.periodo))].sort().reverse(), [data]);
  const carrerasUnicas = useMemo(() => [...new Set(data.map(i => i.carrera))].sort(), [data]);
  
  const tutoresUnicos = useMemo(() => {
    return [...new Set(data
        .filter(i => !filtroCarrera || i.carrera === filtroCarrera)
        .map(i => i.tutor_nombre)
    )].sort();
  }, [data, filtroCarrera]);

  const datosFiltrados = useMemo(() => {
    return data.filter(item => {
      const matchPeriodo = !filtroPeriodo || item.periodo === filtroPeriodo;
      const matchCarrera = !filtroCarrera || item.carrera === filtroCarrera;
      const matchTutor = !filtroTutor || item.tutor_nombre === filtroTutor;
      const matchBusqueda = !busquedaDiferida || 
                            item.asignatura.toLowerCase().includes(busquedaDiferida.toLowerCase()) ||
                            item.tutor_nombre.toLowerCase().includes(busquedaDiferida.toLowerCase());
      return matchPeriodo && matchCarrera && matchTutor && matchBusqueda;
    });
  }, [data, filtroPeriodo, filtroCarrera, filtroTutor, busquedaDiferida]);

  // --- AGREGACIÓN DE DATOS PARA GRÁFICOS ---
  const stats = useMemo(() => {
    const totalEst = datosFiltrados.reduce((acc, curr) => acc + curr.total_estudiantes, 0);
    const totalTutorias = datosFiltrados.reduce((acc, curr) => acc + curr.tutorias_realizadas, 0);
    const promSatisfaccion = datosFiltrados.length > 0 
        ? (datosFiltrados.reduce((acc, curr) => acc + curr.satisfaccion_promedio, 0) / datosFiltrados.length).toFixed(1) 
        : "0";
    
    // Agrupar por carrera para el gráfico de barras
    const porCarreraRaw = datosFiltrados.reduce((acc, curr) => {
        if (!acc[curr.carrera]) acc[curr.carrera] = { name: curr.carrera, Aprobados: 0, Reprobados: 0 };
        acc[curr.carrera].Aprobados += curr.total_aprobados;
        acc[curr.carrera].Reprobados += curr.total_reprobados;
        return acc;
    }, {} as Record<string, any>);
    
    // Datos para gráfico circular (Estado de tutorías)
    const tutoriasData = [
        { name: 'Realizadas', value: datosFiltrados.reduce((acc, c) => acc + c.tutorias_realizadas, 0), color: COLORS.green },
        { name: 'Canceladas', value: datosFiltrados.reduce((acc, c) => acc + c.tutorias_canceladas, 0), color: COLORS.red },
        { name: 'No Asistió', value: datosFiltrados.reduce((acc, c) => acc + c.tutorias_no_asistidas, 0), color: COLORS.yellow },
    ].filter(d => d.value > 0);

    return { totalEst, totalTutorias, promSatisfaccion, chartCarrera: Object.values(porCarreraRaw), tutoriasData };
  }, [datosFiltrados]);

  // --- FUNCIÓN DE EXPORTACIÓN A EXCEL ---
  const handleExportExcel = () => {
    const headers = ["Periodo", "Carrera", "Tutor", "Asignatura", "Estudiantes", "Aprobados", "Reprobados", "Tutorías Realizadas", "Satisfacción"];
    const rows = datosFiltrados.map(item => [
      item.periodo, item.carrera, item.tutor_nombre, item.asignatura, 
      item.total_estudiantes, item.total_aprobados, item.total_reprobados, 
      item.tutorias_realizadas, item.satisfaccion_promedio
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Tutorías");
    XLSX.writeFile(workbook, `Reporte_Coordinador_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = datosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage);

  if (loading) return <TableSkeleton />;
  if (error) return <div className="text-center text-red-600 font-bold p-10 bg-red-50 rounded-xl border border-red-200">{error}</div>;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-[#002F6C] flex items-center gap-3">
                Reporte de Gestión Académica
            </h1>
            <p className="text-gray-500 text-sm mt-1">Monitoreo de rendimiento, cumplimiento de tutorías y satisfacción.</p>
        </div>
        <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg transform active:scale-95"
        >
            <Download size={18} /> Exportar Excel
        </button>
      </div>

      {/* 2. BARRA DE FILTROS (Diseño mejorado) */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[150px]">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Periodo</label>
            <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#002F6C] outline-none">
              <option value="">Todos</option>
              {periodosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </div>
        <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Carrera</label>
            <select value={filtroCarrera} onChange={(e) => { setFiltroCarrera(e.target.value); setFiltroTutor(''); }} className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#002F6C] outline-none">
              <option value="">Todas</option>
              {carrerasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
        <div className="flex-1 min-w-[180px]">
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tutor</label>
            <select value={filtroTutor} onChange={(e) => setFiltroTutor(e.target.value)} className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-[#002F6C] outline-none">
              <option value="">Todos</option>
              {tutoresUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
        </div>
        <div className="flex-[2] min-w-[200px]">
             <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Búsqueda Rápida</label>
            <div className="relative">
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                <input type="text" placeholder="Buscar por asignatura o tutor..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 p-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#002F6C] outline-none"/>
            </div>
        </div>
      </div>

      {/* 3. KPI CARDS (Indicadores) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase">Estudiantes Atendidos</p>
                <p className="text-2xl font-black text-[#002F6C]">{stats.totalEst}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full text-[#002F6C]"><Users size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase">Tutorías Realizadas</p>
                <p className="text-2xl font-black text-emerald-600">{stats.totalTutorias}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-full text-emerald-600"><FileText size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase">Satisfacción Promedio</p>
                <p className="text-2xl font-black text-yellow-500 flex items-center gap-1">
                    {stats.promSatisfaccion} <Star size={20} fill="currentColor" />
                </p>
            </div>
            <div className="bg-yellow-50 p-3 rounded-full text-yellow-500"><Star size={24} /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-gray-400 text-xs font-bold uppercase">Registros Filtrados</p>
                <p className="text-2xl font-black text-gray-700">{datosFiltrados.length}</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-full text-gray-500"><Filter size={24} /></div>
        </div>
      </div>

      {/* 4. GRÁFICOS (Visual Analytics) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico Barras: Rendimiento */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-2">
            <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-6">
                <BarChart3 size={20} /> Rendimiento Académico por Carrera (Aprobados vs Reprobados)
            </h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.chartCarrera} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                        <YAxis />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend />
                        <Bar dataKey="Aprobados" fill={COLORS.green} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Reprobados" fill={COLORS.red} radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Gráfico Pastel: Estado Tutorías */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
             <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-6">
                <PieChartIcon size={20} /> Estado de Tutorías
            </h3>
            <div className="h-64 w-full flex justify-center">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={stats.tutoriasData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.tutoriasData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* 5. TABLA DETALLADA */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Desglose Detallado</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Periodo / Carrera</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase">Docente & Asignatura</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase">Estudiantes / Rendimiento</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase">Gestión Tutorías</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase">Calidad</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <p>No se encontraron resultados con los filtros actuales.</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="block text-xs font-bold text-gray-400 mb-1">{item.periodo}</span>
                    <span className="text-sm font-bold text-gray-800">{item.carrera}</span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#002F6C] text-white flex items-center justify-center text-xs font-bold">
                            {item.tutor_nombre.charAt(0)}
                        </div>
                        <div>
                            <div className="text-sm font-bold text-gray-800">{item.tutor_nombre}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <BookOpen size={10} /> {item.asignatura}
                            </div>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">Total: {item.total_estudiantes}</span>
                        <div className="flex gap-2 text-xs font-bold">
                            <span className="text-emerald-600">{item.total_aprobados} Aprob</span>
                            <span className="text-gray-300">|</span>
                            <span className={item.total_reprobados > 0 ? "text-red-600" : "text-gray-400"}>
                                {item.total_reprobados} Reprob
                            </span>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className="text-sm">
                        <span className="font-bold text-[#002F6C]">{item.tutorias_realizadas}</span> 
                        <span className="text-gray-400 text-xs"> / {item.total_tutorias_registradas} Realizadas</span>
                     </div>
                     {item.tutorias_canceladas > 0 && (
                        <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                            {item.tutorias_canceladas} Canceladas
                        </span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.satisfaccion_promedio > 0 ? (
                        <div className="flex flex-col items-center">
                             <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-800">{item.satisfaccion_promedio.toFixed(1)}</span>
                                <Star size={14} className="text-yellow-400" fill="currentColor"/>
                            </div>
                            <div className="w-16 h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-yellow-400" style={{width: `${(item.satisfaccion_promedio / 5) * 100}%`}}></div>
                            </div>
                        </div>
                    ) : <span className="text-xs text-gray-300">-</span>}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {datosFiltrados.length > 0 && (
            <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
                <span className="text-xs text-gray-500">
                    Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, datosFiltrados.length)} de {datosFiltrados.length}
                </span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft size={16} /></button>
                    <span className="px-3 py-1 bg-white border rounded text-sm font-bold flex items-center">{currentPage}</span>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 bg-white border rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ReportesCoordinador;