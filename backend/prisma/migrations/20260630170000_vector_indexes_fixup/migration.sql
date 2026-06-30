-- Recrée l'index HNSW de document_chunk : la migration précédente
-- (refonte_ia_edt_delegue_filiere) l'a fait apparaître comme drift et l'a
-- supprimé, Prisma ne modélisant pas nativement les index pgvector dans son
-- DSL de schéma (cf. migration add_vector_index). Ajoute aussi l'index
-- équivalent sur document_personnel_chunk (UC14 étendu, supports personnels).
CREATE INDEX IF NOT EXISTS "document_chunk_embedding_hnsw_idx"
  ON "document_chunk"
  USING hnsw ("embedding" vector_cosine_ops);

CREATE INDEX IF NOT EXISTS "document_personnel_chunk_embedding_hnsw_idx"
  ON "document_personnel_chunk"
  USING hnsw ("embedding" vector_cosine_ops);
