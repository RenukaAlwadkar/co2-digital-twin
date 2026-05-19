from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AQI Forecasting API"
    # Ensure this matches the exact filename in your model folder
    MODEL_PATH: str = "aqi_cnn_model-Copy1.keras"

settings = Settings()
