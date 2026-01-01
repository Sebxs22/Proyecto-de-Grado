# backend/app/services/prediction_service.py

from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Dict, Any, List

class PredictionService:
    model = None

    def get_student_features(self, db: Session, matricula_id: int) -> Dict[str, Any]:
        """Obtiene datos académicos y de esfuerzo de forma segura."""
        # 1. Notas (Solo pedimos parciales que existen)
        q_nota = text("SELECT parcial1, parcial2 FROM tutorias_unach.notas WHERE matricula_id = :mid")
        try:
            row = db.execute(q_nota, {"mid": matricula_id}).mappings().one_or_none()
        except Exception:
            row = None 

        # 2. Tutorías (Contamos el esfuerzo real)
        q_tut = text("SELECT COUNT(id) FROM tutorias_unach.tutorias WHERE matricula_id = :mid AND estado IN ('realizada', 'aceptada', 'solicitada')")
        tuts = db.execute(q_tut, {"mid": matricula_id}).scalar()

        return {
            "p1": float(row['parcial1']) if row and row['parcial1'] is not None else None,
            "p2": float(row['parcial2']) if row and row['parcial2'] is not None else None,
            "tutorias": int(tuts) if tuts is not None else 0
        }

    def predict_risk(self, db: Session, estudiante_id: int, matricula_id: int) -> Dict[str, Any]:
        
        feats = self.get_student_features(db, matricula_id)
        p1 = feats['p1']
        p2 = feats['p2']
        num_tutorias = feats['tutorias']

        # --- CASO 0: SIN NOTAS (Inicio de semestre) ---
        if p1 is None:
            return {
                "riesgo_nivel": "N/D",
                "riesgo_color": "gray",
                "probabilidad_riesgo": 0.0,
                "mensaje_explicativo": "Sin calificaciones registradas.",
                "tutorias_acumuladas": num_tutorias,
                "nota_actual": 0.0
            }

        # --- NORMALIZACIÓN DE ESCALA (Todo a base 10) ---
        es_escala_20 = p1 > 10 or (p2 and p2 > 10)
        divisor = 2.0 if es_escala_20 else 1.0
        
        nota_real = ( (p1 + p2)/2 if p2 else p1 ) # Usamos promedio si hay p2
        nota_base_10 = nota_real / divisor # Llevamos todo a escala 10 para calcular

        # --- ALGORITMO DE PROBABILIDAD DE APROBACIÓN ---
        
        # 1. Probabilidad Base (La nota define el 70% del éxito)
        # Una nota de 7/10 te da 70% de probabilidad base.
        probabilidad = (nota_base_10 * 10) 

        # 2. Ajuste Dinámico por Tutorías
        if nota_base_10 < 7.0:
            # --- ZONA DE RIESGO (Nota < 7) ---
            if num_tutorias == 0:
                # PENALIZACIÓN FUERTE: Si va mal y no pide ayuda, la probabilidad cae.
                probabilidad -= 15.0 
                mensaje = f"Rendimiento bajo ({nota_real}) y sin tutorías. Pronóstico crítico."
            else:
                # BONIFICACIÓN DE RESCATE: Las tutorías valen ORO aquí.
                # +6% por cada tutoría (máximo 30% extra)
                bonus = min(num_tutorias * 6.0, 30.0)
                probabilidad += bonus
                mensaje = f"En recuperación. Las tutorías (+{int(bonus)}%) mejoran su proyección."
        else:
            # --- ZONA SEGURA (Nota >= 7) ---
            if num_tutorias > 0:
                # BONIFICACIÓN DE MANTENIMIENTO: Solo un pequeño plus.
                probabilidad += (num_tutorias * 2.0)
                mensaje = "Buen rendimiento académico reforzado por tutorías."
            else:
                mensaje = "Buen rendimiento académico."

        # 3. Limpieza Final (Rango 0-100)
        probabilidad = max(5.0, min(probabilidad, 99.0))
        
        # 4. Definición de Semáforo (Probabilidad de APROBAR)
        if probabilidad >= 70:
            riesgo = "ALTO" # Probabilidad Alta de Aprobar
            color = "green"
        elif probabilidad >= 40:
            riesgo = "MEDIO" # Probabilidad Media
            color = "yellow"
        else:
            riesgo = "BAJO" # Probabilidad Baja de Aprobar (Peligro)
            color = "red"

        return {
            "riesgo_nivel": riesgo, # Nivel de Probabilidad de Éxito
            "riesgo_color": color,
            "probabilidad_riesgo": round(probabilidad, 1),
            "mensaje_explicativo": mensaje,
            "tutorias_acumuladas": num_tutorias,
            "nota_actual": round(nota_real, 2)
        }
    
    def get_student_clusters(self, db: Session, periodo_id: int) -> List[Dict[str, Any]]: return []

prediction_service = PredictionService()