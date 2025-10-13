# backend/app/services/dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List, Optional

# Reemplaza la función existente con esta versión corregida
def get_student_kpis(db: Session, estudiante_id: int) -> Dict[str, Any]:
    """
    Obtiene los KPIs y el historial académico para un estudiante.
    CORREGIDO: Usa LEFT JOIN para incluir materias sin notas.
    """
    query_historial = text("""
        SELECT 
            a.nombre AS asignatura,
            n.parcial1,
            n.parcial2,
            n.final,
            n.situacion,
            m.id AS matricula_id,
            m.tutor_id,
            -- Calculamos el promedio solo si las notas existen
            (COALESCE(n.parcial1, 0) + COALESCE(n.parcial2, 0)) / 2 AS promedio_parciales
        -- El cambio clave está aquí: empezamos desde las matrículas y usamos LEFT JOIN
        FROM tutorias_unach.matriculas m
        JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
        LEFT JOIN tutorias_unach.notas n ON m.id = n.matricula_id
        WHERE m.estudiante_id = :estudiante_id
        ORDER BY m.periodo_id DESC, a.nombre;
    """)
    
    historial_result = db.execute(query_historial, {"estudiante_id": estudiante_id}).mappings().all()
    
    historial_detallado = []
    suma_finales, total_finales = 0, 0
    
    for materia in historial_result:
        materia_dict = dict(materia)
        promedio = materia_dict.get('promedio_parciales')
        riesgo_nivel, riesgo_color = "BAJO", "green"
        
        # El cálculo de riesgo ahora funciona incluso con notas nulas
        if promedio is not None:
            if promedio < 8.0 and promedio >= 7.0:
                riesgo_nivel, riesgo_color = "MEDIO", "yellow"
            elif promedio < 7.0:
                riesgo_nivel, riesgo_color = "ALTO", "red"
        
        materia_dict['riesgo_nivel'] = riesgo_nivel
        materia_dict['riesgo_color'] = riesgo_color
        historial_detallado.append(materia_dict)
        
        if materia_dict.get('final') is not None:
            suma_finales += materia_dict['final']
            total_finales += 1
            
    promedio_general = (suma_finales / total_finales) if total_finales > 0 else 0.0
    
    return {
        "kpis": {
            "promedio_general": round(promedio_general, 2),
            "total_materias": len(historial_detallado)
        },
        "historial_academico": historial_detallado
    }

# La función get_student_id_by_user_email se mantiene igual
def get_student_id_by_user_email(db: Session, email: str) -> Optional[int]:
    query = text("""
        SELECT e.id
        FROM tutorias_unach.estudiantes e
        JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
        WHERE u.correo = :email;
    """)
    result = db.execute(query, {"email": email}).scalar_one_or_none()
    return result