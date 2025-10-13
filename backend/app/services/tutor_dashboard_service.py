# backend/app/services/tutor_dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, Optional

def get_tutor_id_by_user_email(db: Session, email: str) -> Optional[int]:
    """Obtiene el ID del perfil del tutor a partir del correo del usuario."""
    query = text("""
        SELECT t.id
        FROM tutorias_unach.tutores t
        JOIN tutorias_unach.usuarios u ON t.usuario_id = u.id
        WHERE u.correo = :email;
    """)
    result = db.execute(query, {"email": email}).scalar_one_or_none()
    return result

def get_tutor_dashboard_data(db: Session, tutor_id: int) -> Dict[str, Any]:
    """
    Obtiene los datos para el dashboard del tutor, incluyendo sus cursos,
    estudiantes, notas y las tutorías que tiene pendientes de aceptar.
    """
    # Consulta para obtener los cursos y estudiantes asignados al tutor
    query_cursos = text("""
        SELECT
            pa.nombre AS periodo,
            a.nombre AS asignatura,
            e.id AS estudiante_id,
            u.nombre AS estudiante_nombre,
            n.parcial1,
            n.parcial2,
            n.final,
            n.situacion
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

    # Consulta para obtener las tutorías solicitadas que el tutor debe gestionar
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

    return {
        "cursos": [dict(row) for row in cursos_result],
        "tutorias_pendientes": [dict(row) for row in tutorias_result]
    }