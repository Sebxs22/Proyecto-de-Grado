# backend/app/models/nota.py

from sqlalchemy import Column, Integer, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Nota(Base):
    __tablename__ = "notas"
    __table_args__ = {'schema': 'tutorias_unach'}

    id = Column(Integer, primary_key=True, index=True)
    # --- Conexión Clave ---
    matricula_id = Column(Integer, ForeignKey("tutorias_unach.matriculas.id"), unique=True, nullable=False)

    parcial1 = Column(Numeric(4, 2))
    parcial2 = Column(Numeric(4, 2))
    final = Column(Numeric(4, 2))
    suspension = Column(Numeric(4, 2))
    situacion = Column(String(50))

    # --- Relación Inversa ---
    matricula = relationship("Matricula", back_populates="notas")