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
class_names = ['cardboard', 'glass', 'metal', 'organics', 'paper', 'plastic', 'textile', 'trash', 'vegetation']
class_names_frontend = {
    'organics': 'biological',
    'vegetation': 'biological',
    'glass': 'glass',
    'textile': 'other',
    'trash': 'other',
    'paper': 'paper',
    'cardboard': 'paper',
    'plastic': 'plastic',
    'metal': 'plastic',
}

model = keras.models.load_model("real_wastE_model.keras")

origins = [
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def preprocess_image(image_bytes):
    from PIL import ImageOps

    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    original_width, original_height = img.size
    scale = 256 / min(original_width, original_height)
    new_width = int(original_width * scale)
    new_height = int(original_height * scale)
    img = img.resize((new_width, new_height))

    grayscale = ImageOps.grayscale(img)
    gray_np = np.array(grayscale, dtype=np.float32)

    total = np.sum(gray_np)
    if total == 0:
        center_x, center_y = new_width // 2, new_height // 2
    else:
        x_coords = np.arange(new_width)
        y_coords = np.arange(new_height)
        center_x = int(np.sum(x_coords * np.sum(gray_np, axis=0)) / total)
        center_y = int(np.sum(y_coords * np.sum(gray_np, axis=1)) / total)

    left = max(center_x - 112, 0)
    top = max(center_y - 112, 0)
    right = left + 224
    bottom = top + 224

    if right > new_width:
        right = new_width
        left = right - 224
    if bottom > new_height:
        bottom = new_height
        top = bottom - 224

    img = img.crop((left, top, right, bottom))

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
        predicted_class_raw = class_names[predicted_index]
        predicted_class_frontend = class_names_frontend[predicted_class_raw]
        confidence = float(np.max(predictions))

        frontend_probabilities = {}
        for class_name, prob in zip(class_names, predictions):
            frontend_class = class_names_frontend[class_name]
            frontend_probabilities[frontend_class] = frontend_probabilities.get(frontend_class, 0.0) + float(prob)

        return JSONResponse(content={
            "predicted_class": predicted_class_frontend,
            "confidence": confidence,
            "predictions": frontend_probabilities
        })

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

