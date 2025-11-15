# backend/app/services/prediction_service.py

import joblib
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from typing import Dict, Any

MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "..", "models", "tutoria_risk_model.joblib")

class PredictionService:
    model = None

    def load_model(self):
        """Carga el modelo entrenado desde el archivo .joblib"""
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                print("✅ Modelo de predicción cargado exitosamente.")
            else:
                print(f"⚠️ Advertencia: Archivo de modelo no encontrado en {MODEL_PATH}. El servicio de predicción usará reglas simples.")
                self.model = None
        except Exception as e:
            print(f"❌ Error al cargar el modelo: {e}")
            self.model = None

    def get_student_features(self, db: Session, estudiante_id: int, matricula_id: int) -> Dict[str, Any]:
        """Obtiene las características (features) actuales de un estudiante para la predicción."""
        query_notas = text("""
            SELECT parcial1
            FROM tutorias_unach.notas n
            WHERE n.matricula_id = :matricula_id
        """)
        nota_result = db.execute(query_notas, {"matricula_id": matricula_id}).scalar_one_or_none()
        
        query_tutorias = text("""
            SELECT COUNT(t.id)
            FROM tutorias_unach.tutorias t
            WHERE t.matricula_id = :matricula_id AND t.estado = 'realizada'
        """)
        tutorias_result = db.execute(query_tutorias, {"matricula_id": matricula_id}).scalar()

        return {
            "parcial1": float(nota_result) if nota_result is not None else 0.0,
            "conteo_tutorias_asistidas": int(tutorias_result) if tutorias_result is not None else 0
        }

    def predict_risk(self, db: Session, estudiante_id: int, matricula_id: int) -> Dict[str, Any]:
        """
        Predice el riesgo de un estudiante usando el modelo cargado o reglas simples.
        """
        if self.model is None:
            self.load_model() 

        features = self.get_student_features(db, estudiante_id, matricula_id)
        parcial1 = features['parcial1']

        # Fallback de emergencia si no hay nota P1
        if parcial1 == 0.0:
            return {"riesgo_nivel": "BAJO", "riesgo_color": "green", "probabilidad_riesgo": 0.0}

        # Si el modelo SÍ está cargado, lo usamos
        if self.model:
            try:
                live_data = pd.DataFrame([[
                    parcial1, 
                    features['conteo_tutorias_asistidas']
                ]], columns=['parcial1', 'conteo_tutorias_asistidas'])
                
                # Predecir la probabilidad [prob_clase_0, prob_clase_1, ...]
                probabilidades = self.model.predict_proba(live_data)[0]
                
                # ✅ LÓGICA MÁS SEGURA: Encontrar el índice de la clase 'REPROBADO' (que es 0)
                try:
                    # Buscamos la clase '0' (REPROBADO)
                    reprobado_idx = list(self.model.classes_).index(0)
                except ValueError:
                    print("❌ Error: Clase 'REPROBADO' (0) no encontrada. Re-entrenar modelo.")
                    raise Exception("Modelo mal entrenado") # Forzar el fallback

                prob_reprobado = probabilidades[reprobado_idx]
                
                # ✅ --- UMBRALES MÁS ESTRICTOS ---
                # Ahora, un 7 (que es < 8) tendrá más probabilidad de caer en MEDIO
                if prob_reprobado > 0.5: # 50% prob de reprobar
                    return {"riesgo_nivel": "ALTO", "riesgo_color": "red", "probabilidad_riesgo": round(prob_reprobado * 100, 2)}
                elif prob_reprobado > 0.25: # 25% prob de reprobar (aquí caerán los 7-7.99)
                    return {"riesgo_nivel": "MEDIO", "riesgo_color": "yellow", "probabilidad_riesgo": round(prob_reprobado * 100, 2)}
                else:
                    return {"riesgo_nivel": "BAJO", "riesgo_color": "green", "probabilidad_riesgo": round(prob_reprobado * 100, 2)}
                # ✅ --- FIN DE UMBRALES ---

            except Exception as e:
                print(f"❌ Error durante la predicción: {e}. Usando reglas simples.")
        
        # Fallback: Reglas simples (si el modelo falla)
        if parcial1 < 7.0:
            return {"riesgo_nivel": "ALTO", "riesgo_color": "red", "probabilidad_riesgo": None}
        elif parcial1 < 8.0: # Un 7 a 7.99 es MEDIO
            return {"riesgo_nivel": "MEDIO", "riesgo_color": "yellow", "probabilidad_riesgo": None}
        else:
            return {"riesgo_nivel": "BAJO", "riesgo_color": "green", "probabilidad_riesgo": None}

prediction_service = PredictionService()