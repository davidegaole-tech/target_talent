"""Client minimale per l'API di Ollama (solo localhost)."""
from __future__ import annotations

import json
import re
from collections.abc import AsyncIterator
from typing import Any, Protocol

import httpx

from .errors import OLLAMA_DOWN_MSG, AppError

Message = dict[str, str]
THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)
# Segnale emesso da chat_stream: il testo inviato finora era ragionamento interno, va scartato.
RESET = "\x00reset"


def strip_think(text: str) -> str:
    """Rimuove i blocchi <think>…</think> (anche se non chiusi all'inizio)."""
    text = THINK_RE.sub("", text)
    if "</think>" in text:
        text = text.split("</think>", 1)[1]
    return text.strip()


class LLMClient(Protocol):
    """Interfaccia usata dal resto dell'app: sostituibile con un client finto nei test."""

    async def health(self) -> bool: ...
    async def list_models(self) -> list[dict[str, Any]]: ...
    async def chat_json(self, model: str, messages: list[Message], schema: dict[str, Any], num_ctx: int) -> str: ...
    async def chat_text(self, model: str, messages: list[Message], num_ctx: int) -> str: ...
    def chat_stream(self, model: str, messages: list[Message], num_ctx: int) -> AsyncIterator[str]: ...


class OllamaClient:
    def __init__(self, base_url: str, timeout: float = 600.0) -> None:
        self.base_url = base_url.rstrip("/")
        self._timeout = httpx.Timeout(timeout, connect=5.0)
        self._think_supported: dict[str, bool] = {}
        # Modelli che ragionano sempre (es. le versioni "Thinking"): ignorano think=false e scrivono il
        # ragionamento nel testo. Per loro si chiede think=true, così Ollama lo separa nel campo "thinking".
        self._always_thinks: set[str] = set()

    def _client(self, timeout: httpx.Timeout | None = None) -> httpx.AsyncClient:
        return httpx.AsyncClient(base_url=self.base_url, timeout=timeout or self._timeout)

    async def health(self) -> bool:
        try:
            async with self._client(httpx.Timeout(3.0)) as c:
                r = await c.get("/api/version")
                return r.status_code == 200
        except httpx.HTTPError:
            return False

    async def list_models(self) -> list[dict[str, Any]]:
        try:
            async with self._client(httpx.Timeout(5.0)) as c:
                r = await c.get("/api/tags")
                r.raise_for_status()
        except httpx.HTTPError as e:
            raise AppError("ollama_unavailable", OLLAMA_DOWN_MSG, 503) from e
        return [{"name": m["name"], "size": m.get("size", 0)} for m in r.json().get("models", [])]

    def _payload(self, model: str, messages: list[Message], num_ctx: int, stream: bool, **extra: Any) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": stream,
            "options": {"temperature": extra.pop("temperature", 0.3), "num_ctx": num_ctx},
            **extra,
        }
        if model in self._always_thinks:
            payload["think"] = True
        elif self._think_supported.get(model, True):
            payload["think"] = False
        return payload

    def _note_leaked_thinking(self, model: str, payload: dict[str, Any], content: str) -> None:
        if payload.get("think") is False and "</think>" in content and "<think>" not in content:
            self._always_thinks.add(model)

    async def _post_chat(self, payload: dict[str, Any]) -> str:
        model = payload["model"]
        try:
            async with self._client() as c:
                r = await c.post("/api/chat", json=payload)
                if r.status_code == 400 and "think" in r.text.lower() and "think" in payload:
                    # Il modello non supporta il parametro "think": riprova senza.
                    self._think_supported[model] = False
                    payload.pop("think")
                    r = await c.post("/api/chat", json=payload)
                if r.status_code == 404:
                    raise AppError("model_not_found", f"Il modello «{model}» non è installato in Ollama.", 400)
                r.raise_for_status()
        except httpx.HTTPStatusError as e:
            raise AppError("ollama_error", f"Errore da Ollama: {e.response.text[:200]}", 502) from e
        except httpx.HTTPError as e:
            raise AppError("ollama_unavailable", OLLAMA_DOWN_MSG, 503) from e
        content = r.json().get("message", {}).get("content", "")
        self._note_leaked_thinking(model, payload, content)
        return strip_think(content)

    async def chat_json(self, model: str, messages: list[Message], schema: dict[str, Any], num_ctx: int) -> str:
        return await self._post_chat(self._payload(model, messages, num_ctx, False, format=schema))

    async def chat_text(self, model: str, messages: list[Message], num_ctx: int) -> str:
        return await self._post_chat(self._payload(model, messages, num_ctx, False))

    async def chat_stream(self, model: str, messages: list[Message], num_ctx: int) -> AsyncIterator[str]:
        payload = self._payload(model, messages, num_ctx, True, temperature=0.5)
        try:
            async with self._client() as c:
                async with c.stream("POST", "/api/chat", json=payload) as r:
                    if r.status_code == 400 and "think" in payload:
                        body = (await r.aread()).decode(errors="ignore")
                        if "think" in body.lower():
                            self._think_supported[model] = False
                            async for piece in self.chat_stream(model, messages, num_ctx):
                                yield piece
                            return
                    if r.status_code == 404:
                        raise AppError("model_not_found", f"Il modello «{model}» non è installato in Ollama.", 400)
                    r.raise_for_status()
                    in_think = False
                    async for line in r.aiter_lines():
                        if not line.strip():
                            continue
                        data = json.loads(line)
                        piece = data.get("message", {}).get("content", "")
                        # Filtra eventuali <think> inline nei modelli senza supporto a think=false.
                        if "<think>" in piece:
                            in_think = True
                            piece = piece.split("<think>", 1)[0]
                        if in_think and "</think>" in piece:
                            in_think = False
                            piece = piece.split("</think>", 1)[1]
                        elif in_think:
                            piece = ""
                        elif "</think>" in piece:
                            # Ragionamento senza <think> iniziale: quanto inviato finora va scartato.
                            self._note_leaked_thinking(model, payload, piece)
                            yield RESET
                            piece = piece.split("</think>", 1)[1].lstrip()
                        if piece:
                            yield piece
                        if data.get("done"):
                            break
        except httpx.HTTPStatusError as e:
            raise AppError("ollama_error", "Errore da Ollama durante la risposta.", 502) from e
        except httpx.HTTPError as e:
            raise AppError("ollama_unavailable", OLLAMA_DOWN_MSG, 503) from e
