// frontend/src/pages/ReportesCoordinador.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { getCoordinatorReport, ReportData } from '../services/reportService';

const ReportesCoordinador: React.FC = () => {
  const [data, setData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para los filtros
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('');
  const [filtroTutor, setFiltroTutor] = useState<string>('');
  // ✅ 1. CAMBIADO: de 'filtroDepto' a 'filtroCarrera'
  const [filtroCarrera, setFiltroCarrera] = useState<string>('');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const report = await getCoordinatorReport();
        setData(report);
        setError(null);
      } catch (err) {
        console.error("Error al cargar reporte:", err);
        setError('No se pudieron cargar los reportes. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, []); 

  // --- Lógica de Filtros ---
  
  const periodosUnicos = useMemo(() => {
    return [...new Set(data.map(item => item.periodo))].sort().reverse();
  }, [data]);

  // ✅ 2. CAMBIADO: de 'deptosUnicos' a 'carrerasUnicas'
  const carrerasUnicas = useMemo(() => {
    return [...new Set(data.map(item => item.carrera))].sort();
  }, [data]);

  // Filtramos los tutores BASADO en la carrera seleccionada
  const tutoresUnicos = useMemo(() => {
    return [...new Set(
      data
        .filter(item => !filtroCarrera || item.carrera === filtroCarrera)
        .map(item => item.tutor_nombre)
    )].sort();
  }, [data, filtroCarrera]); // ✅ Depende de filtroCarrera

  // Aplicamos los filtros a los datos
  const datosFiltrados = useMemo(() => {
    return data.filter(item => {
      const pasaPeriodo = !filtroPeriodo || item.periodo === filtroPeriodo;
      // ✅ 3. CAMBIADO: Lógica del filtro
      const pasaCarrera = !filtroCarrera || item.carrera === filtroCarrera;
      const pasaTutor = !filtroTutor || item.tutor_nombre === filtroTutor;
      return pasaPeriodo && pasaCarrera && pasaTutor;
    });
  }, [data, filtroPeriodo, filtroCarrera, filtroTutor]); // ✅ 4. Depende de filtroCarrera


  // --- Renderizado ---
  if (loading) return <div className="text-center p-12">Cargando reporte detallado...</div>;
  if (error) return <div className="text-center text-red-500 p-12">{error}</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Reporte Detallado de Tutorías</h1>
      
      {/* SECCIÓN DE FILTROS */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por Periodo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo Académico</label>
            <select
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los Periodos</option>
              {periodosUnicos.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* ✅ 5. CAMBIADO: Filtro de Carrera */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carrera</label>
            <select
              value={filtroCarrera}
              onChange={(e) => {
                setFiltroCarrera(e.target.value);
                setFiltroTutor(''); // Reseteamos el tutor si cambia la carrera
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas las Carreras</option>
              {carrerasUnicas.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          {/* Filtro por Tutor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tutor</label>
            <select
              value={filtroTutor}
              onChange={(e) => setFiltroTutor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los Tutores</option>
              {tutoresUnicos.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE LA TABLA DE DATOS */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Resultados del Reporte ({datosFiltrados.length})</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Periodo</th>
                {/* ✅ 6. CAMBIADO: Columna de Carrera */}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrera</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprobados</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reprobados</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tutorías Realizadas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Satisfacción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {datosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    No se encontraron datos para los filtros seleccionados.
                  </td>
                </tr>
              )}
              {datosFiltrados.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{item.periodo}</td>
                  {/* ✅ 7. CAMBIADO: Celda de Carrera */}
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">{item.carrera}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.tutor_nombre}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{item.asignatura}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-600">{item.total_aprobados}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{item.total_reprobados}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{item.tutorias_realizadas}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-yellow-600">
                    {item.satisfaccion_promedio > 0 ? `${item.satisfaccion_promedio} / 5.0` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportesCoordinador;