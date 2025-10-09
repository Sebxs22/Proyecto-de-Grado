# backend/app/models/periodo_academico.py

from sqlalchemy import Column, Integer, String, Boolean, Date
from sqlalchemy.orm import relationship
from app.db.database import Base

class PeriodoAcademico(Base):
    __tablename__ = "periodos_academicos"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(20), unique=True, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    activo = Column(Boolean, default=False)

    # Un período académico puede tener muchas matrículas
    matriculas = relationship("Matricula", back_populates="periodo")