# backend/app/models/coordinador.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Coordinador(Base):
    __tablename__ = "coordinadores"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("tutorias_unach.usuarios.id"), unique=True, nullable=False)
    carrera = Column(String(100), nullable=False)

    # Relación inversa con el usuario
    usuario = relationship("Usuario", back_populates="coordinador_perfil")