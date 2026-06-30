import logging

from fastapi import APIRouter, Depends, HTTPException

from app.deps import verify_internal_secret
from app.models import IndexPersonnelRequest, IndexPersonnelResponse
from app.services import document_extractor, embeddings, vectorstore
from app.services.chunking import decouper_en_chunks

logger = logging.getLogger("edusmart.ia.index-personnel")

router = APIRouter(prefix="/ia", tags=["indexation-personnelle"], dependencies=[Depends(verify_internal_secret)])


@router.post("/index-personnel", response_model=IndexPersonnelResponse)
async def indexer_document_personnel(payload: IndexPersonnelRequest) -> IndexPersonnelResponse:
    """UC14 étendu - Indexation RAG d'un support personnel uploadé par un étudiant (PDF/PPTX/DOCX/IMAGE,
    OCR via LLM vision pour les images) : extraction -> chunking -> embeddings -> pgvector, isolé des
    chunks de cours officiels (table document_personnel_chunk, jamais accessible aux autres étudiants)."""
    try:
        contenu_binaire = await document_extractor.download_document(payload.cloudinaryUrl)
        texte = await document_extractor.extract_text(contenu_binaire, payload.format)
    except Exception as exc:
        logger.exception("Échec de récupération/extraction du document personnel %s", payload.documentPersonnelId)
        raise HTTPException(status_code=502, detail="Impossible de récupérer ou d'extraire le contenu du document") from exc

    chunks = decouper_en_chunks(texte)
    if not chunks:
        raise HTTPException(status_code=422, detail="Document trop court ou sans contenu textuel exploitable")

    vecteurs = embeddings.embed_texts(chunks)

    await vectorstore.delete_chunks_for_document_personnel(payload.documentPersonnelId)
    nb_chunks = await vectorstore.insert_chunks_personnel(payload.documentPersonnelId, chunks, vecteurs)

    logger.info("Document personnel %s indexé avec %d chunks", payload.documentPersonnelId, nb_chunks)
    return IndexPersonnelResponse(documentPersonnelId=payload.documentPersonnelId, nbChunks=nb_chunks, statut="INDEXE")
