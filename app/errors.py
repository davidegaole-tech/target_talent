"""Errori applicativi con messaggio in italiano per l'utente."""
from __future__ import annotations


class AppError(Exception):
    def __init__(self, code: str, message: str, status: int = 400) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.status = status

    def to_dict(self) -> dict:
        return {"error": {"code": self.code, "message": self.message}}


GENERATION_FAILED_MSG = "Il modello non è riuscito a creare la scheda. Riprova o scegli un modello più grande."
OLLAMA_DOWN_MSG = "Ollama non risponde. Avvia Ollama e ricarica la pagina."
