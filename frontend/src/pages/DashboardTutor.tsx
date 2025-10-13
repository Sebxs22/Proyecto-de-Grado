// frontend/src/pages/DashboardTutor.tsx

import React, { useEffect, useState } from 'react';
import { getTutorDashboard, TutorDashboard, actualizarEstadoTutoria } from '../services/tutorDashboardService';

const DashboardTutor: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<TutorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getTutorDashboard();
      console.log("📊 Dashboard tutor cargado:", data);
      setDashboardData(data);
      setError(null);
    } catch (err) {
      console.error("❌ Error al cargar dashboard tutor:", err);
      setError('No se pudo cargar la información. Asegúrate de haber iniciado sesión con un rol de tutor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateTutoria = async (tutoriaId: number, estado: 'programada' | 'cancelada') => {
    const action = estado === 'programada' ? 'aceptar' : 'cancelar';
    if (!window.confirm(`¿Estás seguro de que quieres ${action} esta tutoría?`)) return;

    try {
      await actualizarEstadoTutoria(tutoriaId, estado);
      alert(`Tutoría actualizada con éxito.`);
      fetchDashboardData();
    } catch (err) {
      alert('Error al actualizar la tutoría.');
    }
  };

  if (loading) return <div className="text-center p-12">Cargando dashboard del tutor...</div>;
  if (error || !dashboardData) return <div className="text-center text-red-500 p-12">{error || 'No se encontraron datos.'}</div>;

  const { nombre, cursos, tutorias_pendientes } = dashboardData;

  // Agrupamos los estudiantes por periodo y asignatura
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

  // Calcular estadísticas por curso
  const calcularEstadisticas = (estudiantes: typeof cursos) => {
    const conNotas = estudiantes.filter(e => e.final !== null);
    const aprobados = estudiantes.filter(e => e.situacion === 'APROBADO').length;
    const reprobados = estudiantes.filter(e => e.situacion === 'REPROBADO').length;
    const promedioFinal = conNotas.length > 0 
      ? (conNotas.reduce((sum, e) => sum + (e.final || 0), 0) / conNotas.length).toFixed(2)
      : 'N/A';
    
    return {
      total: estudiantes.length,
      aprobados,
      reprobados,
      promedioFinal
    };
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Bienvenido, Tutor {nombre}</h1>

      {/* Sección de Tutorías Pendientes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tutorías por Aprobar</h2>
        {tutorias_pendientes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asignatura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Solicitada</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tema</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modalidad</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tutorias_pendientes.map((tutoria) => (
                  <tr key={tutoria.tutoria_id}>
                    <td className="px-6 py-4 whitespace-nowrap">{tutoria.estudiante_nombre}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tutoria.asignatura}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(tutoria.fecha).toLocaleString()}</td>
                    <td className="px-6 py-4">{tutoria.tema}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        tutoria.modalidad === 'presencial' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {tutoria.modalidad}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleUpdateTutoria(tutoria.tutoria_id, 'programada')} 
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors"
                        >
                          Aceptar
                        </button>
                        <button 
                          onClick={() => handleUpdateTutoria(tutoria.tutoria_id, 'cancelada')} 
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition-colors"
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No tienes tutorías pendientes de aprobación.</p>
        )}
      </div>

      {/* Sección de Cursos y Estudiantes */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Mis Cursos y Estudiantes</h2>
        
        {Object.keys(cursosAgrupados).length > 0 ? (
          <div className="space-y-8">
            {Object.entries(cursosAgrupados).map(([key, cursoData]) => {
              const stats = calcularEstadisticas(cursoData.estudiantes);
              
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-6">
                  {/* Header del Curso */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-800">{cursoData.asignatura}</h3>
                    <p className="text-sm text-gray-600">{cursoData.periodo}</p>
                  </div>

                  {/* Estadísticas del Curso */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Total Estudiantes</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Aprobados</p>
                      <p className="text-2xl font-bold text-green-600">{stats.aprobados}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Reprobados</p>
                      <p className="text-2xl font-bold text-red-600">{stats.reprobados}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Promedio General</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.promedioFinal}</p>
                    </div>
                  </div>

                  {/* Tabla de Estudiantes */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estudiante</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcial 1</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parcial 2</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {cursoData.estudiantes.map((estudiante, idx) => (
                          <tr key={`${estudiante.estudiante_id}-${idx}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                              {estudiante.estudiante_nombre}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {estudiante.parcial1 !== null ? Number(estudiante.parcial1).toFixed(2) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                              {estudiante.parcial2 !== null ? Number(estudiante.parcial2).toFixed(2) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                              {estudiante.final !== null ? Number(estudiante.final).toFixed(2) : 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {estudiante.situacion ? (
                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  estudiante.situacion === 'APROBADO' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {estudiante.situacion}
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                  Pendiente
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-600">No tienes cursos asignados.</p>
        )}
      </div>
    </div>
  );
};

export default DashboardTutor;