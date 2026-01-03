# backend/scripts/train_model.py

import sys
import os
import joblib
import pandas as pd
import numpy as np
from sqlalchemy import create_engine, text
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings

def generar_datos_probabilistiscos(cantidad=3000):
    """
    Genera datos donde el éxito no es blanco/negro, sino una probabilidad
    basada en la nota y el esfuerzo.
    """
    print(f"🧪 Generando {cantidad} casos con lógica de 'Curva de Esfuerzo'...")
    
    # 1. Variables aleatorias
    # Generamos notas concentradas en rangos comunes (Gaussiana)
    parcial1 = np.clip(np.random.normal(6.5, 2.0, cantidad), 0, 10)
    parcial2 = np.clip(np.random.normal(6.5, 2.0, cantidad), 0, 10)
    
    # Tutorías: La mayoría va a pocas, algunos a muchas
    tutorias = np.clip(np.random.exponential(3, cantidad), 0, 15).astype(int)
    
    # 2. CÁLCULO DE PROBABILIDAD (La Lógica Humana)
    # Definimos una "Puntuación de Mérito" (0 a 100)
    promedio = (parcial1 + parcial2) / 2
    
    # Fórmula Maestra:
    # - La nota aporta el 85% del peso.
    # - Cada tutoría aporta 2 puntos porcentuales de seguridad.
    # - Penalización si la nota es muy baja (<4) para que no sea fácil pasar solo yendo a sentarse.
    
    score_base = promedio * 10  # Ejemplo: 7.0 -> 70 puntos
    bonus_tutorias = tutorias * 2.5 # Ejemplo: 2 tutorías -> +5 puntos
    
    probabilidad_exito = score_base + bonus_tutorias
    
    # Ajustes finos (Tunear la IA)
    targets = []
    for p, n_real in zip(probabilidad_exito, promedio):
        # Topes naturales
        prob = max(0, min(100, p)) / 100.0
        
        # CASOS ESPECIALES (Para dar los porcentajes que pides)
        
        # Caso 7.0 (Raspando): Queremos que de ~80%
        # Nuestra fórmula da: 70 + bonus. Si bonus es 0 -> 70%. Con tutorías sube. Correcto.
        
        # Caso 5.0 (Riesgo): 
        # Fórmula: 50 + (2 tuts * 2.5) = 55%. -> ¡Justo tu 53%!
        
        # Caso Irrecuperable: Si tienes menos de 3, es muy difícil que la tutoría haga milagros
        if n_real < 3.5:
            prob = prob * 0.3 # Bajamos drásticamente la probabilidad
            
        # 3. La Moneda al Aire (Bernoulli)
        # Aquí definimos si aprobó o no basado en esa probabilidad.
        # Esto hace que la IA aprenda "el 55% de los chicos con nota 5 y 2 tutorías, pasaron".
        resultado = np.random.choice([1, 0], p=[prob, 1-prob])
        targets.append(resultado)

    return pd.DataFrame({
        'parcial1': parcial1,
        'parcial2': parcial2,
        'num_tutorias': tutorias,
        'target': targets
    })

def train():
    print("🚀 Iniciando entrenamiento con MATICES PROBABILÍSTICOS...")

    db_url = str(settings.DATABASE_URL)
    engine = create_engine(db_url)
    
    # 1. Leer datos reales (si existen)
    query = text("""
        SELECT 
            n.parcial1, n.parcial2, n.final, n.situacion,
            COALESCE(t_agrupadas.num_tutorias, 0) as num_tutorias
        FROM tutorias_unach.notas n
        JOIN tutorias_unach.matriculas m ON n.matricula_id = m.id
        LEFT JOIN (
            SELECT matricula_id, COUNT(*) as num_tutorias
            FROM tutorias_unach.tutorias WHERE estado = 'realizada' GROUP BY matricula_id
        ) t_agrupadas ON m.id = t_agrupadas.matricula_id
        WHERE n.final IS NOT NULL
    """)

    try:
        with engine.connect() as conn:
            df_real = pd.read_sql(query, conn)
    except:
        df_real = pd.DataFrame()

    if not df_real.empty:
        df_real['parcial2'] = df_real['parcial2'].fillna(0)
        df_real['target'] = df_real.apply(lambda row: 1 if (row['final'] >= 7 or row['situacion'] == 'APROBADO') else 0, axis=1)
        df_real = df_real[['parcial1', 'parcial2', 'num_tutorias', 'target']]

    # 2. Generar Datos Matizados
    # Creamos muchos datos (5000) para que la IA entienda bien los porcentajes
    df_simulado = generar_datos_probabilistiscos(cantidad=5000)

    # 3. Mezclar
    df_final = pd.concat([df_real, df_simulado], ignore_index=True)
    
    print(f"🧠 Entrenando con {len(df_final)} registros variados...")
    
    X = df_final[['parcial1', 'parcial2', 'num_tutorias']]
    y = df_final['target']

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Aumentamos min_samples_leaf para que el árbol no sea tan "binario" y promedie más (suaviza porcentajes)
    model = RandomForestClassifier(n_estimators=300, max_depth=10, min_samples_leaf=5, random_state=42)
    model.fit(X_train, y_train)

    acc = accuracy_score(y_test, model.predict(X_test))
    print(f"✅ Modelo entrenado. Precisión estimada: {acc:.2%}")

    output_path = os.path.join("app", "models", "tutoria_risk_model.joblib")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    joblib.dump(model, output_path)
    print("💾 Cerebro IA actualizado con lógica humana.")

if __name__ == "__main__":
    train()