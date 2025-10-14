# backend/app/models/tutoria.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Tutoria(Base):
    __tablename__ = "tutorias"
    __table_args__ = {'schema': 'tutorias_unach'}
    
    id = Column(Integer, primary_key=True, index=True)
    
    # ✅ CORRECCIÓN: Cambiado timezone=True a timezone=False
    # Esto hace que SQLAlchemy/PostgreSQL almacene la fecha SIN conversión UTC
    fecha = Column(DateTime(timezone=False), nullable=False)
    
    duracion_min = Column(Integer, nullable=False)
    tema = Column(Text)
    modalidad = Column(String(20))
    estado = Column(String(20), nullable=False)
    observaciones_tutor = Column(Text)
    
    # ✅ CORRECCIÓN: También cambiado en fecha_registro
    fecha_registro = Column(DateTime(timezone=False), server_default=func.now())
    
    # --- Conexiones Clave ---
    matricula_id = Column(Integer, ForeignKey("tutorias_unach.matriculas.id"), nullable=True)
    tutor_id = Column(Integer, ForeignKey("tutorias_unach.tutores.id"), nullable=False)
    
    # --- Relaciones Inversas ---
    matricula = relationship("Matricula", back_populates="tutorias")
    tutor = relationship("Tutor", back_populates="tutorias_impartidas")
    
    # --- Relación "hijo" ---
    evaluacion = relationship("Evaluacion", back_populates="tutoria", uselist=False, cascade="all, delete-orphan")