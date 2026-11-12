"""Accesso SQLite: schede e impostazioni."""
from __future__ import annotations

import json
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Any

SCHEMA = """
CREATE TABLE IF NOT EXISTS items (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL CHECK (type IN ('summary','quiz','flashcards')),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  source_name TEXT,
  model       TEXT NOT NULL,
  best_score  INTEGER,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_items_created ON items(created_at DESC);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS documents (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  kind        TEXT NOT NULL,
  date        TEXT,
  note        TEXT,
  filename    TEXT NOT NULL,
  mime        TEXT NOT NULL,
  size        INTEGER NOT NULL,
  text        TEXT,                 -- testo estratto (se il formato lo permette)
  analysis    TEXT,                 -- JSON dell'analisi AI, se fatta
  created_at  INTEGER NOT NULL
);

-- ---------------------------------------------------------------------------
-- Utenti, sessioni e dati del passaporto (Fase 0)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email         TEXT UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'studente'
                CHECK (role IN ('studente','lavoratore','studente-lavoratore')),
  display_name  TEXT,
  created_at    INTEGER NOT NULL,
  last_login_at INTEGER
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Profilo pubblico dell'utente (JSON: nome, scuola, titoli, sport, ...)
CREATE TABLE IF NOT EXISTS profiles (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER
);

-- Snapshot completo dello stato dell'app (prove, impostazioni, ...)
CREATE TABLE IF NOT EXISTS user_state (
  user_id    TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Tabelle normalizzate: copia interrogabile dei dati contenuti nello stato
CREATE TABLE IF NOT EXISTS evidences (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titolo     TEXT NOT NULL,
  descrizione TEXT,
  tipo       TEXT,
  ambito     TEXT,
  data       TEXT,
  comp       TEXT,              -- JSON array di competenze
  dims       TEXT,              -- JSON array di dimensioni
  confidenza TEXT,
  perche     TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_evidences_user ON evidences(user_id, data DESC);

CREATE TABLE IF NOT EXISTS subjects (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nome       TEXT NOT NULL,
  colore     TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id);

CREATE TABLE IF NOT EXISTS grades (
  id         TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  voto       REAL NOT NULL CHECK (voto >= 1 AND voto <= 10),
  tipo       TEXT,
  data       TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);

CREATE TABLE IF NOT EXISTS planner_items (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titolo     TEXT NOT NULL,
  descrizione TEXT,
  data       TEXT,
  completato INTEGER NOT NULL DEFAULT 0,
  comp       TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_planner_user ON planner_items(user_id, data);

CREATE TABLE IF NOT EXISTS notes (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  titolo     TEXT,
  testo      TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS attachments (
  id         TEXT PRIMARY KEY,
  kind       TEXT NOT NULL DEFAULT 'foto',
  filename   TEXT NOT NULL,
  mime       TEXT NOT NULL,
  size       INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
"""

DOC_PUBLIC = ("id, title, kind, date, note, filename, mime, size, analysis, created_at, "
              "(text IS NOT NULL) AS has_text, (filename IS NOT NULL AND filename <> '') AS has_file")

ITEM_TYPES = ("summary", "quiz", "flashcards")


def _row_to_item(row: sqlite3.Row) -> dict[str, Any]:
    item = dict(row)
    item["content"] = json.loads(item["content"])
    return item


