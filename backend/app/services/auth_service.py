# backend/app/services/auth_service.py

from sqlalchemy.orm import Session
from typing import Optional
from app.core.security import verify_password
from app.models.user import Usuario
from app.services import user_service

def get_user_by_email(db: Session, email: str) -> Optional[Usuario]:
    """Busca y devuelve un usuario por su correo electrónico."""
    return db.query(Usuario).filter(Usuario.correo == email).first()

def authenticate_user(db: Session, email: str, password: str) -> Optional[Usuario]:
    """
    Autentica a un usuario.
    1. Busca al usuario por email.
    2. Si existe, verifica su contraseña.
    3. Devuelve el objeto del usuario si todo es correcto, o None si no.
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user