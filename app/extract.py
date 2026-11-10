"""Estrazione del testo da PDF, DOCX, TXT e MD."""
from __future__ import annotations

import io
from pathlib import Path

from .errors import AppError

MAX_BYTES = 10 * 1024 * 1024
SUPPORTED = (".txt", ".md", ".markdown", ".pdf", ".docx")


def _decode(data: bytes) -> str:
    for enc in ("utf-8-sig", "utf-16") if data[:2] in (b"\xff\xfe", b"\xfe\xff") else ("utf-8-sig",):
        try:
            return data.decode(enc)
        except UnicodeDecodeError:
            pass
    return data.decode("latin-1")


def _pdf(data: bytes) -> str:
    from pypdf import PdfReader
    from pypdf.errors import PdfReadError

    try:
        reader = PdfReader(io.BytesIO(data))
        if reader.is_encrypted:
            try:
                reader.decrypt("")
            except Exception as e:  # noqa: BLE001
                raise AppError("pdf_encrypted", "Il PDF è protetto da password.", 400) from e
        pages = [(p.extract_text() or "").strip() for p in reader.pages]
    except PdfReadError as e:
        raise AppError("bad_file", "Non riesco a leggere questo PDF: il file sembra danneggiato.", 400) from e
    text = "\n\n".join(p for p in pages if p)
    if len(text.split()) < 5:
        raise AppError(
            "pdf_no_text",
            "Questo PDF non contiene testo selezionabile (probabilmente è una scansione). "
            "Usa un PDF con testo oppure passalo prima in un programma di riconoscimento del testo (OCR).",
            400,
        )
    return text


def _docx(data: bytes) -> str:
    import docx

    try:
        doc = docx.Document(io.BytesIO(data))
    except Exception as e:  # noqa: BLE001
        raise AppError("bad_file", "Non riesco a leggere questo file Word (.docx).", 400) from e
    parts = [p.text for p in doc.paragraphs if p.text.strip()]
    for table in doc.tables:
        for row in table.rows:
            cells = [c.text.strip() for c in row.cells if c.text.strip()]
            if cells:
                parts.append(" | ".join(cells))
    return "\n\n".join(parts)


def extract_text(filename: str, data: bytes) -> str:
    if len(data) > MAX_BYTES:
        raise AppError("file_too_large", "Il file è troppo grande (massimo 10 MB).", 413)
    ext = Path(filename).suffix.lower()
    if ext not in SUPPORTED:
        raise AppError("unsupported_file", "Formato non supportato. Usa file .txt, .md, .pdf o .docx.", 400)
    if ext == ".pdf":
        text = _pdf(data)
    elif ext == ".docx":
        text = _docx(data)
    else:
        text = _decode(data)
    text = text.replace("\r\n", "\n").replace("\x00", "").strip()
    if not text:
        raise AppError("empty_file", "Il file non contiene testo.", 400)
    return text
