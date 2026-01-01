# backend/app/services/dashboard_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List, Optional
from datetime import datetime 

from app.services.prediction_service import prediction_service
from app.services.tutoria_service import tutoria_service
from app.schemas.tutoria import TutoriaCreate

def _crear_tutoria_proactiva(db: Session, matricula: Dict[str, Any], nivel_probabilidad: str) -> bool:
    """
    Función interna para crear una tutoría de refuerzo.
    Incluye bloqueo de base de datos para evitar duplicados por concurrencia.
    """
    try:
        # El tema indica claramente por qué se creó
        tema_riesgo = f"Refuerzo Académico - Nivel {nivel_probabilidad}"

        # -------------------------------------------------------------------------
        # 🔒 BLOQUEO DE SEGURIDAD (SOLUCIÓN A DUPLICADOS)
        # Bloqueamos la fila de la matrícula para que nadie más pueda leer/escribir
        # sobre ella hasta que esta función termine. 
        # Si React manda 2 peticiones, la segunda se quedará "congelada" aquí 
        # esperando a que la primera termine. Cuando entre, ya verá el duplicado.
        # -------------------------------------------------------------------------
        db.execute(
            text("SELECT id FROM tutorias_unach.matriculas WHERE id = :mid FOR UPDATE"), 
            {"mid": matricula["matricula_id"]}
        )

        print(f"🔄 Verificando creación automática para Matrícula {matricula['matricula_id']}...")

        # 1. FILTRO: Verificar si ya existe una tutoría idéntica ACTIVA
        query_existente = text("""
            SELECT 1 FROM tutorias_unach.tutorias
            WHERE matricula_id = :matricula_id
            AND (
                (tema = :tema AND estado != 'cancelada')  -- Ya existe esta alerta específica
                OR 
                (estado IN ('solicitada', 'programada'))  -- Ya tiene una tutoría pendiente (cualquiera)
            )
        """)
        ya_existe = db.execute(query_existente, {
            "matricula_id": matricula["matricula_id"],
            "tema": tema_riesgo
        }).scalar()

        if ya_existe:
            print(f"⚠️ Alerta duplicada o pendiente detectada. No se crea nada.")
            return False

        if not matricula.get("tutor_id"):
            print(f"⚠️ La materia no tiene tutor asignado. No se puede crear.")
            return False
        
        # 2. Crear la tutoría
        fecha_actual = datetime.now().replace(microsecond=0)
        
        tutoria_payload = TutoriaCreate(
            matricula_id=matricula["matricula_id"],
            tutor_id=matricula["tutor_id"],
            fecha=fecha_actual, 
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
        print(f"✅ ¡ÉXITO! Tutoría automática creada y guardada.")
        return True 
        
    except Exception as e:
        print(f"❌ ERROR CRÍTICO al crear tutoría proactiva: {e}")
        db.rollback()
        return False


def get_student_kpis(db: Session, estudiante_id: int) -> Dict[str, Any]:
    """
    Obtiene los KPIs y el historial académico para un estudiante.
    """
    query_historial = text("""
        SELECT 
            pa.nombre AS periodo,
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
        JOIN tutorias_unach.periodos_academicos pa ON m.periodo_id = pa.id
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
    
    # Control local para esta ejecución (por si hay duplicados en el mismo query)
    tutorias_creadas_en_loop = set()
    
    for materia in historial_result:
        materia_dict = dict(materia)
        mid = materia_dict['matricula_id']
        
        # Lógica de Riesgo
        if materia_dict.get('situacion') not in ['APROBADO', 'REPROBADO']:
            risk_data = prediction_service.predict_risk(
                db=db, 
                estudiante_id=materia_dict['estudiante_id'], 
                matricula_id=mid
            )
            materia_dict.update(risk_data)
            
            probabilidad_aprobacion = risk_data.get('riesgo_nivel') 
            
            # Solo si la Probabilidad de éxito es BAJA o MEDIA (Riesgo real)
            if probabilidad_aprobacion in ['BAJO', 'MEDIO']:
                # Evitamos intentar crear 2 veces para la misma matrícula en el mismo loop
                if mid not in tutorias_creadas_en_loop:
                    resultado = _crear_tutoria_proactiva(db, materia_dict, probabilidad_aprobacion)
                    if resultado:
                        tutorias_creadas_en_loop.add(mid)
        else:
            if materia_dict.get('situacion') == 'REPROBADO':
                materia_dict['riesgo_nivel'] = 'BAJO'
                materia_dict['riesgo_color'] = 'red'
                materia_dict['probabilidad_riesgo'] = 0.0
            else: 
                materia_dict['riesgo_nivel'] = 'ALTO'
                materia_dict['riesgo_color'] = 'green'
                materia_dict['probabilidad_riesgo'] = 100.0
        
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