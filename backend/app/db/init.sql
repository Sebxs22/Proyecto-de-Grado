-- backend/app/db/init.sql
-- Creamos un "esquema" o espacio de trabajo para mantener todo ordenado.
CREATE SCHEMA IF NOT EXISTS tutorias_unach;
SET search_path TO tutorias_unach;

-- -----------------------------------------------------
-- Tabla: usuarios
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('estudiante', 'tutor', 'coordinador')),
    -- ✅ CORRECCIÓN: TIMESTAMP sin timezone
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE
);

-- -----------------------------------------------------
-- Tabla: tutores
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tutores (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    especialidad VARCHAR(100),
    departamento VARCHAR(100)
);

-- -----------------------------------------------------
-- Tabla: estudiantes
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS estudiantes (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER UNIQUE NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    codigo_estudiante VARCHAR(50) UNIQUE NOT NULL,
    carrera VARCHAR(100),
    semestre INTEGER
);

-- -----------------------------------------------------
-- Tabla: asignaturas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS asignaturas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) UNIQUE,
    nombre VARCHAR(150) NOT NULL
);

-- -----------------------------------------------------
-- Tabla: periodos_academicos
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS periodos_academicos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) UNIQUE NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activo BOOLEAN DEFAULT FALSE
);

-- -----------------------------------------------------
-- Tabla: matriculas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS matriculas (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes(id) ON DELETE CASCADE,
    asignatura_id INTEGER NOT NULL REFERENCES asignaturas(id) ON DELETE CASCADE,
    periodo_id INTEGER NOT NULL REFERENCES periodos_academicos(id),
    tutor_id INTEGER REFERENCES tutores(id) ON DELETE SET NULL,
    paralelo VARCHAR(5),
    UNIQUE (estudiante_id, asignatura_id, periodo_id, tutor_id)
);

-- -----------------------------------------------------
-- Tabla: notas
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS notas (
    id SERIAL PRIMARY KEY,
    matricula_id INTEGER UNIQUE NOT NULL REFERENCES matriculas(id) ON DELETE CASCADE,
    parcial1 NUMERIC(4, 2),
    parcial2 NUMERIC(4, 2),
    final NUMERIC(4, 2),
    suspension NUMERIC(4, 2),
    situacion VARCHAR(50),
    CHECK (parcial1 >= 0 AND parcial1 <= 10),
    CHECK (parcial2 >= 0 AND parcial2 <= 10),
    CHECK (final >= 0 AND final <= 10)
);

-- -----------------------------------------------------
-- Tabla: tutorias
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS tutorias (
    id SERIAL PRIMARY KEY,
    matricula_id INTEGER REFERENCES matriculas(id) ON DELETE SET NULL,
    tutor_id INTEGER NOT NULL REFERENCES tutores(id) ON DELETE CASCADE,
    
    fecha TIMESTAMP NOT NULL,
    
    duracion_min INTEGER NOT NULL CHECK (duracion_min > 0),
    tema TEXT,
    modalidad VARCHAR(20) CHECK (modalidad IN ('Presencial', 'Virtual')), -- Simplificado
    estado VARCHAR(20) NOT NULL CHECK (estado IN ('realizada', 'cancelada', 'no_asistio', 'programada', 'solicitada')),
    observaciones_tutor TEXT,
    
    -- --- ✨ INICIO DE LA MODIFICACIÓN ---
    enlace_reunion VARCHAR(255), -- <-- AÑADE ESTA LÍNEA
    -- --- ✨ FIN DE LA MODIFICACIÓN ---
    
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------
-- Tabla: evaluaciones
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS evaluaciones (
    id SERIAL PRIMARY KEY,
    tutoria_id INTEGER UNIQUE NOT NULL REFERENCES tutorias(id) ON DELETE CASCADE,
    estrellas INTEGER NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
    comentario_estudiante TEXT,
    
    -- ✅ CORRECCIÓN: TIMESTAMP sin TZ (era TIMESTAMPTZ)
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tutorias_fecha ON tutorias(fecha);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);
CREATE INDEX IF NOT EXISTS idx_matriculas_estudiante ON matriculas(estudiante_id);

-- COMMENT ON SCHEMA tutorias_unach IS 'Esquema v2.2 para el sistema de tutorías UNACH. Corregido timezone en fechas.';