// frontend/src/components/EvaluarTutoriaModal.tsx
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import axiosClient from '../api/axiosClient';
import { 
  X, 
  Star, 
  MessageSquare, 
  CheckCircle2, 
  AlertCircle,
  ThumbsUp
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tutoriaId: number | null;
  asignatura: string;
  onSuccess: () => void;
}

interface EvaluacionPayload {
    tutoria_id: number;
    estrellas: number;
    comentario_estudiante: string;
}

const crearEvaluacion = async (payload: EvaluacionPayload) => {
    const response = await axiosClient.post('/evaluaciones/', payload);
    return response.data;
};

const EvaluarTutoriaModal: React.FC<Props> = ({ isOpen, onClose, tutoriaId, asignatura, onSuccess }) => {
  const [estrellas, setEstrellas] = useState(0);
  const [hoverEstrellas, setHoverEstrellas] = useState(0); // Para efecto hover
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutoriaId) {
      setError('ID de tutoría no encontrado.');
      return;
    }
    if (estrellas === 0) {
        setError('Por favor, selecciona una calificación.');
        return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: EvaluacionPayload = {
        tutoria_id: tutoriaId,
        estrellas: estrellas,
        comentario_estudiante: comentario,
      };

      await crearEvaluacion(payload);
      
      // Resetear y cerrar
      setEstrellas(0);
      setComentario('');
      onSuccess(); 
      onClose();
    } catch (err: any) {
      console.error('❌ Error al evaluar:', err);
      setError(err.response?.data?.detail || 'No se pudo enviar la evaluación.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Textos de feedback según estrellas
  const getRatingText = (stars: number) => {
      switch(stars) {
          case 1: return "Muy Malo";
          case 2: return "Malo";
          case 3: return "Regular";
          case 4: return "Bueno";
          case 5: return "¡Excelente!";
          default: return "Selecciona una calificación";
      }
  };

  const currentRating = hoverEstrellas || estrellas;

  // ESTRUCTURA DEL MODAL CON PORTAL
  const modalContent = (
    <div className="fixed inset-0 bg-black/25 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-in fade-in duration-200">
      
      {/* Tarjeta Sólida (Sin líneas blancas) */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col relative">
        
        {/* 1. HEADER (Azul) */}
        <div className="bg-unach-blue p-5 flex justify-between items-center shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ThumbsUp size={22} className="text-blue-200" />
            Evaluar Tutoría
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2. CUERPO */}
        <div className="p-8">
            
            {/* Info de la materia */}
            <div className="text-center mb-6">
                <p className="text-sm text-gray-500 uppercase tracking-wider font-bold mb-1">Calificando a</p>
                <h3 className="text-xl font-extrabold text-unach-blue leading-tight">{asignatura}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* SELECTOR DE ESTRELLAS */}
                <div className="flex flex-col items-center gap-2">
                    <div 
                        className="flex gap-2" 
                        onMouseLeave={() => setHoverEstrellas(0)}
                    >
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoverEstrellas(star)}
                                onClick={() => setEstrellas(star)}
                            >
                                <Star 
                                    size={42} 
                                    // CORRECCIÓN: Se eliminó la propiedad 'weight' que causaba el error
                                    className={`transition-colors duration-200 ${
                                        star <= currentRating 
                                            ? 'fill-yellow-400 text-yellow-400 drop-shadow-sm' 
                                            : 'fill-gray-100 text-gray-200'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className={`text-sm font-bold transition-all ${currentRating > 0 ? 'text-unach-blue' : 'text-gray-300'}`}>
                        {getRatingText(currentRating)}
                    </p>
                </div>

                {/* CAMPO COMENTARIO */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-unach-blue" /> Comentario (Opcional)
                    </label>
                    <textarea
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-unach-blue focus:outline-none transition-all resize-none placeholder:text-gray-400"
                        placeholder="¿Qué te pareció la clase? ¿El tutor resolvió tus dudas?"
                    />
                </div>
                
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-red-700 text-sm font-medium border border-red-100 animate-pulse">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {/* BOTONES */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-sm shadow-sm"
                        disabled={loading}
                    >
                        Omitir
                    </button>
                    <button
                        type="submit"
                        disabled={loading || estrellas === 0}
                        className="flex-1 py-3 px-4 bg-unach-blue text-white font-bold rounded-xl hover:bg-blue-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 text-sm flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? 'Enviando...' : (
                            <>Enviar Calificación <CheckCircle2 size={16} /></>
                        )}
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default EvaluarTutoriaModal;