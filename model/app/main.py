from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.core.config import settings
from app.services.predictor import predictor_service
import contextlib

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # This runs when the FastAPI server starts up
    print("Initializing AQI ML Service...")
    try:
        predictor_service.load_model()
    except Exception as e:
        print(f"Warning: Could not load model on startup. Error: {e}")
    yield
    # This runs when the server shuts down
    print("Shutting down ML Service.")

# Create FastAPI instance
app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

# Allow CORS for the Node.js backend (and any frontend for testing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach our prediction routes
app.include_router(router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "ok", "message": "AQI Forecasting ML Microservice is running!"}
