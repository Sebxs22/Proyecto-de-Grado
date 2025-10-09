# backend/app/routes/tutorias.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.tutoria import Tutoria, TutoriaCreate
from app.services.tutoria_service import tutoria_service  # ✅ CORREGIDO
from app.models.user import Usuario as UserModel

router = APIRouter()

@router.post("/", response_model=Tutoria, status_code=status.HTTP_201_CREATED)
def agendar_nueva_tutoria(
    tutoria: TutoriaCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Endpoint para que un estudiante agende una nueva tutoría.
    El estado inicial será 'solicitada'.
    """
    return tutoria_service.create_tutoria(db=db, tutoria=tutoria, estudiante_id=current_user.id)

@router.get("/", response_model=List[Tutoria])
def obtener_mis_tutorias(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Obtiene la lista de tutorías para el usuario autenticado.
    """
    if current_user.rol == 'estudiante':
        return tutoria_service.get_tutorias_by_estudiante(db=db, estudiante_id=current_user.id)  # ✅ CORREGIDO
    # Aquí iría la lógica para el tutor
    return []