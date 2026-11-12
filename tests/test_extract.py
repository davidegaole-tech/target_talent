import io

import pytest

from app.errors import AppError
from app.extract import extract_text

TEXT = "La fotosintesi avviene nei cloroplasti grazie alla clorofilla."


def test_txt_and_md() -> None:
    assert extract_text("a.txt", TEXT.encode()) == TEXT
    assert extract_text("a.md", ("# Titolo\n\n" + TEXT).encode("utf-8")).startswith("# Titolo")
    assert extract_text("a.txt", "perché è così".encode("latin-1")) == "perché è così"


def test_docx() -> None:
    import docx
    d = docx.Document()
    d.add_paragraph(TEXT)
    d.add_paragraph("Secondo paragrafo.")
    buf = io.BytesIO()
    d.save(buf)
    out = extract_text("appunti.docx", buf.getvalue())
    assert TEXT in out and "Secondo paragrafo." in out


def _pdf(lines: list[str]) -> bytes:
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf)
    for i, line in enumerate(lines):
        c.drawString(72, 750 - 20 * i, line)
    c.showPage()
    c.save()
    return buf.getvalue()


def test_pdf_with_text() -> None:
    out = extract_text("cap1.pdf", _pdf([TEXT, "Seconda riga di testo."]))
    assert "cloroplasti" in out


def test_pdf_without_text() -> None:
    with pytest.raises(AppError) as e:
        extract_text("scan.pdf", _pdf([]))
    assert e.value.code == "pdf_no_text"


def test_unsupported_and_too_large() -> None:
    with pytest.raises(AppError) as e:
        extract_text("foto.png", b"x")
    assert e.value.code == "unsupported_file"
    with pytest.raises(AppError) as e:
        extract_text("big.txt", b"x" * (10 * 1024 * 1024 + 1))
    assert e.value.code == "file_too_large"


def test_extract_endpoint(client) -> None:
    r = client.post("/api/extract", files={"file": ("note.txt", TEXT.encode(), "text/plain")})
    assert r.status_code == 200
    assert r.json() == {"name": "note.txt", "text": TEXT, "words": len(TEXT.split())}
    r = client.post("/api/extract", files={"file": ("scan.pdf", _pdf([]), "application/pdf")})
    assert r.status_code == 400 and "scansione" in r.json()["error"]["message"]

# Le API di documenti, allegati e schede richiedono il login: ogni test parte autenticato.
import pytest as _pytest


@_pytest.fixture(autouse=True)
def _autentica(client):
    r = client.post("/api/auth/register", json={"username": "tester", "password": "password123", "role": "studente"})
    assert r.status_code == 200, r.text
    client.headers["Authorization"] = "Bearer " + r.json()["token"]
