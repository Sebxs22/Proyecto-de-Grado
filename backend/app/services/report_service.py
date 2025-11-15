# backend/app/services/report_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any

class ReportService:
    
    def get_coordinator_report(self, db: Session) -> List[Dict[str, Any]]:
        """
        Genera un reporte detallado para el coordinador, agrupando por
        periodo, tutor, asignatura Y AHORA POR CARRERA.
        """
        
        query = text("""
            SELECT
                pa.nombre AS periodo,
                -- ✅ 1. CAMBIADO: Usamos la carrera del estudiante
                e.carrera AS carrera,
                COALESCE(t_u.nombre, 'Sin Asignar') AS tutor_nombre,
                a.nombre AS asignatura,
                COUNT(DISTINCT m.estudiante_id) AS total_estudiantes,
                
                -- KPIs (el resto de la consulta no cambia)
                SUM(CASE WHEN n.situacion = 'APROBADO' THEN 1 ELSE 0 END) AS total_aprobados,
                SUM(CASE WHEN n.situacion = 'REPROBADO' THEN 1 ELSE 0 END) AS total_reprobados,
                COUNT(DISTINCT t.id) AS total_tutorias_registradas,
                SUM(CASE WHEN t.estado = 'realizada' THEN 1 ELSE 0 END) AS tutorias_realizadas,
                SUM(CASE WHEN t.estado = 'cancelada' THEN 1 ELSE 0 END) AS tutorias_canceladas,
                SUM(CASE WHEN t.estado = 'no_asistio' THEN 1 ELSE 0 END) AS tutorias_no_asistidas,
                AVG(ev.estrellas) AS satisfaccion_promedio
            
            FROM tutorias_unach.matriculas m
            JOIN tutorias_unach.periodos_academicos pa ON m.periodo_id = pa.id
            JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
            LEFT JOIN tutorias_unach.notas n ON m.id = n.matricula_id
            
            -- ✅ 2. AÑADIDO: Join a estudiantes para obtener la carrera
            JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
            
            -- Joins para el Tutor
            LEFT JOIN tutorias_unach.tutores tut ON m.tutor_id = tut.id
            LEFT JOIN tutorias_unach.usuarios t_u ON tut.usuario_id = t_u.id
            
            LEFT JOIN tutorias_unach.tutorias t ON m.id = t.matricula_id
            LEFT JOIN tutorias_unach.evaluaciones ev ON t.id = ev.tutoria_id
            
            -- ✅ 3. CAMBIADO: Agrupamos por e.carrera
            GROUP BY pa.nombre, e.carrera, t_u.nombre, a.nombre
            
            -- Ordenamos
            ORDER BY pa.nombre DESC, e.carrera, t_u.nombre, a.nombre;
        """)
        
        result = db.execute(query).mappings().all()
        
        report_data = []
        for row in result:
            row_dict = dict(row)
            row_dict['satisfaccion_promedio'] = round(float(row_dict['satisfaccion_promedio'] or 0), 2)
            report_data.append(row_dict)
            
        return report_data

# Instancia única del servicio
report_service = ReportService()