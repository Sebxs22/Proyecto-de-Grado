# backend/app/schemas/tutor.py

from pydantic import BaseModel
from typing import Optional

# Importamos el schema base de Usuario para anidarlo
from .user import User

class TutorBase(BaseModel):
    especialidad: Optional[str] = None
    departamento: Optional[str] = None

class TutorCreate(TutorBase):
    # No necesitamos campos adicionales para la creación,
    # ya que el usuario se crea por separado.
    pass

class Tutor(TutorBase):
    id: int
    usuario_id: int
    
    # --- Anidación de Schemas ---
    # Al devolver un Tutor desde la API, también incluiremos
    # la información completa del usuario asociado.
    usuario: User 

    class Config:
        from_attributes = True