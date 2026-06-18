"""Treina o RandomForestRegressor para custo de seguro médico e exporta o artefato via joblib.

Reproduz o pipeline da Etapa 2 do notebook (mesmo encoding, split e modelo escolhido
por ter o melhor desempenho: R² ~0.86 vs ~0.73 da Árvore de Decisão).
Rodar: python train_model.py
"""
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent
DATA_PATH = BASE_DIR / "data" / "insurance.csv"
MODEL_PATH = BASE_DIR / "app" / "ml" / "insurance_model.joblib"

CATEGORICAL_COLUMNS = ["sex", "smoker", "region"]
TARGET_COLUMN = "charges"


def load_dataset() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    return df.drop_duplicates()


def main() -> None:
    df = load_dataset()
    df_encoded = pd.get_dummies(df, columns=CATEGORICAL_COLUMNS, drop_first=True)

    X = df_encoded.drop(columns=[TARGET_COLUMN])
    y = df_encoded[TARGET_COLUMN]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    metrics = {
        "mae": mean_absolute_error(y_test, predictions),
        "r2": r2_score(y_test, predictions),
    }
    print(f"MAE: {metrics['mae']:.2f}")
    print(f"R2:  {metrics['r2']:.4f}")

    artifact = {
        "model": model,
        "feature_columns": X.columns.tolist(),
        "categories": {col: sorted(df[col].unique().tolist()) for col in CATEGORICAL_COLUMNS},
        "metrics": metrics,
    }

    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, MODEL_PATH)
    print(f"Modelo exportado para {MODEL_PATH}")


if __name__ == "__main__":
    main()
