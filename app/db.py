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
"""

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

    def close(self) -> None:
        self.conn.close()

    # --- items ---
    def list_items(self, type_: str | None = None, q: str | None = None) -> list[dict[str, Any]]:
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
