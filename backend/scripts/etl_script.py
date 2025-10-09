# backend/scripts/etl_script.py

import pandas as pd
import sqlalchemy
import logging
import os
from app.core.security import get_password_hash

# --- 1. CONFIGURACIÓN ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
DATABASE_URL = os.getenv("DATABASE_URL")
engine = sqlalchemy.create_engine(DATABASE_URL)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CALIFICACIONES_PATH = os.path.join(BASE_DIR, "data", "UNACH-ITICFI-2025-0388-M(Calificaciones).csv")
DETALLE_TUTORIAS_PATH = os.path.join(BASE_DIR, "data", "UNACH-ITICFI-2025-0388-M(DetalleTutorías).csv")

def clean_and_read_csv(path):
    """Lee un CSV, limpia los nombres de las columnas y maneja la codificación."""
    df = pd.read_csv(path, sep=';', encoding='latin1')
    # Limpia el BOM y espacios
    df.columns = df.columns.str.strip().str.replace('ï»¿', '')
    return df

def main():
    """Función principal que orquesta el proceso ETL."""
    logging.info("--- INICIANDO PROCESO ETL FINAL Y DEFINITIVO ---")
    
    try:
        # --- 1. EXTRACCIÓN Y LIMPIEZA ---
        df_calificaciones = clean_and_read_csv(CALIFICACIONES_PATH)
        df_detalle_tutorias = clean_and_read_csv(DETALLE_TUTORIAS_PATH)
        
        # Limpieza de nombres en los datos
        key_cols = ['Docente', 'Asignatura', 'Periodo', 'IdEstudiante']
        for col in key_cols:
            if col in df_calificaciones.columns:
                df_calificaciones[col] = df_calificaciones[col].astype(str).str.strip()
            if col in df_detalle_tutorias.columns:
                df_detalle_tutorias[col] = df_detalle_tutorias[col].astype(str).str.strip()

        logging.info("Limpiando la base de datos...")
        with engine.connect() as con:
            trans = con.begin()
            con.execute(sqlalchemy.text("TRUNCATE tutorias_unach.usuarios RESTART IDENTITY CASCADE"))
            con.execute(sqlalchemy.text("TRUNCATE tutorias_unach.asignaturas RESTART IDENTITY CASCADE"))
            con.execute(sqlalchemy.text("TRUNCATE tutorias_unach.periodos_academicos RESTART IDENTITY CASCADE"))
            trans.commit()

        # --- 2. CARGA DE CATÁLOGOS Y USUARIOS ---
        logging.info("Cargando Catálogos y Usuarios...")
        password_hash = get_password_hash('unach2025')
        
        periodos = pd.DataFrame(df_calificaciones['Periodo'].unique(), columns=['nombre'])
        periodos['fecha_inicio'], periodos['fecha_fin'] = pd.to_datetime('2024-01-01').date(), pd.to_datetime('2024-12-31').date()
        periodos.to_sql('periodos_academicos', engine, schema='tutorias_unach', if_exists='append', index=False)
        
        asignaturas = df_calificaciones[['Asignatura']].drop_duplicates().rename(columns={'Asignatura': 'nombre'})
        asignaturas['codigo'] = asignaturas['nombre'].str.upper().str.replace(r'\s+', '_', regex=True).str.slice(0, 19)
        asignaturas.drop_duplicates(subset=['codigo'], keep='first', inplace=True)
        asignaturas.to_sql('asignaturas', engine, schema='tutorias_unach', if_exists='append', index=False)
        
        docentes = df_calificaciones[['Docente']].dropna().drop_duplicates().rename(columns={'Docente': 'nombre'})
        docentes['correo'] = docentes['nombre'].str.lower().str.replace(r'\s+', '.', regex=True) + '@unach.edu.ec'
        docentes['rol'] = 'tutor'
        docentes['hashed_password'] = password_hash
        docentes[['nombre', 'correo', 'hashed_password', 'rol']].to_sql('usuarios', engine, schema='tutorias_unach', if_exists='append', index=False)
        
        estudiantes = df_calificaciones[['IdEstudiante']].dropna().drop_duplicates()
        estudiantes['nombre'] = 'Estudiante ' + estudiantes['IdEstudiante'].astype(str)
        estudiantes['correo'] = estudiantes['IdEstudiante'].astype(str) + '@unach.edu.ec'
        estudiantes['rol'] = 'estudiante'
        estudiantes['hashed_password'] = password_hash
        estudiantes[['nombre', 'correo', 'hashed_password', 'rol']].to_sql('usuarios', engine, schema='tutorias_unach', if_exists='append', index=False)
        
        df_usuarios_db = pd.read_sql("SELECT id, correo FROM tutorias_unach.usuarios", engine)
        df_tutores = pd.merge(docentes, df_usuarios_db, on='correo').rename(columns={'id': 'usuario_id'})
        df_tutores[['usuario_id']].to_sql('tutores', engine, schema='tutorias_unach', if_exists='append', index=False)
        
        df_estudiantes = pd.merge(estudiantes, df_usuarios_db, on='correo').rename(columns={'id': 'usuario_id', 'IdEstudiante': 'codigo_estudiante'})
        df_est_perfil = pd.merge(df_estudiantes, df_calificaciones[['IdEstudiante', 'Carrera']].drop_duplicates(subset=['IdEstudiante']), left_on='codigo_estudiante', right_on='IdEstudiante')
        df_est_perfil[['usuario_id', 'codigo_estudiante', 'Carrera']].rename(columns={'Carrera': 'carrera'}).to_sql('estudiantes', engine, schema='tutorias_unach', if_exists='append', index=False)
        logging.info("-> Catálogos y Usuarios cargados.")

        # --- 3. CARGA DE TRANSACCIONALES (LÓGICA FINAL Y CORREGIDA) ---
        logging.info("Cargando Matrículas, Notas y Tutorías...")
        
        # Obtenemos los IDs de la BD
        df_est_db = pd.read_sql("SELECT id as estudiante_id, codigo_estudiante FROM tutorias_unach.estudiantes", engine)
        df_asig_db = pd.read_sql("SELECT id as asignatura_id, nombre FROM tutorias_unach.asignaturas", engine)
        df_per_db = pd.read_sql("SELECT id as periodo_id, nombre FROM tutorias_unach.periodos_academicos", engine)
        # Traemos el nombre del tutor como 'docente' y lo renombramos a 'Docente'
        df_tut_db = pd.read_sql("SELECT t.id as tutor_id, u.nombre AS docente FROM tutorias_unach.tutores t JOIN tutorias_unach.usuarios u ON t.usuario_id = u.id", engine)
        df_tut_db.rename(columns={'docente': 'Docente'}, inplace=True)
        
        # Base: Calificaciones + IDs
        df_calificaciones['IdEstudiante'] = df_calificaciones['IdEstudiante'].astype(str)
        df_est_db['codigo_estudiante'] = df_est_db['codigo_estudiante'].astype(str)
        
        df_base = pd.merge(df_calificaciones, df_est_db, left_on='IdEstudiante', right_on='codigo_estudiante')
        df_base = pd.merge(df_base, df_asig_db, left_on='Asignatura', right_on='nombre')
        df_base = pd.merge(df_base, df_per_db, left_on='Periodo', right_on='nombre')
        df_base = pd.merge(df_base, df_tut_db, on='Docente', how='left')
        
        # Cargamos las matrículas con el tutor asignado
        matriculas = df_base[['estudiante_id', 'asignatura_id', 'periodo_id', 'tutor_id']].drop_duplicates()
        logging.info(f"Total de matrículas a cargar: {len(matriculas)}")
        
        # Verificar duplicados antes de insertar
        duplicados = matriculas[matriculas.duplicated(subset=['estudiante_id', 'asignatura_id', 'periodo_id', 'tutor_id'], keep=False)]
        if len(duplicados) > 0:
            logging.warning(f"Se encontraron {len(duplicados)} filas duplicadas que serán eliminadas")
            matriculas = matriculas.drop_duplicates(subset=['estudiante_id', 'asignatura_id', 'periodo_id', 'tutor_id'])
            logging.info(f"Matrículas después de eliminar duplicados: {len(matriculas)}")
        
        matriculas.to_sql('matriculas', engine, schema='tutorias_unach', if_exists='append', index=False)
        logging.info(f"-> Cargadas {len(matriculas)} matrículas únicas con tutores asignados.")

        # Traemos la tabla de matrículas con el ID generado de la BD
        df_mat_db = pd.read_sql("SELECT id as matricula_id, estudiante_id, asignatura_id, periodo_id, tutor_id FROM tutorias_unach.matriculas", engine)
        df_base_con_matricula = pd.merge(df_base, df_mat_db, on=['estudiante_id', 'asignatura_id', 'periodo_id', 'tutor_id'], how='left')
        
        # Verificar que todas las filas tienen matricula_id
        sin_matricula = df_base_con_matricula[df_base_con_matricula['matricula_id'].isna()]
        if len(sin_matricula) > 0:
            logging.error(f"¡ALERTA! {len(sin_matricula)} registros no pudieron asociarse a una matrícula")
            logging.error(f"Ejemplo de registros sin matrícula: {sin_matricula[['IdEstudiante', 'Asignatura', 'Periodo', 'Docente']].head()}")
        else:
            logging.info(f"✓ Todos los registros tienen matrícula_id asignado")
        
        # Cargamos las notas
        cols_notas = ['PrimerParcial', 'SegundoParcial', 'NotaFinal', 'Suspensión']
        for col in cols_notas: df_base_con_matricula[col] = pd.to_numeric(df_base_con_matricula[col].astype(str).str.replace(',', '.'), errors='coerce')
        
        notas_final = df_base_con_matricula[['matricula_id'] + cols_notas + ['Situación']].rename(columns={'PrimerParcial': 'parcial1', 'SegundoParcial': 'parcial2', 'NotaFinal': 'final', 'Suspensión': 'suspension', 'Situación': 'situacion'}).drop_duplicates(subset=['matricula_id'])
        notas_final.to_sql('notas', engine, schema='tutorias_unach', if_exists='append', index=False)
        logging.info(f"-> Cargados {len(notas_final)} registros de notas.")
        
        # --- CARGA DE TUTORÍAS Y EVALUACIONES (EL PASO CRÍTICO CORREGIDO) ---
        
        # 1. Fusionamos el detalle de tutorías con el ID de la Matrícula
        df_detalle_tutorias['IdEstudiante'] = df_detalle_tutorias['IdEstudiante'].astype(str)
        
        # Log de depuración
        logging.info(f"Columnas en df_detalle_tutorias: {df_detalle_tutorias.columns.tolist()}")
        logging.info(f"Número de registros en df_detalle_tutorias: {len(df_detalle_tutorias)}")
        
        # Creamos una clave única para el cruce de detalles (Estudiante, Asignatura, Periodo)
        df_calif_keys = df_base_con_matricula[['IdEstudiante', 'Asignatura', 'Periodo', 'matricula_id', 'Docente']].drop_duplicates()
        logging.info(f"Columnas en df_calif_keys: {df_calif_keys.columns.tolist()}")
        logging.info(f"Número de registros en df_calif_keys: {len(df_calif_keys)}")
        
        # Unimos los detalles de la tutoría con la matrícula_id y el nombre del docente que la generó
        df_tutorias_full = pd.merge(
            df_detalle_tutorias, 
            df_calif_keys, 
            on=['IdEstudiante', 'Asignatura', 'Periodo', 'Docente'],
            how='inner',
            suffixes=('', '_calif')
        )
        
        logging.info(f"Columnas en df_tutorias_full después del merge: {df_tutorias_full.columns.tolist()}")
        logging.info(f"Número de registros en df_tutorias_full: {len(df_tutorias_full)}")
        
        # Verificar que la columna Docente existe antes del siguiente merge
        if 'Docente' not in df_tutorias_full.columns:
            logging.error(f"La columna 'Docente' no está presente en df_tutorias_full")
            raise ValueError("La columna 'Docente' no está presente en df_tutorias_full")
        
        # 2. Añadimos el ID del tutor
        logging.info(f"Columnas en df_tut_db: {df_tut_db.columns.tolist()}")
        logging.info(f"Número de registros en df_tut_db: {len(df_tut_db)}")
        
        df_tutorias_final = pd.merge(
            df_tutorias_full, 
            df_tut_db, 
            on='Docente',
            how='inner',
            suffixes=('', '_tut')
        )
        
        logging.info(f"Número de registros en df_tutorias_final: {len(df_tutorias_final)}")
        
        # 3. Transformaciones finales y Carga
        # El horario viene como rango "11:00 - 12:00", extraemos solo la hora de inicio
        df_tutorias_final['hora_inicio'] = df_tutorias_final['Horario'].str.split(' - ').str[0].str.strip()
        
        # Combinar fecha y hora
        df_tutorias_final['fecha_hora_str'] = df_tutorias_final['Fecha'].astype(str) + ' ' + df_tutorias_final['hora_inicio'].astype(str)
        
        # Intentar formato día/mes/año primero
        df_tutorias_final['fecha'] = pd.to_datetime(
            df_tutorias_final['fecha_hora_str'], 
            format='%d/%m/%Y %H:%M', 
            errors='coerce'
        )
        
        # Contar fechas válidas/inválidas
        fechas_validas = df_tutorias_final['fecha'].notna().sum()
        fechas_invalidas = df_tutorias_final['fecha'].isna().sum()
        logging.info(f"Fechas válidas con formato d/m/Y: {fechas_validas}, Fechas inválidas: {fechas_invalidas}")
        
        # Si hay muchas fechas inválidas, probar formato mes/día/año
        if fechas_invalidas > len(df_tutorias_final) * 0.5:
            logging.warning("Más del 50% de fechas inválidas, intentando formato m/d/Y...")
            mask_invalidas = df_tutorias_final['fecha'].isna()
            df_tutorias_final.loc[mask_invalidas, 'fecha'] = pd.to_datetime(
                df_tutorias_final.loc[mask_invalidas, 'fecha_hora_str'],
                format='%m/%d/%Y %H:%M',
                errors='coerce'
            )
            fechas_validas = df_tutorias_final['fecha'].notna().sum()
            fechas_invalidas = df_tutorias_final['fecha'].isna().sum()
            logging.info(f"Fechas válidas después de formato alternativo: {fechas_validas}, Fechas inválidas: {fechas_invalidas}")
        
        # Mostrar ejemplos de fechas problemáticas si las hay
        if fechas_invalidas > 0:
            logging.warning(f"Ejemplos de fechas problemáticas:")
            ejemplos = df_tutorias_final[df_tutorias_final['fecha'].isna()][['Fecha', 'Horario', 'hora_inicio', 'fecha_hora_str']].head(5)
            for idx, row in ejemplos.iterrows():
                logging.warning(f"  Fecha: {row['Fecha']}, Horario: {row['Horario']}, Hora inicio: {row['hora_inicio']}, Combined: {row['fecha_hora_str']}")
        
        # Eliminar registros sin fecha válida
        df_tutorias_final.dropna(subset=['fecha'], inplace=True)
        
        if len(df_tutorias_final) == 0:
            logging.error("No hay tutorías con fechas válidas para cargar")
        else:
            df_tutorias_final['estado'] = df_tutorias_final['Recibida'].apply(lambda x: 'realizada' if str(x).upper() == 'SI' else 'no_asistio')
            
            tutorias_a_cargar = df_tutorias_final[['matricula_id', 'tutor_id', 'fecha', 'Modalidad', 'estado']].rename(columns={'Modalidad': 'modalidad'})
            tutorias_a_cargar['duracion_min'] = 60
            tutorias_a_cargar.to_sql('tutorias', engine, schema='tutorias_unach', if_exists='append', index=False, dtype={'fecha': sqlalchemy.types.DateTime(timezone=True)})
            logging.info(f"-> Cargadas {len(tutorias_a_cargar)} tutorías.")

            # Carga de Evaluaciones
            df_tutorias_db = pd.read_sql("SELECT id as tutoria_id, matricula_id, tutor_id FROM tutorias_unach.tutorias", engine)
            df_eval = pd.merge(df_tutorias_final, df_tutorias_db, on='matricula_id')
            
            # Encontrar el nombre correcto de la columna de satisfacción
            col_satisfaccion = None
            for col in df_eval.columns:
                if 'satisfac' in col.lower():
                    col_satisfaccion = col
                    break
            
            if col_satisfaccion is None:
                logging.warning("No se encontró la columna de nivel de satisfacción")
                logging.warning(f"Columnas disponibles: {df_eval.columns.tolist()}")
            else:
                logging.info(f"Usando columna de satisfacción: {col_satisfaccion}")
                df_eval = df_eval[df_eval[col_satisfaccion].notna()]
                eval_a_cargar = df_eval[['tutoria_id', col_satisfaccion]].rename(columns={col_satisfaccion: 'estrellas'})
                eval_a_cargar['estrellas'] = pd.to_numeric(eval_a_cargar['estrellas'], errors='coerce').fillna(0).astype(int)
                eval_a_cargar = eval_a_cargar[eval_a_cargar['estrellas'] > 0]  # Filtrar evaluaciones válidas
                eval_a_cargar.drop_duplicates(subset=['tutoria_id'], inplace=True)
                eval_a_cargar.to_sql('evaluaciones', engine, schema='tutorias_unach', if_exists='append', index=False)
                logging.info(f"-> Cargadas {len(eval_a_cargar)} evaluaciones.")
        
        logging.info("--- PROCESO ETL FINALIZADO CON ÉXITO ---")

    except Exception as e:
        logging.error(f"Ocurrió un error inesperado durante el ETL: {e}", exc_info=True)

if __name__ == "__main__":
    main()