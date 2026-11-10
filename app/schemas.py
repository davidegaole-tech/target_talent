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
