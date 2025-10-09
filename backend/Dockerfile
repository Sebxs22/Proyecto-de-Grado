# backend/Dockerfile

# Usamos una imagen oficial y delgada de Python 3.11
FROM python:3.11-slim

# Establecemos el directorio de trabajo
WORKDIR /app

# Copiamos el archivo de requerimientos de Python
COPY ./requirements.txt /app/requirements.txt

# Instalamos las librerías de Python que necesita el proyecto
RUN pip install --no-cache-dir --upgrade -r /app/requirements.txt

# Copiamos todo el código del backend al contenedor
COPY . /app

# El comando para iniciar el servidor de FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]