import re

from app.config import settings


def _normaliser_espaces(texte: str) -> str:
    return re.sub(r"\n{3,}", "\n\n", texte).strip()


def decouper_en_chunks(texte: str, taille: int | None = None, overlap: int | None = None) -> list[str]:
    """
    Découpe un texte en segments d'environ `taille` caractères avec un
    chevauchement `overlap`, en essayant de couper sur des frontières de
    paragraphe ou de phrase plutôt qu'au milieu d'un mot.
    """
    taille = taille or settings.chunk_size_chars
    overlap = overlap if overlap is not None else settings.chunk_overlap_chars
    texte = _normaliser_espaces(texte)

    if len(texte) <= taille:
        return [texte] if texte else []

    chunks: list[str] = []
    debut = 0
    while debut < len(texte):
        fin = min(debut + taille, len(texte))

        if fin < len(texte):
            coupure = texte.rfind("\n\n", debut, fin)
            if coupure == -1 or coupure <= debut:
                coupure = texte.rfind(". ", debut, fin)
            if coupure != -1 and coupure > debut:
                fin = coupure + 1

        segment = texte[debut:fin].strip()
        if segment:
            chunks.append(segment)

        debut = max(fin - overlap, debut + 1)

    return chunks
