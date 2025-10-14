# backend/app/services/evaluacion_service.py

from sqlalchemy.orm import Session
from app.models.evaluacion import Evaluacion
from app.models.tutoria import Tutoria
from app.schemas.evaluacion import EvaluacionCreate
from fastapi import HTTPException, status
from sqlalchemy import func

class EvaluacionService:
    def create_evaluacion(self, db: Session, evaluacion: EvaluacionCreate):
        """
        Crea una nueva evaluación para una tutoría, verificando su estado y si ya fue evaluada.
        """
        tutoria = db.query(Tutoria).filter(Tutoria.id == evaluacion.tutoria_id).first()

        if not tutoria:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutoría no encontrada.")
        
        # Regla de negocio: Solo se puede evaluar una tutoría si ha sido 'realizada' o 'no_asistio'
        if tutoria.estado not in ['realizada', 'no_asistio']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail=f"La tutoría debe estar en estado 'realizada' o 'no_asistio' para ser evaluada (Estado actual: {tutoria.estado})."
            )

        # Regla de negocio: Una tutoría solo se evalúa una vez (UNIQUE constraint en la DB)
        existe_evaluacion = db.query(Evaluacion).filter(Evaluacion.tutoria_id == evaluacion.tutoria_id).first()
        if existe_evaluacion:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Esta tutoría ya ha sido evaluada.")

        try:
            db_evaluacion = Evaluacion(
                tutoria_id=evaluacion.tutoria_id,
                estrellas=evaluacion.estrellas,
                comentario_estudiante=evaluacion.comentario_estudiante
            )

            db.add(db_evaluacion)
            db.commit()
            db.refresh(db_evaluacion)
            return db_evaluacion
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Error al crear la evaluación: {str(e)}")
            
    def get_tutor_average_rating(self, db: Session, tutor_id: int) -> float:
        """
        Calcula el promedio de estrellas de un tutor.
        """
        # Une evaluaciones con tutorías para filtrar por tutor_id
        avg_rating = db.query(func.avg(Evaluacion.estrellas)).join(
            Tutoria, Evaluacion.tutoria_id == Tutoria.id
        ).filter(
            Tutoria.tutor_id == tutor_id
        ).scalar()
        
        return round(float(avg_rating) if avg_rating else 0.0, 2)

evaluacion_service = EvaluacionService()