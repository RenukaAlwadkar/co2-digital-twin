from fastapi import APIRouter, HTTPException
from app.models.schemas import PredictRequest, PredictResponse
from app.services.predictor import predictor_service

router = APIRouter()

@router.post("/predict", response_model=PredictResponse)
async def get_prediction(request: PredictRequest):
    try:
        # Pass the 24 hours of data to the predictor service
        forecast = predictor_service.predict(request.features)
        
        # Return the resulting forecasted AQI
        return PredictResponse(forecasted_aqi=forecast)
    except Exception as e:
        # Catch any data shape or model inference errors and return as a 500
        raise HTTPException(status_code=500, detail=str(e))
