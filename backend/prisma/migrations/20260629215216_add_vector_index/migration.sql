-- Index HNSW pour la recherche de similarité cosinus sur les embeddings (UC13/UC15).
-- Construit explicitement via SQL brut : Prisma ne modélise pas nativement les
-- index spécifiques à pgvector (HNSW/IVFFLAT) dans son DSL de schéma.
CREATE INDEX IF NOT EXISTS "document_chunk_embedding_hnsw_idx"
  ON "document_chunk"
  USING hnsw ("embedding" vector_cosine_ops);
