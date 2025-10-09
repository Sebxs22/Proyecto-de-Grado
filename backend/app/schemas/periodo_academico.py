# backend/app/schemas/periodo_academico.py

from pydantic import BaseModel
from typing import Optional
from datetime import date

class PeriodoAcademicoBase(BaseModel):
    nombre: str
    fecha_inicio: date
    fecha_fin: date
    activo: Optional[bool] = False

class PeriodoAcademicoCreate(PeriodoAcademicoBase):
    pass

class PeriodoAcademico(PeriodoAcademicoBase):
    id: int

    class Config:
        from_attributes = True