// frontend/src/pages/DashboardEstudiante.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getStudentDashboard, StudentDashboard } from '../services/dashboardService';
import AgendarTutoriaModal from '../components/AgendarTutoriaModal';
import { getMisTutorias, TutoriaEstudiante } from '../services/tutoriaService';
import { Link } from 'react-router-dom';

const DashboardEstudiante: React.FC = () => {
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

  // --- ✅ LÓGICA DE ALERTA DE RIESGO (NUEVO) ---
  const [materiasEnRiesgo, setMateriasEnRiesgo] = useState<string[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const [dashboard, tutorias] = await Promise.all([
        getStudentDashboard(),
        getMisTutorias() 
      ]);
      
      console.log("📊 Dashboard data cargada:", dashboard);
      setDashboardData(dashboard);
      
      const programadas = tutorias.filter(t => t.estado === 'programada');
      setTutoriasProgramadas(programadas);

      // --- ✅ LÓGICA DE ALERTA DE RIESGO (NUEVO) ---
      // Filtramos las materias que tienen predicción de ALTO o MEDIO riesgo
      const enRiesgo = dashboard.historial_academico
        .filter(m => m.riesgo_color === 'red' || m.riesgo_color === 'yellow')
        .map(m => m.asignatura);
      
      setMateriasEnRiesgo(enRiesgo);
      // --- FIN LÓGICA DE ALERTA ---

      setError(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || 'No se pudo cargar la información.';
      setError(errorMessage);
      console.error("❌ Error al cargar dashboard estudiante:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ... (manejadores de modal y paginación - sin cambios) ...
  const handleAgendarClick = (matriculaId: number, tutorId: number, tutorNombre: string) => {
    setSelectedMatriculaId(matriculaId);
    setSelectedTutorId(tutorId);
    setSelectedTutorNombre(tutorNombre);
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMatriculaId(null);
    setSelectedTutorId(null);
    setSelectedTutorNombre(null);
  };
  
  const handleSuccessAgendar = () => {
    handleModalClose();
    fetchDashboardData();
  }


  if (loading) {
    return <div className="text-center p-12">Cargando dashboard...</div>;
  }

  if (error || !dashboardData) {
    return <div className="text-center text-red-500 p-12">{error || 'No se encontraron datos.'}</div>;
  }
  
  const { kpis, nombre, historial_academico } = dashboardData;

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historial_academico.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historial_academico.length / itemsPerPage);
  
  const riskColorClasses = {
    green: 'bg-green-200 text-green-800',
    yellow: 'bg-yellow-200 text-yellow-800',
    red: 'bg-red-200 text-red-800',
    gray: 'bg-gray-200 text-gray-800',
  };

  const situacionColorClasses = {
    APROBADO: 'bg-green-100 text-green-800',
    REPROBADO: 'bg-red-100 text-red-800',
    Pendiente: 'bg-gray-100 text-gray-800',
    DEFAULT: 'bg-gray-100 text-gray-800',
  };

  return (
    <>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Bienvenido, {nombre}</h1>

        {/* --- ✅ SECCIÓN DE ALERTAS DE RIESGO (NUEVO) --- */}
        {materiasEnRiesgo.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-md">
            <div className="flex items-center">
              <div className="text-3xl mr-4">⚠️</div>
              <div>
                <p className="font-bold text-red-800">
                  ¡Atención! Materias en Riesgo
                </p>
                <p className="text-sm text-red-700">
                  Hemos detectado un riesgo predictivo en: <span className="font-semibold">{materiasEnRiesgo.join(', ')}</span>. 
                  Te recomendamos agendar una tutoría pronto.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* --- FIN DE ALERTAS --- */}


        {/* Tarjeta de Notificación de Tutorías (sin cambios) */}
        {tutoriasProgramadas.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg shadow-md">
            <div className="flex items-center">
              <div className="text-2xl mr-4">🗓️</div>
              <div>
                <p className="font-bold text-blue-800">
                  ¡Tienes {tutoriasProgramadas.length} tutoría(s) programada(s)!
                </p>
                <p className="text-sm text-blue-700">
                  La más próxima es sobre "{tutoriasProgramadas[0].tema}" el {new Date(tutoriasProgramadas[0].fecha).toLocaleDateString()}.
                  <Link to="/tutorias/estudiante" className="ml-2 font-semibold underline hover:text-blue-900">
                    Ver detalles
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* KPIs (sin cambios) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-600">Promedio General</h3>
            <p className="text-4xl font-bold text-blue-600 mt-2">{Number(kpis.promedio_general).toFixed(2)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-600">Materias Cursadas</h3>
            <p className="text-4xl font-bold text-gray-700 mt-2">{kpis.total_materias}</p>
          </div>
        </div>

        {/* Tabla de Rendimiento (sin cambios en la estructura, solo aplica los colores) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Rendimiento Académico por Materia</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcial 1</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcial 2</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nota Final</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor Asignado</th> 
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel de Riesgo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((materia, index) => {
                    
                    const situacionKey = (materia.situacion || 'Pendiente') as keyof typeof situacionColorClasses;
                    const situacionColor = situacionColorClasses[situacionKey] || situacionColorClasses.DEFAULT;
                    
                    const riesgoKey = (materia.riesgo_color || 'gray') as keyof typeof riskColorClasses;
                    const riesgoColor = riskColorClasses[riesgoKey] || riskColorClasses.gray;

                    return (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{materia.asignatura}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{materia.parcial1 ? Number(materia.parcial1).toFixed(2) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{materia.parcial2 ? Number(materia.parcial2).toFixed(2) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{materia.final ? Number(materia.final).toFixed(2) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{materia.tutor_nombre}</td> 
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${situacionColor}`}>
                            {materia.situacion || 'Pendiente'}
                        </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${riesgoColor}`}
                        title={`Probabilidad de riesgo: ${materia.probabilidad_riesgo ? materia.probabilidad_riesgo.toFixed(2) : 0}%`}
                      >
                        {materia.riesgo_nivel}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleAgendarClick(materia.matricula_id, materia.tutor_id, materia.tutor_nombre)} 
                        className="text-blue-600 hover:text-blue-900 font-semibold disabled:text-gray-400"
                        disabled={!materia.tutor_id}
                      >
                        {materia.tutor_id ? 'Agendar Tutoría' : 'Sin Tutor'}
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          
          {/* Paginación (sin cambios) */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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