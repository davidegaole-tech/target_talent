"""Generazione di riassunti, quiz e flashcard: chunking, validazione, un solo nuovo tentativo."""
from __future__ import annotations

import json
import math
import random
import re
import unicodedata
from collections.abc import AsyncIterator, Callable
from dataclasses import dataclass, field
from typing import Any

from pydantic import BaseModel, ValidationError

from . import prompts
from .errors import GENERATION_FAILED_MSG, AppError
from .ollama_client import LLMClient, Message, strip_think
from .schemas import (
    BACK_MAX,
    COUNT_RANGE,
    DEFAULT_COUNT,
    FRONT_MAX,
    TITLE_MAX,
    FlashcardsOut,
    QuizOut,
    SummaryOut,
    flashcards_schema,
    quiz_schema,
    summary_schema,
)

CHARS_PER_TOKEN = 3.5
CHUNK_TOKENS = 2500
OVERLAP_TOKENS = 200
CHUNK_THRESHOLD = 0.6
MIN_ITEMS = {"quiz": 3, "flashcards": 4}
BAD_OPTIONS = ("tutte le precedenti", "nessuna delle precedenti", "all of the above", "none of the above")

Event = dict[str, Any]


class RuleError(ValueError):
    """Output del modello che viola le regole di validazione."""


@dataclass
class GenResult:
    type: str
    title: str
    content: dict[str, Any]


@dataclass
class GenContext:
    client: LLMClient
    model: str
    num_ctx: int
    rng: random.Random = field(default_factory=random.Random)


# ---------------------------------------------------------------- utilità

def estimate_tokens(text: str) -> int:
    return math.ceil(len(text) / CHARS_PER_TOKEN)


def normalize(s: str) -> str:
    s = unicodedata.normalize("NFKD", s.lower())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^\w]+", " ", s).strip()


def strip_inline_md(s: str) -> str:
    """Toglie grassetto/corsivo/codice e punti elenco: i punti chiave sono testo semplice."""
    s = re.sub(r"^\s*(?:[-*•]|\d+[.)])\s+", "", s.strip())
    s = re.sub(r"(\*\*|__|\*|`)(.+?)\1", r"\2", s)
    return s.strip(" *_`")


def clean_title(title: str, fallback: str) -> str:
    t = title.strip().strip("\"'«»“”‘’`").strip()
    t = strip_inline_md(re.sub(r"^#+\s*", "", t))
    if not t:
        t = fallback
    if len(t) > TITLE_MAX:
        cut = t[:TITLE_MAX].rsplit(" ", 1)[0]
        t = (cut or t[:TITLE_MAX]).rstrip(" ,;:.-")
    return t


def clamp_count(kind: str, count: int | None) -> int:
    lo, hi = COUNT_RANGE[kind]
    return max(lo, min(hi, count or DEFAULT_COUNT[kind]))


def summary_target_words(text: str | None) -> int:
    if not text:
        return 400
    words = len(text.split())
    return max(150, min(900, round(words * 0.2)))


def split_chunks(text: str, chunk_tokens: int = CHUNK_TOKENS, overlap_tokens: int = OVERLAP_TOKENS) -> list[str]:
    """Divide per paragrafi in blocchi di ~chunk_tokens con sovrapposizione di ~overlap_tokens."""
    max_chars = int(chunk_tokens * CHARS_PER_TOKEN)
    overlap_chars = int(overlap_tokens * CHARS_PER_TOKEN)
    paragraphs: list[str] = []
    for p in re.split(r"\n\s*\n", text):
        p = p.strip()
        if not p:
            continue
        # Paragrafi enormi: spezza per frasi, poi a forza.
        while len(p) > max_chars:
            cut = p.rfind(". ", 0, max_chars)
            cut = cut + 1 if cut > max_chars // 2 else max_chars
            paragraphs.append(p[:cut].strip())
            p = p[cut:].strip()
        if p:
            paragraphs.append(p)

    chunks: list[str] = []
    current: list[str] = []
    size = 0
    for p in paragraphs:
        if current and size + len(p) + 2 > max_chars:
            chunks.append("\n\n".join(current))
            # Sovrapposizione: riporta gli ultimi paragrafi fino a ~overlap_chars.
            tail: list[str] = []
            tail_size = 0
            for prev in reversed(current):
                if tail_size + len(prev) > overlap_chars:
                    break
                tail.insert(0, prev)
                tail_size += len(prev) + 2
            if not tail:
                tail = [current[-1][-overlap_chars:]]
                tail_size = len(tail[0])
            current, size = tail, tail_size
        current.append(p)
        size += len(p) + 2
    if current:
        chunks.append("\n\n".join(current))
    return chunks


def needs_chunking(text: str | None, num_ctx: int) -> bool:
    return bool(text) and estimate_tokens(text or "") > num_ctx * CHUNK_THRESHOLD


def distribute(total: int, weights: list[int], minimum: int = 1) -> list[int]:
    """Distribuisce `total` tra i blocchi in proporzione ai pesi (metodo dei resti maggiori)."""
    s = sum(weights) or 1
    raw = [total * w / s for w in weights]
    out = [max(minimum, math.floor(r)) for r in raw]
    order = sorted(range(len(raw)), key=lambda i: raw[i] - math.floor(raw[i]), reverse=True)
    i = 0
    while sum(out) < total and order:
        out[order[i % len(order)]] += 1
        i += 1
    return out


