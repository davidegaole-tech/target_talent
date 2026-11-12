from __future__ import annotations


def _register(client, username="mario", password="segreta1", role="studente"):
    r = client.post("/api/auth/register", json={"username": username, "password": password, "role": role})
    assert r.status_code == 200, r.text
    return r.json()


def test_register_login_and_state_roundtrip(client) -> None:
    data = _register(client)
    token = data["token"]
    headers = {"Authorization": f"Bearer {token}"}

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["user"]["username"] == "mario"
    assert me["user"]["role"] == "studente"

    state = {
        "evidences": [{"id": "x1", "titolo": "Robot", "comp": ["stem"], "dims": ["fare"], "data": "2026-11-01"}],
        "materie": [{"id": "m1", "nome": "Storia", "color": "#fff", "voti": [{"v": 8, "tipo": "orale"}]}],
        "planner": [{"id": "p1", "titolo": "Corso", "data": "2026-12-01"}],
        "theme": "dark",
    }
    assert client.put("/api/state", json={"state": state}, headers=headers).status_code == 200

    got = client.get("/api/state", headers=headers).json()["state"]
    assert got["evidences"][0]["titolo"] == "Robot"
    assert got["materie"][0]["voti"][0]["v"] == 8
    assert got["theme"] == "dark"

    # Tabelle normalizzate popolate
    db = client.app.state.services.db
    assert db.conn.execute("SELECT COUNT(*) AS c FROM evidences").fetchone()["c"] == 1
    assert db.conn.execute("SELECT COUNT(*) AS c FROM subjects").fetchone()["c"] == 1
    assert db.conn.execute("SELECT COUNT(*) AS c FROM grades").fetchone()["c"] == 1
    assert db.conn.execute("SELECT COUNT(*) AS c FROM planner_items").fetchone()["c"] == 1

    # Il login restituisce un nuovo token e i dati restano
    login = client.post("/api/auth/login", json={"username": "mario", "password": "segreta1"}).json()
    headers2 = {"Authorization": f"Bearer {login['token']}"}
    assert client.get("/api/state", headers=headers2).json()["state"]["evidences"][0]["id"] == "x1"


def test_duplicate_username_is_rejected(client) -> None:
    _register(client)
    r = client.post("/api/auth/register", json={"username": "MARIO", "password": "segreta1"})
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "username_taken"


def test_login_wrong_password(client) -> None:
    _register(client)
    r = client.post("/api/auth/login", json={"username": "mario", "password": "sbagliata"})
    assert r.status_code == 401
    assert r.json()["error"]["code"] == "invalid_credentials"


def test_delete_state_clears_passport(client) -> None:
    data = _register(client)
    headers = {"Authorization": f"Bearer {data['token']}"}
    client.put("/api/state", json={"state": {"evidences": [{"id": "x", "titolo": "Prova"}],
                                              "materie": [{"id": "m", "nome": "Storia", "voti": [{"v": 8}]}]}},
               headers=headers)
    assert client.delete("/api/state", headers=headers).status_code == 200
    assert client.get("/api/state", headers=headers).json()["state"] is None
    db = client.app.state.services.db
    assert db.conn.execute("SELECT COUNT(*) AS c FROM evidences").fetchone()["c"] == 0
    assert db.conn.execute("SELECT COUNT(*) AS c FROM subjects").fetchone()["c"] == 0


def test_state_requires_token(client) -> None:
    assert client.get("/api/state").status_code == 401
    assert client.put("/api/state", json={"state": {}}).status_code == 401


def test_demo_credentials_still_work(client) -> None:
    r = client.post("/api/auth/login", json={"username": "admin", "password": "password"})
    assert r.status_code == 200
    assert r.json()["user"]["username"] == "admin"
