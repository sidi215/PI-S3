import tensorflow as tf
import numpy as np
from app.utils.image_processing import preprocess_image
import json

MODEL_PATH = "app/models/model_v1.h5"
LABELS_PATH = "app/models/labels.json"

model = tf.keras.models.load_model(MODEL_PATH)

with open(LABELS_PATH, "r") as f:
    LABELS = json.load(f)

async def run_inference(file):
    image = await file.read()
    img_array = preprocess_image(image)

    preds = model.predict(img_array)[0]
    idx = int(np.argmax(preds))

    return {
        "label": LABELS[str(idx)],
        "confidence": round(float(preds[idx]) * 100, 2),
    }
