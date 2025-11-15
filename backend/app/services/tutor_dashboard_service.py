# backend/app/services/tutor_dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional, List
from app.services.evaluacion_service import evaluacion_service 
from app.services.prediction_service import prediction_service

def get_tutor_dashboard_data(db: Session, tutor_id: int) -> Dict[str, Any]:
    """
    Obtiene los datos para el dashboard del tutor, incluyendo cursos,
    tutorías pendientes, calificación promedio Y EL RIESGO PREDICTIVO.
    """
    
    query_cursos = text("""
        SELECT
            pa.nombre AS periodo,
            a.nombre AS asignatura,
            e.id AS estudiante_id,
            u.nombre AS estudiante_nombre,
            n.parcial1,
            n.parcial2,
            n.final,
            n.situacion,
            m.id AS matricula_id
        FROM tutorias_unach.matriculas m
        JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
        JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
        JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
        JOIN tutorias_unach.periodos_academicos pa ON m.periodo_id = pa.id
        LEFT JOIN tutorias_unach.notas n ON m.id = n.matricula_id
        WHERE m.tutor_id = :tutor_id
        ORDER BY pa.nombre, a.nombre, u.nombre;
    """)
    cursos_result = db.execute(query_cursos, {"tutor_id": tutor_id}).mappings().all()

    cursos_con_riesgo = []
    for row in cursos_result:
        materia_dict = dict(row)
        situacion = materia_dict.get('situacion')
        
        # ✅ --- INICIO DE LÓGICA DE RIESGO MODIFICADA (IDÉNTICA AL OTRO SERVICIO) ---
        if situacion not in ['APROBADO', 'REPROBADO']:
            # 1. Si está en curso, predecimos
            risk_data = prediction_service.predict_risk(
                db=db, 
                estudiante_id=materia_dict['estudiante_id'], 
                matricula_id=materia_dict['matricula_id']
            )
            materia_dict.update(risk_data)
        else:
            # 2. Si ya finalizó, mostramos el resultado final
            if situacion == 'REPROBADO':
                materia_dict['riesgo_nivel'] = 'Riesgo Alto (Finalizado)'
                materia_dict['riesgo_color'] = 'red'
            else: # APROBADO
                materia_dict['riesgo_nivel'] = 'Riesgo Bajo (Finalizado)'
                materia_dict['riesgo_color'] = 'green'
            materia_dict['probabilidad_riesgo'] = None # Ya no es una probabilidad
        # ✅ --- FIN DE LÓGICA DE RIESGO ---
            
        cursos_con_riesgo.append(materia_dict)
    
    query_tutorias = text("""
        SELECT
            t.id AS tutoria_id,
            t.fecha,
            t.tema,
            t.modalidad,
            u.nombre AS estudiante_nombre,
            a.nombre AS asignatura
        FROM tutorias_unach.tutorias t
        JOIN tutorias_unach.matriculas m ON t.matricula_id = m.id
        JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
        JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
        JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
        WHERE t.tutor_id = :tutor_id AND t.estado = 'solicitada'
        ORDER BY t.fecha;
    """)
    tutorias_result = db.execute(query_tutorias, {"tutor_id": tutor_id}).mappings().all()

    average_rating = evaluacion_service.get_tutor_average_rating(db, tutor_id)

    return {
        "cursos": cursos_con_riesgo, 
        "tutorias_pendientes": [dict(row) for row in tutorias_result],
        "average_rating": average_rating
    }