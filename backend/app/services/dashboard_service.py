# backend/app/services/dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List, Optional

# Reemplaza esta función en backend/app/services/dashboard_service.py

# Reemplaza esta función en backend/app/services/dashboard_service.py

# Reemplaza esta función en dashboard_service.py
def get_student_kpis(db: Session, estudiante_id: int) -> Dict[str, Any]:
    query_historial = text("""
        SELECT 
            a.nombre AS asignatura, 
            n.parcial1,
            n.parcial2,
            n.final,
            n.situacion,
            m.id AS matricula_id,
            m.tutor_id,  -- <-- LEEMOS EL TUTOR_ID DIRECTAMENTE DE LA MATRÍCULA
            (COALESCE(n.parcial1, 0) + COALESCE(n.parcial2, 0)) / 2 AS promedio_parciales
        FROM tutorias_unach.notas n
        JOIN tutorias_unach.matriculas m ON n.matricula_id = m.id
        JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
        WHERE m.estudiante_id = :estudiante_id
        ORDER BY m.periodo_id DESC, a.nombre;
    """)
    historial_result = db.execute(query_historial, {"estudiante_id": estudiante_id}).mappings().all()
    # ... (El resto de la función para calcular riesgo y promedios no cambia y es correcto)
    historial_detallado = []; suma_finales, total_finales = 0, 0
    for materia in historial_result:
        materia_dict = dict(materia); promedio = materia_dict.get('promedio_parciales'); riesgo_nivel, riesgo_color = "BAJO", "green"
        if promedio is not None:
            if promedio < 8.0: riesgo_nivel, riesgo_color = "MEDIO", "yellow"
            if promedio < 7.0: riesgo_nivel, riesgo_color = "ALTO", "red"
        materia_dict['riesgo_nivel'] = riesgo_nivel; materia_dict['riesgo_color'] = riesgo_color; historial_detallado.append(materia_dict)
        if materia_dict.get('final') is not None: suma_finales += materia_dict['final']; total_finales += 1
    promedio_general = (suma_finales / total_finales) if total_finales > 0 else 0.0
    return {"kpis": {"promedio_general": round(promedio_general, 2), "total_materias": len(historial_detallado)}, "historial_academico": historial_detallado}

# Esta función no cambia, la dejamos como está
def get_student_id_by_user_email(db: Session, email: str) -> Optional[int]:
    query = text("""
        SELECT e.id
        FROM tutorias_unach.estudiantes e
        JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
        WHERE u.correo = :email;
    """)
    result = db.execute(query, {"email": email}).scalar_one_or_none()
    return result