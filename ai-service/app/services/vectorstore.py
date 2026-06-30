import uuid

from app.db import get_pool
from app.models import SourceDocument


async def delete_chunks_for_document(cours_document_id: str) -> None:
    pool = get_pool()
    await pool.execute("DELETE FROM document_chunk WHERE cours_document_id = $1", cours_document_id)


async def insert_chunks(cours_document_id: str, chunks: list[str], embeddings: list[list[float]]) -> int:
    pool = get_pool()
    # created_at omis : la colonne a DEFAULT CURRENT_TIMESTAMP côté Postgres.
    # Un datetime Python timezone-aware (UTC) ferait échouer asyncpg sur cette
    # colonne TIMESTAMP(3) sans fuseau ("can't subtract offset-naive and
    # offset-aware datetimes"), vérifié empiriquement.
    rows = [
        (str(uuid.uuid4()), cours_document_id, texte, position, embedding)
        for position, (texte, embedding) in enumerate(zip(chunks, embeddings, strict=True))
    ]
    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO document_chunk (id, cours_document_id, contenu_texte, position_index, embedding)
            VALUES ($1, $2, $3, $4, $5)
            """,
            rows,
        )
    return len(rows)


async def delete_chunks_for_document_personnel(document_personnel_id: str) -> None:
    pool = get_pool()
    await pool.execute("DELETE FROM document_personnel_chunk WHERE document_personnel_id = $1", document_personnel_id)


async def insert_chunks_personnel(document_personnel_id: str, chunks: list[str], embeddings: list[list[float]]) -> int:
    pool = get_pool()
    rows = [
        (str(uuid.uuid4()), document_personnel_id, texte, position, embedding)
        for position, (texte, embedding) in enumerate(zip(chunks, embeddings, strict=True))
    ]
    async with pool.acquire() as conn:
        await conn.executemany(
            """
            INSERT INTO document_personnel_chunk (id, document_personnel_id, contenu_texte, position_index, embedding)
            VALUES ($1, $2, $3, $4, $5)
            """,
            rows,
        )
    return len(rows)


MAX_CHUNKS_FICHE = 40


async def get_chunks_for_scope(
    matiere_id: str | None = None,
    module_id: str | None = None,
    cours_document_id: str | None = None,
    document_personnel_id: str | None = None,
) -> list[str]:
    """
    Récupère les chunks textuels pertinents pour la génération d'une fiche de
    révision (UC14), selon le périmètre choisi par l'étudiant (document précis,
    matière entière, module entier, ou document personnel uploadé par l'étudiant).
    """
    pool = get_pool()

    if document_personnel_id:
        rows = await pool.fetch(
            "SELECT contenu_texte FROM document_personnel_chunk WHERE document_personnel_id = $1 ORDER BY position_index LIMIT $2",
            document_personnel_id,
            MAX_CHUNKS_FICHE,
        )
    elif cours_document_id:
        rows = await pool.fetch(
            "SELECT contenu_texte FROM document_chunk WHERE cours_document_id = $1 ORDER BY position_index LIMIT $2",
            cours_document_id,
            MAX_CHUNKS_FICHE,
        )
    elif matiere_id:
        rows = await pool.fetch(
            """
            SELECT dc.contenu_texte FROM document_chunk dc
            JOIN cours_document cd ON cd.id = dc.cours_document_id
            WHERE cd.matiere_id = $1
            ORDER BY cd.date_depot DESC, dc.position_index
            LIMIT $2
            """,
            matiere_id,
            MAX_CHUNKS_FICHE,
        )
    elif module_id:
        rows = await pool.fetch(
            """
            SELECT dc.contenu_texte FROM document_chunk dc
            JOIN cours_document cd ON cd.id = dc.cours_document_id
            JOIN matiere m ON m.id = cd.matiere_id
            WHERE m.module_id = $1
            ORDER BY cd.date_depot DESC, dc.position_index
            LIMIT $2
            """,
            module_id,
            MAX_CHUNKS_FICHE,
        )
    else:
        return []

    return [row["contenu_texte"] for row in rows]


async def get_perimetre_label(
    matiere_id: str | None = None,
    module_id: str | None = None,
    cours_document_id: str | None = None,
    document_personnel_id: str | None = None,
) -> str:
    """Nom lisible du périmètre ciblé, utilisé comme contexte minimal en génération hors-cours (UC14)."""
    pool = get_pool()

    if document_personnel_id:
        row = await pool.fetchrow("SELECT titre FROM document_personnel WHERE id = $1", document_personnel_id)
    elif cours_document_id:
        row = await pool.fetchrow("SELECT titre FROM cours_document WHERE id = $1", cours_document_id)
    elif matiere_id:
        row = await pool.fetchrow("SELECT nom AS titre FROM matiere WHERE id = $1", matiere_id)
    elif module_id:
        row = await pool.fetchrow("SELECT nom AS titre FROM module WHERE id = $1", module_id)
    else:
        return "le sujet demandé"

    return row["titre"] if row else "le sujet demandé"


async def search_similar(filiere_id: str, query_embedding: list[float], top_k: int, threshold: float) -> list[SourceDocument]:
    """
    Recherche les chunks les plus proches sémantiquement (similarité cosinus via
    pgvector), restreints aux documents de la filière de l'utilisateur (UC13/UC15
    NFR "portée"). `1 - distance_cosinus` donne le score de similarité.
    """
    pool = get_pool()
    rows = await pool.fetch(
        """
        SELECT
            cd.id AS cours_document_id,
            cd.titre AS titre,
            dc.contenu_texte AS extrait,
            1 - (dc.embedding <=> $1) AS score
        FROM document_chunk dc
        JOIN cours_document cd ON cd.id = dc.cours_document_id
        JOIN matiere m ON m.id = cd.matiere_id
        JOIN module mo ON mo.id = m.module_id
        WHERE mo.filiere_id = $2
        ORDER BY dc.embedding <=> $1
        LIMIT $3
        """,
        query_embedding,
        filiere_id,
        top_k,
    )

    return [
        SourceDocument(
            coursDocumentId=row["cours_document_id"],
            titre=row["titre"],
            extrait=row["extrait"][:400],
            score=round(float(row["score"]), 4),
        )
        for row in rows
        if row["score"] >= threshold
    ]
