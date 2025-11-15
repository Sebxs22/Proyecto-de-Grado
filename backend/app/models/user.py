# backend/app/models/user.py

from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import relationship
from app.db.database import Base


# Esta clase es nuestro modelo y representa la tabla "usuarios" en la BD
class Usuario(Base):
    __tablename__ = "usuarios"
    __table_args__ = {'schema': 'tutorias_unach'}

    # --- Columnas de la tabla ---
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    correo = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    # --- Relaciones con otras tablas ---
    # Esto le dice a SQLAlchemy: "Un usuario puede tener un perfil de tutor asociado"
    tutor_perfil = relationship("Tutor", back_populates="usuario", uselist=False, cascade="all, delete-orphan")
    
    # "Un usuario puede tener un perfil de estudiante asociado"
    estudiante_perfil = relationship("Estudiante", back_populates="usuario", uselist=False, cascade="all, delete-orphan")

    coordinador_perfil = relationship("Coordinador", back_populates="usuario", uselist=False, cascade="all, delete-orphan")