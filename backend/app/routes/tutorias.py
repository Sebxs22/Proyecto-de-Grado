# backend/app/routes/tutorias.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.dependencies import get_current_user
from app.schemas.tutoria import Tutoria, TutoriaCreate, TutoriaUpdate
from app.services.tutoria_service import tutoria_service
# ✅ Mantenemos la importación del servicio centralizado de perfiles
from app.services.profile_service import get_tutor_id_by_user_email, get_student_id_by_user_email 
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
    if current_user.rol != 'estudiante':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Solo los estudiantes pueden agendar tutorías.")
    
    # ✅ CORRECCIÓN CRÍTICA: OBTENER ID DE PERFIL DE ESTUDIANTE
    # No usamos current_user.id (ID de Usuario) sino el ID de la tabla estudiantes.
    estudiante_id = get_student_id_by_user_email(db, current_user.correo)
    
    if not estudiante_id:
        raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado.")

    # El servicio de tutoría solo necesita el ID de perfil si se usa para validación futura,
    # pero para la creación directa del objeto Tutoria, solo usamos el payload.
    return tutoria_service.create_tutoria(db=db, tutoria=tutoria, estudiante_id=estudiante_id)

@router.get("/", response_model=List[Tutoria])
def obtener_mis_tutorias(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Obtiene la lista de tutorías para el usuario autenticado.
    """
    if current_user.rol == 'estudiante':
        # ✅ CORRECCIÓN CRÍTICA: OBTENER ID DE PERFIL DE ESTUDIANTE
        estudiante_id = get_student_id_by_user_email(db, current_user.correo)
        if not estudiante_id:
             raise HTTPException(status_code=404, detail="Perfil de estudiante no encontrado.")
        return tutoria_service.get_tutorias_by_estudiante(db=db, estudiante_id=estudiante_id)
        
    elif current_user.rol == 'tutor':
        # ✅ ID de tutoría ya se maneja correctamente (ID de perfil)
        tutor_id = get_tutor_id_by_user_email(db, current_user.correo)
        if not tutor_id:
            raise HTTPException(status_code=404, detail="Perfil de tutor no encontrado.")
        return tutoria_service.get_tutorias_by_tutor(db=db, tutor_id=tutor_id)

    return []

    # --- ENDPOINT PARA ACTUALIZAR ESTADO (se mantiene igual, ya usaba el ID de perfil) ---
@router.patch("/{tutoria_id}/estado", response_model=Tutoria)
def actualizar_estado_tutoria(
    tutoria_id: int,
    update_data: TutoriaUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Permite a un tutor:
    1. Aceptar/Rechazar una solicitud (solicitada -> programada/cancelada).
    2. Marcar como realizada/no asistida (programada -> realizada/no_asistio).
    """
    if current_user.rol != 'tutor':
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado.")

    tutor_id = get_tutor_id_by_user_email(db, current_user.correo)
    if not tutor_id:
        raise HTTPException(status_code=404, detail="Perfil de tutor no encontrado.")

    # ✅ CORREGIDO: Extraemos el estado y el enlace del payload
    return tutoria_service.update_tutoria_status(
        db=db,
        tutoria_id=tutoria_id,
        nuevo_estado=update_data.estado,
        current_tutor_id=tutor_id,
        enlace_reunion=update_data.enlace_reunion # ✅ PASAMOS EL ENLACE
    )