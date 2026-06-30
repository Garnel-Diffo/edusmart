from typing import Literal

from groq import AsyncGroq

from app.config import settings

_client: AsyncGroq | None = None


def get_client() -> AsyncGroq:
    global _client
    if _client is None:
        _client = AsyncGroq(api_key=settings.groq_api_key)
    return _client


async def generer_completion(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_tokens: int = 2048,
    reasoning_effort: Literal["low", "medium", "high"] = "low",
) -> str:
    """
    gpt-oss-120b est un modèle de raisonnement : il consomme une partie de
    `max_tokens` en réflexion interne (non retournée) avant de produire la
    réponse finale. `reasoning_effort="low"` minimise ce surcoût pour respecter
    le NFR chatbot (UC13 : réponse < 10s pour 95% des requêtes) ; `max_tokens`
    est volontairement plus généreux que pour un modèle non-raisonneur.
    """
    client = get_client()
    completion = await client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        max_tokens=max_tokens,
        reasoning_effort=reasoning_effort,
    )
    return completion.choices[0].message.content or ""
