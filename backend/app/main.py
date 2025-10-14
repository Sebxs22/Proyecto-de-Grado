# backend/app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware # <--- 1. IMPORTAMOS EL MÓDULO

# Importamos los routers
from app.routes import users, auth, dashboard, tutorias
from app.routes import evaluaciones

app = FastAPI(
    title="Tutorías UNACH API",
    description="API para el sistema de gestión de tutorías y CMI.",
    version="0.1.0"
)

# --- 2. AÑADIMOS EL PERMISO DE CORS ---
# Lista de orígenes que tienen permiso para hablar con nuestra API
origins = [
    "http://localhost:5173", # La dirección de nuestro frontend en desarrollo
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # Permitir solo los orígenes de la lista
    allow_credentials=True,
    allow_methods=["*"], # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"], # Permitir todas las cabeceras
)

# --- 3. CONECTAMOS LOS ROUTERS (esto ya estaba) ---
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(tutorias.router, prefix="/tutorias", tags=["Tutorías"])
app.include_router(evaluaciones.router, prefix="/evaluaciones", tags=["Evaluaciones"])

@app.get("/")
def read_root():
    return {"status": "ok", "message": "¡Bienvenido a la API de Tutorías UNACH!"}