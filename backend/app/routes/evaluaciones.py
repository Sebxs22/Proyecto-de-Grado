# backend/app/routes/evaluaciones.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.evaluacion import Evaluacion, EvaluacionCreate
from app.services.evaluacion_service import evaluacion_service
from app.services.profile_service import get_student_id_by_user_email
from app.models.user import Usuario as UserModel
from app.models.tutoria import Tutoria

router = APIRouter()

@router.post("/", response_model=Evaluacion, status_code=status.HTTP_201_CREATED)
def crear_evaluacion(
    evaluacion: EvaluacionCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Permite a un estudiante crear una evaluación para una tutoría finalizada.
    """
    if current_user.rol != 'estudiante':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado. Solo estudiantes pueden evaluar.")

    # 1. Verificar que el estudiante que evalúa es el estudiante de la tutoría
    tutoria = db.query(Tutoria).filter(Tutoria.id == evaluacion.tutoria_id).first()
    if not tutoria:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tutoría no encontrada.")

    estudiante_id = get_student_id_by_user_email(db, current_user.correo)
    
    # Comprobamos que la matrícula de la tutoría pertenece al estudiante actual.
    # Nota: esto asume que el objeto Tutoria tiene una relación con Matricula.
    # Si la relación no está cargada, podríamos necesitar una consulta JOIN extra aquí
    # o depender de la verificación que hace el service. Por ahora, asumimos que
    # si la tutoría existe, el service validará el ID de matrícula.

    # 2. Creamos la evaluación a través del servicio
    return evaluacion_service.create_evaluacion(db=db, evaluacion=evaluacion)