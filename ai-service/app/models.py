from typing import Literal

from pydantic import BaseModel


class IndexRequest(BaseModel):
    coursDocumentId: str
    cloudinaryUrl: str
    format: Literal["PDF", "PPTX", "DOCX"]


class IndexResponse(BaseModel):
    coursDocumentId: str
    nbChunks: int
    statut: Literal["INDEXE"]


class IndexPersonnelRequest(BaseModel):
    documentPersonnelId: str
    cloudinaryUrl: str
    format: Literal["PDF", "PPTX", "DOCX", "IMAGE"]


class IndexPersonnelResponse(BaseModel):
    documentPersonnelId: str
    nbChunks: int
    statut: Literal["INDEXE"]


class ChatRequest(BaseModel):
    question: str
    filiereId: str
    utilisateurId: str


class SourceDocument(BaseModel):
    coursDocumentId: str
    titre: str
    extrait: str
    score: float


ModeReponse = Literal["COURS", "CONNAISSANCES_GENERALES"]


class ChatResponse(BaseModel):
    reponse: str
    sources: list[SourceDocument]
    modeReponse: ModeReponse = "COURS"
    modeDegrade: bool = False


class SearchRequest(BaseModel):
    requete: str
    filiereId: str


class SearchResponse(BaseModel):
    resultats: list[SourceDocument]


class FicheRequest(BaseModel):
    ficheRevisionId: str
    type: Literal["FICHE_RESUME", "RESUME_DETAILLE", "QUIZ_QCM"]
    matiereId: str | None = None
    moduleId: str | None = None
    coursDocumentId: str | None = None
    documentPersonnelId: str | None = None


class FicheAcceptedResponse(BaseModel):
    ficheRevisionId: str
    statut: Literal["EN_COURS"]
