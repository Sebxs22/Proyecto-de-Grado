# backend/app/core/security.py

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from app.core.config import settings
# --- NUEVAS IMPORTACIONES ---
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Creamos una instancia del hasher de Argon2
ph = PasswordHasher()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica una contraseña en texto plano contra un hash de Argon2."""
    try:
        # La función verify se encarga de todo. Lanza un error si no coinciden.
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False

def get_password_hash(password: str) -> str:
    """Cifra una contraseña en texto plano usando Argon2."""
    # La función hash crea el cifrado con la seguridad necesaria.
    return ph.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crea un nuevo token de acceso JWT."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt