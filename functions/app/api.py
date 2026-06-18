from dotenv import load_dotenv

load_dotenv()

from .firebase import init_firebase

init_firebase()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .ml import get_model
from .schemas import PredictionInput, PredictionRecord, PredictionResponse
from .storage import get_prediction, list_predictions, save_prediction

app = FastAPI(
    title="Insurance Cost Prediction API",
    description="API para predição do custo individual de seguro médico.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    model = get_model()
    return {"status": "ok", "model_metrics": model.metrics}


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionInput):
    model = get_model()
    predicted_charges = model.predict(payload.model_dump())
    record = save_prediction(payload, predicted_charges)
    return PredictionResponse(
        id=record.id,
        predicted_charges=record.predicted_charges,
        created_at=record.created_at,
    )


@app.get("/predictions", response_model=list[PredictionRecord])
def get_predictions(limit: int = 50, offset: int = 0):
    return list_predictions(limit=limit, offset=offset)


@app.get("/predictions/{prediction_id}", response_model=PredictionRecord)
def get_prediction_by_id(prediction_id: str):
    record = get_prediction(prediction_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Predição não encontrada")
    return record
