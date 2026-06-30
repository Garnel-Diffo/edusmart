from fastapi import APIRouter, Depends

from app.deps import verify_internal_secret
from app.models import SearchRequest, SearchResponse
from app.services import rag

router = APIRouter(prefix="/ia", tags=["search"], dependencies=[Depends(verify_internal_secret)])


@router.post("/search", response_model=SearchResponse)
async def recherche_semantique(payload: SearchRequest) -> SearchResponse:
    """UC15 - Recherche sémantique dans les cours."""
    resultats = await rag.rechercher_semantique(payload.requete, payload.filiereId)
    return SearchResponse(resultats=resultats)
