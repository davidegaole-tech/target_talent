from __future__ import annotations

import json
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.config import Config
from app.db import Database
from app.main import create_app


class FakeClient:
    """Client Ollama finto: restituisce risposte preimpostate in ordine."""

    def __init__(self, responses: list[Any] | None = None, models: list[str] | None = None, up: bool = True) -> None:
        self.responses = list(responses or [])
        self.models = models if models is not None else ["qwen3:8b"]
        self.up = up
        self.calls: list[dict[str, Any]] = []

    def _next(self) -> str:
        if not self.responses:
            raise AssertionError("FakeClient: nessuna risposta preimpostata rimasta")
        r = self.responses.pop(0)
        if callable(r):
            r = r(self.calls[-1])
        return r if isinstance(r, str) else json.dumps(r, ensure_ascii=False)

    async def health(self) -> bool:
        return self.up

    async def list_models(self) -> list[dict[str, Any]]:
        return [{"name": m, "size": 5_000_000_000} for m in self.models]

    async def chat_json(self, model: str, messages: list, schema: dict, num_ctx: int) -> str:
        self.calls.append({"kind": "json", "model": model, "messages": messages, "schema": schema})
        return self._next()

    async def chat_text(self, model: str, messages: list, num_ctx: int) -> str:
        self.calls.append({"kind": "text", "model": model, "messages": messages})
        return self._next()

    async def chat_stream(self, model: str, messages: list, num_ctx: int) -> AsyncIterator[str]:
        self.calls.append({"kind": "stream", "model": model, "messages": messages})
        for piece in ["Ciao", ", sono ", "il tutor."]:
            yield piece


def make_quiz(n: int, prefix: str = "Domanda", title: str = "Quiz di prova") -> dict:
    return {
        "title": title,
        "questions": [
            {"q": f"{prefix} numero {i}?", "options": [f"Giusta {i}", f"Sbagliata A{i}", f"Sbagliata B{i}", f"Sbagliata C{i}"],
             "answer": 0, "explanation": "Perché sì."}
            for i in range(n)
        ],
    }


def make_cards(n: int, prefix: str = "Termine") -> dict:
    return {"title": "Flashcard di prova", "cards": [{"front": f"{prefix} {i}", "back": f"Definizione {i}."} for i in range(n)]}


SUMMARY = {"title": "Riassunto di prova", "text": "## Sezione\nUn testo di riassunto abbastanza lungo.", "keyPoints": ["uno", "due", "tre"]}


@pytest.fixture
def fake() -> FakeClient:
    return FakeClient()


@pytest.fixture
def client(tmp_path: Path, fake: FakeClient) -> TestClient:
    cfg = Config(db_path=tmp_path / "test.db")
    app = create_app(cfg, client=fake, db=Database(cfg.db_path))
    with TestClient(app) as c:
        yield c
