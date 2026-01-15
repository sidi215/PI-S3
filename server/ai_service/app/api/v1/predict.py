from fastapi import APIRouter, UploadFile, File, HTTPException
from app.services.inference import run_inference
from app.services.recommendations import get_recommendation

router = APIRouter()

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file")

    result = await run_inference(file)

    return {
        "model_version": "v1",
        "disease": result["label"],
        "confidence": result["confidence"],
        "recommendation": get_recommendation(result["label"]),
    }
