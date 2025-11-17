# backend/app/services/dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List, Optional
from datetime import datetime 

from app.services.prediction_service import prediction_service
from app.services.tutoria_service import tutoria_service
from app.schemas.tutoria import TutoriaCreate

def _crear_tutoria_proactiva(db: Session, matricula: Dict[str, Any], riesgo_nivel: str) -> bool:
    """
    Función interna para crear una tutoría de refuerzo.
    ✅ Retorna True si creó la tutoría, False si no la creó.
    """
    try:
        tema_riesgo = f"Refuerzo por Riesgo {riesgo_nivel.upper()} Detectado"

        # 1. ¿Ya existe una tutoría abierta (solicitada/programada)?
        query_abierta = text("""
            SELECT 1 FROM tutorias_unach.tutorias
            WHERE matricula_id = :matricula_id
            AND estado IN ('solicitada', 'programada')
        """)
        existe_abierta = db.execute(query_abierta, {"matricula_id": matricula["matricula_id"]}).scalar()

        # 2. ¿Ya se completó una tutoría de refuerzo?
        query_completada = text("""
            SELECT 1 FROM tutorias_unach.tutorias
            WHERE matricula_id = :matricula_id
            AND tema = :tema_riesgo
            AND estado = 'realizada'
        """)
        existe_completada = db.execute(query_completada, {
            "matricula_id": matricula["matricula_id"],
            "tema_riesgo": tema_riesgo
        }).scalar()

        if existe_abierta or existe_completada or not matricula.get("tutor_id"):
            return False  # ✅ No se creó
        
        # 3. Crear la tutoría
        tutoria_payload = TutoriaCreate(
            matricula_id=matricula["matricula_id"],
            tutor_id=matricula["tutor_id"],
            fecha=datetime.now(),
            tema=tema_riesgo,
            modalidad="Virtual"
        )
        
        tutoria_service.create_tutoria(
            db=db,
            tutoria=tutoria_payload,
            estudiante_id=matricula["estudiante_id"],
            tema_predeterminado=tema_riesgo,
            modalidad_predeterminada="Virtual"
        )
        print(f"✅ Tutoría proactiva creada para matrícula {matricula['matricula_id']}")
        return True  # ✅ Se creó exitosamente
        
    except Exception as e:
        print(f"❌ Error al crear tutoría proactiva: {e}")
        db.rollback()
        return False  # ✅ Falló la creación


def get_student_kpis(db: Session, estudiante_id: int) -> Dict[str, Any]:
    """
    Obtiene los KPIs y el historial académico para un estudiante.
    """
    query_historial = text("""
        SELECT 
            a.nombre AS asignatura,
            t_u.nombre AS tutor_nombre,
            n.parcial1,
            n.parcial2,
            n.final,
            n.situacion,
            m.id AS matricula_id,
            m.tutor_id,
            m.estudiante_id,
            (COALESCE(n.parcial1, 0) + COALESCE(n.parcial2, 0)) / 2 AS promedio_parciales
        FROM tutorias_unach.matriculas m
        JOIN tutorias_unach.asignaturas a ON m.asignatura_id = a.id
        LEFT JOIN tutorias_unach.notas n ON m.id = n.matricula_id
        LEFT JOIN tutorias_unach.tutores t ON m.tutor_id = t.id
        LEFT JOIN tutorias_unach.usuarios t_u ON t.usuario_id = t_u.id
        WHERE m.estudiante_id = :estudiante_id
        ORDER BY m.periodo_id DESC, a.nombre;
    """)
    
    historial_result = db.execute(query_historial, {"estudiante_id": estudiante_id}).mappings().all()
    
    historial_detallado = []
    suma_finales, total_finales = 0, 0
    
    # ✅ SOLUCIÓN: Flag para controlar que solo se cree UNA tutoría
    tutoria_creada_en_esta_ejecucion = False
    
    for materia in historial_result:
        materia_dict = dict(materia)
        
        if materia_dict.get('situacion') not in ['APROBADO', 'REPROBADO']:
            risk_data = prediction_service.predict_risk(
                db=db, 
                estudiante_id=materia_dict['estudiante_id'], 
                matricula_id=materia_dict['matricula_id']
            )
            materia_dict.update(risk_data)
            
            riesgo_detectado = risk_data.get('riesgo_nivel')
            
            # ✅ SOLUCIÓN: Solo crear si NO se ha creado una en este request
            if riesgo_detectado in ['ALTO', 'MEDIO'] and not tutoria_creada_en_esta_ejecucion:
                resultado = _crear_tutoria_proactiva(db, materia_dict, riesgo_detectado)
                if resultado:  # Si se creó la tutoría
                    tutoria_creada_en_esta_ejecucion = True
        else:
            if materia_dict.get('situacion') == 'REPROBADO':
                materia_dict['riesgo_nivel'] = 'Riesgo Alto (Finalizado)'
                materia_dict['riesgo_color'] = 'red'
            else: 
                materia_dict['riesgo_nivel'] = 'Riesgo Bajo (Finalizado)'
                materia_dict['riesgo_color'] = 'green'
            materia_dict['probabilidad_riesgo'] = None
        
        materia_dict['tutor_nombre'] = materia_dict.get('tutor_nombre') or 'No Asignado'
        historial_detallado.append(materia_dict)
        
        if materia_dict.get('final') is not None:
            suma_finales += materia_dict['final']
            total_finales += 1
            
    promedio_general = (suma_finales / total_finales) if total_finales > 0 else 0.0
    
    return {
        "kpis": {
            "promedio_general": round(promedio_general, 2),
            "total_materias": len(historial_detallado)
        },
        "historial_academico": historial_detallado
    }