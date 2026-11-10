"""Documenti dello studente: attestati, certificati, corsi. File su disco, dati in SQLite."""
from __future__ import annotations

import re
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile
from fastapi.responses import FileResponse

from ..analyze import analyze, document_description
from ..errors import OLLAMA_DOWN_MSG, AppError
from ..extract import MAX_BYTES, extract_text
from ..generators import GenContext
from ..schemas import DOCUMENT_KINDS
from ..services import Services, get_services, resolve_model

router = APIRouter(prefix="/api/documents")

ALLOWED: dict[str, str] = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
}
TEXT_FORMATS = (".pdf", ".docx", ".txt", ".md")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


def _not_found() -> AppError:
    return AppError("not_found", "Documento non trovato.", 404)


def _file_path(s: Services, doc: dict) -> Path:
    return s.config.documents_dir / f"{doc['id']}{Path(doc['filename']).suffix.lower()}"


@router.get("")
def list_documents(kind: str | None = None, s: Services = Depends(get_services)) -> dict:
    docs = s.db.list_documents()
    if kind:
        docs = [d for d in docs if d["kind"] == kind]
    return {"documents": docs}


@router.get("/{doc_id}/text")
def document_text(doc_id: str, s: Services = Depends(get_services)) -> dict:
    """Testo estratto (per esempio per far creare a Sergio un riassunto degli appunti)."""
    doc = s.db.get_document(doc_id, with_text=True)
    if not doc:
        raise _not_found()
    if not doc.get("text"):
        raise AppError("no_text", "Da questo file non si riesce a leggere il testo.", 400)
    return {"name": doc["title"], "text": doc["text"], "words": len(doc["text"].split())}


@router.post("")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(""),
    kind: str = Form("attestato"),
    date: str = Form(""),
    note: str = Form(""),
    s: Services = Depends(get_services),
) -> dict:
    filename = Path(file.filename or "documento").name
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED:
        raise AppError("unsupported_file", "Formato non supportato. Carica un PDF, un DOCX, un TXT o un'immagine (JPG, PNG).", 400)
    data = await file.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise AppError("file_too_large", "Il file è troppo grande (massimo 10 MB).", 413)
    if not data:
        raise AppError("empty_file", "Il file è vuoto.", 400)

    text: str | None = None
    if ext in TEXT_FORMATS:
        try:
            text = extract_text(filename, data)
        except AppError:
            text = None   # es. PDF scansionato: il documento si salva lo stesso, senza testo

    doc_id = uuid.uuid4().hex
    s.config.documents_dir.mkdir(parents=True, exist_ok=True)
    (s.config.documents_dir / f"{doc_id}{ext}").write_bytes(data)
    title = title.strip()[:120] or Path(filename).stem[:120]
    return s.db.create_document(
        doc_id, title,
        kind if kind in DOCUMENT_KINDS else "altro",
        date if DATE_RE.match(date) else None,
        note.strip()[:1000] or None,
        filename, ALLOWED[ext], len(data), text,
    )


@router.get("/{doc_id}/file")
def document_file(doc_id: str, s: Services = Depends(get_services)) -> FileResponse:
    doc = s.db.get_document(doc_id)
    if not doc:
        raise _not_found()
    path = _file_path(s, doc)
    if not path.is_file():
        raise AppError("file_missing", "Il file di questo documento non è più sul disco.", 404)
    return FileResponse(path, media_type=doc["mime"], filename=doc["filename"], content_disposition_type="inline")


@router.post("/{doc_id}/analyze")
async def analyze_document(doc_id: str, s: Services = Depends(get_services)) -> dict:
    doc = s.db.get_document(doc_id, with_text=True)
    if not doc:
        raise _not_found()
    st = await resolve_model(s)
    if not st.ollama:
        raise AppError("ollama_unavailable", OLLAMA_DOWN_MSG, 503)
    ctx = GenContext(s.client, st.model, s.config.num_ctx)
    result = await analyze(ctx, doc["title"], document_description(doc.get("note"), doc.get("text")),
                           doc["kind"], with_suggestion=True)
    updated = s.db.set_document_analysis(doc_id, {**result, "model": st.model})
    assert updated is not None
    return updated


@router.delete("/{doc_id}")
def delete_document(doc_id: str, s: Services = Depends(get_services)) -> Response:
    doc = s.db.get_document(doc_id)
    if not doc or not s.db.delete_document(doc_id):
        raise _not_found()
    _file_path(s, doc).unlink(missing_ok=True)
    return Response(status_code=204)
