from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.services.inference import run_inference
from app.services.recommendations import get_recommendation

router = APIRouter()

@router.post("/predict")
async def predict(
    file: UploadFile = File(...),
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid image file")

    result = await run_inference(file)

    rec = get_recommendation(result["label"])

    return {
        "model_version": "v1",
        "disease": result["label"],
        "confidence": result["confidence"],
        "recommendation": rec["recommendation"],
        "treatment_duration": rec["treatment_duration"],
        "products": rec["products"],
        "actions": rec["actions"],
    }
