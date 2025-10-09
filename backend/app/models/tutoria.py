# backend/app/models/tutoria.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.db.database import Base

class Tutoria(Base):
    __tablename__ = "tutorias"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(DateTime(timezone=True), nullable=False)
    duracion_min = Column(Integer, nullable=False)
    tema = Column(Text)
    modalidad = Column(String(20))
    estado = Column(String(20), nullable=False)
    observaciones_tutor = Column(Text)
    fecha_registro = Column(DateTime(timezone=True), server_default=func.now())

    # --- Conexiones Clave ---
    matricula_id = Column(Integer, ForeignKey("tutorias_unach.matriculas.id"), nullable=True)
    tutor_id = Column(Integer, ForeignKey("tutorias_unach.tutores.id"), nullable=False)

    # --- Relaciones Inversas ---
    matricula = relationship("Matricula", back_populates="tutorias")
    tutor = relationship("Tutor", back_populates="tutorias_impartidas")

    # --- Relación "hijo" ---
    # Una tutoría solo puede tener una evaluación
    evaluacion = relationship("Evaluacion", back_populates="tutoria", uselist=False, cascade="all, delete-orphan")