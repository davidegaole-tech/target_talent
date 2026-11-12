"""Backup completo: passaporto, documenti/appunti e schede di Sergio.

- ``GET  /api/export``  scarica un bundle JSON con tutto ciò che appartiene all'utente.
- ``POST /api/import``  ripristina il bundle: lo stato sostituisce il passaporto,
  le schede vengono sovrascritte, i documenti mancanti ricreati (testo sì, file no).
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..errors import AppError
from ..services import Services, get_services
from .account import current_user

router = APIRouter(prefix="/api")

APP_NAME = "Talent Radar"
BUNDLE_VERSION = 2


class BundleDocument(BaseModel):
    id: str | None = None
    title: str = Field(min_length=1, max_length=200)
    kind: str = "altro"
    date: str | None = None
    note: str | None = None
    text: str | None = None
    analysis: dict[str, Any] | None = None


class BundleItem(BaseModel):
    id: str | None = None
    type: str
    title: str = Field(min_length=1, max_length=120)
    content: dict[str, Any] = Field(default_factory=dict)
    source_name: str | None = None
    model: str = "importato"
    best_score: int | None = None
    created_at: int | None = None


class ImportBundle(BaseModel):
    app: str | None = None
    version: int | None = None
    state: dict[str, Any] | None = None
    documents: list[BundleDocument] = Field(default_factory=list)
    items: list[BundleItem] = Field(default_factory=list)


@router.get("/export")
def export_all(user: dict = Depends(current_user), s: Services = Depends(get_services)) -> dict:
    """Backup completo dell'account autenticato."""
    uid = user["id"]
    documents = []
    for doc in s.db.list_documents(user_id=uid):
        full = s.db.get_document(doc["id"], with_text=True) or doc
        documents.append({
            "id": doc["id"], "title": doc["title"], "kind": doc["kind"],
            "date": doc.get("date"), "note": doc.get("note"),
            "text": full.get("text"), "analysis": doc.get("analysis"),
            "has_file": bool(doc.get("has_file")),
        })
    items = s.db.list_items(user_id=uid)
    return {
        "app": APP_NAME,
        "version": BUNDLE_VERSION,
        "exported_at": datetime.now().isoformat(timespec="seconds"),
        "user": {"username": user.get("username"), "display_name": user.get("display_name")},
        "state": s.db.get_state(uid),
        "documents": documents,
        "items": items,
    }


@router.post("/import")
def import_all(body: ImportBundle, user: dict = Depends(current_user),
               s: Services = Depends(get_services)) -> dict:
    """Ripristina un backup: il passaporto viene sostituito, il resto completato."""
    uid = user["id"]
    if body.app and body.app != APP_NAME:
        raise AppError("bad_backup", "Questo file non è un backup di Talent Radar.", 400)
    if not body.state and not body.documents and not body.items:
        raise AppError("empty_backup", "Il file di backup è vuoto.", 400)

    if body.state:
        s.db.save_state(uid, body.state)

    items_added = items_updated = 0
    for it in body.items:
        if it.type not in ("summary", "quiz", "flashcards"):
            continue
        item_id = it.id or uuid.uuid4().hex
        if s.db.item_exists(item_id):
            s.db.delete_item(item_id)
            items_updated += 1
        else:
            items_added += 1
        s.db.create_item(it.type, it.title[:120], it.content, it.model, it.source_name,
                         item_id, it.best_score, it.created_at, user_id=uid)

    documents_added = 0
    for doc in body.documents:
        doc_id = doc.id or uuid.uuid4().hex
        if s.db.get_document(doc_id):
            continue  # il file originale resta sul server: non lo tocchiamo
        s.db.create_document(
            doc_id, doc.title[:200], doc.kind, doc.date, doc.note,
            "", "", 0, doc.text, user_id=uid,
        )
        if doc.analysis:
            s.db.set_document_analysis(doc_id, doc.analysis)
        documents_added += 1

    return {
        "ok": True,
        "items_added": items_added,
        "items_updated": items_updated,
        "documents_added": documents_added,
    }
