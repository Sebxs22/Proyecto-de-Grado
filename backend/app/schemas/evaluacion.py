# backend/app/schemas/evaluacion.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class EvaluacionBase(BaseModel):
    # Validamos que las estrellas estén entre 1 y 5
    estrellas: int = Field(..., ge=1, le=5)
    comentario_estudiante: Optional[str] = None

class EvaluacionCreate(EvaluacionBase):
    tutoria_id: int

class Evaluacion(EvaluacionBase):
    id: int
    tutoria_id: int
    fecha: datetime

    class Config:
        from_attributes = True