// frontend/src/components/AgendarCitaModal.tsx

import React, { useState } from 'react';
import { crearTutoria, TutoriaPayload } from '../services/tutoriaService';
import { 
  X, 
  Calendar, 
  Clock, 
  MessageSquare, 
  CheckCircle, 
  AlertCircle, 
  UserCheck 
} from 'lucide-react';

interface AgendarCitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  matriculaId: number | null;
  estudianteNombre: string | null;
  onSuccess: () => void;
}

const AgendarCitaModal: React.FC<AgendarCitaModalProps> = ({ 
  isOpen, onClose, matriculaId, estudianteNombre, onSuccess 
}) => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [tema, setTema] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- GENERADOR DE HORAS (Igual al del Estudiante) ---
  const generarOpcionesHora = () => {
    const opciones = [];
    for (let h = 7; h <= 20; h++) { // De 7 AM a 8 PM
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

  if (!isOpen || !matriculaId) return null;
  
  const opcionesHora = generarOpcionesHora();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Validar inputs
      if (!fecha || !hora) {
          setError("Debes definir fecha y hora de la citación.");
          setLoading(false);
          return;
      }

      // Construir fecha completa
      // OJO: La hora viene "HH:MM", agregamos ":00" para segundos
      const fechaHoraLocalString = `${fecha}T${hora}:00`;
      const fechaHora = new Date(fechaHoraLocalString);
      const ahora = new Date();

      if (fechaHora < ahora) {
          setError("No puedes citar en una fecha pasada.");
          setLoading(false);
          return;
      }

      // 2. Enviar al backend
      // El backend forzará 'programada' porque lo envía un Tutor
      const payload: TutoriaPayload = {
        matricula_id: matriculaId,
        tutor_id: 0, // El backend usa el ID real del tutor logueado
        fecha: fechaHoraLocalString,
        duracion_min: 60,
        tema: tema || "Refuerzo Académico (Citación Obligatoria)",
        modalidad: "Presencial" // Por defecto Virtual para citas rápidas
      };

      await crearTutoria(payload);

      onSuccess();
      onClose();
      // Limpiar
      setFecha(''); setHora(''); setTema('');
    } catch (err: any) {
      console.error(err);
      setError("Error al procesar la citación. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 transform transition-all scale-100">
        
        {/* Header (Estilo Tutor - Índigo Profundo) */}
        <div className="bg-indigo-600 p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <UserCheck className="text-indigo-200" size={24} />
              Citar Estudiante
            </h3>
            <p className="text-indigo-100 text-sm mt-1 opacity-90">
              Programar sesión obligatoria para: <span className="font-bold text-white uppercase tracking-wide">{estudianteNombre}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        {/* Formulario */}
        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Mensaje de Error */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-pulse">
                    <div className="text-red-600 mt-0.5"><AlertCircle size={18} /></div>
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* INPUT FECHA */}
                <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Calendar size={16} className="text-indigo-600" />
                    Fecha
                </label>
                <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-gray-700 cursor-pointer"
                />
                </div>

                {/* INPUT HORA (SELECTOR MEJORADO) */}
                <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-600" />
                    Hora
                </label>
                <div className="relative">
                    <select
                        value={hora}
                        onChange={(e) => setHora(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none appearance-none cursor-pointer text-gray-700"
                        required
                    >
                        <option value="">Seleccionar...</option>
                        {opcionesHora.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    {/* Flecha personalizada */}
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                    </div>
                </div>
                </div>
            </div>

            {/* MOTIVO */}
            <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-600" />
                Motivo de la Citación
                </label>
                <textarea 
                rows={3}
                placeholder="Ej. Revisión de notas parciales, bajo rendimiento detectado..."
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all outline-none text-sm font-medium resize-none placeholder:text-gray-400"
                />
            </div>

            {/* FOOTER: BOTONES */}
            <div className="pt-4 flex gap-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3.5 px-4 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 py-3.5 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 transform hover:-translate-y-0.5"
                >
                    {loading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Agendando...
                        </>
                    ) : (
                        <>
                            Confirmar <CheckCircle size={18} />
                        </>
                    )}
                </button>
            </div>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AgendarCitaModal;