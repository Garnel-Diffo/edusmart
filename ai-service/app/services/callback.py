import logging

import httpx

from app.config import settings

logger = logging.getLogger("edusmart.ia.callback")


async def notifier_fiche_prete(fiche_revision_id: str, statut: str, contenu_genere: str | None = None) -> None:
    """Callback serveur-à-serveur vers le backend Node une fois la génération terminée (UC14)."""
    payload = {"ficheRevisionId": fiche_revision_id, "statut": statut}
    if contenu_genere is not None:
        payload["contenuGenere"] = contenu_genere

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(
                f"{settings.backend_url}/api/ia/fiche/callback",
                json=payload,
                headers={"X-Internal-Secret": settings.internal_secret},
            )
    except Exception:
        logger.exception("Échec de notification du backend Node pour la fiche %s", fiche_revision_id)
