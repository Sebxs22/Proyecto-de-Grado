# backend/app/routes/reports.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.db.database import get_db
from app.dependencies import get_current_user
from app.models.user import Usuario as UserModel
from app.services.report_service import report_service

router = APIRouter()

@router.get("/coordinator", response_model=List[Dict[str, Any]], tags=["Reports"])
def get_detailed_coordinator_report(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
):
    """
    Endpoint para el Coordinador.
    Retorna un reporte detallado de tutorías, agrupado por
    periodo, tutor y asignatura, con KPIs.
    """
    if current_user.rol != "coordinador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Acceso denegado: Se requiere rol de coordinador."
        )
    
    report_data = report_service.get_coordinator_report(db)
    
    return report_data