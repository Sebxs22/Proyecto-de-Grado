# backend/app/services/tutor_dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List
from app.services.prediction_service import prediction_service

class TutorDashboardService:
    
    def get_tutor_dashboard_data(self, db: Session, usuario_id: int) -> Dict[str, Any]:
        """
        Obtiene dashboard del tutor OPTIMIZADO (Sin consultas N+1).
        """
        try:
            # 1. Identificar al Tutor
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

            # 2. Obtener Cursos y Estudiantes (CONSULTA OPTIMIZADA)
            # Traemos TODA la info necesaria de una sola vez, incluyendo el conteo de tutorías.
            cursos_query = text("""
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
                    (
                        SELECT COUNT(*) 
                        FROM tutorias_unach.tutorias t_count 
                        WHERE t_count.matricula_id = m.id 
                        AND t_count.estado = 'realizada'
                    ) as num_tutorias
                FROM tutorias_unach.matriculas m
                JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
                JOIN tutorias_unach.periodos_academicos pa ON m.periodo_id = pa.id
                JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
                JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
                LEFT JOIN tutorias_unach.notas n ON m.id = n.matricula_id
                WHERE m.tutor_id = :tid
                ORDER BY a.nombre, u.nombre
            """)
            
            filas = db.execute(cursos_query, {"tid": tutor_id}).mappings().all()
            
            cursos_procesados = []
            
            # 3. PROCESAR CADA ESTUDIANTE (¡Ahora es ultrarrápido!)
            for fila in filas:
                estudiante_dict = dict(fila)
                estudiante_dict['asistencia'] = 100 
                estudiante_dict['tutorias_acumuladas'] = fila['num_tutorias']
                
                # --- AQUÍ ESTÁ LA OPTIMIZACIÓN ---
                # Preparamos los datos en un diccionario local
                # Evitamos llamar a la base de datos por cada alumno
                feats_for_ia = {
                    "p1": float(fila['parcial1']) if fila['parcial1'] is not None else None,
                    "p2": float(fila['parcial2']) if fila['parcial2'] is not None else None,
                    "final": float(fila['final']) if fila['final'] is not None else None,
                    "situacion": fila['situacion'],
                    "tutorias": int(fila['num_tutorias'])
                }

                try:
                    # Llamamos al método LOCAL de la IA (memoria RAM pura)
                    prediccion = prediction_service.calculate_risk_local(feats_for_ia)
                    estudiante_dict.update(prediccion)
                except Exception as e:
                    estudiante_dict.update({
                        "riesgo_nivel": "BAJO", 
                        "probabilidad_riesgo": 0,
                        "riesgo_color": "green",
                        "mensaje_explicativo": "Análisis no disponible"
                    })
                
                cursos_procesados.append(estudiante_dict)

            # 4. Tutorías Pendientes
            pendientes_query = text("""
                SELECT t.id, u.nombre as estudiante, t.fecha as fecha_solicitada, t.tema
                FROM tutorias_unach.tutorias t
                JOIN tutorias_unach.matriculas m ON t.matricula_id = m.id
                JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
                JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
                WHERE m.tutor_id = :tid AND t.estado = 'solicitada'
            """)
            pendientes = db.execute(pendientes_query, {"tid": tutor_id}).mappings().all()

            # 5. Promedio Calificación
            rating_query = text("""
                SELECT AVG(ev.estrellas) 
                FROM tutorias_unach.evaluaciones ev
                JOIN tutorias_unach.tutorias t ON ev.tutoria_id = t.id
                JOIN tutorias_unach.matriculas m ON t.matricula_id = m.id
                WHERE m.tutor_id = :tid
            """)
            avg_rating = db.execute(rating_query, {"tid": tutor_id}).scalar() or 5.0

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