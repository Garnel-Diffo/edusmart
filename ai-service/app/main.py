import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from app.config import settings
from app.db import connect_db, disconnect_db
from app.routers import chat_router, fiche_router, index_personnel_router, index_router, search_router
from app.services import embeddings

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("edusmart.ia")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Démarrage du service IA EduSmart — chargement du modèle d'embeddings (%s)...", settings.embedding_model)
    embeddings.load_model()
    await connect_db()
    logger.info("✅ Service IA prêt (pool DB connecté, modèle d'embeddings chargé)")
    yield
    await disconnect_db()


app = FastAPI(
    title="EduSmart - Service IA (RAG)",
    description="Micro-service interne Python/FastAPI : indexation RAG, chatbot, recherche sémantique, fiches de révision.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url=None,
)

app.include_router(index_router.router)
app.include_router(index_personnel_router.router)
app.include_router(chat_router.router)
app.include_router(search_router.router)
app.include_router(fiche_router.router)


@app.get("/health")
async def health() -> JSONResponse:
    return JSONResponse({"success": True, "status": "ok", "service": "edusmart-ai-service"})
