// frontend/src/pages/DashboardEstudiante.tsx

import React, { useEffect, useState, useCallback } from 'react'; // ✅ MODIFICADO
import { getStudentDashboard, StudentDashboard } from '../services/dashboardService';
import AgendarTutoriaModal from '../components/AgendarTutoriaModal';

const DashboardEstudiante: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<StudentDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMatricula, setSelectedMatricula] = useState<number | null>(null);
  const [selectedTutor, setSelectedTutor] = useState<number | null>(null);
  const [selectedTutorNombre, setSelectedTutorNombre] = useState<string | null>(null); // ✅ AGREGADO

  // ✅ CORREGIDO: Usamos useCallback para que la función sea estable
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStudentDashboard();
      console.log("📊 Dashboard data cargada:", data);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError('No se pudo cargar la información. Asegúrate de haber iniciado sesión y refresca la página.');
      console.error("❌ Error en fetchDashboardData:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // ✅ MODIFICADO: Ahora recibe el nombre del tutor
  const handleAgendarClick = (matriculaId: number, tutorId: number, tutorNombre: string) => {
    setSelectedMatricula(matriculaId);
    setSelectedTutor(tutorId);
    setSelectedTutorNombre(tutorNombre); // ✅ AGREGADO
    setIsModalOpen(true);
  };
  
  // Función para manejar el cierre y recarga tras agendar
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedMatricula(null);
    setSelectedTutor(null);
    setSelectedTutorNombre(null);
  };

  if (loading) {
    return <div className="text-center p-12">Cargando dashboard...</div>;
  }

  if (error || !dashboardData) {
    return <div className="text-center text-red-500 p-12">{error || 'No se encontraron datos.'}</div>;
  }
  
  const { kpis, nombre, historial_academico } = dashboardData;
  
  const riskColorClasses = {
    green: 'bg-green-200 text-green-800',
    yellow: 'bg-yellow-200 text-yellow-800',
    red: 'bg-red-200 text-red-800',
  };

  return (
    <>
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Bienvenido, {nombre}</h1>
        
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor Asignado</th> {/* ✅ AGREGADO */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nivel de Riesgo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {historial_academico.map((materia, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{materia.asignatura}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{materia.parcial1 ? Number(materia.parcial1).toFixed(2) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{materia.parcial2 ? Number(materia.parcial2).toFixed(2) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-900">{materia.final ? Number(materia.final).toFixed(2) : 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{materia.tutor_nombre}</td> {/* ✅ MOSTRANDO EL NOMBRE */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{materia.situacion || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${riskColorClasses[materia.riesgo_color]}`}>
                        {materia.riesgo_nivel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button 
                        onClick={() => handleAgendarClick(materia.matricula_id, materia.tutor_id, materia.tutor_nombre)} // ✅ PASAMOS EL NOMBRE
                        className="text-blue-600 hover:text-blue-900 font-semibold disabled:text-gray-400"
                        disabled={materia.tutor_id === null} // Deshabilitar si no hay tutor
                      >
                        {materia.tutor_id ? 'Agendar Tutoría' : 'Sin Tutor'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AgendarTutoriaModal 
        isOpen={isModalOpen}
        onClose={handleModalClose} // ✅ Usamos la nueva función de cierre
        matriculaId={selectedMatricula}
        tutorId={selectedTutor}
        tutorNombre={selectedTutorNombre} // ✅ PASAMOS EL NOMBRE AL MODAL
        onSuccess={fetchDashboardData} // ✅ Callback para recargar los datos
      />
    </>
  );
};

export default DashboardEstudiante;