from __future__ import annotations

import json
from collections.abc import AsyncIterator

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse

from ..errors import OLLAMA_DOWN_MSG, AppError
from ..generators import GenContext, generate
from ..schemas import GenerateRequest
from ..services import Services, get_services, resolve_model
from .account import current_user_optional

router = APIRouter(prefix="/api")


def _line(obj: dict) -> bytes:
    return (json.dumps(obj, ensure_ascii=False) + "\n").encode()


@router.post("/generate")
async def generate_route(body: GenerateRequest, request: Request, s: Services = Depends(get_services),
                         user: dict | None = Depends(current_user_optional)) -> StreamingResponse:
    if not (body.text or "").strip() and not (body.topic or "").strip():
        raise AppError("missing_input", "Scrivi un argomento o incolla del materiale.", 400)

    async def events() -> AsyncIterator[bytes]:
        try:
            st = await resolve_model(s)
            if not st.ollama:
                raise AppError("ollama_unavailable", OLLAMA_DOWN_MSG, 503)
            if st.warning:
                yield _line({"stage": "warning", "message": st.warning})
            ctx = GenContext(s.client, st.model, s.config.num_ctx)
            async for ev in generate(ctx, body.kind, body.text, body.topic, body.count):
                if await request.is_disconnected():
                    return
                if ev["stage"] == "result":
                    r = ev["result"]
                    source = body.source_name or ("argomento" if not (body.text or "").strip() else "testo incollato")
                    item = s.db.create_item(r.type, r.title, r.content, st.model, source,
                                            user_id=user["id"] if user else None)
                    yield _line({"stage": "done", "item": item})
                else:
                    yield _line(ev)
        except AppError as e:
            yield _line({"stage": "error", **e.to_dict()})
        except Exception:  # noqa: BLE001
            yield _line({"stage": "error", "error": {"code": "internal", "message": "Errore imprevisto durante la generazione. Riprova."}})

    return StreamingResponse(events(), media_type="application/x-ndjson",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
