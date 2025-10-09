# backend/app/schemas/user.py

from pydantic import BaseModel, EmailStr
from typing import Optional

# --- Schema Base ---
# Define los campos comunes que todos los demás schemas de usuario tendrán.
# No incluimos la contraseña aquí por seguridad.
class UserBase(BaseModel):
    nombre: str
    correo: EmailStr # Pydantic valida automáticamente que sea un email válido
    rol: str
    activo: Optional[bool] = None

# --- Schema para Creación ---
# Hereda de UserBase y añade el campo de la contraseña, que solo se necesita al crear un usuario.
class UserCreate(UserBase):
    password: str

# --- Schema para Lectura/Respuesta ---
# Este es el schema que usaremos para devolver información del usuario desde la API.
# Hereda los campos de UserBase y añade el 'id'.
class User(UserBase):
    id: int

    # Esta configuración le dice a Pydantic que puede leer los datos
    # incluso si son de un modelo de SQLAlchemy (un objeto, no un diccionario).
    class Config:
        from_attributes = True