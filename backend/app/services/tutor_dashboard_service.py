# backend/app/services/tutor_dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List
from app.services.prediction_service import prediction_service

class TutorDashboardService:
    
    def get_tutor_dashboard_data(self, db: Session, usuario_id: int) -> Dict[str, Any]:
        """
        Obtiene dashboard del tutor (Maneja materias sin nota).
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

            # 2. Obtener Cursos
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
                    n.situacion
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
            
            # 3. PROCESAR CADA ESTUDIANTE
            for fila in filas:
                estudiante_dict = dict(fila)
                estudiante_dict['asistencia'] = 100 
                
                try:
                    prediccion = prediction_service.predict_risk(
                        db=db, 
                        estudiante_id=fila['estudiante_id'],
                        matricula_id=fila['matricula_id']
                    )
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