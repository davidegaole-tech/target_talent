from app.analyze import validate_analysis

GOOD = {
    "competences": [{"id": "multilingue", "p": 0.9}],
    "reason": "Certificazione di inglese di livello B2",
    "signals": ["Cambridge", "B2"],
    "suggestion": "Potresti provare un'esperienza di scambio o un corso per il livello C1.",
}


def upload(client, name="cambridge.txt", data=b"Cambridge English B2 First - Giulia", **form):
    fields = {"title": "Certificato Cambridge B2", "kind": "certificato", "date": "2026-06-10", **form}
    return client.post("/api/documents", data=fields, files={"file": (name, data, "text/plain")})


def test_upload_list_file_delete(client, tmp_path) -> None:
    r = upload(client)
    assert r.status_code == 200
    doc = r.json()
    assert doc["title"] == "Certificato Cambridge B2" and doc["kind"] == "certificato"
    assert doc["has_text"] is True and doc["analysis"] is None and "text" not in doc

    assert [d["id"] for d in client.get("/api/documents").json()["documents"]] == [doc["id"]]
    f = client.get(f"/api/documents/{doc['id']}/file")
    assert f.status_code == 200 and f.content.startswith(b"Cambridge")
    assert (tmp_path / "documents" / f"{doc['id']}.txt").is_file()

    assert client.delete(f"/api/documents/{doc['id']}").status_code == 204
    assert not (tmp_path / "documents" / f"{doc['id']}.txt").exists()
    assert client.get("/api/documents").json()["documents"] == []


def test_image_saved_without_text_and_bad_values_normalized(client) -> None:
    png = b"\x89PNG\r\n\x1a\n" + b"0" * 32
    r = client.post("/api/documents", data={"title": "", "kind": "boh", "date": "ieri"},
                    files={"file": ("attestato corso.png", png, "image/png")})
    doc = r.json()
    assert r.status_code == 200 and doc["has_text"] is False
    assert doc["title"] == "attestato corso" and doc["kind"] == "altro" and doc["date"] is None


def test_rejects_unsupported_format(client) -> None:
    r = client.post("/api/documents", files={"file": ("virus.exe", b"MZ", "application/octet-stream")})
    assert r.status_code == 400 and r.json()["error"]["code"] == "unsupported_file"


def test_analyze_document_stores_suggestion(client, fake) -> None:
    doc = upload(client).json()
    fake.responses = [GOOD]
    r = client.post(f"/api/documents/{doc['id']}/analyze")
    assert r.status_code == 200
    a = r.json()["analysis"]
    assert a["comp"][0]["id"] == "multilingue" and a["suggerimento"].startswith("Potresti")
    prompt = fake.calls[0]["messages"][-1]["content"]
    assert "Cambridge English B2" in prompt and "documento: certificazione" in prompt
    assert "suggestion" in fake.calls[0]["schema"]["required"]
    assert client.get("/api/documents").json()["documents"][0]["analysis"]["suggerimento"]


def test_analyze_document_ollama_down(client, fake) -> None:
    doc = upload(client).json()
    fake.up = False
    r = client.post(f"/api/documents/{doc['id']}/analyze")
    assert r.status_code == 503


def test_missing_suggestion_is_rejected() -> None:
    import pytest

    from app.generators import RuleError
    with pytest.raises(RuleError):
        validate_analysis({**GOOD, "suggestion": ""}, with_suggestion=True)

# Le API di documenti, allegati e schede richiedono il login: ogni test parte autenticato.
import pytest as _pytest


@_pytest.fixture(autouse=True)
def _autentica(client):
    r = client.post("/api/auth/register", json={"username": "tester", "password": "password123", "role": "studente"})
    assert r.status_code == 200, r.text
    client.headers["Authorization"] = "Bearer " + r.json()["token"]
