# frontend/Dockerfile

# Usamos una imagen oficial y ligera de Node.js
FROM node:20-alpine

# Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero la lista de dependencias para optimizar la caché de Docker
COPY package*.json ./

# Instalamos las dependencias del proyecto
RUN npm install

# Copiamos el resto del código de nuestra aplicación
COPY . .

# Exponemos el puerto 5173 para que podamos acceder desde fuera
EXPOSE 5173

# El comando que se ejecutará para iniciar la aplicación
CMD ["npm", "run", "dev"]