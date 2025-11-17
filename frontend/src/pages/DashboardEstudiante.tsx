// frontend/src/pages/DashboardEstudiante.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getStudentDashboard, StudentDashboard } from '../services/dashboardService';
import AgendarTutoriaModal from '../components/AgendarTutoriaModal';
import { getMisTutorias, TutoriaEstudiante } from '../services/tutoriaService';
import { Link } from 'react-router-dom';
// 1. Importamos los íconos profesionales de Lucide
import { 
  BookOpen, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  GraduationCap, 
  Clock, 
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

const DashboardEstudiante: React.FC = () => {
  // --- LÓGICA DE ESTADO (Igual que antes) ---
  const [dashboardData, setDashboardData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatriculaId, setSelectedMatriculaId] = useState<number | null>(null);
  const [selectedTutorId, setSelectedTutorId] = useState<number | null>(null);
  const [selectedTutorNombre, setSelectedTutorNombre] = useState<string | null>(null);
  const [tutoriasProgramadas, setTutoriasProgramadas] = useState<TutoriaEstudiante[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [materiasEnRiesgo, setMateriasEnRiesgo] = useState<string[]>([]);

  const fetchDashboardData = useCallback(async () => {
      try {
        setLoading(true);
        const [dashboard, tutorias] = await Promise.all([
          getStudentDashboard(),
          getMisTutorias() 
        ]);
        setDashboardData(dashboard);
        const programadas = tutorias.filter(t => t.estado === 'programada');
        setTutoriasProgramadas(programadas);
        
        // Detectar riesgo
        const enRiesgo = dashboard.historial_academico
          .filter(m => m.riesgo_color === 'red' || m.riesgo_color === 'yellow')
          .map(m => m.asignatura);
        setMateriasEnRiesgo(enRiesgo);
        
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
  
  const handleSuccessAgendar = () => { 
      handleModalClose(); 
      fetchDashboardData(); 
  }

  // Loader con estilo
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-96 text-unach-blue animate-pulse">
      <GraduationCap size={48} strokeWidth={1} />
      <p className="mt-4 font-medium text-sm tracking-wide">CARGANDO TU PANEL ACADÉMICO...</p>
    </div>
  );
  
  if (error || !dashboardData) return <div className="text-center text-unach-red p-12 font-bold border border-red-100 bg-red-50 rounded-xl mx-auto max-w-2xl mt-10">{error || 'No se encontraron datos.'}</div>;
  
  const { kpis, nombre, historial_academico } = dashboardData;
  
  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historial_academico.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historial_academico.length / itemsPerPage);

  // Definición de estilos para etiquetas
  const situacionColorClasses = {
    APROBADO: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    REPROBADO: 'bg-rose-100 text-rose-700 border border-rose-200',
    Pendiente: 'bg-gray-100 text-gray-600 border border-gray-200',
    DEFAULT: 'bg-gray-100 text-gray-600 border border-gray-200',
  };

  return (
    <>
      <div className="space-y-8 pb-12 animate-in fade-in duration-500">
        
        {/* 1. HEADER PRINCIPAL */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-6">
            <div>
                <h1 className="text-3xl font-extrabold text-unach-blue flex items-center gap-3">
                    Hola, {nombre.split(' ')[0]} <span className="text-2xl">👋</span>
                </h1>
                <p className="text-gray-500 mt-1 ml-1 flex items-center gap-2 text-sm">
                    <GraduationCap size={16} /> Panel de Control Estudiantil
                </p>
            </div>
            <div className="hidden md:block text-right">
               <p className="text-xs font-bold text-unach-blue/60 uppercase tracking-widest">Fecha Actual</p>
               <p className="text-sm font-semibold text-gray-700">
                   {new Date().toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
               </p>
            </div>
        </div>

        {/* 2. SECCIÓN DE AVISOS IMPORTATES (Riesgo y Tutorías) */}
        <div className="grid grid-cols-1 gap-4">
            {/* Alerta de Riesgo */}
            {materiasEnRiesgo.length > 0 && (
            <div className="bg-white border-l-4 border-unach-red p-5 rounded-lg shadow-sm flex items-start gap-4 transition-all hover:shadow-md group cursor-default">
                <div className="p-3 bg-red-50 rounded-full text-unach-red group-hover:bg-unach-red group-hover:text-white transition-colors">
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <p className="font-bold text-gray-800 text-lg">Atención Académica Requerida</p>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Nuestro sistema predictivo ha detectado un riesgo potencial en: <span className="font-bold text-unach-red">{materiasEnRiesgo.join(', ')}</span>.
                        Se recomienda agendar una tutoría de refuerzo inmediatamente.
                    </p>
                </div>
            </div>
            )}

            {/* Próxima Tutoría */}
            {tutoriasProgramadas.length > 0 && (
            <div className="bg-unach-blue text-white p-5 rounded-lg shadow-lg flex items-center justify-between relative overflow-hidden">
                {/* Decoración de fondo */}
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
                <Link 
                    to="/tutorias/estudiante" 
                    className="z-10 bg-white text-unach-blue px-4 py-2 rounded-md text-sm font-bold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                    Ver Detalles <ChevronRight size={16} />
                </Link>
            </div>
            )}
        </div>
        
        {/* 3. TARJETAS KPI (Estadísticas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Promedio */}
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

            {/* Materias */}
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

        {/* 4. TABLA DE RENDIMIENTO ACADÉMICO */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-unach-blue/10 rounded-lg text-unach-blue">
                    <CheckCircle2 size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Rendimiento por Asignatura</h2>
                    <p className="text-xs text-gray-500">Detalle de notas y análisis de riesgo predictivo</p>
                </div>
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50 text-gray-500">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Asignatura / Docente</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider w-24">P1</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider w-24">P2</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider w-24">Final</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider">Nivel de Riesgo</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-50">
                {currentItems.map((materia, index) => {
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
                  <tr key={index} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* Asignatura y Tutor */}
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
                    
                    {/* Notas */}
                    <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100 block">
                            {materia.parcial1 ? Number(materia.parcial1).toFixed(2) : '-'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="text-sm text-gray-600 font-medium bg-gray-50 px-2 py-1 rounded border border-gray-100 block">
                            {materia.parcial2 ? Number(materia.parcial2).toFixed(2) : '-'}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold px-2 py-1 rounded block ${materia.final ? 'text-gray-900' : 'text-gray-300'}`}>
                            {materia.final ? Number(materia.final).toFixed(2) : '-'}
                        </span>
                    </td>
                    
                    {/* Estado */}
                    <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1.5 text-[10px] uppercase tracking-wide font-bold rounded-full shadow-sm ${situacionColor}`}>
                            {materia.situacion || 'En Curso'}
                        </span>
                    </td>
                    
                    {/* Riesgo (Visualmente mejorado) */}
                    <td className="px-6 py-4 text-center">
                      <div 
                        className={`inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg border w-full max-w-[140px] mx-auto ${riesgoStyle}`}
                        title={`Probabilidad calculada: ${materia.probabilidad_riesgo ? materia.probabilidad_riesgo.toFixed(2) : 0}%`}
                      >
                        <div className="relative flex h-2 w-2">
                          {materia.riesgo_color === 'red' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>}
                          <span className={`relative inline-flex rounded-full h-2 w-2 ${materia.riesgo_color === 'red' ? 'bg-rose-500' : materia.riesgo_color === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                        </div>
                        <span className="text-xs font-bold">{materia.riesgo_nivel?.replace('Riesgo ', '')}</span>
                      </div>
                    </td>

                    {/* Botón de Acción */}
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
                )})}
              </tbody>
            </table>
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 bg-white border-t border-gray-100">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-unach-blue disabled:opacity-50 transition-colors"
              >
                Anterior
              </button>
              <span className="text-xs text-gray-500 font-medium">
                Página <span className="text-unach-blue font-bold">{currentPage}</span> de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-unach-blue disabled:opacity-50 transition-colors"
              >
                Siguiente
              </button>
            </div>
          )}
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