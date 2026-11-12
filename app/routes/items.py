from __future__ import annotations

from fastapi import APIRouter, Depends, File, Response, UploadFile

from ..errors import AppError
from ..extract import extract_text
from ..schemas import ImportRequest, ItemPatch
from ..services import Services, get_services
from .account import current_user

router = APIRouter(prefix="/api")


def _not_found() -> AppError:
    return AppError("not_found", "Scheda non trovata.", 404)


def _check_owner(s: Services, item_id: str, user: dict) -> None:
    owner = s.db.item_owner(item_id)
    if owner and owner != user["id"]:
        raise _not_found()


@router.get("/items")
def list_items(type: str | None = None, q: str | None = None,
               s: Services = Depends(get_services),
               user: dict = Depends(current_user)) -> dict:
    if type and type not in ("summary", "quiz", "flashcards"):
        raise AppError("bad_type", "Tipo di scheda non valido.", 400)
    return {"items": s.db.list_items(type or None, (q or "").strip() or None, user_id=user["id"])}


@router.get("/items/{item_id}")
def get_item(item_id: str, s: Services = Depends(get_services),
             user: dict = Depends(current_user)) -> dict:
    _check_owner(s, item_id, user)
    item = s.db.get_item(item_id)
    if not item:
        raise _not_found()
    return item


@router.patch("/items/{item_id}")
def patch_item(item_id: str, body: ItemPatch, s: Services = Depends(get_services),
               user: dict = Depends(current_user)) -> dict:
    fields = body.model_dump(exclude_none=True)
    if not fields:
        raise AppError("empty_patch", "Puoi modificare solo il titolo o il miglior punteggio.", 400)
    _check_owner(s, item_id, user)
    if not s.db.item_exists(item_id):
        raise _not_found()
    item = s.db.update_item(item_id, fields)
    assert item is not None
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_item(item_id: str, s: Services = Depends(get_services),
                user: dict = Depends(current_user)) -> Response:
    _check_owner(s, item_id, user)
    if not s.db.delete_item(item_id):
        raise _not_found()
    return Response(status_code=204)


@router.post("/items/import")
def import_items(body: ImportRequest, s: Services = Depends(get_services),
                 user: dict = Depends(current_user)) -> dict:
    uid = user["id"]
    imported = skipped = 0
    for it in body.items:
        if it.id and s.db.item_exists(it.id):
            skipped += 1
            continue
        s.db.create_item(it.type, it.title[:120], it.content, it.model, it.source_name, it.id or None,
                         it.best_score, it.created_at, user_id=uid)
        imported += 1
    return {"imported": imported, "skipped": skipped}


@router.post("/extract")
async def extract(file: UploadFile = File(...), user: dict = Depends(current_user)) -> dict:
    data = await file.read(10 * 1024 * 1024 + 1)
    text = extract_text(file.filename or "file.txt", data)
    return {"name": file.filename, "text": text, "words": len(text.split())}
