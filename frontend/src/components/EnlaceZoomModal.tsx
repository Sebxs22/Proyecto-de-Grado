// frontend/src/components/EnlaceZoomModal.tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom'; // <--- 1. IMPORTAMOS ESTO
import { 
  X, 
  Video, 
  Link as LinkIcon, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

interface Tutoria {
    id: number;
    modalidad: string;
    matricula: {
        estudiante: {
            usuario: {
                nombre: string;
            }
        };
        asignatura: {
            nombre: string;
        }
    };
    fecha: string;
    enlace_reunion: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tutoria: Tutoria;
  onAceptar: (tutoriaId: number, enlace: string) => void;
}

const EnlaceZoomModal: React.FC<Props> = ({ isOpen, onClose, tutoria, onAceptar }) => {
  const [enlace, setEnlace] = useState(tutoria.enlace_reunion || '');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enlace || !enlace.startsWith('http')) {
      setError('Por favor, ingresa un enlace válido (ej: https://zoom.us/...)');
      return;
    }
    
    onAceptar(tutoria.id, enlace);
    onClose();
  };

  if (!isOpen) return null;
  
  const fechaLocal = new Date(tutoria.fecha).toLocaleString();

  // 2. CREAMOS EL CONTENIDO DEL MODAL
  const modalContent = (
    // Usamos w-screen h-screen para forzar el 100% del viewport real
    <div className="fixed inset-0 w-screen h-screen z-[9999] flex justify-center items-center p-4 animate-in fade-in duration-200">
      
      {/* FONDO (Overlay): Absoluto para cubrir todo */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={onClose} // Cierra si das clic afuera
      />
      
      {/* MODAL: Relativo para estar encima del fondo */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100">
        
        {/* HEADER AZUL */}
        <div className="bg-unach-blue p-5 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Video size={22} className="text-blue-200" />
            Programar Sesión Virtual
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* CUERPO */}
        <div className="p-6 bg-white">
            
            {/* Tarjeta de Contexto */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 space-y-2">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-white border border-gray-100 rounded-full text-gray-400 shadow-sm">
                        <User size={14} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">ESTUDIANTE</p>
                        <p className="text-sm font-bold text-gray-800">{tutoria.matricula.estudiante.usuario.nombre}</p>
                    </div>
                </div>
                
                <div className="h-px bg-gray-200 w-full"></div>

                <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-white border border-gray-100 rounded-full text-gray-400 shadow-sm">
                        <Calendar size={14} />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-tight">ASIGNATURA & FECHA</p>
                        <p className="text-sm font-semibold text-gray-700 leading-tight">
                            {tutoria.matricula.asignatura.nombre}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{fechaLocal}</p>
                    </div>
                </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Para confirmar, proporciona el enlace de la videollamada.
            </p>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-800 uppercase flex items-center gap-1.5">
                        <LinkIcon size={14} className="text-unach-blue" /> Enlace de Reunión *
                    </label>
                    <div className="relative">
                        <input
                            type="url"
                            value={enlace}
                            onChange={(e) => {
                                setEnlace(e.target.value);
                                setError('');
                            }}
                            placeholder="https://zoom.us/j/1234567890"
                            className={`w-full px-4 py-3 text-sm border rounded-xl focus:ring-2 focus:outline-none transition-all shadow-sm ${
                                error 
                                    ? 'border-red-300 focus:ring-red-100 focus:border-red-400 bg-red-50 text-red-900 placeholder:text-red-300' 
                                    : 'border-gray-200 focus:ring-blue-100 focus:border-unach-blue text-gray-700'
                            }`}
                            autoFocus
                            required
                        />
                    </div>
                    {error && (
                        <div className="flex items-center gap-1.5 text-red-600 text-xs font-semibold animate-pulse">
                            <AlertCircle size={12} /> {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 bg-white text-gray-700 font-bold rounded-lg border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-2.5 px-4 bg-unach-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm flex justify-center items-center gap-2"
                    >
                        Confirmar <CheckCircle2 size={16} />
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );

  // 3. USAMOS EL PORTAL PARA "SACAR" EL HTML AL BODY
  return createPortal(modalContent, document.body);
};

export default EnlaceZoomModal;