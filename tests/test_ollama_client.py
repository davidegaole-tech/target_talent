"""OllamaClient con un trasporto HTTP finto: gestione dei modelli che ragionano sempre."""
import asyncio
import json

import httpx

from app.ollama_client import RESET, OllamaClient

THINKING = "Okay, the user wants a greeting. Let me answer briefly.\n</think>\n\n"


def make_client(handler) -> tuple[OllamaClient, list[dict]]:
    sent: list[dict] = []

    def wrapped(request: httpx.Request) -> httpx.Response:
        body = json.loads(request.content)
        sent.append(body)
        return handler(body)

    c = OllamaClient("http://ollama.test")
    c._client = lambda timeout=None: httpx.AsyncClient(  # type: ignore[method-assign]
        base_url="http://ollama.test", transport=httpx.MockTransport(wrapped))
    return c, sent


def test_json_call_learns_model_that_always_thinks() -> None:
    def handler(body: dict) -> httpx.Response:
        content = '{"ok": true}' if body.get("think") else THINKING + '{"ok": true}'
        return httpx.Response(200, json={"message": {"content": content, "thinking": "..."}})

    c, sent = make_client(handler)
    first = asyncio.run(c.chat_json("qwen3:4b", [{"role": "user", "content": "x"}], {}, 4096))
    second = asyncio.run(c.chat_json("qwen3:4b", [{"role": "user", "content": "x"}], {}, 4096))
    assert first == second == '{"ok": true}'
    assert sent[0]["think"] is False and sent[1]["think"] is True


def test_stream_resets_leaked_thinking_and_learns() -> None:
    def handler(body: dict) -> httpx.Response:
        if body.get("think"):
            pieces = ["Ciao!"]
        else:
            pieces = ["Okay, the user ", "wants a greeting.\n</think>\n\nCia", "o!"]
        lines = [json.dumps({"message": {"content": p}, "done": False}) for p in pieces]
        lines.append(json.dumps({"message": {"content": ""}, "done": True}))
        return httpx.Response(200, content="\n".join(lines).encode())

    c, sent = make_client(handler)

    async def collect() -> list[str]:
        return [p async for p in c.chat_stream("qwen3:4b", [{"role": "user", "content": "ciao"}], 4096)]

    first = asyncio.run(collect())
    assert first[first.index(RESET) + 1:] == ["Cia", "o!"]
    assert asyncio.run(collect()) == ["Ciao!"] and sent[1]["think"] is True


def test_hybrid_model_keeps_think_false() -> None:
    def handler(body: dict) -> httpx.Response:
        return httpx.Response(200, json={"message": {"content": "Ciao"}})

    c, sent = make_client(handler)
    for _ in range(2):
        asyncio.run(c.chat_text("qwen3:8b", [{"role": "user", "content": "x"}], 4096))
    assert [b["think"] for b in sent] == [False, False]
