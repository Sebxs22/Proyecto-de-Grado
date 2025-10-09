# backend/app/routes/users.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import User, UserCreate
from app.services import user_service
# --- Nuevas importaciones ---
from app.models.user import Usuario as UserModel
from app.dependencies import get_current_user

router = APIRouter()

@router.post("/", response_model=User, status_code=status.HTTP_201_CREATED)
def create_new_user(user: UserCreate, db: Session = Depends(get_db)):
    # ... (código existente)
    new_user = user_service.create_user(db=db, user=user)
    return new_user

# --- NUEVO ENDPOINT PROTEGIDO ---
@router.get("/me", response_model=User)
def read_users_me(current_user: UserModel = Depends(get_current_user)):
    """
    Endpoint protegido.
    Devuelve la información del usuario que está actualmente autenticado.
    """
    return current_user