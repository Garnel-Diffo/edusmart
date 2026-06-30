from fastapi import APIRouter, Depends

from app.deps import verify_internal_secret
from app.models import ChatRequest, ChatResponse
from app.services import rag

router = APIRouter(prefix="/ia", tags=["chat"], dependencies=[Depends(verify_internal_secret)])


@router.post("/chat", response_model=ChatResponse)
async def chatbot(payload: ChatRequest) -> ChatResponse:
    """UC13 - Interroger le chatbot IA (RAG)."""
    return await rag.repondre_question(payload.question, payload.filiereId)
