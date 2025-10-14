// frontend/src/pages/DashboardTutor.tsx

import React, { useEffect, useState, useCallback } from 'react';
// Asegúrate de que TutorDashboard ahora tiene average_rating
import { getTutorDashboard, TutorDashboard } from '../services/tutorDashboardService'; 

// ✅ Nueva función para parsear la nota de forma segura
const safeParseFloat = (value: number | null | undefined): number => {
    // Si es nulo o indefinido, devuelve 0 para el cálculo (y se ignora en la cuenta)
    if (value === null || value === undefined) return 0;
    
    // Si ya es un número, lo devuelve. Si es un string, lo convierte.
    const num = Number(value);
    
    // Devuelve 0 si la conversión resulta en NaN (para evitar que NaN contamine la suma)
    return isNaN(num) ? 0 : num;
};


const DashboardTutor: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<TutorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);


  if (loading) return <div className="text-center p-12">Cargando dashboard del tutor...</div>;
  if (error || !dashboardData) return <div className="text-center text-red-500 p-12">{error || 'No se encontraron datos.'}</div>;

  // ✅ CORREGIDO: Desestructuramos average_rating
  const { nombre, cursos, tutorias_pendientes, average_rating } = dashboardData;

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

  // Lógica para calcular estadísticas
  const calcularEstadisticas = (estudiantes: typeof cursos) => {
    // Solo contamos a los estudiantes que tienen una nota final registrada
    const estudiantesConNotaFinal = estudiantes.filter(e => e.final !== null);
    
    // Convertimos las notas a número de forma segura para la suma
    const notasValidas = estudiantesConNotaFinal
        .map(e => safeParseFloat(e.final))
        .filter(n => n > 0 || n === 0); // Aseguramos que el parseo fue exitoso
        
    const aprobados = estudiantes.filter(e => e.situacion === 'APROBADO').length;
    const reprobados = estudiantes.filter(e => e.situacion === 'REPROBADO').length;
    
    const promedioFinal = notasValidas.length > 0
        ? (notasValidas.reduce((sum, n) => sum + n, 0) / notasValidas.length).toFixed(2)
        : 'N/A'; // Si no hay notas finales válidas, devuelve N/A
    
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

      {/* ✅ SECCIÓN CALIFICACIÓN PROMEDIO Y RESUMEN DE TUTORÍAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card de Rating */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu Calificación Promedio</h2>
            <p className="text-green-600 font-extrabold text-4xl">
                {Number(average_rating).toFixed(2)} / 5.0 {/* ✅ MOSTRAR CALIFICACIÓN */}
            </p>
        </div>
        
        {/* Card de Pendientes */}
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Resumen de Tutorías</h2>
            {tutorias_pendientes.length > 0 ? (
                <p className="text-yellow-600 font-semibold text-lg">
                    Tienes <span className="text-3xl font-extrabold">{tutorias_pendientes.length}</span> solicitudes pendientes.
                    <button 
                        onClick={() => window.location.href = '/tutorias/tutor'}
                        className="ml-4 text-blue-600 hover:text-blue-800 font-medium underline"
                    >
                        Ir a Gestión
                    </button>
                </p>
            ) : (
                <p className="text-gray-600">No tienes tutorías pendientes de aprobación.</p>
            )}
        </div>
      </div>


      {/* Sección de Cursos y Estudiantes (Se mantiene) */}
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