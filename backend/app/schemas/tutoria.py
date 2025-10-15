# backend/app/schemas/tutoria.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .evaluacion import Evaluacion 

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
# Schema para la respuesta, con más detalles
class Tutoria(BaseModel):
    id: int
    matricula_id: Optional[int] = None
    tutor_id: int
    fecha: datetime
    duracion_min: int
    tema: Optional[str] = None
    modalidad: str
    estado: str
    observaciones_tutor: Optional[str] = None
    enlace_reunion: Optional[str] = None # ✅ AGREGADO: Enlace de reunión
   
    tutor: Tutor
    matricula: Optional[Matricula] = None
    evaluacion: Optional[Evaluacion] = None
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

# --- NUEVO SCHEMA PARA ACTUALIZAR ESTADO (USADO POR EL TUTOR) ---
class TutoriaUpdate(BaseModel):
    estado: str
    enlace_reunion: Optional[str] = None # ✅ AGREGADO: Enlace para aceptar
    # Campo opcional para que el tutor marque la asistencia/finalización
    marcar_como_finalizada: Optional[bool] = False 