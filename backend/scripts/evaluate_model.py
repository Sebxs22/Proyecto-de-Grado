# backend/scripts/evaluate_model.py

import pandas as pd
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import confusion_matrix, classification_report, accuracy_score
import os

# Ajustamos rutas para que funcione dentro y fuera de Docker
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Busca el modelo un nivel arriba, en app/models/
MODEL_PATH = os.path.join(BASE_DIR, "..", "app", "models", "tutoria_risk_model.joblib")
# Busca datos simulados en la misma carpeta scripts/
DATA_PATH = os.path.join(BASE_DIR, "datos_historicos_simulados.csv")

def evaluate():
    print("--- INICIANDO EVALUACIÓN DEL MODELO ---")
    print(f"📂 Buscando modelo en: {MODEL_PATH}")
    
    if not os.path.exists(MODEL_PATH):
        print("❌ Error CRÍTICO: No se encuentra el archivo .joblib del modelo.")
        print("   Asegúrate de haber entrenado el modelo primero.")
        return

    # Cargar modelo
    try:
        model = joblib.load(MODEL_PATH)
        print("✅ Modelo cargado exitosamente.")
    except Exception as e:
        print(f"❌ Error al cargar joblib: {e}")
        return

    # Generar datos de prueba si no existen
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
    else:
        print("⚠️ No se encontró CSV real. Usando datos simulados en memoria...")
        data = {
            'parcial1': [4.0, 9.5, 7.2, 5.0, 8.8, 3.5, 9.0, 6.5, 7.8, 2.0],
            'conteo_tutorias_asistidas': [0, 5, 2, 1, 4, 0, 3, 2, 3, 0],
            'aprobado': [0, 1, 1, 0, 1, 0, 1, 0, 1, 0] # 0=Reprobado, 1=Aprobado
        }
        df = pd.DataFrame(data)

    X = df[['parcial1', 'conteo_tutorias_asistidas']]
    y_true = df['aprobado']

    # Predicciones
    y_pred = model.predict(X)

    # 1. Generar Matriz de Confusión
    cm = confusion_matrix(y_true, y_pred)
    
    plt.figure(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['Reprobado', 'Aprobado'], 
                yticklabels=['Reprobado', 'Aprobado'])
    plt.xlabel('Predicción del Sistema')
    plt.ylabel('Valor Real')
    plt.title('Matriz de Confusión - Modelo de Riesgo')
    
    output_img = os.path.join(BASE_DIR, "matriz_confusion.png")
    plt.savefig(output_img)
    print(f"✅ Gráfico guardado en: {output_img}")

    # 2. Imprimir Métricas
    print("\n--- REPORTE DE CLASIFICACIÓN ---")
    print(classification_report(y_true, y_pred, target_names=['Reprobado', 'Aprobado']))

if __name__ == "__main__":
    evaluate()