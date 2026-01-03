# backend/app/models/tutor.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Tutor(Base):
    __tablename__ = "tutores"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("tutorias_unach.usuarios.id"), unique=True, nullable=False)

    especialidad = Column(String(100))
    departamento = Column(String(100))

    usuario = relationship("Usuario", back_populates="tutor_perfil")

    # Un tutor puede impartir muchas tutorías
    tutorias_impartidas = relationship("Tutoria", back_populates="tutor")
    
    # ✅ CORRECCIÓN: Relación inversa con Matriculas
    matriculas = relationship("Matricula", back_populates="tutor")