import json

from .conftest import SUMMARY, make_quiz


def create(client, **kw):
    db = client.app.state.services.db
    return db.create_item(kw.get("type", "summary"), kw.get("title", "Titolo"), kw.get("content", {"text": "x", "keyPoints": []}), "qwen3:8b", "argomento")


def test_crud(client) -> None:
    assert client.get("/api/items").json() == {"items": []}
    a = create(client, title="Fotosintesi")
    b = create(client, type="quiz", title="Quiz storia", content={"questions": []})
    items = client.get("/api/items").json()["items"]
    assert [i["id"] for i in items] == [b["id"], a["id"]] or len(items) == 2
    assert [i["title"] for i in client.get("/api/items?type=quiz").json()["items"]] == ["Quiz storia"]
    assert [i["title"] for i in client.get("/api/items?q=FOTO").json()["items"]] == ["Fotosintesi"]
    assert client.get(f"/api/items/{a['id']}").json()["content"]["text"] == "x"

    r = client.patch(f"/api/items/{b['id']}", json={"best_score": 7})
    assert r.status_code == 200 and r.json()["best_score"] == 7
    r = client.patch(f"/api/items/{b['id']}", json={"title": "Nuovo"})
    assert r.json()["title"] == "Nuovo" and r.json()["best_score"] == 7
    assert client.patch(f"/api/items/{b['id']}", json={}).status_code == 400
    assert client.patch(f"/api/items/{b['id']}", json={"content": "x"}).status_code == 400

    assert client.delete(f"/api/items/{a['id']}").status_code == 204
    r = client.get(f"/api/items/{a['id']}")
    assert r.status_code == 404 and r.json()["error"]["code"] == "not_found"
    assert client.delete(f"/api/items/{a['id']}").status_code == 404


def test_bad_type_filter(client) -> None:
    assert client.get("/api/items?type=boh").status_code == 400


def test_import_skips_existing_ids(client) -> None:
    a = create(client)
    payload = {"items": [
        {"id": a["id"], "type": "summary", "title": "dup", "content": {"text": "y", "keyPoints": []}},
        {"id": "nuovo1", "type": "flashcards", "title": "FC", "content": {"cards": []}, "created_at": 5},
        {"type": "quiz", "title": "Senza id", "content": {"questions": []}},
    ]}
    r = client.post("/api/items/import", json=payload).json()
    assert r == {"imported": 2, "skipped": 1}
    assert len(client.get("/api/items").json()["items"]) == 3


def ndjson(r):
    return [json.loads(line) for line in r.text.splitlines() if line.strip()]


def test_generate_streams_and_saves(client, fake) -> None:
    fake.responses = [make_quiz(5)]
    r = client.post("/api/generate", json={"kind": "quiz", "topic": "la fotosintesi", "count": 5})
    assert r.status_code == 200
    events = ndjson(r)
    assert events[0]["stage"] == "start"
    done = events[-1]
    assert done["stage"] == "done"
    item = done["item"]
    assert item["type"] == "quiz" and len(item["content"]["questions"]) == 5
    assert item["source_name"] == "argomento" and item["model"] == "qwen3:8b"
    assert client.get(f"/api/items/{item['id']}").status_code == 200


def test_generate_failure_event(client, fake) -> None:
    fake.responses = ["no", "ancora no"]
    events = ndjson(client.post("/api/generate", json={"kind": "summary", "topic": "x"}))
    assert events[-1]["stage"] == "error"
    assert events[-1]["error"]["code"] == "generation_failed"
    assert client.get("/api/items").json()["items"] == []


def test_generate_requires_input(client) -> None:
    r = client.post("/api/generate", json={"kind": "summary"})
    assert r.status_code == 400 and r.json()["error"]["code"] == "missing_input"


def test_generate_ollama_down(client, fake) -> None:
    fake.up = False
    events = ndjson(client.post("/api/generate", json={"kind": "summary", "topic": "x"}))
    assert events[-1]["error"]["code"] == "ollama_unavailable"


def test_health_models_settings(client, fake) -> None:
    fake.models = ["gemma3:4b", "qwen3:8b"]
    h = client.get("/api/health").json()
    assert h == {**h, "ollama": True, "model": "qwen3:8b", "model_installed": True}
    assert [m["name"] for m in client.get("/api/models").json()["models"]] == ["gemma3:4b", "qwen3:8b"]
    assert client.put("/api/settings", json={"model": "gemma3:4b"}).json() == {"model": "gemma3:4b"}
    assert client.get("/api/health").json()["model"] == "gemma3:4b"


def test_health_fallback_model(client, fake) -> None:
    fake.models = ["gemma3:4b"]
    h = client.get("/api/health").json()
    assert h["model"] == "gemma3:4b" and h["model_installed"] is False and "ollama pull qwen3:8b" in h["warning"]


def test_health_ollama_down(client, fake) -> None:
    fake.up = False
    h = client.get("/api/health").json()
    assert h["ollama"] is False


def test_chat_stream(client, fake) -> None:
    r = client.post("/api/chat", json={"messages": [{"role": "user", "content": "ciao"}], "context_text": "Materiale X"})
    events = ndjson(r)
    assert "".join(e.get("delta", "") for e in events) == "Ciao, sono il tutor."
    assert events[-1] == {"done": True}
    assert "<materiale>\nMateriale X" in fake.calls[0]["messages"][0]["content"]


def test_index_served(client) -> None:
    r = client.get("/")
    assert r.status_code == 200 and "Talent Radar" in r.text and "tutor.js" in r.text
    assert "googleapis" not in r.text and "cdnjs" not in r.text


def test_static_files_are_revalidated(client) -> None:
    assert client.get("/tutor.js").headers["cache-control"] == "no-cache"

# Le API di documenti, allegati e schede richiedono il login: ogni test parte autenticato.
import pytest as _pytest


@_pytest.fixture(autouse=True)
def _autentica(client):
    r = client.post("/api/auth/register", json={"username": "tester", "password": "password123", "role": "studente"})
    assert r.status_code == 200, r.text
    client.headers["Authorization"] = "Bearer " + r.json()["token"]
