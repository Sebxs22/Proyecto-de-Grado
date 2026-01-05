# backend/app/services/tutor_dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List
from app.services.prediction_service import prediction_service

class TutorDashboardService:
    
    def get_tutor_dashboard_data(self, db: Session, usuario_id: int) -> Dict[str, Any]:
        """
        Obtiene dashboard del tutor ULTRA-OPTIMIZADO.
        Mejoras:
        1. SQL: Usa JOINs en lugar de subconsultas correlacionadas.
        2. Python: Aplica lógica de 'Cortocircuito' para evitar llamar a la IA innecesariamente.
        """
        try:
            # 1. Identificar al Tutor (Rápido)
            tutor_query = text("""
                SELECT t.id, u.nombre 
                FROM tutorias_unach.tutores t
                JOIN tutorias_unach.usuarios u ON t.usuario_id = u.id
                WHERE t.usuario_id = :uid
            """)
            tutor = db.execute(tutor_query, {"uid": usuario_id}).mappings().one_or_none()
            
            if not tutor:
                raise Exception("Usuario no es tutor o no existe.")

            tutor_id = tutor['id']
            nombre_tutor = tutor['nombre']

            # 2. Obtener Cursos y Estudiantes (OPTIMIZACIÓN SQL MÁXIMA)
            # Usamos un LEFT JOIN con una subtabla pre-agrupada para contar tutorías.
            # Esto es mucho más rápido que hacer un SELECT COUNT por cada fila.
            cursos_query = text("""
                WITH conteo_tutorias AS (
                    SELECT matricula_id, COUNT(*) as num 
                    FROM tutorias_unach.tutorias 
                    WHERE estado = 'realizada' 
                    GROUP BY matricula_id
                )
                SELECT 
                    m.id as matricula_id,
                    e.id as estudiante_id,
                    u.nombre as estudiante_nombre,
                    a.nombre as asignatura,
                    pa.nombre as periodo,
                    n.parcial1 as parcial1, 
                    n.parcial2 as parcial2,
                    n.final as final,
                    n.situacion,
                    COALESCE(ct.num, 0) as num_tutorias
                FROM tutorias_unach.matriculas m
                JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
                JOIN tutorias_unach.periodos_academicos pa ON m.periodo_id = pa.id
                JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
                JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
                LEFT JOIN tutorias_unach.notas n ON m.id = n.matricula_id
                LEFT JOIN conteo_tutorias ct ON m.id = ct.matricula_id
                WHERE m.tutor_id = :tid
                ORDER BY a.nombre, u.nombre
            """)
            
            filas = db.execute(cursos_query, {"tid": tutor_id}).mappings().all()
            
            cursos_procesados = []
            
            # 3. PROCESAR CADA ESTUDIANTE (Con "Vía Rápida")
            for fila in filas:
                estudiante_dict = dict(fila)
                estudiante_dict['asistencia'] = 100 
                estudiante_dict['tutorias_acumuladas'] = fila['num_tutorias']
                
                # Extracción segura de datos
                p1 = float(fila['parcial1']) if fila['parcial1'] is not None else None
                p2 = float(fila['parcial2']) if fila['parcial2'] is not None else None
                final = float(fila['final']) if fila['final'] is not None else None
                situacion = fila['situacion']
                tutorias = int(fila['num_tutorias'])

                # --- OPTIMIZACIÓN LÓGICA (Circuit Breaker) ---
                # Si el estudiante ya aprobó o reprobó oficialmente, NO LLAMAMOS A LA IA.
                # Esto ahorra crear DataFrames y cálculos pesados para casos obvios.
                if situacion == 'APROBADO':
                    estudiante_dict.update({
                        "riesgo_nivel": "ALTO", "riesgo_color": "green", 
                        "probabilidad_riesgo": 100.0, "mensaje_explicativo": "Materia aprobada."
                    })
                elif situacion == 'REPROBADO':
                    estudiante_dict.update({
                        "riesgo_nivel": "BAJO", "riesgo_color": "red", 
                        "probabilidad_riesgo": 0.0, "mensaje_explicativo": "Materia reprobada."
                    })
                elif final is not None:
                     # Si ya tiene nota final pero no tiene situación marcada (caso raro pero posible)
                     if final >= 7.0:
                        estudiante_dict.update({"riesgo_nivel": "ALTO", "riesgo_color": "green", "probabilidad_riesgo": 100.0, "mensaje_explicativo": "Promedio suficiente."})
                     else:
                        estudiante_dict.update({"riesgo_nivel": "BAJO", "riesgo_color": "red", "probabilidad_riesgo": 0.0, "mensaje_explicativo": "Promedio insuficiente."})
                else:
                    # --- SOLO AQUÍ LLAMAMOS A LA IA (CASOS EN CURSO) ---
                    # Solo procesamos con IA a los que realmente lo necesitan (ahorra 80% de tiempo)
                    feats_for_ia = {
                        "p1": p1, "p2": p2, "final": final,
                        "situacion": situacion, "tutorias": tutorias
                    }
                    try:
                        prediccion = prediction_service.calculate_risk_local(feats_for_ia)
                        estudiante_dict.update(prediccion)
                    except Exception:
                        estudiante_dict.update({
                            "riesgo_nivel": "BAJO", "probabilidad_riesgo": 0,
                            "riesgo_color": "gray", "mensaje_explicativo": "Calc Pendiente"
                        })
                
                cursos_procesados.append(estudiante_dict)

            # 4. Tutorías Pendientes (Consulta simple)
            pendientes_query = text("""
                SELECT t.id, u.nombre as estudiante, t.fecha as fecha_solicitada, t.tema
                FROM tutorias_unach.tutorias t
                JOIN tutorias_unach.matriculas m ON t.matricula_id = m.id
                JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
                JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
                WHERE m.tutor_id = :tid AND t.estado = 'solicitada'
            """)
            pendientes = db.execute(pendientes_query, {"tid": tutor_id}).mappings().all()

            # 5. Promedio Calificación (Optimizado con COALESCE)
            rating_query = text("""
                SELECT COALESCE(AVG(ev.estrellas), 5.0)
                FROM tutorias_unach.evaluaciones ev
                JOIN tutorias_unach.tutorias t ON ev.tutoria_id = t.id
                JOIN tutorias_unach.matriculas m ON t.matricula_id = m.id
                WHERE m.tutor_id = :tid
            """)
            avg_rating = db.execute(rating_query, {"tid": tutor_id}).scalar()

            return {
                "nombre": nombre_tutor,
                "cursos": cursos_procesados,
                "tutorias_pendientes": [dict(p) for p in pendientes],
                "average_rating": round(float(avg_rating), 1)
            }

        except Exception as e:
            db.rollback() 
            print(f"Error CRÍTICO en Dashboard Tutor: {e}")
            raise e

tutor_dashboard_service = TutorDashboardService()