"""Configurazione letta dalle variabili d'ambiente, con default sensati."""
from __future__ import annotations

import os
import shutil
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
    # Interfaccia di ascolto: 127.0.0.1 = solo questo PC, 0.0.0.0 = anche dalla rete locale
    host: str = "127.0.0.1"
    db_path: Path = BASE_DIR / "data" / "quaderno.db"
    # Motore del database: "sqlite" (file locale) oppure "mysql" (XAMPP)
    db_driver: str = "sqlite"
    mysql_host: str = "127.0.0.1"
    mysql_port: int = 3306
    mysql_user: str = "root"
    mysql_password: str = ""
    mysql_database: str = "talent_radar"
    web_dir: Path = BASE_DIR / "web"
    # Credenziali provvisorie, finché non ci sarà un database degli utenti
    login_user: str = "admin"
    login_password: str = "password"

    @property
    def documents_dir(self) -> Path:
        return self.db_path.parent / "documents"

    @property
    def attachments_dir(self) -> Path:
        return self.db_path.parent / "attachments"


def _migrate_legacy_db(db: Path) -> None:
    """Se il nuovo DB non esiste ma c'è il vecchio quaderno.db, lo copia."""
    legacy = BASE_DIR / "data" / "quaderno.db"
    if db.exists() or not legacy.exists() or legacy.resolve() == db.resolve():
        return
    db.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(legacy, db)


def load_config() -> Config:
    _load_dotenv(BASE_DIR / ".env")
    db = Path(os.environ.get("TALENT_DB") or os.environ.get("QUADERNO_DB", "data/talent.db"))
    if not db.is_absolute():
        db = BASE_DIR / db
    _migrate_legacy_db(db)
    driver = os.environ.get("TALENT_DB_DRIVER", "sqlite").strip().lower()
    return Config(
        ollama_url=os.environ.get("OLLAMA_URL", "http://localhost:11434").rstrip("/"),
        model=os.environ.get("QUADERNO_MODEL", "qwen3:8b"),
        num_ctx=int(os.environ.get("QUADERNO_NUM_CTX", "8192")),
        port=int(os.environ.get("QUADERNO_PORT", "8765")),
        host=os.environ.get("QUADERNO_HOST", "127.0.0.1").strip(),
        db_path=db,
        db_driver="mysql" if driver == "mysql" else "sqlite",
        mysql_host=os.environ.get("TALENT_MYSQL_HOST", "127.0.0.1"),
        mysql_port=int(os.environ.get("TALENT_MYSQL_PORT", "3306")),
        mysql_user=os.environ.get("TALENT_MYSQL_USER", "root"),
        mysql_password=os.environ.get("TALENT_MYSQL_PASSWORD", ""),
        mysql_database=os.environ.get("TALENT_MYSQL_DATABASE", "talent_radar"),
        login_user=os.environ.get("TALENT_USER", "admin"),
        login_password=os.environ.get("TALENT_PASSWORD", "password"),
    )
