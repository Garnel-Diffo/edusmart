import logging

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException

from app.deps import verify_internal_secret
from app.models import FicheAcceptedResponse, FicheRequest
from app.services import callback, rag, vectorstore

logger = logging.getLogger("edusmart.ia.fiche")

router = APIRouter(prefix="/ia", tags=["fiche"], dependencies=[Depends(verify_internal_secret)])


async def _traiter_generation_fiche(payload: FicheRequest) -> None:
    try:
        extraits = await vectorstore.get_chunks_for_scope(
            matiere_id=payload.matiereId, module_id=payload.moduleId, cours_document_id=payload.coursDocumentId
        )
        if not extraits:
            # UC14 - 5a : périmètre non encore indexé ou vide.
            await callback.notifier_fiche_prete(payload.ficheRevisionId, "ECHEC")
            return

        contenu = await rag.generer_contenu_fiche(payload.type, extraits)
        await callback.notifier_fiche_prete(payload.ficheRevisionId, "PRET", contenu)
    except Exception:
        logger.exception("Échec de génération de la fiche %s", payload.ficheRevisionId)
        await callback.notifier_fiche_prete(payload.ficheRevisionId, "ECHEC")


@router.post("/fiche", response_model=FicheAcceptedResponse, status_code=202)
async def generer_fiche(payload: FicheRequest, background_tasks: BackgroundTasks) -> FicheAcceptedResponse:
    """UC14 - Génère une fiche de révision de façon asynchrone (callback vers le backend Node à la fin)."""
    if not (payload.matiereId or payload.moduleId or payload.coursDocumentId):
        raise HTTPException(status_code=400, detail="Aucun périmètre fourni (matiere, module ou document)")

    background_tasks.add_task(_traiter_generation_fiche, payload)
    return FicheAcceptedResponse(ficheRevisionId=payload.ficheRevisionId, statut="EN_COURS")
