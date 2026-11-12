from __future__ import annotations

from fastapi import APIRouter, Depends

from ..analyze import analyze
from ..competenze import analizza_testo
from ..errors import OLLAMA_DOWN_MSG, AppError
from ..generators import GenContext
from ..schemas import AnalyzeRequest
from ..services import Services, get_services, resolve_model
from .account import current_user_optional

router = APIRouter(prefix="/api")


@router.post("/analyze")
async def analyze_route(body: AnalyzeRequest, s: Services = Depends(get_services),
                        user: dict | None = Depends(current_user_optional)) -> dict:
    """Collega una prova/obiettivo alle competenze chiave europee.

    Se il modello locale (Ollama) è attivo lo usa; altrimenti interviene
    l'analisi algoritmica di ``app.competenze`` (deterministica, spiegabile),
    così il planner può categorizzare il "cosa" anche senza Ollama.
    """
    st = await resolve_model(s)
    result: dict
    engine = "algoritmo"

    if st.ollama:
        ctx = GenContext(s.client, st.model, s.config.num_ctx)
        try:
            result = await analyze(ctx, body.title, body.description, body.kind)
            engine = "modello"
        except AppError as exc:
            if exc.code != "analysis_failed":
                raise
            result = analizza_testo(body.title, body.description, body.kind)
    else:
        result = analizza_testo(body.title, body.description, body.kind)

    result["engine"] = engine
    if user is not None and hasattr(s.db, "log_analysis"):
        try:  # il log non deve mai far fallire l'analisi
            s.db.log_analysis(user["id"], f"{body.title}\n{body.description}",
                              result, engine, "obiettivo" if body.kind == "piano" else "prova")
        except Exception:  # pragma: no cover - dipende dal database
            pass

    return {**result, "model": st.model if st.ollama else None}


@router.post("/analyze/competenze")
async def analyze_competenze(body: AnalyzeRequest) -> dict:
    """Solo l'analisi algoritmica: utile per test e per confrontare i punteggi."""
    return analizza_testo(body.title, body.description, body.kind)
