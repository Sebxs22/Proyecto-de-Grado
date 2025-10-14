// frontend/src/components/AgendarTutoriaModal.tsx
import React, { useState } from 'react';
import { crearTutoria } from '../services/tutoriaService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  matriculaId: number | null;
  tutorId: number | null; 
  tutorNombre: string | null; // ✅ AGREGADO
  onSuccess: () => void; // ✅ AGREGADO para refrescar el dashboard
}

const AgendarTutoriaModal: React.FC<Props> = ({ isOpen, onClose, matriculaId, tutorId, tutorNombre, onSuccess }) => {
  const [tema, setTema] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [modalidad, setModalidad] = useState<'Presencial' | 'Virtual'>('Presencial');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matriculaId || !tutorId) {
      setError('Error: No se ha seleccionado una materia o tutor.');
      return;
    }

    try {
      const payload = {
        matricula_id: matriculaId,
        tutor_id: tutorId,
        fecha: `${fecha}T${hora}:00`, // Combinamos fecha y hora
        duracion_min: 60, // Duración por defecto de 60 mins
        tema,
        modalidad,
      };
      await crearTutoria(payload);
      alert('¡Tutoría solicitada con éxito! El tutor la revisará pronto.');
      onClose(); 
      onSuccess(); // ✅ Recarga los datos del dashboard
    } catch (err) {
      setError('No se pudo agendar la tutoría. Intenta de nuevo. Asegúrate que la fecha no esté en el pasado.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Agendar Nueva Tutoría</h2>
        
        {/* ✅ AGREGADO: Mostrar el tutor asignado */}
        <p className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
            Tutor Asignado: <span className="font-semibold">{tutorNombre || 'Sin asignar'}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Tema de la Tutoría</label>
            <input type="text" value={tema} onChange={(e) => setTema(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium">Hora</label>
              <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} className="w-full mt-1 p-2 border rounded-md" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Modalidad</label>
            <select value={modalidad} onChange={(e) => setModalidad(e.target.value as any)} className="w-full mt-1 p-2 border rounded-md">
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 rounded-md">Cancelar</button>
            <button type="submit" className="py-2 px-4 bg-blue-600 text-white rounded-md">Solicitar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgendarTutoriaModal;