"""Stato condiviso dell'app e risoluzione del modello attivo."""
from __future__ import annotations

from dataclasses import dataclass

from fastapi import Request

from .config import Config
from .db import Database
from .ollama_client import LLMClient


@dataclass
class Services:
    config: Config
    db: Database
    client: LLMClient


@dataclass
class ModelStatus:
    ollama: bool
    configured: str
    model: str
    installed: bool
    warning: str | None = None


def get_services(request: Request) -> Services:
    return request.app.state.services


def configured_model(s: Services) -> str:
    return s.db.get_setting("model") or s.config.model


async def resolve_model(s: Services) -> ModelStatus:
    """Modello scelto (impostazioni > env); se non installato usa il primo disponibile con un avviso."""
    wanted = configured_model(s)
    if not await s.client.health():
        return ModelStatus(False, wanted, wanted, False)
    names = [m["name"] for m in await s.client.list_models()]
    if wanted in names or f"{wanted}:latest" in names:
        return ModelStatus(True, wanted, wanted if wanted in names else f"{wanted}:latest", True)
    if not names:
        return ModelStatus(True, wanted, wanted, False,
                           f"Nessun modello installato in Ollama. Esegui: ollama pull {wanted}")
    return ModelStatus(True, wanted, names[0], False,
                       f"Il modello «{wanted}» non è installato: uso «{names[0]}». "
                       f"Per installarlo: ollama pull {wanted}")
