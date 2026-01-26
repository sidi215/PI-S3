# ai_service/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.predict import router as predict_router

app = FastAPI(
    title="BetterAgri AI Service",
    version="1.0.0",
    description="AI microservice for plant disease diagnosis",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router, prefix="/api/v1", tags=["AI Diagnosis"])


@app.get("/health")
def health_check():
    return {"status": "ok"}
