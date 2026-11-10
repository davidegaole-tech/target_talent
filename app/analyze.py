"""Analisi di una prova di Talent Passport: collega il testo alle competenze chiave europee."""
from __future__ import annotations

from typing import Any

from pydantic import ValidationError

from . import prompts
from .errors import AppError
from .generators import GenContext, RuleError, normalize, pydantic_error, strip_inline_md, structured_call
from .ollama_client import Message
from .schemas import (
    ANALYSIS_TYPES,
    COMPETENCES,
    REASON_MAX,
    SIGNAL_MAX,
    AnalysisOut,
    analysis_schema,
)

MAX_COMPETENCES = 2
ANALYSIS_FAILED_MSG = "Il modello non è riuscito ad analizzare la prova. Riprova o scegli un modello più grande."


def confidence(p: float) -> str:
    """Stesse soglie dell'analisi simulata del frontend."""
    return "alta" if p >= 0.85 else "media" if p >= 0.6 else "bassa"


def clean_reason(reason: str) -> str:
    r = strip_inline_md(reason).strip().strip('"«»“”').rstrip(".!;:").strip()
    if len(r) > REASON_MAX:
        r = r[:REASON_MAX].rsplit(" ", 1)[0].rstrip(",;:")
    # Il frontend la mostra dopo "Perché:": minuscola iniziale, salvo sigle (es. "STEM")
    if len(r) > 1 and not r[1].isupper():
        r = r[0].lower() + r[1:]
    return r


def keep_signals(signals: list[str], source: str) -> list[str]:
    """Tiene solo i segnali che compaiono davvero nel testo della prova (se il testo è noto)."""
    out: list[str] = []
    src = normalize(source) if source else ""
    for s in signals:
        s = strip_inline_md(s).strip().strip('"«»“”.').strip()
        key = normalize(s)
        if not s or len(s) > SIGNAL_MAX or key in (normalize(x) for x in out):
            continue
        if src and key not in src:
            continue
        out.append(s)
    return out[:5]


def validate_analysis(data: Any, source: str = "") -> dict[str, Any]:
    try:
        out = AnalysisOut.model_validate(data)
    except ValidationError as e:
        raise RuleError(pydantic_error(e)) from e
    comps: list[dict[str, Any]] = []
    for c in sorted(out.competences, key=lambda c: c.p, reverse=True):
        if c.id not in COMPETENCES:
            raise RuleError(f"competenza sconosciuta «{c.id}»: usa solo {', '.join(COMPETENCES)}")
        if all(x["id"] != c.id for x in comps):
            comps.append({"id": c.id, "p": round(min(0.99, max(0.05, c.p)), 2)})
    comps = comps[:MAX_COMPETENCES]
    reason = clean_reason(out.reason)
    if len(reason) < 3:
        raise RuleError("il campo reason è vuoto")
    signals = keep_signals(out.signals, source)
    return {"comp": comps, "perche": reason, "segnali": signals, "conf": confidence(comps[0]["p"])}


def build_analysis_messages(title: str, description: str, kind: str | None) -> list[Message]:
    comp_list = "\n".join(f"- {cid}: {desc}" for cid, desc in COMPETENCES.items())
    user = prompts.ANALYZE.format(
        competences=comp_list,
        kind=kind if kind in ANALYSIS_TYPES else "testo",
        title=title.strip(),
        description=description.strip() or "(nessuna descrizione)",
    )
    return [{"role": "system", "content": prompts.ANALYZE_SYSTEM}, {"role": "user", "content": user}]


async def analyze(ctx: GenContext, title: str, description: str, kind: str | None) -> dict[str, Any]:
    if not title.strip():
        raise AppError("missing_input", "Dai un titolo alla prova.", 400)
    messages = build_analysis_messages(title, description, kind)
    try:
        source = f"{title} {description}"
        return await structured_call(ctx, messages, analysis_schema(), lambda d: validate_analysis(d, source))
    except AppError as e:
        if e.code == "generation_failed":
            raise AppError("analysis_failed", ANALYSIS_FAILED_MSG, 422) from e
        raise
