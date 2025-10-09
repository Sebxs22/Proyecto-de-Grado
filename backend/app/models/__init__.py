# backend/app/models/__init__.py

from .user import Usuario
from .tutor import Tutor
from .estudiante import Estudiante
from .periodo_academico import PeriodoAcademico
from .asignatura import Asignatura
from .matricula import Matricula
from .nota import Nota
# --- ASEGÚRATE DE QUE ESTAS DOS LÍNEAS ESTÉN ---
from .tutoria import Tutoria
from .evaluacion import Evaluacion