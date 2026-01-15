from fastapi import FastAPI
from app.api.v1.predict import router as predict_router

app = FastAPI(
    title="BetterAgri AI Service",
    version="1.0.0",
    description="AI microservice for plant disease diagnosis"
)

app.include_router(
    predict_router,
    prefix="/api/v1",
    tags=["AI Diagnosis"]
)

@app.get("/health")
def health_check():
    return {"status": "ok"}
