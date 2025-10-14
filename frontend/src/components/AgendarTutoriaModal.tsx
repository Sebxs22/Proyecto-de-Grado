// frontend/src/components/AgendarTutoriaModal.tsx
import React, { useState } from 'react';
import { crearTutoria } from '../services/tutoriaService';
import { TutoriaPayload } from '../services/tutoriaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matriculaId: number | null;
  tutorId: number | null;
  tutorNombre: string | null;
  onSuccess: () => void;
}

const AgendarTutoriaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  matriculaId,
  tutorId,
  tutorNombre,
  onSuccess,
}) => {
  const [tema, setTema] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [modalidad, setModalidad] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ✅ Generar opciones de hora cada 30 minutos (7 AM - 8 PM)
  const generarOpcionesHora = () => {
    const opciones = [];
    for (let h = 7; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        const horaStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        const hora12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
        const ampm = h >= 12 ? 'PM' : 'AM';
        const label = `${hora12}:${m.toString().padStart(2, '0')} ${ampm}`;
        opciones.push({ value: horaStr, label });
      }
    }
    return opciones;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!matriculaId || !tutorId) {
      setError('Error: No se ha seleccionado una materia o tutor.');
      return;
    }

    if (!fecha || !hora) {
      setError('Por favor completa todos los campos.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // ✅ SOLUCIÓN DEFINITIVA AL PROBLEMA DE ZONA HORARIA
      // Creamos la fecha EXACTAMENTE como la ingresó el usuario
      // SIN conversión a UTC, SIN timezone info
      const fechaHoraLocalString = `${fecha}T${hora}:00`;
      
      // Log para debugging (puedes removerlo después)
      console.log('📅 Fecha y hora seleccionada:', fechaHoraLocalString);

      const payload: TutoriaPayload = {
        matricula_id: matriculaId,
        tutor_id: tutorId,
        fecha: fechaHoraLocalString, // ✅ String limpio sin timezone
        duracion_min: 60,
        tema,
        modalidad,
      };

      await crearTutoria(payload);
      
      // Resetear formulario
      setTema('');
      setFecha('');
      setHora('');
      setModalidad('Presencial');
      
      alert('¡Tutoría solicitada con éxito! El tutor la revisará pronto.');
      onClose();
      onSuccess();
    } catch (err: any) {
      console.error('❌ Error al agendar:', err);
      setError(
        err.response?.data?.detail ||
        'No se pudo agendar la tutoría. Verifica que la fecha sea futura.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const opcionesHora = generarOpcionesHora();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header con gradiente */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">Agendar Nueva Tutoría</h2>
          <p className="text-blue-100 text-sm mt-1">Completa los datos para solicitar tu sesión</p>
        </div>

        <div className="p-6">
          {/* Card de información del tutor */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600 font-medium mb-1">Tutor Asignado</p>
            <p className="text-lg font-semibold text-blue-900">
              {tutorNombre || 'Sin asignar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Campo: Tema */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tema de la Tutoría *
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ej: Integrales definidas, Ecuaciones diferenciales..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
              />
            </div>

            {/* Campos: Fecha y Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Fecha */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📅 Fecha *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* ✅ Hora - SELECTOR VISUAL CON OPCIONES */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🕐 Hora *
                </label>
                <select
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition appearance-none bg-white cursor-pointer"
                  required
                >
                  <option value="">Selecciona la hora</option>
                  {opcionesHora.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campo: Modalidad */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Modalidad *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalidad('Presencial')}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    modalidad === 'Presencial'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">📍</div>
                  <span className="text-sm">Presencial</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalidad('Virtual')}
                  className={`p-4 rounded-lg border-2 transition-all text-center ${
                    modalidad === 'Virtual'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  <div className="text-2xl mb-1">💻</div>
                  <span className="text-sm">Virtual</span>
                </button>
              </div>
            </div>

            {/* Información de duración */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                ⏱️ Duración: <span className="font-semibold">60 minutos</span>
              </p>
            </div>

            {/* Mensaje de error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">⚠️ {error}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Agendando...' : 'Solicitar Tutoría'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgendarTutoriaModal;