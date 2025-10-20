// frontend/src/pages/DashboardCoordinador.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { getCoordinatorDashboard, CoordinatorDashboard } from '../services/cmiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const DashboardCoordinador: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<CoordinatorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCmiData = useCallback(async () => {
  try {
    setLoading(true);
    console.log('🔍 Iniciando carga de CMI...');
    const data = await getCoordinatorDashboard();
    console.log('✅ Datos recibidos:', data);
    console.log('📊 Nombre:', data.nombre);
    console.log('📊 CMI completo:', data.cmi);
    console.log('📊 Perspectiva estudiante:', data.cmi?.perspectiva_estudiante);
    setDashboardData(data);
    setError(null);
  } catch (err: any) {
    console.error('❌ Error completo:', err);
    console.error('❌ Mensaje de error:', err.message);
    console.error('❌ Response:', err.response);
    setError('No se pudo cargar el Cuadro de Mando Integral.');
  } finally {
    setLoading(false);
    console.log('✅ Loading finalizado');
  }
}, []);

  useEffect(() => {
    fetchCmiData();
  }, [fetchCmiData]);

  if (loading) {
    return <div className="text-center p-12">Cargando Cuadro de Mando...</div>;
  }

  if (error || !dashboardData) {
    return <div className="text-center text-red-500 p-12">{error || 'No se encontraron datos.'}</div>;
  }

  const { nombre, cmi } = dashboardData;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-800">Cuadro de Mando Integral (CMI)</h1>
      <p className="text-lg text-gray-600">Bienvenido, Coordinador {nombre}</p>

      {/* Perspectiva del Estudiante */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Perspectiva del Estudiante</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Tasa de Asistencia a Tutorías</p>
            <p className="text-4xl font-bold text-blue-600">{cmi.perspectiva_estudiante.tasa_asistencia}%</p>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Satisfacción Promedio</p>
            <p className="text-4xl font-bold text-yellow-600">{cmi.perspectiva_estudiante.satisfaccion_promedio} / 5</p>
          </div>
        </div>
      </div>

      {/* Perspectiva de Procesos Internos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Perspectiva de Procesos Internos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total Sesiones Realizadas</p>
            <p className="text-4xl font-bold text-green-600">{cmi.perspectiva_procesos.total_sesiones_realizadas}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-center mb-2">Distribución de Estados de Tutorías</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={cmi.perspectiva_procesos.distribucion_estados} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {cmi.perspectiva_procesos.distribucion_estados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Perspectiva de Recursos */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Perspectiva de Recursos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total de Tutores</p>
            <p className="text-4xl font-bold text-purple-600">{cmi.perspectiva_recursos.total_tutores}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Total de Estudiantes</p>
            <p className="text-4xl font-bold text-purple-600">{cmi.perspectiva_recursos.total_estudiantes}</p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg text-center">
            <p className="text-sm text-gray-600">Ratio Estudiantes por Tutor</p>
            <p className="text-4xl font-bold text-indigo-600">{cmi.perspectiva_recursos.ratio_tutor_estudiante}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCoordinador;