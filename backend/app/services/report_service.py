# backend/app/services/report_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any
# Importamos modelos para las validaciones
from app.models.estudiante import Estudiante
from app.models.user import Usuario

class ReportService:
    
    def get_coordinator_report(self, db: Session) -> List[Dict[str, Any]]:
        """
        Genera un reporte detallado para el coordinador.
        """
        query = text("""
            SELECT
                pa.nombre AS periodo,
                e.carrera AS carrera,
                COALESCE(t_u.nombre, 'Sin Asignar') AS tutor_nombre,
                a.nombre AS asignatura,
                COUNT(DISTINCT m.estudiante_id) AS total_estudiantes,
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
            JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
            LEFT JOIN tutorias_unach.tutores tut ON m.tutor_id = tut.id
            LEFT JOIN tutorias_unach.usuarios t_u ON tut.usuario_id = t_u.id
            LEFT JOIN tutorias_unach.tutorias t ON m.id = t.matricula_id
            LEFT JOIN tutorias_unach.evaluaciones ev ON t.id = ev.tutoria_id
            GROUP BY pa.nombre, e.carrera, t_u.nombre, a.nombre
            ORDER BY pa.nombre DESC, e.carrera, t_u.nombre, a.nombre;
        """)
        
        result = db.execute(query).mappings().all()
        
        report_data = []
        for row in result:
            row_dict = dict(row)
            row_dict['satisfaccion_promedio'] = round(float(row_dict['satisfaccion_promedio'] or 0), 2)
            report_data.append(row_dict)
            
        return report_data

    # ✅ NUEVO MÉTODO: Calidad de Datos (ISO/IEC 25012)
    def get_data_quality_metrics(self, db: Session) -> Dict[str, Any]:
        """
        Calcula métricas de Completitud y Precisión.
        """
        # 1. Completitud: Estudiantes sin datos clave (carrera)
        total_estudiantes = db.query(Estudiante).count()
        if total_estudiantes == 0:
            completitud_pct = 100
        else:
            incompletos = db.query(Estudiante).filter(Estudiante.carrera == None).count()
            completitud_pct = ((total_estudiantes - incompletos) / total_estudiantes) * 100

        # 2. Precisión: Usuarios con email institucional válido
        total_usuarios = db.query(Usuario).count()
        if total_usuarios == 0:
            precision_pct = 100
        else:
            invalidos = db.query(Usuario).filter(~Usuario.correo.like("%@unach.edu.ec")).count()
            precision_pct = ((total_usuarios - invalidos) / total_usuarios) * 100

        indice_global = round((completitud_pct + precision_pct) / 2, 2)

        return {
            "indice_global": indice_global,
            "metricas": {
                "completitud": round(completitud_pct, 2),
                "precision": round(precision_pct, 2),
                "registros_auditados": total_estudiantes + total_usuarios
            },
            "estado": "ÓPTIMO" if indice_global > 90 else "MEJORABLE"
        }

# Instancia única del servicio
report_service = ReportService()