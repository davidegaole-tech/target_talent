from __future__ import annotations


PNG = b"\x89PNG\r\n\x1a\n" + b"0" * 200


def test_upload_serve_and_delete_image(client) -> None:
    r = client.post("/api/attachments", data={"kind": "foto"},
                    files={"file": ("foto.png", PNG, "image/png")})
    assert r.status_code == 200, r.text
    attachment = r.json()
    assert attachment["mime"] == "image/png"
    assert attachment["kind"] == "foto"
    assert attachment["url"].endswith("/file")

    served = client.get(attachment["url"])
    assert served.status_code == 200
    assert served.content == PNG

    assert client.delete(f"/api/attachments/{attachment['id']}").status_code == 204
    assert client.get(attachment["url"]).status_code == 404


def test_rejects_unsupported_format(client) -> None:
    r = client.post("/api/attachments", data={"kind": "foto"},
                    files={"file": ("virus.exe", b"x", "application/octet-stream")})
    assert r.status_code == 400
    assert r.json()["error"]["code"] == "unsupported_file"


def test_rejects_too_large_image(client) -> None:
    big = b"0" * (5 * 1024 * 1024 + 10)
    r = client.post("/api/attachments", data={"kind": "foto"},
                    files={"file": ("grande.png", big, "image/png")})
    assert r.status_code == 413
    assert r.json()["error"]["code"] == "file_too_large"


def test_audio_upload(client) -> None:
    audio = b"ID3" + b"0" * 100
    r = client.post("/api/attachments", data={"kind": "voce"},
                    files={"file": ("voce.mp3", audio, "audio/mpeg")})
    assert r.status_code == 200
    assert r.json()["mime"] == "audio/mpeg"
    assert r.json()["kind"] == "voce"