class Database:
    def __init__(self, path: Path | str) -> None:
        self.path = str(path)
        if self.path != ":memory:":
            Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript(SCHEMA)
        self.conn.commit()
        # Pulizia delle vecchie tabelle social (la sezione Amici è stata rimossa).
        for table in ("messages", "friendships"):
            try:
                count = self.conn.execute(f"SELECT COUNT(*) AS c FROM {table}").fetchone()["c"]
                if count == 0:
                    self.conn.execute(f"DROP TABLE IF EXISTS {table}")
            except sqlite3.OperationalError:
                pass
        self.conn.commit()

    def close(self) -> None:
        self.conn.close()

    # --- items ---
    def list_items(self, type_: str | None = None, q: str | None = None,
                   user_id: str | None = None) -> list[dict[str, Any]]:
        sql = "SELECT * FROM items WHERE 1=1"
        args: list[Any] = []
        if type_:
            sql += " AND type = ?"
            args.append(type_)
        if q:
            sql += " AND lower(title) LIKE ?"
            args.append(f"%{q.lower()}%")
        sql += " ORDER BY created_at DESC"
        return [_row_to_item(r) for r in self.conn.execute(sql, args)]

    def get_item(self, item_id: str) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT * FROM items WHERE id = ?", (item_id,)).fetchone()
        return _row_to_item(row) if row else None

    def create_item(
        self,
        type_: str,
        title: str,
        content: dict[str, Any],
        model: str,
        source_name: str | None = None,
        item_id: str | None = None,
        best_score: int | None = None,
        created_at: int | None = None,
        user_id: str | None = None,
    ) -> dict[str, Any]:
        item_id = item_id or uuid.uuid4().hex
        created_at = created_at or int(time.time() * 1000)
        self.conn.execute(
            "INSERT INTO items (id, type, title, content, source_name, model, best_score, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (item_id, type_, title, json.dumps(content, ensure_ascii=False), source_name, model, best_score, created_at),
        )
        self.conn.commit()
        item = self.get_item(item_id)
        assert item is not None
        return item

    def update_item(self, item_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
        allowed = {k: v for k, v in fields.items() if k in ("title", "best_score")}
        if allowed:
            cols = ", ".join(f"{k} = ?" for k in allowed)
            self.conn.execute(f"UPDATE items SET {cols} WHERE id = ?", (*allowed.values(), item_id))
            self.conn.commit()
        return self.get_item(item_id)

    def delete_item(self, item_id: str) -> bool:
        cur = self.conn.execute("DELETE FROM items WHERE id = ?", (item_id,))
        self.conn.commit()
        return cur.rowcount > 0

    def item_exists(self, item_id: str) -> bool:
        return self.conn.execute("SELECT 1 FROM items WHERE id = ?", (item_id,)).fetchone() is not None

    # --- documents ---
    @staticmethod
    def _doc(row: sqlite3.Row | None) -> dict[str, Any] | None:
        if row is None:
            return None
        doc = dict(row)
        doc["analysis"] = json.loads(doc["analysis"]) if doc.get("analysis") else None
        if "has_text" in doc:
            doc["has_text"] = bool(doc["has_text"])
        if "has_file" in doc:
            doc["has_file"] = bool(doc["has_file"])
        return doc

    def list_documents(self, user_id: str | None = None) -> list[dict[str, Any]]:
        rows = self.conn.execute(f"SELECT {DOC_PUBLIC} FROM documents ORDER BY COALESCE(date, '') DESC, created_at DESC")
        return [d for r in rows if (d := self._doc(r))]

    def get_document(self, doc_id: str, with_text: bool = False) -> dict[str, Any] | None:
        cols = "*" if with_text else DOC_PUBLIC
        return self._doc(self.conn.execute(f"SELECT {cols} FROM documents WHERE id = ?", (doc_id,)).fetchone())

    # SQLite (usato solo nei test) non ha il concetto di proprietario: nessun vincolo.
    def document_owner(self, doc_id: str) -> str | None:
        return None

    def attachment_owner(self, attachment_id: str) -> str | None:
        return None

    def item_owner(self, item_id: str) -> str | None:
        return None

    def create_document(self, doc_id: str, title: str, kind: str, date: str | None, note: str | None,
                        filename: str, mime: str, size: int, text: str | None,
                        user_id: str | None = None) -> dict[str, Any]:
        self.conn.execute(
            "INSERT INTO documents (id, title, kind, date, note, filename, mime, size, text, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (doc_id, title, kind, date, note, filename, mime, size, text, int(time.time() * 1000)),
        )
        self.conn.commit()
        doc = self.get_document(doc_id)
        assert doc is not None
        return doc

    def set_document_analysis(self, doc_id: str, analysis: dict[str, Any]) -> dict[str, Any] | None:
        self.conn.execute("UPDATE documents SET analysis = ? WHERE id = ?",
                          (json.dumps(analysis, ensure_ascii=False), doc_id))
        self.conn.commit()
        return self.get_document(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        cur = self.conn.execute("DELETE FROM documents WHERE id = ?", (doc_id,))
        self.conn.commit()
        return cur.rowcount > 0

    # --- allegati delle prove (foto, audio) ---
    def create_attachment(self, attachment_id: str, kind: str, filename: str, mime: str, size: int,
                          user_id: str | None = None) -> dict[str, Any]:
        self.conn.execute(
            "INSERT INTO attachments (id, kind, filename, mime, size, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (attachment_id, kind, filename, mime, size, int(time.time() * 1000)),
        )
        self.conn.commit()
        attachment = self.get_attachment(attachment_id)
        assert attachment is not None
        return attachment

    def get_attachment(self, attachment_id: str) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT * FROM attachments WHERE id = ?", (attachment_id,)).fetchone()
        return dict(row) if row else None

    def delete_attachment(self, attachment_id: str) -> bool:
        cur = self.conn.execute("DELETE FROM attachments WHERE id = ?", (attachment_id,))
        self.conn.commit()
        return cur.rowcount > 0

    # --- settings ---
    def get_setting(self, key: str) -> str | None:
        row = self.conn.execute("SELECT value FROM settings WHERE key = ?", (key,)).fetchone()
        return row["value"] if row else None

    def set_setting(self, key: str, value: str) -> None:
        self.conn.execute(
            "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
            (key, value),
        )
        self.conn.commit()

    # --- utenti e sessioni ---
    @staticmethod
    def _user(row: sqlite3.Row | None) -> dict[str, Any] | None:
        if row is None:
            return None
        user = dict(row)
        user.pop("password_hash", None)
        return user

    def create_user(self, username: str, password_hash: str, role: str = "studente",
                    display_name: str | None = None, email: str | None = None) -> dict[str, Any]:
        user_id = uuid.uuid4().hex
        now = int(time.time() * 1000)
        self.conn.execute(
            "INSERT INTO users (id, username, email, password_hash, role, display_name, created_at)"
            " VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, username.strip(), email, password_hash, role, display_name or username.strip(), now),
        )
        self.conn.execute(
            "INSERT INTO profiles (user_id, data, updated_at) VALUES (?, '{}', ?)", (user_id, now)
        )
        self.conn.commit()
        user = self.get_user(user_id)
        assert user is not None
        return user

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        return self._user(self.conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        """Restituisce anche password_hash: serve solo al login."""
        row = self.conn.execute("SELECT * FROM users WHERE username = ? COLLATE NOCASE", (username.strip(),)).fetchone()
        return dict(row) if row else None

    def touch_login(self, user_id: str) -> None:
        self.conn.execute("UPDATE users SET last_login_at = ? WHERE id = ?", (int(time.time() * 1000), user_id))
        self.conn.commit()

    def create_session(self, user_id: str, token: str, ttl_ms: int) -> dict[str, Any]:
        now = int(time.time() * 1000)
        self.conn.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, now, now + ttl_ms),
        )
        self.conn.commit()
        return {"token": token, "user_id": user_id, "expires_at": now + ttl_ms}

    def get_session(self, token: str) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT * FROM sessions WHERE token = ?", (token,)).fetchone()
        if not row:
            return None
        session = dict(row)
        if session["expires_at"] < int(time.time() * 1000):
            self.delete_session(token)
            return None
        return session

    def delete_session(self, token: str) -> bool:
        cur = self.conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        self.conn.commit()
        return cur.rowcount > 0

    # --- stato del passaporto ---
    def get_state(self, user_id: str) -> dict[str, Any] | None:
        row = self.conn.execute("SELECT data FROM user_state WHERE user_id = ?", (user_id,)).fetchone()
        return json.loads(row["data"]) if row else None

    def save_state(self, user_id: str, data: dict[str, Any]) -> None:
        now = int(time.time() * 1000)
        payload = json.dumps(data, ensure_ascii=False)
        try:
            self.conn.execute(
                "INSERT INTO user_state (user_id, data, updated_at) VALUES (?, ?, ?)"
                " ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
                (user_id, payload, now),
            )
            self._sync_normalized(user_id, data, now)
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise

    def delete_state(self, user_id: str) -> None:
        """Cancella tutti i dati del passaporto dell'utente (l'account resta)."""
        try:
            self.conn.execute("DELETE FROM user_state WHERE user_id = ?", (user_id,))
            self.conn.execute("DELETE FROM evidences WHERE user_id = ?", (user_id,))
            self.conn.execute(
                "DELETE FROM grades WHERE subject_id IN (SELECT id FROM subjects WHERE user_id = ?)",
                (user_id,),
            )
            self.conn.execute("DELETE FROM subjects WHERE user_id = ?", (user_id,))
            self.conn.execute("DELETE FROM planner_items WHERE user_id = ?", (user_id,))
            self.conn.execute("DELETE FROM documents")
            self.conn.execute("DELETE FROM attachments")
            # Anche il profilo torna vuoto: altrimenti nome e scuola ricompaiono dopo il reset.
            self.conn.execute("UPDATE profiles SET data = '{}', updated_at = ? WHERE user_id = ?",
                              (int(time.time() * 1000), user_id))
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise

    def save_profile(self, user_id: str, data: dict[str, Any]) -> None:
        self.conn.execute(
            "INSERT INTO profiles (user_id, data, updated_at) VALUES (?, ?, ?)"
            " ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
            (user_id, json.dumps(data, ensure_ascii=False), int(time.time() * 1000)),
        )
        self.conn.commit()

    @staticmethod
    def _nid(user_id: str, raw: Any) -> str:
        """ID normalizzato e isolato per utente (evita collisioni tra account)."""
        return f"{user_id}:{raw}"

    def _sync_normalized(self, user_id: str, data: dict[str, Any], now: int) -> None:
        """Riscrive le tabelle normalizzate a partire dallo stato dell'app."""
        self.conn.execute("DELETE FROM evidences WHERE user_id = ?", (user_id,))
        for e in data.get("evidences") or []:
            raw_id = str(e.get("id") or uuid.uuid4().hex)
            self.conn.execute(
                "INSERT INTO evidences (id, user_id, titolo, descrizione, tipo, ambito, data, comp, dims,"
                " confidenza, perche, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    self._nid(user_id, raw_id), user_id,
                    str(e.get("titolo") or "Senza titolo"), e.get("descrizione"),
                    e.get("tipo"), e.get("ambito"), e.get("data"),
                    json.dumps(e.get("comp") or [], ensure_ascii=False),
                    json.dumps(e.get("dims") or [], ensure_ascii=False),
                    e.get("conf"), e.get("perche"), now,
                ),
            )

        self.conn.execute(
            "DELETE FROM grades WHERE subject_id IN (SELECT id FROM subjects WHERE user_id = ?)", (user_id,)
        )
        self.conn.execute("DELETE FROM subjects WHERE user_id = ?", (user_id,))
        for mi, m in enumerate(data.get("materie") or []):
            raw_subject = str(m.get("id") or f"m{mi}")
            subject_id = self._nid(user_id, raw_subject)
            self.conn.execute(
                "INSERT INTO subjects (id, user_id, nome, colore, created_at) VALUES (?, ?, ?, ?, ?)",
                (subject_id, user_id, str(m.get("nome") or "Materia"), m.get("colore"), now),
            )
            for gi, g in enumerate(m.get("voti") or []):
                try:
                    voto = float(g.get("v"))
                except (TypeError, ValueError):
                    continue
                if not 1 <= voto <= 10:
                    continue
                grade_id = self._nid(user_id, str(g.get("id") or f"{raw_subject}:{gi}"))
                self.conn.execute(
                    "INSERT INTO grades (id, subject_id, voto, tipo, data, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    (grade_id, subject_id, voto, g.get("tipo"), g.get("data"), now),
                )

        self.conn.execute("DELETE FROM planner_items WHERE user_id = ?", (user_id,))
        for p in data.get("planner") or []:
            raw_id = str(p.get("id") or uuid.uuid4().hex)
            self.conn.execute(
                "INSERT INTO planner_items (id, user_id, titolo, descrizione, data, completato, comp, created_at)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    self._nid(user_id, raw_id), user_id,
                    str(p.get("titolo") or "Attività"), p.get("note") or p.get("descrizione"),
                    p.get("data"), 1 if p.get("fatto") else 0,
                    json.dumps(p.get("comp") or [], ensure_ascii=False), now,
                ),
            )
