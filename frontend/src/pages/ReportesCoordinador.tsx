// frontend/src/pages/ReportesCoordinador.tsx

import React, { useEffect, useState, useMemo, useDeferredValue } from 'react';
import { getCoordinatorReport, ReportData } from '../services/reportService';
import { 
  FileText, 
  Filter, 
  Download, 
  Search, 
  Users, 
  BookOpen, 
  GraduationCap,
  Star,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// --- COMPONENTE SKELETON ---
const TableSkeleton = () => (
  <div className="space-y-6 animate-pulse">
    <div className="flex justify-between items-center pb-6 border-b border-gray-200">
      <div className="h-8 w-64 bg-gray-300 rounded-lg"></div>
      <div className="h-8 w-32 bg-gray-300 rounded-lg"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-gray-200">
      <div className="h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-10 bg-gray-200 rounded-lg"></div>
    </div>
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="h-14 bg-gray-100 border-b border-gray-200 flex items-center px-6">
          <div className="h-4 w-full bg-gray-300 rounded opacity-50"></div>
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center p-5 border-b border-gray-100 gap-6">
          <div className="h-4 w-24 bg-gray-300 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
          <div className="h-4 w-40 bg-gray-200 rounded"></div>
          <div className="h-6 w-20 bg-gray-300 rounded-full ml-auto"></div>
        </div>
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
  
  // Búsqueda
  const [busqueda, setBusqueda] = useState<string>(''); 
  const busquedaDiferida = useDeferredValue(busqueda); 

  // --- PAGINACIÓN (La clave para que no se trabe) ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Mostramos 10 por página para que sea muy rápido

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const report = await getCoordinatorReport();
        setData(report);
        setError(null);
      } catch (err) {
        console.error("Error al cargar reporte:", err);
        setError('No se pudieron cargar los reportes.');
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, []); 

  // Resetear a página 1 cuando cambian los filtros (Importante)
  useEffect(() => {
    setCurrentPage(1);
  }, [filtroPeriodo, filtroCarrera, filtroTutor, busquedaDiferida]);

  // --- Lógica de Filtros ---
  const periodosUnicos = useMemo(() => [...new Set(data.map(i => i.periodo))].sort().reverse(), [data]);
  const carrerasUnicas = useMemo(() => [...new Set(data.map(i => i.carrera))].sort(), [data]);
  
  const tutoresUnicos = useMemo(() => {
    return [...new Set(
      data
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

  // --- CÁLCULO DE PAGINACIÓN ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = datosFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(datosFiltrados.length / itemsPerPage);

  if (loading) return <TableSkeleton />;
  if (error) return <div className="text-center text-unach-red p-12 font-bold border border-red-100 bg-red-50 rounded-xl">{error}</div>;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6 gap-4">
        <div>
            <h1 className="text-3xl font-extrabold text-unach-blue flex items-center gap-3">
                Reporte Detallado <span className="text-2xl">📑</span>
            </h1>
            <p className="text-gray-500 mt-1 text-sm flex items-center gap-2">
               <FileText size={16} /> Análisis de rendimiento por asignatura y tutor.
            </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:text-unach-blue transition-colors shadow-sm text-sm">
            <Download size={16} /> Exportar CSV
        </button>
      </div>
      
      {/* BARRA DE FILTROS */}
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-gray-400 mr-2">
            <Filter size={20} /> <span className="text-xs font-bold uppercase tracking-wider">Filtrar:</span>
        </div>
        {/* Select Periodo */}
        <div className="relative flex-1 min-w-[180px]">
            <select value={filtroPeriodo} onChange={(e) => setFiltroPeriodo(e.target.value)} className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-unach-blue focus:border-transparent outline-none cursor-pointer appearance-none font-medium">
              <option value="">Todos los Periodos</option>
              {periodosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">▼</div>
        </div>
        {/* Select Carrera */}
        <div className="relative flex-1 min-w-[200px]">
            <select value={filtroCarrera} onChange={(e) => { setFiltroCarrera(e.target.value); setFiltroTutor(''); }} className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-unach-blue focus:border-transparent outline-none cursor-pointer appearance-none font-medium">
              <option value="">Todas las Carreras</option>
              {carrerasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">▼</div>
        </div>
        {/* Select Tutor */}
        <div className="relative flex-1 min-w-[200px]">
            <select value={filtroTutor} onChange={(e) => setFiltroTutor(e.target.value)} className="w-full pl-3 pr-8 py-2 bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-unach-blue focus:border-transparent outline-none cursor-pointer appearance-none font-medium">
              <option value="">Todos los Tutores</option>
              {tutoresUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-400">▼</div>
        </div>
        {/* Busqueda */}
        <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Search size={16} />
            </div>
            <input type="text" placeholder="Buscar asignatura..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-2 focus:ring-unach-blue focus:border-transparent outline-none transition-all"/>
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Resultados</h2>
            <span className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-bold text-unach-blue shadow-sm">
                {datosFiltrados.length} registros encontrados
            </span>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y divide-gray-200 transition-opacity duration-200 ${busqueda !== busquedaDiferida ? 'opacity-50' : 'opacity-100'}`}>
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Periodo / Carrera</th>
                <th className="px-6 py-4 text-left text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tutor & Asignatura</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Rendimiento</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Tutorías</th>
                <th className="px-6 py-4 text-center text-xs font-extrabold text-gray-500 uppercase tracking-wider">Satisfacción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {datosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                      <Search size={48} className="mb-4 text-gray-200 mx-auto" />
                      <p className="font-medium">No se encontraron resultados.</p>
                  </td>
                </tr>
              ) : (
                // Mapeamos currentItems (los 10 de la página actual) NO todos los datos
                currentItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                            <GraduationCap size={12} /> {item.periodo}
                        </span>
                        <span className="text-sm font-bold text-gray-700 mt-1 max-w-[180px] truncate" title={item.carrera}>
                            {item.carrera}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">
                                {item.tutor_nombre.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-unach-blue">{item.tutor_nombre}</span>
                         </div>
                         <div className="text-xs text-gray-500 mt-1 ml-8 flex items-center gap-1">
                            <BookOpen size={12} /> {item.asignatura}
                         </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center align-middle">
                     <div className="flex items-center justify-center gap-3">
                        <div className="text-center">
                            <span className="block text-sm font-bold text-emerald-600">{item.total_aprobados}</span>
                            <span className="block text-[10px] text-gray-400 uppercase">Apr</span>
                        </div>
                        <div className="h-6 w-px bg-gray-200"></div>
                        <div className="text-center">
                            <span className={`block text-sm font-bold ${item.total_reprobados > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                                {item.total_reprobados}
                            </span>
                            <span className="block text-[10px] text-gray-400 uppercase">Rep</span>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                        <Users size={14} />
                        {item.tutorias_realizadas}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {item.satisfaccion_promedio > 0 ? (
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-1 text-yellow-500">
                                <span className="text-sm font-black text-gray-700">{item.satisfaccion_promedio.toFixed(1)}</span>
                                <Star size={14} fill="currentColor" />
                            </div>
                            <div className="flex gap-0.5 mt-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <div key={star} className={`h-1 w-3 rounded-full ${star <= Math.round(item.satisfaccion_promedio) ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <span className="text-xs text-gray-400 italic">Sin evaluar</span>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* CONTROLES DE PAGINACIÓN */}
        {datosFiltrados.length > 0 && (
            <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
                <div className="text-xs text-gray-500 font-medium">
                    Mostrando {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, datosFiltrados.length)} de {datosFiltrados.length}
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
      </div>
    </div>
  );
};

export default ReportesCoordinador;