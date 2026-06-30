from app.config import settings
from app.models import ChatResponse, SourceDocument
from app.services import embeddings, groq_client, vectorstore

MESSAGE_AUCUN_DOCUMENT = (
    "Aucun support de cours indexé ne correspond à votre question pour le moment. "
    "Essayez de reformuler ou consultez directement la section Cours de votre filière."
)

SYSTEM_PROMPT_CHAT = """Tu es l'assistant pédagogique d'EduSmart, spécialisé exclusivement dans le contenu \
académique des cours déposés par les enseignants. Réponds en français, de façon claire et structurée, \
en te basant UNIQUEMENT sur les extraits de cours fournis dans le contexte ci-dessous. \
Cite les documents sources pertinents par leur titre. \
Si le contexte fourni ne permet pas de répondre à la question (hors-sujet ou non couvert par les cours), \
réponds poliment que tu es spécialisé sur le contenu académique des cours de la filière et que tu ne peux \
pas répondre à cette question précise."""


def _construire_contexte(sources: list[SourceDocument]) -> str:
    return "\n\n".join(f"[Source: {s.titre}]\n{s.extrait}" for s in sources)


async def repondre_question(question: str, filiere_id: str) -> ChatResponse:
    """UC13 - Pipeline RAG complet : embedding -> recherche vectorielle -> génération LLM sourcée."""
    query_embedding = embeddings.embed_query(question)
    sources = await vectorstore.search_similar(filiere_id, query_embedding, settings.rag_top_k, settings.rag_similarity_threshold)

    if not sources:
        return ChatResponse(reponse=MESSAGE_AUCUN_DOCUMENT, sources=[], modeDegrade=False)

    contexte = _construire_contexte(sources)
    user_prompt = f"Contexte (extraits de cours) :\n{contexte}\n\nQuestion de l'étudiant : {question}"

    try:
        reponse = await groq_client.generer_completion(SYSTEM_PROMPT_CHAT, user_prompt)
        return ChatResponse(reponse=reponse, sources=sources, modeDegrade=False)
    except Exception:
        # UC13 - 6a : LLM indisponible -> mode dégradé, on renvoie les passages RAG bruts.
        passages_bruts = "\n\n".join(f"• {s.titre} : {s.extrait}" for s in sources)
        return ChatResponse(
            reponse=f"Le service de génération est temporairement indisponible. Voici les passages les plus pertinents trouvés :\n\n{passages_bruts}",
            sources=sources,
            modeDegrade=True,
        )


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


async def generer_contenu_fiche(type_fiche: str, extraits: list[str]) -> str:
    """UC14 - Génération de fiche/résumé/quiz à partir des chunks pertinents du pipeline RAG."""
    contexte = "\n\n".join(extraits)
    instruction = PROMPTS_FICHE[type_fiche]
    system_prompt = (
        "Tu es l'assistant pédagogique d'EduSmart. Tu génères des supports de révision en français, "
        "clairs, structurés et fidèles au contenu fourni, sans inventer d'information absente du contexte."
    )
    user_prompt = f"{instruction}\n\nExtraits de cours :\n{contexte}"
    # UC14 NFR : 20s de budget (vs 10s pour le chat) -> reasoning_effort "medium"
    # pour une meilleure qualité de synthèse, sans risquer le timeout.
    return await groq_client.generer_completion(system_prompt, user_prompt, temperature=0.4, max_tokens=4096, reasoning_effort="medium")
