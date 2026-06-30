from sentence_transformers import SentenceTransformer

from app.config import settings

_model: SentenceTransformer | None = None


def load_model() -> None:
    """Charge le modèle d'embeddings en mémoire (appelé une fois au démarrage de l'application)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(settings.embedding_model)


def get_model() -> SentenceTransformer:
    if _model is None:
        raise RuntimeError("Le modèle d'embeddings n'est pas chargé (load_model() non appelé)")
    return _model


def embed_texts(textes: list[str]) -> list[list[float]]:
    """Calcule les embeddings normalisés (similarité cosinus directe via produit scalaire)."""
    model = get_model()
    vecteurs = model.encode(textes, normalize_embeddings=True, show_progress_bar=False)
    return [v.tolist() for v in vecteurs]


def embed_query(texte: str) -> list[float]:
    return embed_texts([texte])[0]