def parse_json(raw: str) -> Any:
    raw = strip_think(raw).strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise RuleError(f"JSON non valido ({e.msg})") from e


def pydantic_error(e: ValidationError) -> str:
    parts = []
    for err in e.errors()[:3]:
        loc = ".".join(str(x) for x in err["loc"])
        parts.append(f"{loc}: {err['msg']}")
    return "; ".join(parts)


# ---------------------------------------------------------------- validazione

def validate_summary(data: Any) -> GenResult:
    try:
        out = SummaryOut.model_validate(data)
    except ValidationError as e:
        raise RuleError(pydantic_error(e)) from e
    points = [strip_inline_md(p) for p in out.keyPoints if strip_inline_md(p)]
    if len(points) < 3:
        raise RuleError("servono almeno 3 punti chiave non vuoti")
    return GenResult("summary", clean_title(out.title, "Riassunto"), {"text": out.text.strip(), "keyPoints": points[:6]})


def shuffle_question(q: dict[str, Any], rng: random.Random) -> dict[str, Any]:
    """Mescola le opzioni mantenendo corretta la risposta."""
    order = list(range(len(q["options"])))
    rng.shuffle(order)
    return {**q, "options": [q["options"][i] for i in order], "answer": order.index(q["answer"])}


def clean_questions(questions: list[dict[str, Any]], seen: set[str] | None = None) -> list[dict[str, Any]]:
    """Toglie domande con opzioni duplicate o vietate e domande duplicate."""
    seen = set() if seen is None else seen
    out = []
    for q in questions:
        opts = [o.strip() for o in q["options"]]
        norm_opts = [normalize(o) for o in opts]
        if any(not o for o in norm_opts) or len(set(norm_opts)) != 4:
            continue
        if any(b in o for o in norm_opts for b in BAD_OPTIONS):
            continue
        key = normalize(q["q"])
        if not key or key in seen:
            continue
        seen.add(key)
        out.append({"q": q["q"].strip(), "options": opts, "answer": q["answer"], "explanation": q.get("explanation", "").strip()})
    return out


def validate_quiz(data: Any, wanted: int, rng: random.Random) -> GenResult:
    try:
        out = QuizOut.model_validate(data)
    except ValidationError as e:
        raise RuleError(pydantic_error(e)) from e
    qs = clean_questions([q.model_dump() for q in out.questions])
    need = max(1, math.ceil(wanted * 0.5))
    if len(qs) < need:
        raise RuleError(
            f"solo {len(qs)} domande valide su {wanted} richieste: servono 4 opzioni diverse, "
            "una sola corretta, nessuna domanda ripetuta"
        )
    qs = [shuffle_question(q, rng) for q in qs[:wanted]]
    return GenResult("quiz", clean_title(out.title, "Quiz"), {"questions": qs})


def clean_cards(cards: list[dict[str, Any]], seen: set[str] | None = None) -> list[dict[str, Any]]:
    seen = set() if seen is None else seen
    out = []
    for c in cards:
        front, back = c["front"].strip(), c["back"].strip()
        if not front or not back or len(front) > FRONT_MAX or len(back) > BACK_MAX:
            continue
        key = normalize(front)
        if key in seen:
            continue
        seen.add(key)
        out.append({"front": front, "back": back})
    return out


def validate_flashcards(data: Any, wanted: int) -> GenResult:
    try:
        out = FlashcardsOut.model_validate(data)
    except ValidationError as e:
        raise RuleError(pydantic_error(e)) from e
    cards = clean_cards([c.model_dump() for c in out.cards])
    need = max(1, math.ceil(wanted * 0.5))
    if len(cards) < need:
        raise RuleError(
            f"solo {len(cards)} flashcard valide su {wanted} richieste: fronte massimo {FRONT_MAX} caratteri, "
            f"retro massimo {BACK_MAX}, nessuna ripetizione"
        )
    return GenResult("flashcards", clean_title(out.title, "Flashcard"), {"cards": cards[:wanted]})


# ---------------------------------------------------------------- chiamate al modello

async def structured_call(
    ctx: GenContext,
    messages: list[Message],
    schema: dict[str, Any],
    validate: Callable[[Any], GenResult],
    on_retry: Callable[[], None] | None = None,
) -> GenResult:
    """Chiama il modello con output vincolato; un solo nuovo tentativo se l'output non è valido."""
    raw = await ctx.client.chat_json(ctx.model, messages, schema, ctx.num_ctx)
    try:
        return validate(parse_json(raw))
    except RuleError as first:
        if on_retry:
            on_retry()
        retry_msgs = [
            *messages,
            {"role": "assistant", "content": raw[:4000]},
            {"role": "user", "content": prompts.RETRY.format(error=first)},
        ]
        raw2 = await ctx.client.chat_json(ctx.model, retry_msgs, schema, ctx.num_ctx)
        try:
            return validate(parse_json(raw2))
        except RuleError as second:
            raise AppError("generation_failed", GENERATION_FAILED_MSG, 422) from second


