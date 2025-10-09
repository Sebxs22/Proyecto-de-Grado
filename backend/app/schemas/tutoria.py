# backend/app/schemas/tutoria.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
# Importamos los schemas necesarios
from .tutor import Tutor  # ✅ CAMBIADO: importar Tutor en vez de User
from .matricula import Matricula  # ✅ AGREGADO (probablemente lo necesites también)

class TutoriaBase(BaseModel):
    fecha: datetime
    duracion_min: int = Field(..., gt=0)
    tema: Optional[str] = None
    modalidad: str
    estado: str

class TutoriaCreate(BaseModel):
    matricula_id: int
    tutor_id: int
    fecha: datetime
    duracion_min: int = 60
    tema: str
    modalidad: str
    estado: str = "solicitada"  # ✅ Con valor por defecto

# Schema para la respuesta, con más detalles
class Tutoria(TutoriaBase):
    id: int
    matricula_id: int
    tutor_id: int  # ✅ AGREGADO
    
    # ✅ CAMBIADO: Ahora esperamos un objeto Tutor completo
    # (que incluye el usuario dentro)
    tutor: Tutor
    
    class Config:
        from_attributes = True