# backend/app/routes/dashboard.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.db.database import get_db
from app.dependencies import get_current_user
from app.services import dashboard_service
from app.models.user import Usuario as UserModel

router = APIRouter()

@router.get("/student", response_model=Dict[str, Any], tags=["Dashboard"])
def get_student_dashboard(db: Session = Depends(get_db), current_user: UserModel = Depends(get_current_user)):
    """
    Retorna todos los datos para el Dashboard del Estudiante, incluyendo KPIs y historial.
    Requiere un token de autenticación.
    """
    if current_user.rol != "estudiante":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado: Se requiere rol de estudiante.")

    # Obtenemos el ID del estudiante a partir del usuario autenticado
    estudiante_id = dashboard_service.get_student_id_by_user_email(db, current_user.correo)
    
    if not estudiante_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de estudiante no encontrado.")

    # Obtenemos los KPIs usando el servicio
    dashboard_data = dashboard_service.get_student_kpis(db, estudiante_id)
    
    return {
        "nombre": current_user.nombre,
        "kpis": dashboard_data["kpis"],
        "historial": dashboard_data["historial_academico"],
        "proxima_tutoria": None # La dejamos en None ya que la carga de tutorías falló.
    }