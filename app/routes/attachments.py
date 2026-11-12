"""Allegati delle prove: foto e audio caricati dall'utente."""
from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from fastapi.responses import FileResponse

from ..errors import AppError
from ..services import Services, get_services
from .account import current_user, current_user_file

router = APIRouter(prefix="/api/attachments")

ALLOWED: dict[str, str] = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".m4a": "audio/mp4",
    ".ogg": "audio/ogg",
    ".webm": "audio/webm",
}
IMAGE_LIMIT = 5 * 1024 * 1024
AUDIO_LIMIT = 10 * 1024 * 1024


def _not_found() -> AppError:
    return AppError("not_found", "Allegato non trovato.", 404)


def _path(s: Services, attachment: dict) -> Path:
    return s.config.attachments_dir / f"{attachment['id']}{Path(attachment['filename']).suffix.lower()}"


def _check_owner(s: Services, attachment_id: str, user: dict) -> None:
    owner = s.db.attachment_owner(attachment_id)
    if owner and owner != user["id"]:
        raise _not_found()


@router.post("")
async def upload_attachment(
    file: UploadFile = File(...),
    kind: str = Form("foto"),
    s: Services = Depends(get_services),
    user: dict = Depends(current_user),
) -> dict:
    filename = Path(file.filename or "allegato").name
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED:
        raise AppError(
            "unsupported_file",
            "Formato non supportato. Per le foto usa JPG, PNG, WEBP o GIF; per l'audio MP3, WAV, M4A, OGG o WEBM.",
            400,
        )
    mime = ALLOWED[ext]
    limit = IMAGE_LIMIT if mime.startswith("image/") else AUDIO_LIMIT
    data = await file.read(limit + 1)
    if len(data) > limit:
        raise AppError("file_too_large", f"Il file è troppo grande (massimo {limit // (1024 * 1024)} MB).", 413)
    if not data:
        raise AppError("empty_file", "Il file è vuoto.", 400)

    attachment_id = uuid.uuid4().hex
    s.config.attachments_dir.mkdir(parents=True, exist_ok=True)
    (s.config.attachments_dir / f"{attachment_id}{ext}").write_bytes(data)
    attachment = s.db.create_attachment(attachment_id, kind if kind in ("foto", "voce") else "foto",
                                        filename, mime, len(data), user_id=user["id"])
    return {**attachment, "url": f"/api/attachments/{attachment_id}/file"}


@router.get("/{attachment_id}/file")
def attachment_file(attachment_id: str, s: Services = Depends(get_services),
                    user: dict = Depends(current_user_file)) -> FileResponse:
    _check_owner(s, attachment_id, user)
    attachment = s.db.get_attachment(attachment_id)
    if not attachment:
        raise _not_found()
    path = _path(s, attachment)
    if not path.is_file():
        raise AppError("file_missing", "Il file di questo allegato non è più sul disco.", 404)
    return FileResponse(path, media_type=attachment["mime"], filename=attachment["filename"],
                        content_disposition_type="inline")


@router.delete("/{attachment_id}")
def delete_attachment(attachment_id: str, s: Services = Depends(get_services),
                      user: dict = Depends(current_user)) -> Response:
    _check_owner(s, attachment_id, user)
    attachment = s.db.get_attachment(attachment_id)
    if not attachment or not s.db.delete_attachment(attachment_id):
        raise _not_found()
    _path(s, attachment).unlink(missing_ok=True)
    return Response(status_code=204)
