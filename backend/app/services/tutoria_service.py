# backend/app/services/tutoria_service.py

from sqlalchemy.orm import Session, joinedload
from app.models.tutoria import Tutoria
from app.models.tutor import Tutor
from app.models.matricula import Matricula
from app.models.estudiante import Estudiante
from app.models.user import Usuario
from app.schemas.tutoria import TutoriaCreate,TutoriaUpdate
from fastapi import HTTPException
from typing import Optional # ✅ CORREGIDO: Importar Optional
from fastapi import status 

class TutoriaService:
    
    def create_tutoria(self, db: Session, tutoria: TutoriaCreate, estudiante_id: int):
        """
        Crea una nueva tutoría.
        ✅ CORREGIDO: Eliminamos la información de zona horaria para evitar
        la conversión UTC en el servidor (problema de 6 horas de diferencia).
        """
        try:
            tutoria_data = tutoria.model_dump()
            
            # --- 🛑 SOLUCIÓN AL PROBLEMA DE LA HORA 🛑 ---
            # Removemos la información de timezone (tzinfo) para que SQLAlchemy 
            # almacene la fecha/hora exactamente como viene del frontend (ej. 11:00 AM)
            # sin ajustes automáticos de UTC.
            if tutoria_data['fecha'].tzinfo is not None:
                tutoria_data['fecha'] = tutoria_data['fecha'].replace(tzinfo=None)
            
            tutoria_data['estado'] = 'solicitada'
            
            # Crear la tutoría
            nueva_tutoria = Tutoria(**tutoria_data)
            db.add(nueva_tutoria)
            db.commit()
            db.refresh(nueva_tutoria)
            
            # Recargar con todas las relaciones necesarias
            tutoria_completa = db.query(Tutoria).options(
                joinedload(Tutoria.tutor).joinedload(Tutor.usuario),
                joinedload(Tutoria.matricula).joinedload(Matricula.estudiante).joinedload(Estudiante.usuario),
                joinedload(Tutoria.matricula).joinedload(Matricula.asignatura)
            ).filter(Tutoria.id == nueva_tutoria.id).first()
            
            return tutoria_completa
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Error al crear tutoría: {str(e)}")
    
    
    def get_tutoria_by_id(self, db: Session, tutoria_id: int):
        """
        Obtiene una tutoría por ID con todas sus relaciones.
        """
        tutoria = db.query(Tutoria).options(
            joinedload(Tutoria.tutor).joinedload(Tutor.usuario),
            joinedload(Tutoria.matricula).joinedload(Matricula.estudiante).joinedload(Estudiante.usuario),
            joinedload(Tutoria.matricula).joinedload(Matricula.asignatura)
        ).filter(Tutoria.id == tutoria_id).first()
        
        if not tutoria:
            raise HTTPException(status_code=404, detail="Tutoría no encontrada")
        
        return tutoria
    
    def get_tutorias_by_estudiante(self, db: Session, estudiante_id: int):
        """
        Obtiene todas las tutorías de un estudiante.
        """
        tutorias = db.query(Tutoria).join(
            Matricula, Tutoria.matricula_id == Matricula.id
        ).filter(
            Matricula.estudiante_id == estudiante_id
        ).options(
            joinedload(Tutoria.tutor).joinedload(Tutor.usuario),
            joinedload(Tutoria.matricula).joinedload(Matricula.asignatura)
        ).all()
        
        return tutorias
    
    def get_tutorias_by_tutor(self, db: Session, tutor_id: int):
        """
        Obtiene todas las tutorías de un tutor, incluyendo la evaluación si existe.
        """
        tutorias = db.query(Tutoria).filter(
            Tutoria.tutor_id == tutor_id
        ).options(
            joinedload(Tutoria.tutor).joinedload(Tutor.usuario),
            joinedload(Tutoria.matricula).joinedload(Matricula.estudiante).joinedload(Estudiante.usuario),
            joinedload(Tutoria.matricula).joinedload(Matricula.asignatura),
            joinedload(Tutoria.evaluacion) # ✅ AGREGADO: Incluir la evaluación
        ).all()
        
        return tutorias

    
    # --- NUEVO MÉTODO PARA ACTUALIZAR EL ESTADO ---
    def update_tutoria_status(self, db: Session, tutoria_id: int, nuevo_estado: str, current_tutor_id: int, enlace_reunion: Optional[str] = None):
        """
        Actualiza el estado de una tutoría, incluyendo la lógica para aceptar
        (programada), rechazar (cancelada) y finalizar (realizada/no_asistio).
        """
        tutoria = db.query(Tutoria).filter(Tutoria.id == tutoria_id).first()

        if not tutoria:
            raise HTTPException(status_code=404, detail="Tutoría no encontrada")

        if tutoria.tutor_id != current_tutor_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No autorizado para modificar esta tutoría")

        estados_validos = ['realizada', 'cancelada', 'no_asistio', 'programada', 'solicitada']
        if nuevo_estado not in estados_validos:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Estado '{nuevo_estado}' no es válido.")

        # --- Lógica de ACEPTACIÓN (solicitada -> programada) ---
        if nuevo_estado == 'programada':
            if tutoria.estado != 'solicitada':
                 raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se puede programar una tutoría que está en estado 'solicitada'.")

            # Si es virtual, DEBE tener un enlace
            if tutoria.modalidad == 'Virtual' and not enlace_reunion:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Las tutorías virtuales requieren el enlace de reunión.")
            
            # Guardamos el enlace si aplica
            tutoria.enlace_reunion = enlace_reunion
            tutoria.estado = 'programada'
            
        # --- Lógica de FINALIZACIÓN (programada -> realizada / no_asistio) ---
        elif nuevo_estado in ['realizada', 'no_asistio']:
            if tutoria.estado != 'programada':
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Solo se puede finalizar una tutoría que está en estado 'programada'.")
            
            tutoria.estado = nuevo_estado
            
        # --- Lógica de RECHAZO (cualquier estado -> cancelada) ---
        elif nuevo_estado == 'cancelada':
            tutoria.estado = 'cancelada'
            
        else:
            tutoria.estado = nuevo_estado
            
        db.commit()
        db.refresh(tutoria)
        return tutoria
    

# Instancia del servicio para usar en los endpoints
tutoria_service = TutoriaService()