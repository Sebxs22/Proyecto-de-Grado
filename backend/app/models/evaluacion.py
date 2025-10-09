# backend/app/models/evaluacion.py

from sqlalchemy import Column, Integer, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Evaluacion(Base):
    __tablename__ = "evaluaciones"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    estrellas = Column(Integer, nullable=False)
    comentario_estudiante = Column(Text)
    fecha = Column(DateTime(timezone=True), server_default=func.now())

    # --- Conexión Clave ---
    tutoria_id = Column(Integer, ForeignKey("tutorias_unach.tutorias.id"), unique=True, nullable=False)

    # --- Relación Inversa ---
    tutoria = relationship("Tutoria", back_populates="evaluacion")