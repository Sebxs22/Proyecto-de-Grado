# backend/app/services/cmi_service.py

from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.tutoria import Tutoria
from app.models.evaluacion import Evaluacion
from app.models.estudiante import Estudiante
from app.models.tutor import Tutor
from typing import Dict, Any


class CMIService:
    """Servicio para el Cuadro de Mando Integral (CMI)"""
    
    @staticmethod
    def get_cmi_data(db: Session) -> Dict[str, Any]:
        """
        Calcula y retorna los indicadores clave de rendimiento (KPIs) para el CMI.
        """
        
        # --- Perspectiva: Estudiante ---
        
        # 1. Tasa de Asistencia a Tutorías
        total_tutorias_finalizadas = db.query(Tutoria).filter(
            Tutoria.estado.in_(['realizada', 'no_asistio'])
        ).count()
        
        tutorias_asistidas = db.query(Tutoria).filter(
            Tutoria.estado == 'realizada'
        ).count()
        
        tasa_asistencia = (
            (tutorias_asistidas / total_tutorias_finalizadas * 100) 
            if total_tutorias_finalizadas > 0 
            else 0
        )
        
        # 2. Nivel de Satisfacción Promedio
        satisfaccion_promedio = db.query(func.avg(Evaluacion.estrellas)).scalar() or 0
        
        # --- Perspectiva: Procesos Internos ---
        
        # 3. Total de Sesiones Realizadas
        total_sesiones_realizadas = tutorias_asistidas
        
        # 4. Estado actual de las tutorías (para un gráfico de distribución)
        distribucion_estados = db.query(
            Tutoria.estado, 
            func.count(Tutoria.id)
        ).group_by(Tutoria.estado).all()
        
        # --- Perspectiva: Recursos ---
        
        # 5. Ratio Tutor-Estudiante
        total_tutores = db.query(Tutor).count()
        total_estudiantes = db.query(Estudiante).count()
        ratio_tutor_estudiante = (
            total_estudiantes / total_tutores 
            if total_tutores > 0 
            else 0
        )
        
        # --- Ensamblaje del CMI ---
        cmi = {
            "perspectiva_estudiante": {
                "tasa_asistencia": round(tasa_asistencia, 2),
                "satisfaccion_promedio": round(satisfaccion_promedio, 2),
            },
            "perspectiva_procesos": {
                "total_sesiones_realizadas": total_sesiones_realizadas,
                "distribucion_estados": [
                    {"name": estado, "value": count} 
                    for estado, count in distribucion_estados
                ],
            },
            "perspectiva_recursos": {
                "total_tutores": total_tutores,
                "total_estudiantes": total_estudiantes,
                "ratio_tutor_estudiante": round(ratio_tutor_estudiante, 2),
            }
        }
        
        return cmi


# Instancia del servicio para importar
cmi_service = CMIService()