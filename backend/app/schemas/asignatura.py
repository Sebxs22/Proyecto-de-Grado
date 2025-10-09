# backend/app/schemas/asignatura.py

from pydantic import BaseModel
from typing import Optional

class AsignaturaBase(BaseModel):
    nombre: str
    codigo: Optional[str] = None

class AsignaturaCreate(AsignaturaBase):
    pass

class Asignatura(AsignaturaBase):
    id: int

    class Config:
        from_attributes = True