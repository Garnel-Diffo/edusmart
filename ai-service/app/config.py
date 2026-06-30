from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuration centralisée, chargée depuis les variables d'environnement (.env)."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    port: int = 8000

    database_url: str
    internal_secret: str
    backend_url: str = "http://localhost:4000"

    groq_api_key: str
    # llama-3.3-70b-versatile est déprécié par Groq (retrait le 16/08/2026) ;
    # gpt-oss-120b est le modèle de remplacement recommandé (production, plus rapide).
    groq_model: str = "openai/gpt-oss-120b"

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    embedding_dimensions: int = 384

    rag_top_k: int = 5
    rag_similarity_threshold: float = 0.7
    chunk_size_chars: int = 1000
    chunk_overlap_chars: int = 150

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


settings = Settings()
