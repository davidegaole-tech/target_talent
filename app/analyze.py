"""Analisi di una prova di Talent Radar: collega il testo alle competenze chiave europee."""
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
    DOCUMENT_KINDS,
    REASON_MAX,
    SIGNAL_MAX,
    SUGGESTION_MAX,
    AnalysisOut,
    analysis_schema,
)

DOC_TEXT_MAX = 3000

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


def clean_suggestion(text: str | None) -> str:
    s = strip_inline_md(text or "").strip().strip('"«»“”').strip()
    if len(s) > SUGGESTION_MAX:
        s = s[:SUGGESTION_MAX].rsplit(" ", 1)[0].rstrip(",;:") + "…"
    return s


def validate_analysis(data: Any, source: str = "", with_suggestion: bool = False) -> dict[str, Any]:
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
    result: dict[str, Any] = {"comp": comps, "perche": reason, "segnali": signals, "conf": confidence(comps[0]["p"])}
    if with_suggestion:
        suggestion = clean_suggestion(out.suggestion)
        if len(suggestion) < 10:
            raise RuleError("il campo suggestion è vuoto o troppo corto")
        result["suggerimento"] = suggestion
    return result


def build_analysis_messages(title: str, description: str, kind: str | None,
                            with_suggestion: bool = False) -> list[Message]:
    comp_list = "\n".join(f"- {cid}: {desc}" for cid, desc in COMPETENCES.items())
    if kind in DOCUMENT_KINDS:
        kind_label = f"documento: {DOCUMENT_KINDS[kind]}"
    elif kind == "piano":
        kind_label = "attività in programma, non ancora svolta (un impegno o un obiettivo futuro)"
    else:
        kind_label = kind if kind in ANALYSIS_TYPES else "testo"
    user = prompts.ANALYZE.format(
        competences=comp_list,
        kind=kind_label,
        title=title.strip(),
        description=description.strip() or "(nessuna descrizione)",
    )
    if with_suggestion:
        user += prompts.ANALYZE_SUGGESTION
    return [{"role": "system", "content": prompts.ANALYZE_SYSTEM}, {"role": "user", "content": user}]


async def analyze(ctx: GenContext, title: str, description: str, kind: str | None,
                  with_suggestion: bool = False) -> dict[str, Any]:
    if not title.strip():
        raise AppError("missing_input", "Dai un titolo alla prova.", 400)
    messages = build_analysis_messages(title, description, kind, with_suggestion)
    try:
        source = f"{title} {description}"
        return await structured_call(ctx, messages, analysis_schema(with_suggestion),
                                     lambda d: validate_analysis(d, source, with_suggestion))
    except AppError as e:
        if e.code == "generation_failed":
            raise AppError("analysis_failed", ANALYSIS_FAILED_MSG, 422) from e
        raise


def document_description(note: str | None, text: str | None) -> str:
    """Descrizione da analizzare: nota dello studente più un estratto del testo del documento."""
    parts = [note.strip()] if note and note.strip() else []
    if text and text.strip():
        excerpt = text.strip()[:DOC_TEXT_MAX]
        parts.append(f"Testo del documento (estratto):\n{excerpt}")
    return "\n\n".join(parts)
