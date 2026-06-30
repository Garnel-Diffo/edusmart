from app.config import settings
from app.models import ChatResponse, SourceDocument
from app.services import embeddings, groq_client, vectorstore

SYSTEM_PROMPT_CHAT_COURS = """Tu es l'assistant pédagogique d'EduSmart. Réponds en français, de façon claire et \
structurée, en te basant PRINCIPALEMENT sur les extraits de cours fournis dans le contexte ci-dessous, et cite les \
documents sources pertinents par leur titre. Si ces extraits ne couvrent que partiellement la question, tu peux \
compléter avec tes connaissances générales pour rendre la réponse plus utile, mais tu dois alors introduire \
clairement cette partie complémentaire par la phrase exacte "Au-delà de vos supports de cours :" avant de la \
rédiger, afin que l'étudiant distingue toujours ce qui vient de ses cours de ce qui n'en vient pas."""

SYSTEM_PROMPT_CHAT_GENERAL = """Tu es l'assistant pédagogique d'EduSmart. Aucun support de cours indexé ne couvre \
la question posée par l'étudiant. Réponds quand même en français, de façon claire, structurée et utile, en \
t'appuyant sur tes connaissances générales. Commence IMPÉRATIVEMENT ta réponse par la phrase exacte : "Aucun \
support de cours ne couvre cette question. Voici une réponse basée sur mes connaissances générales :" suivie d'un \
saut de ligne, puis ta réponse."""


def _construire_contexte(sources: list[SourceDocument]) -> str:
    return "\n\n".join(f"[Source: {s.titre}]\n{s.extrait}" for s in sources)


async def repondre_question(question: str, filiere_id: str) -> ChatResponse:
    """UC13 - Pipeline RAG : embedding -> recherche vectorielle -> génération LLM, sourcée si possible,
    complétée ou remplacée par les connaissances générales du modèle sinon (avec disclosure explicite)."""
    query_embedding = embeddings.embed_query(question)
    sources = await vectorstore.search_similar(filiere_id, query_embedding, settings.rag_top_k, settings.rag_similarity_threshold)

    if sources:
        contexte = _construire_contexte(sources)
        user_prompt = f"Contexte (extraits de cours) :\n{contexte}\n\nQuestion de l'étudiant : {question}"
        system_prompt = SYSTEM_PROMPT_CHAT_COURS
        mode_reponse = "COURS"
    else:
        user_prompt = f"Question de l'étudiant : {question}"
        system_prompt = SYSTEM_PROMPT_CHAT_GENERAL
        mode_reponse = "CONNAISSANCES_GENERALES"

    try:
        reponse = await groq_client.generer_completion(system_prompt, user_prompt)
        return ChatResponse(reponse=reponse, sources=sources, modeReponse=mode_reponse, modeDegrade=False)
    except Exception:
        # UC13 - 6a : LLM indisponible -> mode dégradé, on renvoie les passages RAG bruts (s'il y en a).
        if sources:
            passages_bruts = "\n\n".join(f"• {s.titre} : {s.extrait}" for s in sources)
            reponse_degradee = f"Le service de génération est temporairement indisponible. Voici les passages les plus pertinents trouvés :\n\n{passages_bruts}"
        else:
            reponse_degradee = "Le service de génération est temporairement indisponible et aucun support de cours ne correspond à votre question. Veuillez réessayer plus tard."
        return ChatResponse(reponse=reponse_degradee, sources=sources, modeReponse=mode_reponse, modeDegrade=True)


async def rechercher_semantique(requete: str, filiere_id: str) -> list[SourceDocument]:
    """UC15 - Recherche sémantique pure (sans génération LLM)."""
    query_embedding = embeddings.embed_query(requete)
    return await vectorstore.search_similar(filiere_id, query_embedding, settings.rag_top_k, settings.rag_similarity_threshold)


PROMPTS_FICHE = {
    "FICHE_RESUME": (
        "Génère une fiche de révision concise (format Markdown, titres ## et listes à puces) "
        "résumant les notions clés des extraits de cours fournis. Maximum 400 mots."
    ),
    "RESUME_DETAILLE": (
        "Génère un résumé détaillé et structuré (format Markdown, titres ## et sous-titres ###) "
        "couvrant l'ensemble des notions importantes des extraits de cours fournis, avec explications."
    ),
    "QUIZ_QCM": (
        "Génère un quiz de 8 questions à choix multiples (format Markdown) basé sur les extraits de cours "
        "fournis, avec 4 propositions par question et la bonne réponse indiquée en gras à la fin de chaque question."
    ),
}


MENTION_HORS_COURS = (
    "_Contenu généré à partir des connaissances générales de l'IA, aucun support de cours disponible "
    "pour ce périmètre._\n\n"
)


async def generer_contenu_fiche(type_fiche: str, extraits: list[str], hors_cours: bool = False, sujet: str = "") -> str:
    """UC14 - Génération de fiche/résumé/quiz à partir des chunks pertinents du pipeline RAG, ou à
    partir des connaissances générales du modèle quand aucun chunk n'est disponible pour le périmètre
    choisi (`hors_cours=True`), avec une mention explicite ajoutée en tête du contenu généré."""
    instruction = PROMPTS_FICHE[type_fiche]

    if hors_cours:
        system_prompt = (
            "Tu es l'assistant pédagogique d'EduSmart. Aucun support de cours n'est disponible pour le périmètre "
            "demandé. Tu génères quand même un support de révision en français, clair et structuré, à partir de "
            "tes connaissances générales sur le sujet indiqué."
        )
        user_prompt = f"{instruction}\n\nSujet : {sujet}"
        # UC14 NFR : 20s de budget -> reasoning_effort "medium".
        contenu = await groq_client.generer_completion(system_prompt, user_prompt, temperature=0.4, max_tokens=4096, reasoning_effort="medium")
        return MENTION_HORS_COURS + contenu

    contexte = "\n\n".join(extraits)
    system_prompt = (
        "Tu es l'assistant pédagogique d'EduSmart. Tu génères des supports de révision en français, "
        "clairs, structurés et fidèles au contenu fourni, sans inventer d'information absente du contexte."
    )
    user_prompt = f"{instruction}\n\nExtraits de cours :\n{contexte}"
    # UC14 NFR : 20s de budget (vs 10s pour le chat) -> reasoning_effort "medium"
    # pour une meilleure qualité de synthèse, sans risquer le timeout.
    return await groq_client.generer_completion(system_prompt, user_prompt, temperature=0.4, max_tokens=4096, reasoning_effort="medium")
