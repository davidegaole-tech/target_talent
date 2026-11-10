from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from .. import prompts
from ..errors import OLLAMA_DOWN_MSG, AppError
from ..generators import CHARS_PER_TOKEN
from ..schemas import ChatRequest
from ..services import Services, get_services, resolve_model

router = APIRouter(prefix="/api")


def build_chat_messages(body: ChatRequest, num_ctx: int) -> list[dict[str, str]]:
    system = prompts.TUTOR_SYSTEM
    if body.context_text and body.context_text.strip():
        max_chars = int(num_ctx * 0.5 * CHARS_PER_TOKEN)
        ctx = body.context_text.strip()[:max_chars]
        system += f"\n\n{prompts.GUARD}\n\n<materiale>\n{ctx}\n</materiale>"
    # Tieni solo gli ultimi messaggi per restare nel contesto.
    history = [m.model_dump() for m in body.messages][-12:]
    return [{"role": "system", "content": system}, *history]


@router.post("/chat")
async def chat_route(body: ChatRequest, request: Request, s: Services = Depends(get_services)) -> StreamingResponse:
    async def events() -> AsyncIterator[bytes]:
        try:
            st = await resolve_model(s)
            if not st.ollama:
                raise AppError("ollama_unavailable", OLLAMA_DOWN_MSG, 503)
            async for piece in s.client.chat_stream(st.model, build_chat_messages(body, s.config.num_ctx), s.config.num_ctx):
                if await request.is_disconnected():
                    return
                yield (json.dumps({"delta": piece}, ensure_ascii=False) + "\n").encode()
            yield b'{"done": true}\n'
        except AppError as e:
            yield (json.dumps(e.to_dict(), ensure_ascii=False) + "\n").encode()

    return StreamingResponse(events(), media_type="application/x-ndjson",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
