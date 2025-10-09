# backend/app/schemas/matricula.py

from pydantic import BaseModel
from typing import Optional

# Importamos los schemas que vamos a anidar
from .estudiante import Estudiante
from .asignatura import Asignatura
from .periodo_academico import PeriodoAcademico

class MatriculaBase(BaseModel):
    estudiante_id: int
    asignatura_id: int
    periodo_id: int
    paralelo: Optional[str] = None

class MatriculaCreate(MatriculaBase):
    pass

class Matricula(MatriculaBase):
    id: int
    
    # --- Anidación de Datos ---
    # Aquí está la magia: en lugar de solo IDs,
    # la API devolverá los objetos completos.
    estudiante: Estudiante
    asignatura: Asignatura
    periodo: PeriodoAcademico

    class Config:
        from_attributes = True