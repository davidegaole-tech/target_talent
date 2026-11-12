"""Accesso MySQL/MariaDB (XAMPP): utenti, passaporto, planner, appunti e schede.

Espone la stessa interfaccia di ``app.db.Database`` (SQLite) così le route non
cambiano: la scelta del motore avviene in ``app.config`` / ``app.main``.

Tutte le tabelle sono definite in ``sql/talent_radar.sql``.
"""
from __future__ import annotations

import json
import threading
import time
import uuid
from datetime import date, datetime
from typing import Any

import pymysql
from pymysql.cursors import DictCursor

from .schemas import COMPETENCES, DOCUMENT_KINDS

ITEM_TYPES = ("summary", "quiz", "flashcards")
DOC_PUBLIC = (
    "id, title, kind, doc_date AS `date`, note, filename, original_name, mime, "
    "size_bytes AS `size`, analysis, created_at, (extracted_text IS NOT NULL) AS has_text, "
    "(filename IS NOT NULL AND filename <> '') AS has_file"
)
DOC_FULL = DOC_PUBLIC + ", extracted_text AS text"

# Competenze dello studente demo usate quando una prova non porta punteggi
DEFAULT_PRIMARY = 0.90
DEFAULT_SECONDARY = 0.60


def _ms(dt: datetime | None) -> int | None:
    if dt is None:
        return None
    return int(dt.timestamp() * 1000)


def _dt(ms: int | float | None) -> datetime | None:
    if not ms:
        return None
    return datetime.fromtimestamp(float(ms) / 1000)


def _date(value: str | None) -> date | None:
    """'2026-11-06' → date; valori non validi diventano NULL."""
    if not value:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except ValueError:
        return None


def _iso(value: date | None) -> str | None:
    return value.isoformat() if value else None


def _json(value: Any, default: Any = None) -> Any:
    if value is None:
        return default
    if isinstance(value, (dict, list)):
        return value
    try:
        return json.loads(value)
    except (TypeError, ValueError):
        return default


def _dump(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False)