def build_messages(instruction: str, text: str | None, topic: str | None) -> list[Message]:
    return [
        {"role": "system", "content": prompts.SYSTEM},
        {"role": "user", "content": f"{instruction}\n\n{prompts.material_block(text, topic)}"},
    ]


# ---------------------------------------------------------------- generatori

async def generate(
    ctx: GenContext,
    kind: str,
    text: str | None,
    topic: str | None,
    count: int | None = None,
) -> AsyncIterator[Event]:
    """Genera una scheda emettendo eventi di avanzamento; l'ultimo evento è {"stage":"result", ...}."""
    text = (text or "").strip() or None
    topic = (topic or "").strip() or None
    if not text and not topic:
        raise AppError("missing_input", "Scrivi un argomento o incolla del materiale.", 400)

    if kind == "summary":
        gen = _summary(ctx, text, topic)
    elif kind in ("quiz", "flashcards"):
        gen = _items(ctx, kind, text, topic, clamp_count(kind, count))
    else:
        raise AppError("bad_kind", "Tipo di scheda non valido.", 400)
    async for ev in gen:
        yield ev


async def _summary(ctx: GenContext, text: str | None, topic: str | None) -> AsyncIterator[Event]:
    target = summary_target_words(text)
    schema = summary_schema()
    retries: list[bool] = []

    if text and needs_chunking(text, ctx.num_ctx):
        chunks = split_chunks(text)
        total = len(chunks) + 1
        yield {"stage": "start", "total": total}
        per_chunk = max(120, min(400, round(target * 1.6 / len(chunks))))
        partials: list[str] = []
        for i, chunk in enumerate(chunks, 1):
            msgs = [
                {"role": "system", "content": prompts.SYSTEM.replace(" Rispondi esclusivamente con JSON valido conforme allo schema.", "")},
                {"role": "user", "content": prompts.CHUNK_SUMMARY.format(i=i, total=len(chunks), words=per_chunk)
                 + "\n\n" + prompts.material_block(chunk, topic)},
            ]
            partials.append(strip_think(await ctx.client.chat_text(ctx.model, msgs, ctx.num_ctx)))
            yield {"stage": "chunk", "done": i, "total": total}
        joined = "\n\n".join(f"[Parte {i}]\n{p}" for i, p in enumerate(partials, 1))
        instruction = prompts.REDUCE_NOTE + "\n\n" + prompts.SUMMARY.format(words=target)
        result = await structured_call(ctx, build_messages(instruction, joined, topic), schema, validate_summary,
                                       lambda: retries.append(True))
        yield {"stage": "chunk", "done": total, "total": total}
    else:
        yield {"stage": "start", "total": 1}
        result = await structured_call(ctx, build_messages(prompts.SUMMARY.format(words=target), text, topic),
                                       schema, validate_summary, lambda: retries.append(True))
        yield {"stage": "chunk", "done": 1, "total": 1}
    yield {"stage": "result", "result": result}


async def _items(ctx: GenContext, kind: str, text: str | None, topic: str | None, count: int) -> AsyncIterator[Event]:
    is_quiz = kind == "quiz"
    template = prompts.QUIZ if is_quiz else prompts.FLASHCARDS

    def schema_for(n: int) -> dict[str, Any]:
        return quiz_schema(min(n, 3)) if is_quiz else flashcards_schema(min(n, 4))

    def validator(n: int) -> Callable[[Any], GenResult]:
        if is_quiz:
            return lambda d: validate_quiz(d, n, ctx.rng)
        return lambda d: validate_flashcards(d, n)

    if text and needs_chunking(text, ctx.num_ctx):
        chunks = split_chunks(text)
        counts = distribute(count, [len(c) for c in chunks])
        yield {"stage": "start", "total": len(chunks)}
        merged: list[dict[str, Any]] = []
        seen: set[str] = set()
        title = ""
        for i, (chunk, n) in enumerate(zip(chunks, counts), 1):
            # Chiedi un elemento in più per compensare i duplicati tra blocchi.
            ask = n + 1
            res = await structured_call(ctx, build_messages(template.format(n=ask), chunk, topic),
                                        schema_for(ask), validator(ask))
            title = title or res.title
            entries = res.content["questions" if is_quiz else "cards"]
            merged.extend((clean_questions if is_quiz else clean_cards)(entries, seen))
            yield {"stage": "chunk", "done": i, "total": len(chunks)}
        merged = merged[:count]
        if len(merged) < min(count, MIN_ITEMS[kind]):
            raise AppError("generation_failed", GENERATION_FAILED_MSG, 422)
        key = "questions" if is_quiz else "cards"
        if topic:
            title = clean_title(topic, title)
        yield {"stage": "result", "result": GenResult(kind, title, {key: merged})}
    else:
        yield {"stage": "start", "total": 1}
        res = await structured_call(ctx, build_messages(template.format(n=count), text, topic),
                                    schema_for(count), validator(count))
        yield {"stage": "chunk", "done": 1, "total": 1}
        yield {"stage": "result", "result": res}
