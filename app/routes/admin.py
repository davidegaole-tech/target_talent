"""Anteprima read-only del database, per demo/debug.

Protetta da login. Nasconde i campi sensibili (hash password, token di sessione).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ..errors import AppError
from ..services import Services, get_services
from .account import current_user

router = APIRouter(prefix="/api/admin")

MASKED_COLUMNS = {"password_hash", "token"}
MAX_ROWS = 200


def _quote(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


@router.get("/db/tables")
def list_tables(user: dict = Depends(current_user), s: Services = Depends(get_services)) -> dict:
    rows = s.db.conn.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    ).fetchall()
    tables = []
    for row in rows:
        name = row["name"]
        count = s.db.conn.execute(f"SELECT COUNT(*) AS c FROM {_quote(name)}").fetchone()["c"]
        tables.append({"name": name, "rows": count})
    return {"tables": tables}


@router.get("/db/tables/{name}")
def table_rows(
    name: str,
    limit: int = Query(50, ge=1, le=MAX_ROWS),
    user: dict = Depends(current_user),
    s: Services = Depends(get_services),
) -> dict:
    exists = s.db.conn.execute(
        "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?", (name,)
    ).fetchone()
    if not exists:
        raise AppError("not_found", "Tabella non trovata.", 404)

    cursor = s.db.conn.execute(f"SELECT * FROM {_quote(name)} LIMIT ?", (limit,))
    columns = [d[0] for d in cursor.description]
    rows = []
    for record in cursor.fetchall():
        item = {}
        for col in columns:
            value = record[col]
            if col in MASKED_COLUMNS and value is not None:
                item[col] = "••••••"
            elif isinstance(value, bytes):
                item[col] = f"<{len(value)} byte>"
            else:
                item[col] = value
        rows.append(item)
    return {"name": name, "columns": columns, "rows": rows, "limit": limit}
