import asyncpg
from pgvector.asyncpg import register_vector

from app.config import settings

_pool: asyncpg.Pool | None = None


async def _init_connection(conn: asyncpg.Connection) -> None:
    await register_vector(conn)


async def connect_db() -> None:
    """Crée le pool de connexions asyncpg vers Neon Postgres (appelé au démarrage de l'app)."""
    global _pool
    _pool = await asyncpg.create_pool(
        dsn=settings.database_url,
        min_size=1,
        max_size=5,
        init=_init_connection,
        statement_cache_size=0,  # requis avec le pooler Neon (pgbouncer en mode transaction)
    )


async def disconnect_db() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Le pool de connexions n'est pas initialisé (connect_db() non appelé)")
    return _pool
