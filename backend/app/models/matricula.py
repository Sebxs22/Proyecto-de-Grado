# backend/app/models/matricula.py

from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.database import Base

class Matricula(Base):
    __tablename__ = "matriculas"
    __table_args__ = (
        UniqueConstraint('estudiante_id', 'asignatura_id', 'periodo_id', name='uq_matricula_unica'),
        {'schema': 'tutorias_unach'}
    )

    id = Column(Integer, primary_key=True, index=True)
    paralelo = Column(String(5))

    # --- Conexiones con los catálogos ---
    estudiante_id = Column(Integer, ForeignKey("tutorias_unach.estudiantes.id"), nullable=False)
    asignatura_id = Column(Integer, ForeignKey("tutorias_unach.asignaturas.id"), nullable=False)
    periodo_id = Column(Integer, ForeignKey("tutorias_unach.periodos_academicos.id"), nullable=False)
    
    # ✅ CORRECCIÓN: Agregamos la columna tutor_id que faltaba
    tutor_id = Column(Integer, ForeignKey("tutorias_unach.tutores.id"), nullable=True)

    # --- Relaciones Inversas ---
    estudiante = relationship("Estudiante", back_populates="matriculas")
    asignatura = relationship("Asignatura", back_populates="matriculas")
    periodo = relationship("PeriodoAcademico", back_populates="matriculas")
    
    # ✅ CORRECCIÓN: Relación con Tutor
    tutor = relationship("Tutor", back_populates="matriculas")

    # --- Relaciones a "hijos" ---
    notas = relationship("Nota", back_populates="matricula", uselist=False, cascade="all, delete-orphan")
    tutorias = relationship("Tutoria", back_populates="matricula")