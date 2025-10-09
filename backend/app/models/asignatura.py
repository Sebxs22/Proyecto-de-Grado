# backend/app/models/asignatura.py

from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.database import Base

class Asignatura(Base):
    __tablename__ = "asignaturas"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(20), unique=True)
    nombre = Column(String(150), nullable=False)

    # Una asignatura puede tener muchas matrículas
    matriculas = relationship("Matricula", back_populates="asignatura")