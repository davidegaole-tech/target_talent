from __future__ import annotations

from fastapi import APIRouter, Depends

from ..analyze import analyze
from ..errors import OLLAMA_DOWN_MSG, AppError
from ..generators import GenContext
from ..schemas import AnalyzeRequest
from ..services import Services, get_services, resolve_model

router = APIRouter(prefix="/api")


@router.post("/analyze")
async def analyze_route(body: AnalyzeRequest, s: Services = Depends(get_services)) -> dict:
    """Collega una prova alle competenze chiave usando il modello locale. Non salva nulla."""
    st = await resolve_model(s)
    if not st.ollama:
        raise AppError("ollama_unavailable", OLLAMA_DOWN_MSG, 503)
    ctx = GenContext(s.client, st.model, s.config.num_ctx)
    result = await analyze(ctx, body.title, body.description, body.kind)
    return {**result, "model": st.model}
