import logging

from fastapi import APIRouter, Depends, HTTPException

from app.deps import verify_internal_secret
from app.models import IndexRequest, IndexResponse
from app.services import document_extractor, embeddings, vectorstore
from app.services.chunking import decouper_en_chunks

logger = logging.getLogger("edusmart.ia.index")

router = APIRouter(prefix="/ia", tags=["indexation"], dependencies=[Depends(verify_internal_secret)])


@router.post("/index", response_model=IndexResponse)
async def indexer_document(payload: IndexRequest) -> IndexResponse:
    """UC3/UC4 - Indexation RAG d'un document pédagogique : extraction -> chunking -> embeddings -> pgvector."""
    try:
        contenu_binaire = await document_extractor.download_document(payload.cloudinaryUrl)
        texte = await document_extractor.extract_text(contenu_binaire, payload.format)
    except Exception as exc:
        logger.exception("Échec de récupération/extraction du document %s", payload.coursDocumentId)
        raise HTTPException(status_code=502, detail="Impossible de récupérer ou d'extraire le contenu du document") from exc

    chunks = decouper_en_chunks(texte)
    if not chunks:
        raise HTTPException(status_code=422, detail="Document trop court ou sans contenu textuel exploitable")

    vecteurs = embeddings.embed_texts(chunks)

    await vectorstore.delete_chunks_for_document(payload.coursDocumentId)
    nb_chunks = await vectorstore.insert_chunks(payload.coursDocumentId, chunks, vecteurs)

    logger.info("Document %s indexé avec %d chunks", payload.coursDocumentId, nb_chunks)
    return IndexResponse(coursDocumentId=payload.coursDocumentId, nbChunks=nb_chunks, statut="INDEXE")
