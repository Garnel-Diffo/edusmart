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
            matiere_id=payload.matiereId,
            module_id=payload.moduleId,
            cours_document_id=payload.coursDocumentId,
            document_personnel_id=payload.documentPersonnelId,
        )

        if not extraits:
            # Périmètre non encore indexé ou vide : on génère quand même à partir des
            # connaissances générales du modèle plutôt que d'échouer (UC14 étendu),
            # avec une mention explicite ajoutée par generer_contenu_fiche.
            sujet = await vectorstore.get_perimetre_label(
                matiere_id=payload.matiereId,
                module_id=payload.moduleId,
                cours_document_id=payload.coursDocumentId,
                document_personnel_id=payload.documentPersonnelId,
            )
            contenu = await rag.generer_contenu_fiche(payload.type, [], hors_cours=True, sujet=sujet)
        else:
            contenu = await rag.generer_contenu_fiche(payload.type, extraits)

        await callback.notifier_fiche_prete(payload.ficheRevisionId, "PRET", contenu)
    except Exception:
        logger.exception("Échec de génération de la fiche %s", payload.ficheRevisionId)
        await callback.notifier_fiche_prete(payload.ficheRevisionId, "ECHEC")


@router.post("/fiche", response_model=FicheAcceptedResponse, status_code=202)
async def generer_fiche(payload: FicheRequest, background_tasks: BackgroundTasks) -> FicheAcceptedResponse:
    """UC14 - Génère une fiche de révision de façon asynchrone (callback vers le backend Node à la fin)."""
    if not (payload.matiereId or payload.moduleId or payload.coursDocumentId or payload.documentPersonnelId):
        raise HTTPException(status_code=400, detail="Aucun périmètre fourni (matiere, module, document ou document personnel)")

    background_tasks.add_task(_traiter_generation_fiche, payload)
    return FicheAcceptedResponse(ficheRevisionId=payload.ficheRevisionId, statut="EN_COURS")
