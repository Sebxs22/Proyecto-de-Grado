# backend/app/schemas/tutoria.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# Importamos los schemas necesarios
from .tutor import Tutor
from .matricula import Matricula

class TutoriaBase(BaseModel):
    # ✅ CORRECCIÓN: datetime sin timezone awareness
    fecha: datetime
    duracion_min: int = Field(..., gt=0)
    tema: Optional[str] = None
    modalidad: str
    estado: str

class TutoriaCreate(BaseModel):
    matricula_id: int
    tutor_id: int
    
    # ✅ CORRECCIÓN: datetime naive (sin timezone)
    fecha: datetime
    
    duracion_min: int = 60
    tema: str
    modalidad: str
    estado: str = "solicitada"
    
    class Config:
        # ✅ Esto asegura que Pydantic no intente convertir timezones
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# Schema para la respuesta, con más detalles
class Tutoria(TutoriaBase):
    id: int
    matricula_id: Optional[int] = None  # Puede ser nulo si la matrícula se borra
    tutor_id: int
   
    # ✅ Se mantiene
    tutor: Tutor
   
    # ✅ AGREGADO: Anidamos el objeto Matricula
    matricula: Optional[Matricula] = None
    
    class Config:
        from_attributes = True
        # ✅ Mismo encoder para las respuestas
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# --- NUEVO SCHEMA PARA ACTUALIZAR ESTADO ---
class TutoriaUpdate(BaseModel):
    estado: str