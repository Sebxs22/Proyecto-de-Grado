# backend/app/routes/dashboard.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.database import get_db
from app.dependencies import get_current_user
from app.services import dashboard_service
from app.services import tutor_dashboard_service
from app.services.cmi_service import cmi_service
# ✅ CORREGIDO: Importar el servicio centralizado de perfiles
from app.services.profile_service import get_student_id_by_user_email, get_tutor_id_by_user_email 
from app.models.user import Usuario as UserModel

router = APIRouter()

@router.get("/student", response_model=Dict[str, Any], tags=["Dashboard"])
def get_student_dashboard(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Retorna todos los datos para el Dashboard del Estudiante.
    Requiere un token de autenticación de un usuario con rol 'estudiante'.
    """
    if current_user.rol != "estudiante":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado: Se requiere rol de estudiante."
        )

    # ✅ CORREGIDO: Usamos la función del profile_service
    estudiante_id = get_student_id_by_user_email(db, current_user.correo)

    if not estudiante_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Perfil de estudiante no encontrado."
        )

    dashboard_data = dashboard_service.get_student_kpis(db, estudiante_id)

    return {
        "nombre": current_user.nombre,
        "kpis": dashboard_data["kpis"],
        "historial_academico": dashboard_data["historial_academico"]
    }

# --- ENDPOINT PARA EL TUTOR ---
@router.get("/tutor", response_model=Dict[str, Any], tags=["Dashboard"])
def get_tutor_dashboard(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Retorna todos los datos para el Dashboard del Tutor.
    Requiere un token de autenticación de un usuario con rol 'tutor'.
    """
    if current_user.rol != "tutor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado: Se requiere rol de tutor."
        )

    # ✅ CORREGIDO: Usamos la función del profile_service
    tutor_id = get_tutor_id_by_user_email(db, current_user.correo)

    if not tutor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Perfil de tutor no encontrado."
        )

    dashboard_data = tutor_dashboard_service.get_tutor_dashboard_data(db, tutor_id)

    return {
        "nombre": current_user.nombre,
        "cursos": dashboard_data["cursos"],
        "tutorias_pendientes": dashboard_data["tutorias_pendientes"],
        "average_rating": dashboard_data["average_rating"]
    }

# --- ✅ NUEVO ENDPOINT PARA EL COORDINADOR (CMI) ---
@router.get("/coordinator", response_model=Dict[str, Any], tags=["Dashboard"])
def get_coordinator_dashboard(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Retorna los datos para el Cuadro de Mando Integral (CMI) del Coordinador.
    Requiere un token de autenticación de un usuario con rol 'coordinador'.
    """
    if current_user.rol != "coordinador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de coordinador."
        )
    
    # El CMI no está atado a un coordinador específico, es una vista global.
    data = cmi_service.get_cmi_data(db)
    
    return {
        "nombre": current_user.nombre,
        "cmi": data
    }