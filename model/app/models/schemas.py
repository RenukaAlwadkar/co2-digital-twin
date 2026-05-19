from pydantic import BaseModel, Field
from typing import List

class HourlyReading(BaseModel):
    pm25: float
    pm10: float
    no: float
    no2: float
    nox: float
    nh3: float
    co: float
    so2: float
    o3: float

class PredictRequest(BaseModel):
    # Expects exactly 24 hours of data
    features: List[HourlyReading] = Field(..., min_length=24, max_length=24)

class PredictResponse(BaseModel):
    forecasted_aqi: float
