# backend/app/services/prediction_service.py

import os
import joblib
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
from sklearn.cluster import KMeans
from typing import Dict, Any, List

class PredictionService:
    def __init__(self):
        self.model_path = "app/models/tutoria_risk_model.joblib"
        self.model = self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                return joblib.load(self.model_path)
            except: return None
        return None

    def get_student_features(self, db: Session, matricula_id: int) -> Dict[str, Any]:
        q_nota = text("SELECT parcial1, parcial2, final, situacion FROM tutorias_unach.notas WHERE matricula_id = :mid")
        row = db.execute(q_nota, {"mid": matricula_id}).mappings().one_or_none()
        
        q_tut = text("SELECT COUNT(id) FROM tutorias_unach.tutorias WHERE matricula_id = :mid AND estado = 'realizada'")
        tuts = db.execute(q_tut, {"mid": matricula_id}).scalar() or 0

        p1 = float(row['parcial1']) if row and row['parcial1'] is not None else None
        p2 = float(row['parcial2']) if row and row['parcial2'] is not None else None
        
        return {
            "p1": p1,
            "p2": p2,
            "final": float(row['final']) if row and row['final'] is not None else None,
            "situacion": row['situacion'] if row else None,
            "tutorias": int(tuts)
        }

    def predict_risk(self, db: Session, estudiante_id: int, matricula_id: int) -> Dict[str, Any]:
        feats = self.get_student_features(db, matricula_id)
        p1 = feats['p1']
        p2 = feats['p2']
        tutorias = feats['tutorias']

        # 1. CERTEZA ABSOLUTA (BD)
        if feats['situacion'] == 'APROBADO':
            return self._response(100.0, "green", "ALTO", "Materia aprobada oficialmente.", feats)
        if feats['situacion'] == 'REPROBADO':
            return self._response(0.0, "red", "BAJO", "Materia reprobada oficialmente.", feats)

        # 2. CERTEZA MATEMÁTICA (Dos Notas)
        if p1 is not None and p2 is not None:
            promedio = (p1 + p2) / 2
            if promedio >= 7.0:
                 return self._response(100.0, "green", "ALTO", "Promedio final suficiente.", feats)
            else:
                 return self._response(0.0, "red", "BAJO", "Promedio insuficiente.", feats)

        # 3. PREDICCIÓN (Falta Parcial 2)
        if p1 is not None and p2 is None:
            if not self.model:
                return self._response(0.0, "gray", "ERROR", "IA no disponible.", feats)

            try:
                # Proyección
                features_df = pd.DataFrame([[p1, p1, tutorias]], columns=['parcial1', 'parcial2', 'num_tutorias'])
                
                # IA Calcula
                prob_raw = self.model.predict_proba(features_df)[0][1] * 100
                
                # --- REGLA DEL SUPER ESTUDIANTE ---
                # Si tiene nota de Excelencia (>=8) Y se esfuerza (>=5 tutorías)
                # Le permitimos llegar al 99.9%
                if p1 >= 8.0 and tutorias >= 5:
                    prob = min(prob_raw, 99.9) # Casi 100, la gloria.
                else:
                    # Para el resto, mantenemos la cautela del 98%
                    prob = min(prob_raw, 98.0)

                # Piso mínimo de esperanza
                prob = max(prob, 5.0)

                # Mensajes
                if prob >= 99:
                     nivel, color, msg = "ALTO", "green", "Modelo IA: Excelencia Total. Aprobación virtualmente asegurada."
                elif prob >= 90:
                    nivel, color, msg = "ALTO", "green", "Modelo IA: Rendimiento destacado (Mantener ritmo)."
                elif prob >= 70:
                    nivel, color, msg = "ALTO", "green", "Modelo IA: Pronóstico favorable."
                elif prob >= 50:
                    nivel, color, msg = "MEDIO", "yellow", "Modelo IA: Zona de recuperación."
                else:
                    nivel, color, msg = "BAJO", "red", "Modelo IA: Alerta de riesgo académico."

                return self._response(prob, color, nivel, msg, feats)

            except Exception as e:
                print(f"Error IA: {e}")
                return self._response(0.0, "gray", "ERROR", "Fallo predicción.", feats)

        return self._response(0.0, "gray", "N/D", "Sin calificaciones.", feats)

    def get_student_clusters(self, db: Session, periodo_id: int) -> List[Dict[str, Any]]:
        # Clustering sin cambios
        try:
            q = text("""
                SELECT u.nombre, n.parcial1, n.parcial2, 
                    (SELECT COUNT(*) FROM tutorias_unach.tutorias t WHERE t.matricula_id = m.id AND t.estado = 'realizada') as tuts
                FROM tutorias_unach.matriculas m
                JOIN tutorias_unach.estudiantes e ON m.estudiante_id = e.id
                JOIN tutorias_unach.usuarios u ON e.usuario_id = u.id
                JOIN tutorias_unach.notas n ON m.id = n.matricula_id
                WHERE m.periodo_id = :pid
            """)
            rows = db.execute(q, {"pid": periodo_id}).mappings().all()
            if len(rows) < 3: return [] 
            
            df = pd.DataFrame(rows)
            df['parcial1'] = df['parcial1'].fillna(0)
            df['parcial2'] = df['parcial2'].fillna(df['parcial1']) 
            df['promedio'] = (df['parcial1'] + df['parcial2']) / 2
            
            kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
            df['cluster'] = kmeans.fit_predict(df[['promedio', 'tuts']])
            means = df.groupby('cluster')['promedio'].mean().sort_values()
            labels = {means.index[0]: 'Riesgo', means.index[1]: 'Regular', means.index[2]: 'Sobresaliente'}
            df['categoria'] = df['cluster'].map(labels)
            
            return df[['nombre', 'promedio', 'tuts', 'categoria']].rename(columns={'tuts': 'total_tutorias'}).to_dict(orient='records')
        except: return []

    def _response(self, prob, color, nivel, msg, feats):
        nota = feats['p1'] if feats['p1'] is not None else 0.0
        if feats['p2'] is not None: nota = (feats['p1'] + feats['p2']) / 2
            
        return {
            "riesgo_nivel": nivel,
            "riesgo_color": color,
            "probabilidad_riesgo": round(prob, 1),
            "mensaje_explicativo": msg,
            "tutorias_acumuladas": feats['tutorias'],
            "nota_actual": round(nota, 2)
        }

prediction_service = PredictionService()