# backend/scripts/train_model.py
import pandas as pd
import sqlalchemy
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.impute import SimpleImputer

# --- 1. CONFIGURACIÓN ---
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@db:5432/tutorias_db")
engine = sqlalchemy.create_engine(DATABASE_URL)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "models")
MODEL_PATH = os.path.join(MODEL_DIR, "tutoria_risk_model.joblib")

os.makedirs(MODEL_DIR, exist_ok=True)

def fetch_training_data():
    """
    Obtiene todos los datos históricos para entrenar el modelo.
    """
    query = """
    WITH tutoria_counts AS (
        SELECT 
            matricula_id, 
            COUNT(id) as conteo_tutorias_asistidas
        FROM tutorias_unach.tutorias
        WHERE estado = 'realizada'
        GROUP BY matricula_id
    )
    SELECT 
        n.parcial1,
        COALESCE(tc.conteo_tutorias_asistidas, 0) as conteo_tutorias_asistidas,
        n.situacion
    FROM tutorias_unach.notas n
    LEFT JOIN tutoria_counts tc ON n.matricula_id = tc.matricula_id
    WHERE n.situacion IN ('APROBADO', 'REPROBADO')
      AND n.parcial1 IS NOT NULL;
    """
    try:
        df = pd.read_sql(query, engine)
        print(f"Se obtuvieron {len(df)} registros para entrenamiento.")
        return df
    except Exception as e:
        print(f"Error al obtener datos: {e}")
        return pd.DataFrame()

def train_model():
    df = fetch_training_data()
    
    if df.empty:
        print("No hay datos suficientes para entrenar.")
        return

    # --- 2. PREPARACIÓN DE DATOS ---
    features = ['parcial1', 'conteo_tutorias_asistidas']
    target = 'situacion'
    
    X = df[features]
    # 0 = REPROBADO, 1 = APROBADO
    y = df[target].apply(lambda x: 1 if x == 'APROBADO' else 0) 
    
    imputer = SimpleImputer(strategy='mean')
    X = pd.DataFrame(imputer.fit_transform(X), columns=X.columns)

    # --- 3. ENTRENAMIENTO DEL MODELO ---
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print(f"Entrenando con {len(X_train)} registros, probando con {len(X_test)}.")
    
    # ✅ --- INICIO DE LA MODIFICACIÓN ---
    # Le añadimos class_weight='balanced' para ser más "estricto"
    # y darle más importancia a los casos de 'REPROBADO'.
    model = LogisticRegression(random_state=42, class_weight='balanced')
    # ✅ --- FIN DE LA MODIFICACIÓN ---
    
    model.fit(X_train, y_train)
    
    # --- 4. EVALUACIÓN ---
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n--- Resultados de la Evaluación del Modelo ---")
    print(f"Precisión (Accuracy): {accuracy * 100:.2f}%")
    # Target '0' es REPROBADO, '1' es APROBADO
    print(classification_report(y_test, y_pred, target_names=['REPROBADO (0)', 'APROBADO (1)']))
    print("---------------------------------------------\n")

    # --- 5. GUARDAR MODELO ---
    joblib.dump(model, MODEL_PATH)
    print(f"✅ Modelo entrenado y guardado en: {MODEL_PATH}")

if __name__ == "__main__":
    train_model()