"""Modelli Pydantic per validare l'output del modello e JSON Schema passati a Ollama."""
from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

Kind = Literal["summary", "quiz", "flashcards"]

# Numeri predefiniti e limiti (§6.4)
DEFAULT_COUNT: dict[str, int] = {"quiz": 8, "flashcards": 12}
COUNT_RANGE: dict[str, tuple[int, int]] = {"quiz": (3, 20), "flashcards": (4, 40)}
FRONT_MAX = 120
BACK_MAX = 400
TITLE_MAX = 60


# --- Output del modello ---
class SummaryOut(BaseModel):
    title: str = Field(min_length=1)
    text: str = Field(min_length=20)
    keyPoints: list[str] = Field(min_length=3, max_length=6)


class QuizQuestion(BaseModel):
    q: str = Field(min_length=3)
    options: list[str] = Field(min_length=4, max_length=4)
    answer: int = Field(ge=0, le=3)
    explanation: str = ""


class QuizOut(BaseModel):
    title: str = Field(min_length=1)
    questions: list[QuizQuestion] = Field(min_length=1)


class Card(BaseModel):
    front: str = Field(min_length=1)
    back: str = Field(min_length=1)


class FlashcardsOut(BaseModel):
    title: str = Field(min_length=1)
    cards: list[Card] = Field(min_length=1)


OUTPUT_MODELS: dict[str, type[BaseModel]] = {"summary": SummaryOut, "quiz": QuizOut, "flashcards": FlashcardsOut}


# --- Richieste API ---
class GenerateRequest(BaseModel):
    kind: Kind
    text: str | None = None
    topic: str | None = None
    count: int | None = None
    source_name: str | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(min_length=1)
    context_text: str | None = None


class ItemPatch(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    best_score: int | None = Field(default=None, ge=0)


class SettingsIn(BaseModel):
    model: str = Field(min_length=1)


class ImportItem(BaseModel):
    id: str | None = None
    type: Kind
    title: str
    content: dict[str, Any]
    source_name: str | None = None
    model: str = "importato"
    best_score: int | None = None
    created_at: int | None = None


class ImportRequest(BaseModel):
    items: list[ImportItem]


# --- JSON Schema per Ollama (§6.1) ---
def summary_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "required": ["title", "text", "keyPoints"],
        "properties": {
            "title": {"type": "string"},
            "text": {"type": "string"},
            "keyPoints": {"type": "array", "items": {"type": "string"}, "minItems": 3, "maxItems": 6},
        },
    }


def quiz_schema(min_items: int = 3) -> dict[str, Any]:
    return {
        "type": "object",
        "required": ["title", "questions"],
        "properties": {
            "title": {"type": "string"},
            "questions": {
                "type": "array",
                "minItems": min_items,
                "items": {
                    "type": "object",
                    "required": ["q", "options", "answer", "explanation"],
                    "properties": {
                        "q": {"type": "string"},
                        "options": {"type": "array", "items": {"type": "string"}, "minItems": 4, "maxItems": 4},
                        "answer": {"type": "integer", "minimum": 0, "maximum": 3},
                        "explanation": {"type": "string"},
                    },
                },
            },
        },
    }


def flashcards_schema(min_items: int = 4) -> dict[str, Any]:
    return {
        "type": "object",
        "required": ["title", "cards"],
        "properties": {
            "title": {"type": "string"},
            "cards": {
                "type": "array",
                "minItems": min_items,
                "items": {
                    "type": "object",
                    "required": ["front", "back"],
                    "properties": {"front": {"type": "string"}, "back": {"type": "string"}},
                },
            },
        },
    }


# --- Analisi delle prove di Talent Radar ---
COMPETENCES: dict[str, str] = {
    "alfabetica": "Alfabetica funzionale: leggere, scrivere, argomentare, comprendere testi",
    "multilingue": "Multilinguistica: usare lingue straniere in contesti reali",
    "stem": "Matematica, scienze, tecnologie e ingegneria: logica, metodo scientifico, progettazione tecnica",
    "digitale": "Digitale: creare contenuti e strumenti digitali, programmare, usare software in modo consapevole",
    "personale": "Personale, sociale e imparare a imparare: costanza, gestione del tempo, autoregolazione, relazioni",
    "cittadinanza": "Cittadinanza: impegno civico, volontariato, ambiente, responsabilità verso la comunità",
    "imprenditoriale": "Imprenditoriale: iniziativa, organizzazione, guida di un gruppo, gestione di progetti e budget",
    "cultura": "Consapevolezza ed espressione culturali: arte, musica, teatro, fotografia, design, letteratura",
}
ANALYSIS_TYPES = ("foto", "link", "testo", "voce")
REASON_MAX = 220
SIGNAL_MAX = 40


class AnalyzeRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    kind: str | None = None


class AnalysisCompetence(BaseModel):
    id: str
    p: float = Field(ge=0, le=1)


class AnalysisOut(BaseModel):
    competences: list[AnalysisCompetence] = Field(min_length=1)
    reason: str = Field(min_length=3)
    signals: list[str] = Field(default_factory=list)
    suggestion: str | None = None


SUGGESTION_MAX = 320
DOCUMENT_KINDS: dict[str, str] = {
    "attestato": "attestato di partecipazione",
    "certificato": "certificazione ufficiale (es. lingua, informatica)",
    "corso": "corso frequentato",
    "esperienza": "esperienza documentata",
    "altro": "altro documento",
    "appunti": "appunti di studio",
}


class LoginRequest(BaseModel):
    username: str = Field(max_length=100)
    password: str = Field(max_length=200)


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=40)
    password: str = Field(min_length=6, max_length=200)
    role: Literal["studente", "lavoratore", "studente-lavoratore"] = "studente"
    display_name: str | None = Field(default=None, max_length=80)
    email: str | None = Field(default=None, max_length=200)


class StatePayload(BaseModel):
    state: dict[str, Any]


def analysis_schema(with_suggestion: bool = False) -> dict[str, Any]:
    schema = _analysis_schema()
    if with_suggestion:
        schema["required"].append("suggestion")
        schema["properties"]["suggestion"] = {"type": "string"}
    return schema


def _analysis_schema() -> dict[str, Any]:
    return {
        "type": "object",
        "required": ["competences", "reason", "signals"],
        "properties": {
            "competences": {
                "type": "array",
                "minItems": 1,
                "maxItems": 3,
                "items": {
                    "type": "object",
                    "required": ["id", "p"],
                    "properties": {
                        "id": {"type": "string", "enum": list(COMPETENCES)},
                        "p": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                },
            },
            "reason": {"type": "string"},
            "signals": {"type": "array", "items": {"type": "string"}, "minItems": 1, "maxItems": 5},
        },
    }
