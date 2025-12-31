# backend/app/services/prediction_service.py

import joblib
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text
import os
from typing import Dict, Any, List
# ✅ Importaciones para clustering
from sklearn.cluster import KMeans
import numpy as np

MODEL_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(MODEL_DIR, "..", "models", "tutoria_risk_model.joblib")

class PredictionService:
    model = None

    def load_model(self):
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
                print("✅ Modelo cargado.")
            else:
                self.model = None
        except Exception as e:
            print(f"❌ Error modelo: {e}")
            self.model = None

    def get_student_features(self, db: Session, estudiante_id: int, matricula_id: int) -> Dict[str, Any]:
        q_nota = text("SELECT parcial1 FROM tutorias_unach.notas WHERE matricula_id = :mid")
        nota = db.execute(q_nota, {"mid": matricula_id}).scalar_one_or_none()
        
        q_tut = text("SELECT COUNT(id) FROM tutorias_unach.tutorias WHERE matricula_id = :mid AND estado = 'realizada'")
        tuts = db.execute(q_tut, {"mid": matricula_id}).scalar()

        return {
            "parcial1": float(nota) if nota is not None else 0.0,
            "conteo_tutorias_asistidas": int(tuts) if tuts is not None else 0
        }

    def predict_risk(self, db: Session, estudiante_id: int, matricula_id: int) -> Dict[str, Any]:
        if self.model is None: self.load_model()
        
        feats = self.get_student_features(db, estudiante_id, matricula_id)
        p1 = feats['parcial1']

        if p1 == 0.0: return {"riesgo_nivel": "BAJO", "riesgo_color": "green", "probabilidad_riesgo": 0.0}

        if self.model:
            try:
                df = pd.DataFrame([[p1, feats['conteo_tutorias_asistidas']]], columns=['parcial1', 'conteo_tutorias_asistidas'])
                probs = self.model.predict_proba(df)[0]
                idx_rep = list(self.model.classes_).index(0) # 0 = Reprobado
                prob = probs[idx_rep]

                if prob > 0.5: return {"riesgo_nivel": "ALTO", "riesgo_color": "red", "probabilidad_riesgo": round(prob*100, 2)}
                elif prob > 0.25: return {"riesgo_nivel": "MEDIO", "riesgo_color": "yellow", "probabilidad_riesgo": round(prob*100, 2)}
                else: return {"riesgo_nivel": "BAJO", "riesgo_color": "green", "probabilidad_riesgo": round(prob*100, 2)}
            except: pass
        
        # Fallback
        if p1 < 7: return {"riesgo_nivel": "ALTO", "riesgo_color": "red", "probabilidad_riesgo": None}
        return {"riesgo_nivel": "BAJO", "riesgo_color": "green", "probabilidad_riesgo": None}

    # ✅ NUEVO: CLUSTERING (K-MEANS)
    def get_student_clusters(self, db: Session, periodo_id: int) -> List[Dict[str, Any]]:
        """Segmenta estudiantes en 3 perfiles: Riesgo, Medio, Alto."""
        sql = text("""
            SELECT e.id, AVG(n.final) as prom, COUNT(t.id) as tuts
            FROM tutorias_unach.estudiantes e
            JOIN tutorias_unach.matriculas m ON m.estudiante_id = e.id
            LEFT JOIN tutorias_unach.notas n ON n.matricula_id = m.id
            LEFT JOIN tutorias_unach.tutorias t ON t.matricula_id = m.id
            WHERE m.periodo_id = :pid
            GROUP BY e.id
        """)
        res = db.execute(sql, {"pid": periodo_id}).fetchall()
        if len(res) < 3: return []

        data = [[float(r.prom or 0), int(r.tuts)] for r in res]
        ids = [r.id for r in res]

        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10).fit(data)
        
        # Ordenar clusters por nota promedio del centroide
        centers = kmeans.cluster_centers_
        sorted_idx = np.argsort(centers[:, 0])
        labels_map = {sorted_idx[0]: "Riesgo", sorted_idx[1]: "Medio", sorted_idx[2]: "Alto"}

        return [{"estudiante_id": ids[i], "cluster": labels_map[l], "promedio": data[i][0]} for i, l in enumerate(kmeans.labels_)]

prediction_service = PredictionService()