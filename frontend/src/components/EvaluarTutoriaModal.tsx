// frontend/src/components/EvaluarTutoriaModal.tsx
import React, { useState } from 'react';
import axiosClient from '../api/axiosClient';

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
  const [estrellas, setEstrellas] = useState(5);
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
        setError('Debes seleccionar al menos 1 estrella.');
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
      
      alert('¡Tutoría calificada con éxito!');
      onSuccess(); // Cierra y refresca la lista
      onClose();
    } catch (err: any) {
      console.error('❌ Error al evaluar:', err);
      setError(err.response?.data?.detail || 'No se pudo enviar la evaluación. Puede que ya haya sido evaluada.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">Evaluar Tutoría</h2>
        </div>

        <div className="p-6 space-y-5">
            <p className="text-gray-700">Calificando: <span className="font-semibold">{asignatura}</span></p>

            {/* Selector de Estrellas */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tu Calificación (1 a 5 estrellas) *
                </label>
                <div className="flex justify-center space-x-2 text-3xl">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            className={`cursor-pointer transition-colors ${
                                star <= estrellas ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            onClick={() => setEstrellas(star)}
                        >
                            ★
                        </span>
                    ))}
                </div>
                <p className="text-center text-sm mt-2 text-gray-500">
                    {estrellas} {estrellas === 1 ? 'estrella' : 'estrellas'}
                </p>
            </div>

            {/* Comentario */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Comentario (Opcional)
                </label>
                <textarea
                    value={comentario}
                    onChange={(e) => setComentario(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 transition"
                    placeholder="¿Qué te pareció la tutoría?"
                />
            </div>
            
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
                onClick={handleSubmit}
                disabled={loading || estrellas === 0}
                className="flex-1 py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar Evaluación'}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluarTutoriaModal;