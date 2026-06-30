from fastapi import Header, HTTPException, status

from app.config import settings


async def verify_internal_secret(x_internal_secret: str = Header(default="")) -> None:
    """Authentifie les appels provenant exclusivement du backend Node (jamais exposé au frontend)."""
    if x_internal_secret != settings.internal_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Secret interne invalide")
