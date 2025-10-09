# backend/app/models/estudiante.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Estudiante(Base):
    __tablename__ = "estudiantes"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    # --- La Conexión Clave ---
    usuario_id = Column(Integer, ForeignKey("tutorias_unach.usuarios.id"), unique=True, nullable=False)

    codigo_estudiante = Column(String(50), unique=True, nullable=False)
    carrera = Column(String(100))
    semestre = Column(Integer)

    # --- Relación Inversa ---
    usuario = relationship("Usuario", back_populates="estudiante_perfil")

    # Un estudiante puede estar en muchas matrículas
    matriculas = relationship("Matricula", back_populates="estudiante")