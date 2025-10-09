# backend/app/schemas/estudiante.py

from pydantic import BaseModel
from typing import Optional
from .user import User

class EstudianteBase(BaseModel):
    codigo_estudiante: str
    carrera: Optional[str] = None
    semestre: Optional[int] = None

class EstudianteCreate(EstudianteBase):
    pass

class Estudiante(EstudianteBase):
    id: int
    usuario_id: int
    
    # --- Anidación de Schemas ---
    # Al igual que con el tutor, incluimos los datos del usuario.
    usuario: User

    class Config:
        from_attributes = True