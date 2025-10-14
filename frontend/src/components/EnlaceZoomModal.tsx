// frontend/src/components/EnlaceZoomModal.tsx
import React, { useState } from 'react';

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
      setError('Por favor, ingresa un enlace de reunión válido (debe comenzar con http/https).');
      return;
    }
    
    onAceptar(tutoria.id, enlace);
    onClose();
  };

  if (!isOpen) return null;
  
  const fechaLocal = new Date(tutoria.fecha).toLocaleString();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">Aceptar Tutoría Virtual</h2>
        </div>

        <div className="p-6 space-y-5">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                <p className="font-semibold">{tutoria.matricula.asignatura.nombre}</p>
                <p>Estudiante: {tutoria.matricula.estudiante.usuario.nombre}</p>
                <p>Fecha/Hora: {fechaLocal}</p>
            </div>
            
            <p className="text-gray-700">
                Esta es una tutoría **Virtual**. Para programarla, debes proporcionar el enlace de la reunión (Zoom, Meet, etc.).
            </p>

            {/* Campo Enlace */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    🔗 Enlace de Reunión (Zoom/Meet) *
                </label>
                <input
                    type="url"
                    value={enlace}
                    onChange={(e) => setEnlace(e.target.value)}
                    placeholder="https://zoom.us/j/1234567890"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    required
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
              >
                Cerrar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
              >
                Aceptar y Guardar Enlace
              </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EnlaceZoomModal;