# backend/app/dependencies.py

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.user import Usuario
from app.services import auth_service

# Este es el esquema que le dice a FastAPI: "Para entrar aquí, necesitas un token".
# Se encargará de buscar el token en la cabecera "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    """
    Dependencia que valida el token y devuelve el usuario actual.
    Actúa como un guardia en cada ruta que la requiera.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decodifica el token usando nuestra clave secreta
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Una vez decodificado, busca al usuario en la base de datos
    user = auth_service.get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    
    return user