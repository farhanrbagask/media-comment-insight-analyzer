from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import analyze
from app.models.loader import ModelLoader

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load ML models on startup."""
    print("Loading NLP models...")
    ModelLoader.load_all()
    print("Models ready.")
    yield
    print("Shutting down ML service.")

app = FastAPI(
    title="Comment Insight ML Service",
    description="NLP analysis service: sentiment, keywords, topics, insight generation",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="", tags=["Analyze"])

@app.get("/health")
def health():
    return {"status": "ok", "models_loaded": ModelLoader.is_loaded()}
