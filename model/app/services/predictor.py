import numpy as np
import tensorflow as tf
import os
from app.core.config import settings
from app.models.schemas import HourlyReading
from typing import List

class AQIPredictor:
    def __init__(self):
        self.model = None

    def load_model(self):
        if self.model is None:
            # Resolve the absolute path to the .keras file located in the root of the 'model' directory
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, settings.MODEL_PATH)
            
            print(f"Loading TensorFlow model from: {model_path}")
            self.model = tf.keras.models.load_model(model_path)
            print("Model loaded successfully into memory.")

    def predict(self, data: List[HourlyReading]) -> float:
        if self.model is None:
            self.load_model()
            
        # 1. Extract values from Pydantic models into a 2D Python list
        sequence = []
        for row in data:
            sequence.append([
                row.pm25, row.pm10, row.no, row.no2, row.nox, 
                row.nh3, row.co, row.so2, row.o3
            ])
        
        # 2. Convert to a 2D NumPy array of shape (24, 9)
        seq_array = np.array(sequence, dtype=np.float32)
        
        # 3. Reshape to 3D Tensor for CNN/LSTM: (batch_size, timesteps, features) -> (1, 24, 9)
        input_tensor = np.expand_dims(seq_array, axis=0)
        
        # 4. Run inference
        prediction = self.model.predict(input_tensor)
        
        # 5. Extract scalar output (assuming output shape is (1, 1))
        forecast = float(prediction[0][0])
        
        return forecast

# Expose a singleton instance
predictor_service = AQIPredictor()
