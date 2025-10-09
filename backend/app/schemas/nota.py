# backend/app/schemas/nota.py

from pydantic import BaseModel, Field
from typing import Optional

class NotaBase(BaseModel):
    # Usamos Field para añadir validaciones: la nota debe estar entre 0 y 10.
    parcial1: Optional[float] = Field(None, ge=0, le=10)
    parcial2: Optional[float] = Field(None, ge=0, le=10)
    final: Optional[float] = Field(None, ge=0, le=10)
    suspension: Optional[float] = Field(None, ge=0, le=10)
    situacion: Optional[str] = None

class NotaCreate(NotaBase):
    matricula_id: int

class NotaUpdate(NotaBase):
    # Para actualizar, todos los campos son opcionales
    pass

class Nota(NotaBase):
    id: int
    matricula_id: int

    class Config:
        from_attributes = True