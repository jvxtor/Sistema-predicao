"""Persistência das predições no Firestore."""
from datetime import datetime, timezone

from firebase_admin import firestore

from .schemas import PredictionInput, PredictionRecord

COLLECTION = "predictions"


def _collection():
    return firestore.client().collection(COLLECTION)


def _to_record(doc) -> PredictionRecord:
    data = doc.to_dict()
    return PredictionRecord(id=doc.id, **data)


def save_prediction(payload: PredictionInput, predicted_charges: float) -> PredictionRecord:
    doc_ref = _collection().document()
    created_at = datetime.now(timezone.utc)
    doc_ref.set(
        {
            **payload.model_dump(),
            "predicted_charges": predicted_charges,
            "created_at": created_at,
        }
    )
    return PredictionRecord(
        id=doc_ref.id,
        predicted_charges=predicted_charges,
        created_at=created_at,
        **payload.model_dump(),
    )


def list_predictions(limit: int = 50, offset: int = 0) -> list[PredictionRecord]:
    query = (
        _collection()
        .order_by("created_at", direction=firestore.Query.DESCENDING)
        .limit(limit + offset)
    )
    docs = list(query.stream())[offset:]
    return [_to_record(doc) for doc in docs]


def get_prediction(prediction_id: str) -> PredictionRecord | None:
    doc = _collection().document(prediction_id).get()
    if not doc.exists:
        return None
    return _to_record(doc)
