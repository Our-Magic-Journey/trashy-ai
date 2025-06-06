from typing import Annotated

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from PIL import Image
import numpy as np
from tensorflow import keras
from tensorflow.keras.applications.mobilenet_v3 import preprocess_input
import io

app = FastAPI()
img_size = (224, 224)
class_names = ['biological', 'glass', 'other', 'paper', 'plastic']
model = keras.models.load_model("model.keras")

origins = [
    "http://45.157.233.78:5174",
    "https://ai.purgal.xyz",
    "https://ai_old.purgal.xyz",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← pozwala wszystkim
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def preprocess_image(image_bytes, ):
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    img = img.resize(img_size)
    img_array = np.array(img)
    img_array = preprocess_input(img_array)

    return img_array

@app.post("/predict", tags=["root"])
async def analise(file: Annotated[UploadFile, File(description="A file read as UploadFile")]) -> JSONResponse:
    try:
        contents = await file.read()
        img_array = preprocess_image(contents)
        predictions = model.predict(np.expand_dims(img_array, axis=0))
        predictions = predictions[0]

        predicted_index = int(np.argmax(predictions))
        predicted_class = class_names[predicted_index]
        confidence = float(np.max(predictions))

        class_probabilities = {
            class_name: float(prob)
            for class_name, prob in zip(class_names, predictions)
        }

        return JSONResponse(content={
            "predicted_class": predicted_class,
            "confidence": confidence,
            "predictions": class_probabilities
        })

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

