from app.analyze import build_analysis_messages


def test_login_ok_and_wrong(client) -> None:
    assert client.post("/api/login", json={"username": "admin", "password": "password"}).json()["ok"] is True
    r = client.post("/api/login", json={"username": "admin", "password": "sbagliata"})
    assert r.status_code == 401 and r.json()["error"]["code"] == "invalid_credentials"


def test_notes_are_documents_with_readable_text(client) -> None:
    r = client.post("/api/documents", data={"title": "Appunti di storia", "kind": "appunti"},
                    files={"file": ("storia.txt", "La Rivoluzione francese inizia nel 1789.".encode(), "text/plain")})
    doc = r.json()
    assert doc["kind"] == "appunti"
    assert [d["id"] for d in client.get("/api/documents?kind=appunti").json()["documents"]] == [doc["id"]]
    assert client.get("/api/documents?kind=certificato").json()["documents"] == []
    t = client.get(f"/api/documents/{doc['id']}/text").json()
    assert t["text"].startswith("La Rivoluzione") and t["words"] == 6


def test_planner_kind_in_prompt() -> None:
    msg = build_analysis_messages("Corso di primo soccorso", "a marzo", "piano")[-1]["content"]
    assert "attività in programma" in msg
