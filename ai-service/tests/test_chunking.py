from app.services.chunking import decouper_en_chunks


def test_texte_court_retourne_un_seul_chunk():
    texte = "Ceci est un court texte de cours."
    chunks = decouper_en_chunks(texte, taille=1000, overlap=100)
    assert chunks == [texte]


def test_texte_vide_ne_retourne_aucun_chunk():
    assert decouper_en_chunks("", taille=1000, overlap=100) == []
    assert decouper_en_chunks("   \n\n  ", taille=1000, overlap=100) == []


def test_texte_long_est_decoupe_en_plusieurs_chunks():
    paragraphe = "Phrase de cours numero %d sur l'architecture logicielle. "
    texte = "\n\n".join(paragraphe % i for i in range(50))
    chunks = decouper_en_chunks(texte, taille=500, overlap=50)

    assert len(chunks) > 1
    for chunk in chunks:
        assert len(chunk) <= 600  # tolérance pour la recherche de frontière de coupure


def test_chunks_se_chevauchent_legerement():
    texte = "A" * 300 + "\n\n" + "B" * 300 + "\n\n" + "C" * 300
    chunks = decouper_en_chunks(texte, taille=350, overlap=50)
    assert len(chunks) >= 2
