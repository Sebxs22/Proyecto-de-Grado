# backend/app/services/tutoria_service.py

from sqlalchemy.orm import Session, joinedload
from app.models.tutoria import Tutoria
from app.models.tutor import Tutor
from app.models.matricula import Matricula
from app.models.estudiante import Estudiante
from app.models.user import Usuario
from app.schemas.tutoria import TutoriaCreate,TutoriaUpdate
from fastapi import HTTPException

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
        Obtiene todas las tutorías de un tutor.
        """
        tutorias = db.query(Tutoria).filter(
            Tutoria.tutor_id == tutor_id
        ).options(
            joinedload(Tutoria.tutor).joinedload(Tutor.usuario),
            joinedload(Tutoria.matricula).joinedload(Matricula.estudiante).joinedload(Estudiante.usuario),
            joinedload(Tutoria.matricula).joinedload(Matricula.asignatura)
        ).all()
        
        return tutorias

    
    # --- NUEVO MÉTODO PARA ACTUALIZAR EL ESTADO ---
    def update_tutoria_status(self, db: Session, tutoria_id: int, nuevo_estado: str, current_tutor_id: int):
        """
        Actualiza el estado de una tutoría, verificando que el tutor que
        realiza la acción es el tutor asignado a dicha tutoría.
        """
        tutoria = db.query(Tutoria).filter(Tutoria.id == tutoria_id).first()

        if not tutoria:
            raise HTTPException(status_code=404, detail="Tutoría no encontrada")

        if tutoria.tutor_id != current_tutor_id:
            raise HTTPException(status_code=403, detail="No autorizado para modificar esta tutoría")

        estados_validos = ['realizada', 'cancelada', 'no_asistio', 'programada', 'solicitada']
        if nuevo_estado not in estados_validos:
            raise HTTPException(status_code=400, detail=f"Estado '{nuevo_estado}' no es válido.")

        tutoria.estado = nuevo_estado
        db.commit()
        db.refresh(tutoria)
        return tutoria

# Instancia del servicio para usar en los endpoints
tutoria_service = TutoriaService()