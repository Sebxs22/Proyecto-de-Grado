# backend/app/services/profile_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

def get_student_id_by_user_email(db: Session, email: str) -> Optional[int]:
    """Obtiene el ID del perfil del estudiante a partir del correo del usuario."""
    query = text("""
        SELECT e.id
        FROM tutorias_unach.estudiantes e
        JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
        WHERE u.correo = :email;
    """)
    result = db.execute(query, {"email": email}).scalar_one_or_none()
    return result

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