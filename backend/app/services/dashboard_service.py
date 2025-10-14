# backend/app/services/dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List, Optional

# ✅ ELIMINADA: La función get_student_id_by_user_email se mueve a profile_service.py

def get_student_kpis(db: Session, estudiante_id: int) -> Dict[str, Any]:
    """
    Obtiene los KPIs y el historial académico para un estudiante.
    CORREGIDO: Usa LEFT JOIN para incluir materias sin notas y añade el nombre del tutor.
    """
    query_historial = text("""
        SELECT 
            a.nombre AS asignatura,
            t_u.nombre AS tutor_nombre, -- ✅ AGREGADO: Nombre del tutor
            n.parcial1,
            n.parcial2,
            n.final,
            n.situacion,
            m.id AS matricula_id,
            m.tutor_id,
            -- Calculamos el promedio solo si las notas existen
            (COALESCE(n.parcial1, 0) + COALESCE(n.parcial2, 0)) / 2 AS promedio_parciales
        FROM tutorias_unach.matriculas m
        JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
        LEFT JOIN tutorias_unach.notas n ON m.id = n.matricula_id
        LEFT JOIN tutorias_unach.tutores t ON m.tutor_id = t.id -- ✅ Join a tutores
        LEFT JOIN tutorias_unach.usuarios t_u ON t.usuario_id = t_u.id -- ✅ Join a usuarios para el nombre del tutor
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
        materia_dict['tutor_nombre'] = materia_dict.get('tutor_nombre') or 'No Asignado'
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

# ✅ ELIMINADA: La función get_student_id_by_user_email se ha movido a profile_service.py
# Ya no necesitamos esta función aquí.