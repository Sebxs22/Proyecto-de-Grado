// frontend/src/components/AgendarTutoriaModal.tsx
import React, { useState } from 'react';
import { crearTutoria, TutoriaPayload } from '../services/tutoriaService';
// 1. Importamos los íconos de Lucide
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  Type, 
  BookOpen, 
  CheckCircle2 
} from 'lucide-react';

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

  // Generador de horas (lógica original mantenida)
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
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const fechaHoraLocalString = `${fecha}T${hora}:00`;
      
      const payload: TutoriaPayload = {
        matricula_id: matriculaId,
        tutor_id: tutorId,
        fecha: fechaHoraLocalString,
        duracion_min: 60,
        tema,
        modalidad,
      };

      await crearTutoria(payload);
      
      // Limpiar y cerrar
      setTema('');
      setFecha('');
      setHora('');
      setModalidad('Presencial');
      
      alert('¡Solicitud enviada correctamente!');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all scale-100">
        
        {/* 1. HEADER INSTITUCIONAL */}
        <div className="bg-unach-blue p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BookOpen size={24} className="text-blue-200" />
              Agendar Tutoría
            </h2>
            <p className="text-blue-100 text-sm mt-1 opacity-90">Solicita una sesión de refuerzo académico</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
          {/* 2. TARJETA DE TUTOR */}
          <div className="mb-8 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-unach-blue font-bold text-lg border border-blue-200">
              {tutorNombre ? tutorNombre.charAt(0) : '?'}
            </div>
            <div>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Tutor Asignado</p>
               <p className="text-gray-800 font-bold text-lg leading-tight">{tutorNombre || 'Sin asignar'}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* CAMPO: TEMA */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                <Type size={16} className="text-unach-blue" />
                Tema a tratar
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ej: Derivadas parciales, Repaso examen..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unach-blue focus:border-transparent focus:bg-white transition-all outline-none placeholder:text-gray-400"
                required
              />
            </div>

            {/* CAMPOS: FECHA Y HORA (GRID) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Calendar size={16} className="text-unach-blue" />
                  Fecha
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unach-blue focus:border-transparent focus:bg-white transition-all outline-none text-gray-700 cursor-pointer"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Clock size={16} className="text-unach-blue" />
                  Hora
                </label>
                <div className="relative">
                    <select
                      value={hora}
                      onChange={(e) => setHora(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-unach-blue focus:border-transparent focus:bg-white transition-all outline-none appearance-none cursor-pointer text-gray-700"
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

            {/* CAMPO: MODALIDAD (TARJETAS) */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Modalidad Preferida</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setModalidad('Presencial')}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative overflow-hidden
                    ${modalidad === 'Presencial'
                      ? 'border-unach-blue bg-blue-50/50 text-unach-blue shadow-md'
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <MapPin size={28} className={modalidad === 'Presencial' ? 'fill-current opacity-20 absolute -right-2 -bottom-2 w-12 h-12' : 'hidden'} />
                  <MapPin size={24} className={modalidad === 'Presencial' ? 'fill-current' : ''} />
                  <span className="font-bold text-sm">Presencial</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setModalidad('Virtual')}
                  className={`
                    p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 relative overflow-hidden
                    ${modalidad === 'Virtual'
                      ? 'border-unach-blue bg-blue-50/50 text-unach-blue shadow-md'
                      : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <Video size={28} className={modalidad === 'Virtual' ? 'fill-current opacity-20 absolute -right-2 -bottom-2 w-12 h-12' : 'hidden'} />
                  <Video size={24} className={modalidad === 'Virtual' ? 'fill-current' : ''} />
                  <span className="font-bold text-sm">Virtual</span>
                </button>
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-pulse">
                 <div className="text-unach-red mt-0.5"><X size={18} /></div>
                 <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

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
                className="flex-1 py-3.5 px-4 bg-unach-blue text-white font-bold rounded-xl hover:bg-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 transform hover:-translate-y-0.5"
              >
                {loading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Enviando...
                    </>
                ) : (
                    <>
                        Confirmar Solicitud <CheckCircle2 size={18} />
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

export default AgendarTutoriaModal;