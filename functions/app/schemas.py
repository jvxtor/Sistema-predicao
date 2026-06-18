from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

Sex = Literal["male", "female"]
Smoker = Literal["yes", "no"]
Region = Literal["northeast", "northwest", "southeast", "southwest"]


class PredictionInput(BaseModel):
    age: int = Field(ge=18, le=100)
    sex: Sex
    bmi: float = Field(gt=0, le=80)
    children: int = Field(ge=0, le=10)
    smoker: Smoker
    region: Region


class PredictionRecord(PredictionInput):
    id: str
    predicted_charges: float
    created_at: datetime


class PredictionResponse(BaseModel):
    id: str
    predicted_charges: float
    created_at: datetime
