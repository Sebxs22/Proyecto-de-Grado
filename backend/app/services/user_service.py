# backend/app/services/user_service.py

from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.models.user import Usuario
from app.schemas.user import UserCreate

def create_user(db: Session, user: UserCreate) -> Usuario:
    """
    Crea un nuevo usuario en la base de datos.
    1. Cifra la contraseña.
    2. Crea el objeto de modelo.
    3. Lo guarda en la BD.
    """
    # Ciframos la contraseña antes de guardarla
    hashed_password = get_password_hash(user.password)
    
    # Creamos el objeto del modelo SQLAlchemy
    db_user = Usuario(
        nombre=user.nombre,
        correo=user.correo,
        hashed_password=hashed_password,
        rol=user.rol
    )
    
    # Añadimos el nuevo usuario a la sesión y lo guardamos en la base de datos
    db.add(db_user)
    db.commit()
    db.refresh(db_user) # Refrescamos para obtener el ID asignado por la BD
    
    return db_user