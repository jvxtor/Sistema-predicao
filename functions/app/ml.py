from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

MODEL_PATH = Path(__file__).resolve().parent / "ml" / "insurance_model.joblib"


class InsuranceModel:
    def __init__(self, artifact: dict[str, Any]):
        self._model = artifact["model"]
        self._feature_columns = artifact["feature_columns"]
        self.categories = artifact["categories"]
        self.metrics = artifact["metrics"]

    def predict(self, payload: dict) -> float:
        row = pd.DataFrame([payload])
        row_encoded = pd.get_dummies(row, columns=["sex", "smoker", "region"])
        row_encoded = row_encoded.reindex(columns=self._feature_columns, fill_value=False)
        return float(self._model.predict(row_encoded)[0])


@lru_cache
def get_model() -> InsuranceModel:
    if not MODEL_PATH.exists():
        raise RuntimeError(
            f"Modelo não encontrado em {MODEL_PATH}. Execute `python train_model.py` antes de iniciar a API."
        )
    artifact = joblib.load(MODEL_PATH)
    return InsuranceModel(artifact)
