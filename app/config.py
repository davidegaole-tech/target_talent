"""Configurazione letta dalle variabili d'ambiente, con default sensati."""
from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent


def _load_dotenv(path: Path) -> None:
    """Carica un file .env minimale (KEY=VALUE) senza sovrascrivere l'ambiente."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


@dataclass(frozen=True)
class Config:
    ollama_url: str = "http://localhost:11434"
    model: str = "qwen3:8b"
    num_ctx: int = 8192
    port: int = 8765
    db_path: Path = BASE_DIR / "data" / "quaderno.db"
    web_dir: Path = BASE_DIR / "web"
    # Credenziali provvisorie, finché non ci sarà un database degli utenti
    login_user: str = "admin"
    login_password: str = "password"

    @property
    def documents_dir(self) -> Path:
        return self.db_path.parent / "documents"


def load_config() -> Config:
    _load_dotenv(BASE_DIR / ".env")
    db = Path(os.environ.get("QUADERNO_DB", "data/quaderno.db"))
    if not db.is_absolute():
        db = BASE_DIR / db
    return Config(
        ollama_url=os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/"),
        model=os.environ.get("QUADERNO_MODEL", "qwen3:8b"),
        num_ctx=int(os.environ.get("QUADERNO_NUM_CTX", "8192")),
        port=int(os.environ.get("QUADERNO_PORT", "8765")),
        db_path=db,
        login_user=os.environ.get("TALENT_USER", "admin"),
        login_password=os.environ.get("TALENT_PASSWORD", "password"),
    )