class MySQLDatabase:
    """Implementazione MySQL della persistenza di Talent Radar."""

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: int = 3306,
        user: str = "root",
        password: str = "",
        database: str = "talent_radar",
        charset: str = "utf8mb4",
    ) -> None:
        self.params = dict(
            host=host, port=port, user=user, password=password,
            database=database, charset=charset, cursorclass=DictCursor, autocommit=True,
        )
        self._local = threading.local()
        # Verifica subito la connessione (errore chiaro all'avvio)
        with self.conn.cursor() as cur:
            cur.execute("SELECT 1")
        self.ensure_seed()

    # ------------------------------------------------------------------ utils
    @property
    def conn(self):  # type: ignore[no-untyped-def]
        """Una connessione per thread: le route sync di FastAPI girano nel threadpool."""
        c = getattr(self._local, "conn", None)
        if c is None or not getattr(c, "open", False):
            c = pymysql.connect(**self.params)
            self._local.conn = c
        return c

    def close(self) -> None:
        c = getattr(self._local, "conn", None)
        if c is not None:
            try:
                c.close()
            finally:
                self._local.conn = None

    def _query(self, sql: str, args: tuple | list = ()) -> list[dict[str, Any]]:
        with self.conn.cursor() as cur:
            cur.execute(sql, args)
            return list(cur.fetchall())

    def _one(self, sql: str, args: tuple | list = ()) -> dict[str, Any] | None:
        rows = self._query(sql, args)
        return rows[0] if rows else None

    def _execute(self, sql: str, args: tuple | list = ()) -> int:
        with self.conn.cursor() as cur:
            cur.execute(sql, args)
            return cur.rowcount

    def _commit(self) -> None:
        self.conn.commit()

    def _rollback(self) -> None:
        self.conn.rollback()

    # ---------------------------------------------------------------- cataloghi
    def competences(self) -> list[dict[str, Any]]:
        return self._query("SELECT * FROM competences ORDER BY sort_order")

    # -------------------------------------------------------------- ai_items
    @staticmethod
    def _item(row: dict[str, Any] | None) -> dict[str, Any] | None:
        if row is None:
            return None
        item = dict(row)
        item["type"] = item.pop("item_type")
        item["content"] = _json(item["content"], {})
        item["created_at"] = _ms(item["created_at"])
        item.pop("user_id", None)
        return item

    def list_items(self, type_: str | None = None, q: str | None = None,
                   user_id: str | None = None) -> list[dict[str, Any]]:
        sql = "SELECT * FROM ai_items WHERE 1=1"
        args: list[Any] = []
        if user_id:
            sql += " AND (user_id = %s OR user_id IS NULL)"
            args.append(user_id)
        if type_:
            sql += " AND item_type = %s"
            args.append(type_)
        if q:
            sql += " AND LOWER(title) LIKE %s"
            args.append(f"%{q.lower()}%")
        sql += " ORDER BY created_at DESC"
        return [i for r in self._query(sql, args) if (i := self._item(r))]

    def get_item(self, item_id: str, user_id: str | None = None) -> dict[str, Any] | None:
        return self._item(self._one("SELECT * FROM ai_items WHERE id = %s", (item_id,)))

    def create_item(self, type_: str, title: str, content: dict[str, Any], model: str,
                    source_name: str | None = None, item_id: str | None = None,
                    best_score: int | None = None, created_at: int | None = None,
                    user_id: str | None = None) -> dict[str, Any]:
        item_id = item_id or uuid.uuid4().hex
        self._execute(
            "INSERT INTO ai_items (id, user_id, item_type, title, content, source_name, model, best_score, created_at)"
            " VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (item_id, user_id, type_, title, _dump(content), source_name, model,
             best_score, _dt(created_at) or datetime.now()),
        )
        self._commit()
        item = self.get_item(item_id)
        assert item is not None
        return item

    def update_item(self, item_id: str, fields: dict[str, Any]) -> dict[str, Any] | None:
        mapping = {"title": "title", "best_score": "best_score"}
        allowed = {mapping[k]: v for k, v in fields.items() if k in mapping}
        if allowed:
            cols = ", ".join(f"{k} = %s" for k in allowed)
            self._execute(f"UPDATE ai_items SET {cols} WHERE id = %s", (*allowed.values(), item_id))
            self._commit()
        return self.get_item(item_id)

    def delete_item(self, item_id: str) -> bool:
        n = self._execute("DELETE FROM ai_items WHERE id = %s", (item_id,))
        self._commit()
        return n > 0

    def item_exists(self, item_id: str) -> bool:
        return self._one("SELECT 1 AS ok FROM ai_items WHERE id = %s", (item_id,)) is not None

    # -------------------------------------------------------------- documents
    @staticmethod
    def _doc(row: dict[str, Any] | None) -> dict[str, Any] | None:
        if row is None:
            return None
        doc = dict(row)
        doc["analysis"] = _json(doc.get("analysis"))
        doc["date"] = _iso(doc.get("date")) if doc.get("date") else doc.get("date")
        doc["created_at"] = _ms(doc["created_at"])
        if "has_text" in doc:
            doc["has_text"] = bool(doc["has_text"])
        if "has_file" in doc:
            doc["has_file"] = bool(doc["has_file"])
        doc.pop("user_id", None)
        return doc

    def list_documents(self, kind: str | None = None, user_id: str | None = None) -> list[dict[str, Any]]:
        sql = f"SELECT {DOC_PUBLIC} FROM documents WHERE 1=1"
        args: list[Any] = []
        if user_id:
            sql += " AND (user_id = %s OR user_id IS NULL)"
            args.append(user_id)
        if kind:
            sql += " AND kind = %s"
            args.append(kind)
        sql += " ORDER BY COALESCE(doc_date, '1000-01-01') DESC, created_at DESC"
        return [d for r in self._query(sql, args) if (d := self._doc(r))]

    def get_document(self, doc_id: str, with_text: bool = False,
                     user_id: str | None = None) -> dict[str, Any] | None:
        sql = f"SELECT {DOC_FULL if with_text else DOC_PUBLIC} FROM documents WHERE id = %s"
        return self._doc(self._one(sql, (doc_id,)))

    # --- proprietari degli oggetti (per l'isolamento tra account) ---
    def document_owner(self, doc_id: str) -> str | None:
        row = self._one("SELECT user_id FROM documents WHERE id = %s", (doc_id,))
        return row["user_id"] if row else None

    def attachment_owner(self, attachment_id: str) -> str | None:
        row = self._one("SELECT user_id FROM attachments WHERE id = %s", (attachment_id,))
        return row["user_id"] if row else None

    def item_owner(self, item_id: str) -> str | None:
        row = self._one("SELECT user_id FROM ai_items WHERE id = %s", (item_id,))
        return row["user_id"] if row else None

    def create_document(self, doc_id: str, title: str, kind: str, date_: str | None, note: str | None,
                        filename: str, mime: str, size: int, text: str | None,
                        user_id: str | None = None) -> dict[str, Any]:
        self._execute(
            "INSERT INTO documents (id, user_id, title, kind, doc_date, note, filename, original_name,"
            " mime, size_bytes, extracted_text, created_at)"
            " VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (doc_id, user_id, title, kind if kind in DOCUMENT_KINDS else "altro",
             _date(date_), note, filename, filename, mime, size, text, datetime.now()),
        )
        self._commit()
        doc = self.get_document(doc_id)
        assert doc is not None
        return doc

    def set_document_analysis(self, doc_id: str, analysis: dict[str, Any]) -> dict[str, Any] | None:
        self._execute("UPDATE documents SET analysis = %s WHERE id = %s", (_dump(analysis), doc_id))
        self._commit()
        return self.get_document(doc_id)

    def delete_document(self, doc_id: str) -> bool:
        n = self._execute("DELETE FROM documents WHERE id = %s", (doc_id,))
        self._commit()
        return n > 0

    # ------------------------------------------------------------ attachments
    def create_attachment(self, attachment_id: str, kind: str, filename: str, mime: str, size: int,
                          user_id: str | None = None) -> dict[str, Any]:
        self._execute(
            "INSERT INTO attachments (id, user_id, kind, filename, original_name, mime, size_bytes)"
            " VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (attachment_id, user_id, kind if kind in ("foto", "voce") else "foto",
             filename, filename, mime, size),
        )
        self._commit()
        attachment = self.get_attachment(attachment_id)
        assert attachment is not None
        return attachment

    def get_attachment(self, attachment_id: str) -> dict[str, Any] | None:
        row = self._one("SELECT * FROM attachments WHERE id = %s", (attachment_id,))
        if not row:
            return None
        attachment = dict(row)
        attachment["size"] = attachment.pop("size_bytes")
        attachment["created_at"] = _ms(attachment["created_at"])
        attachment.pop("user_id", None)
        return attachment

    def delete_attachment(self, attachment_id: str) -> bool:
        n = self._execute("DELETE FROM attachments WHERE id = %s", (attachment_id,))
        self._commit()
        return n > 0

    # --------------------------------------------------------------- settings
    def get_setting(self, key: str) -> str | None:
        row = self._one("SELECT setting_value FROM app_settings WHERE setting_key = %s", (key,))
        return row["setting_value"] if row else None

    def set_setting(self, key: str, value: str) -> None:
        self._execute(
            "INSERT INTO app_settings (setting_key, setting_value) VALUES (%s, %s)"
            " ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
            (key, value),
        )
        self._commit()

    def get_user_setting(self, user_id: str, key: str) -> str | None:
        row = self._one("SELECT setting_value FROM user_settings WHERE user_id = %s AND setting_key = %s",
                        (user_id, key))
        return row["setting_value"] if row else None

    def set_user_setting(self, user_id: str, key: str, value: str) -> None:
        self._execute(
            "INSERT INTO user_settings (user_id, setting_key, setting_value) VALUES (%s, %s, %s)"
            " ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
            (user_id, key, value),
        )
        self._commit()

    # ------------------------------------------------------- utenti e sessioni
    @staticmethod
    def _user(row: dict[str, Any] | None) -> dict[str, Any] | None:
        if row is None:
            return None
        user = dict(row)
        user.pop("password_hash", None)
        user["created_at"] = _ms(user["created_at"])
        user["last_login_at"] = _ms(user.get("last_login_at"))
        return user

    def create_user(self, username: str, password_hash: str, role: str = "studente",
                    display_name: str | None = None, email: str | None = None) -> dict[str, Any]:
        user_id = uuid.uuid4().hex
        username = username.strip()
        self.conn.begin()
        try:
            self._execute(
                "INSERT INTO users (id, username, email, password_hash, role, display_name)"
                " VALUES (%s, %s, %s, %s, %s, %s)",
                (user_id, username, email or None, password_hash, role, display_name or username),
            )
            self._execute("INSERT INTO personal_data (user_id, contact_email) VALUES (%s, %s)",
                          (user_id, email or None))
            self._commit()
        except Exception:
            self._rollback()
            raise
        user = self.get_user(user_id)
        assert user is not None
        return user

    def get_user(self, user_id: str) -> dict[str, Any] | None:
        return self._user(self._one("SELECT * FROM users WHERE id = %s", (user_id,)))

    def get_user_by_username(self, username: str) -> dict[str, Any] | None:
        row = self._one("SELECT * FROM users WHERE username = %s AND is_active = 1", (username.strip(),))
        if not row:
            return None
        user = dict(row)
        user["created_at"] = _ms(user["created_at"])
        user["last_login_at"] = _ms(user.get("last_login_at"))
        return user

    def touch_login(self, user_id: str) -> None:
        self._execute("UPDATE users SET last_login_at = %s WHERE id = %s", (datetime.now(), user_id))
        self._commit()

    def create_session(self, user_id: str, token: str, ttl_ms: int) -> dict[str, Any]:
        now = int(time.time() * 1000)
        expires = datetime.fromtimestamp((now + ttl_ms) / 1000)
        self._execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (%s, %s, %s, %s)",
            (token, user_id, datetime.now(), expires),
        )
        self._commit()
        return {"token": token, "user_id": user_id, "expires_at": now + ttl_ms}

    def get_session(self, token: str) -> dict[str, Any] | None:
        row = self._one("SELECT * FROM sessions WHERE token = %s", (token,))
        if not row:
            return None
        if row["expires_at"] < datetime.now():
            self.delete_session(token)
            return None
        return {"token": row["token"], "user_id": row["user_id"],
                "created_at": _ms(row["created_at"]), "expires_at": _ms(row["expires_at"])}

    def delete_session(self, token: str) -> bool:
        n = self._execute("DELETE FROM sessions WHERE token = %s", (token,))
        self._commit()
        return n > 0

    # ------------------------------------------------- stato del passaporto
    def get_state(self, user_id: str) -> dict[str, Any] | None:
        row = self._one("SELECT data FROM user_state WHERE user_id = %s", (user_id,))
        if row:
            return _json(row["data"], {})
        # Nessuno snapshot: ricostruisce lo stato dalle tabelle normalizzate.
        return self._build_state(user_id)

    def save_state(self, user_id: str, data: dict[str, Any]) -> None:
        self.conn.begin()
        try:
            self._execute(
                "INSERT INTO user_state (user_id, data, updated_at) VALUES (%s, %s, %s)"
                " ON DUPLICATE KEY UPDATE data = VALUES(data), updated_at = VALUES(updated_at)",
                (user_id, _dump(data), datetime.now()),
            )
            self._sync_normalized(user_id, data)
            self._commit()
        except Exception:
            self._rollback()
            raise

    def delete_state(self, user_id: str) -> None:
        self.conn.begin()
        try:
            self._execute("DELETE FROM user_state WHERE user_id = %s", (user_id,))
            self._execute("DELETE FROM evidences WHERE user_id = %s", (user_id,))
            self._execute("DELETE FROM notes WHERE user_id = %s", (user_id,))
            self._execute("DELETE FROM subjects WHERE user_id = %s", (user_id,))
            self._execute("DELETE FROM planner_items WHERE user_id = %s", (user_id,))
            self._execute("DELETE FROM competency_analyses WHERE user_id = %s", (user_id,))
            self._execute("DELETE FROM documents WHERE user_id = %s", (user_id,))
            self._execute("DELETE FROM attachments WHERE user_id = %s", (user_id,))
            # Anche i dati personali: senza questo, dopo "Elimina tutti i dati"
            # nome, scuola e città ricompaiono nel passaporto.
            self._execute(
                "UPDATE personal_data SET first_name = NULL, last_name = NULL, birth_date = NULL,"
                " city = NULL, phone = NULL, school = NULL, class_name = NULL, school_year = NULL,"
                " bio = NULL, languages = NULL, digital_skills = NULL, interests = NULL, sports = NULL,"
                " avatar_path = NULL, updated_at = %s WHERE user_id = %s",
                (datetime.now(), user_id),
            )
            self._commit()
        except Exception:
            self._rollback()
            raise

    # ------------------------------------------------------------ profilo
    PROFILE_COLUMNS: dict[str, str] = {
        "nome": "first_name", "cognome": "last_name", "nascita": "birth_date",
        "citta": "city", "telefono": "phone", "email": "contact_email",
        "scuola": "school", "classe": "class_name", "anno": "school_year",
        "presentazione": "bio", "lingue": "languages", "digitali": "digital_skills",
        "interessi": "interests", "sport": "sports",
    }

    def save_profile(self, user_id: str, data: dict[str, Any]) -> None:
        """Aggiorna solo i campi presenti in ``data`` (chiavi in italiano)."""
        cols = {col: data[key] for key, col in self.PROFILE_COLUMNS.items() if key in data}
        if not cols:
            return
        if "birth_date" in cols:
            cols["birth_date"] = _date(cols["birth_date"])
        names = ", ".join(cols)
        marks = ", ".join("%s" for _ in cols)
        updates = ", ".join(f"{c} = VALUES({c})" for c in cols)
        try:
            self._execute(
                f"INSERT INTO personal_data (user_id, {names}, updated_at) VALUES (%s, {marks}, %s)"
                f" ON DUPLICATE KEY UPDATE {updates}, updated_at = VALUES(updated_at)",
                (user_id, *cols.values(), datetime.now()),
            )
            self._commit()
        except Exception:
            self._rollback()
            raise

    # ------------------------------------------------------------ analisi AI
    def log_analysis(self, user_id: str | None, input_text: str, result: dict[str, Any],
                     engine: str = "algoritmo", target_type: str = "libera",
                     target_id: str | None = None) -> str:
        analysis_id = uuid.uuid4().hex
        comps = result.get("comp") or []
        scores = {c["id"]: c.get("p") for c in comps if isinstance(c, dict) and c.get("id")}
        self._execute(
            "INSERT INTO competency_analyses"
            " (id, user_id, target_type, target_id, input_text, engine, top_competence, confidence, scores, result)"
            " VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (analysis_id, user_id, target_type, target_id, input_text[:4000], engine,
             comps[0]["id"] if comps else None, result.get("conf"), _dump(scores), _dump(result)),
        )
        self._commit()
        return analysis_id

    # --------------------------------------------------- sincronizzazione tabelle
    @staticmethod
    def _nid(user_id: str, raw: Any) -> str:
        """ID isolato per utente (le tabelle hanno id VARCHAR(64))."""
        return f"{user_id}:{raw}"[:64]

    def _sync_normalized(self, user_id: str, data: dict[str, Any]) -> None:
        """Riscrive le tabelle normalizzate a partire dallo stato del passaporto."""
        profilo = data.get("profilo") or {}
        if profilo:
            self.save_profile(user_id, profilo)

        # --- prove ---
        self._execute("DELETE FROM evidences WHERE user_id = %s", (user_id,))
        for e in data.get("evidences") or []:
            raw_id = str(e.get("id") or uuid.uuid4().hex)
            self._execute(
                "INSERT INTO evidences (id, user_id, title, description, kind, scope, evidence_date,"
                " confidence, why, source, is_featured) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (self._nid(user_id, raw_id), user_id,
                 str(e.get("titolo") or "Senza titolo")[:160], e.get("descrizione"),
                 e.get("tipo") if e.get("tipo") in ("foto", "link", "testo", "voce") else "testo",
                 e.get("ambito") if e.get("ambito") in ("scuola", "extra", "altro") else "scuola",
                 _date(e.get("data")), e.get("conf") if e.get("conf") in ("alta", "media", "bassa") else None,
                 (e.get("perche") or "")[:255] or None,
                 "esempio" if e.get("esempio") else "manuale",
                 1 if e.get("evidenza") else 0),
            )
            comps = [c for c in (e.get("comp") or []) if c in COMPETENCES][:2]
            for i, cid in enumerate(comps):
                self._execute(
                    "INSERT INTO evidence_competences (evidence_id, competence_id, score, is_primary)"
                    " VALUES (%s, %s, %s, %s)",
                    (self._nid(user_id, raw_id), cid, DEFAULT_PRIMARY if i == 0 else DEFAULT_SECONDARY, 1 if i == 0 else 0),
                )
            for dim in {d for d in (e.get("dims") or []) if d in ("essere", "fare", "lavorare")}:
                self._execute(
                    "INSERT INTO evidence_dimensions (evidence_id, dimension_id) VALUES (%s, %s)",
                    (self._nid(user_id, raw_id), dim),
                )

        # --- materie e voti ---
        self._execute("DELETE FROM subjects WHERE user_id = %s", (user_id,))
        for mi, m in enumerate(data.get("materie") or []):
            raw_subject = str(m.get("id") or f"m{mi}")
            subject_id = self._nid(user_id, raw_subject)
            self._execute(
                "INSERT INTO subjects (id, user_id, name, color) VALUES (%s, %s, %s, %s)",
                (subject_id, user_id, str(m.get("nome") or "Materia")[:80], m.get("color")),
            )
            for gi, g in enumerate(m.get("voti") or []):
                try:
                    voto = float(g.get("v"))
                except (TypeError, ValueError):
                    continue
                if not 1 <= voto <= 10:
                    continue
                self._execute(
                    "INSERT INTO grades (id, subject_id, value, kind, grade_date) VALUES (%s, %s, %s, %s, %s)",
                    (self._nid(user_id, f"{raw_subject}:{g.get('id') or gi}"), subject_id, voto,
                     g.get("tipo") if g.get("tipo") in ("scritto", "orale", "pratico") else None,
                     _date(g.get("data"))),
                )

        # --- planner (il "cosa" è il titolo) ---
        self._execute("DELETE FROM planner_items WHERE user_id = %s", (user_id,))
        for p in data.get("planner") or []:
            raw_id = str(p.get("id") or uuid.uuid4().hex)
            item_id = self._nid(user_id, raw_id)
            engine = p.get("fonte") if p.get("fonte") in ("modello", "algoritmo", "simulata", "manuale") else None
            self._execute(
                "INSERT INTO planner_items (id, user_id, item_type, title, details, due_date, is_done,"
                " done_at, why, analysis_engine, confidence) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (item_id, user_id, "obiettivo" if p.get("tipo") == "obiettivo" else "attivita",
                 str(p.get("titolo") or "Attività")[:200], p.get("note"),
                 _date(p.get("data")), 1 if p.get("fatto") else 0,
                 datetime.now() if p.get("fatto") else None,
                 (p.get("perche") or "")[:255] or None, engine,
                 p.get("conf") if p.get("conf") in ("alta", "media", "bassa") else None),
            )
            comps = [c for c in (p.get("comp") or []) if c in COMPETENCES][:2]
            for i, cid in enumerate(comps):
                self._execute(
                    "INSERT INTO planner_competences (planner_item_id, competence_id, score, is_primary)"
                    " VALUES (%s, %s, %s, %s)",
                    (item_id, cid, p.get("confidenza") if isinstance(p.get("confidenza"), (int, float)) else
                     (DEFAULT_PRIMARY if i == 0 else DEFAULT_SECONDARY), 1 if i == 0 else 0),
                )

        # --- preferenze ---
        for key, value in (("theme", data.get("theme")), ("text_size", data.get("textSize")),
                           ("role_selected", data.get("ruolo"))):
            if value:
                self.set_user_setting(user_id, key, str(value))

    def _build_state(self, user_id: str) -> dict[str, Any] | None:
        """Ricostruisce lo stato dell'app dalle tabelle (usato al primo accesso)."""
        user = self.get_user(user_id)
        if not user:
            return None
        pd = self._one("SELECT * FROM personal_data WHERE user_id = %s", (user_id,)) or {}

        evidences: list[dict[str, Any]] = []
        for row in self._query("SELECT * FROM evidences WHERE user_id = %s ORDER BY evidence_date DESC", (user_id,)):
            key = row["id"][len(user_id) + 1:] if row["id"].startswith(f"{user_id}:") else row["id"]
            comps = [r["competence_id"] for r in self._query(
                "SELECT competence_id FROM evidence_competences WHERE evidence_id = %s ORDER BY is_primary DESC, score DESC",
                (row["id"],))]
            dims = [r["dimension_id"] for r in self._query(
                "SELECT dimension_id FROM evidence_dimensions WHERE evidence_id = %s", (row["id"],))]
            evidences.append({
                "id": key, "ambito": row["scope"], "evidenza": bool(row["is_featured"]),
                "titolo": row["title"], "tipo": row["kind"], "data": _iso(row["evidence_date"]),
                "descrizione": row["description"] or "", "comp": comps, "dims": dims,
                "conf": row["confidence"], "perche": row["why"],
            })

        materie: list[dict[str, Any]] = []
        for subj in self._query("SELECT * FROM subjects WHERE user_id = %s", (user_id,)):
            key = subj["id"][len(user_id) + 1:] if subj["id"].startswith(f"{user_id}:") else subj["id"]
            voti = self._query(
                "SELECT * FROM grades WHERE subject_id = %s ORDER BY grade_date", (subj["id"],))
            materie.append({
                "id": key, "nome": subj["name"], "color": subj["color"],
                "voti": [{"v": float(g["value"]), "tipo": g["kind"], "data": _iso(g["grade_date"])} for g in voti],
            })

        planner: list[dict[str, Any]] = []
        for row in self._query("SELECT * FROM planner_items WHERE user_id = %s ORDER BY due_date", (user_id,)):
            key = row["id"][len(user_id) + 1:] if row["id"].startswith(f"{user_id}:") else row["id"]
            comps = [r["competence_id"] for r in self._query(
                "SELECT competence_id FROM planner_competences WHERE planner_item_id = %s ORDER BY is_primary DESC",
                (row["id"],))]
            planner.append({
                "id": key, "tipo": row["item_type"], "titolo": row["title"], "note": row["details"] or "",
                "data": _iso(row["due_date"]), "comp": comps, "perche": row["why"] or "",
                "fonte": row["analysis_engine"] or "esempio", "fatto": bool(row["is_done"]),
                "conf": row["confidence"],
            })

        prove = {cid: 0 for cid in COMPETENCES}
        for row in self._query(
            "SELECT competence_id, COUNT(*) AS n FROM evidence_competences ec"
            " JOIN evidences e ON e.id = ec.evidence_id WHERE e.user_id = %s GROUP BY competence_id",
            (user_id,)
        ):
            prove[row["competence_id"]] = int(row["n"])

        return {
            "prove": prove,
            "evidences": evidences,
            "materie": materie,
            "planner": planner,
            "profilo": {
                "nome": pd.get("first_name") or "", "cognome": pd.get("last_name") or "",
                "nascita": _iso(pd.get("birth_date")) or "", "citta": pd.get("city") or "",
                "email": pd.get("contact_email") or "", "telefono": pd.get("phone") or "",
                "scuola": pd.get("school") or "", "classe": pd.get("class_name") or "",
                "anno": pd.get("school_year") or "", "presentazione": pd.get("bio") or "",
                "lingue": pd.get("languages") or "", "digitali": pd.get("digital_skills") or "",
                "interessi": pd.get("interests") or "", "sport": pd.get("sports") or "",
            },
            "role": user["role"],
            "ruolo": user["role"],
            "isSample": False,
            "sampleBanner": False,
        }

    # ------------------------------------------------------ seed automatico
    def ensure_seed(self) -> None:
        """Crea l'account demo se il database è vuoto (primo avvio)."""
        row = self._one("SELECT COUNT(*) AS n FROM users")
        if row and row["n"]:
            return
        from .seed import seed_default_data  # import locale: evita cicli

        seed_default_data(self)
