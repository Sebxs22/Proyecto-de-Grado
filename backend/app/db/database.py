# backend/app/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.core.config import settings

# Creamos el "motor" que se conectará a la base de datos
engine = create_engine(settings.DATABASE_URL)

# Creamos una fábrica de sesiones para interactuar con la BD
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Una clase base que nuestros modelos de datos heredarán
Base = declarative_base()

# Función para obtener una sesión de BD en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()