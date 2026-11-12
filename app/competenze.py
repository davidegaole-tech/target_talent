"""Analisi delle competenze chiave europee fatta in locale, senza modello AI.

Il motore legge il testo di una prova o di un obiettivo (il campo "Cosa" del
planner) e lo collega alle 8 competenze europee con un punteggio 0-1 e una
spiegazione. È deterministico e spiegabile:

1. normalizzazione (minuscole, accenti, punteggiatura, apostrofi)
2. dizionario pesato per competenza: frasi (peso alto), parole chiave, radici
3. bonus di campo: il titolo/"cosa" conta più dei dettagli
4. gestione delle negazioni ("non voglio fare…") con finestra di 4 parole
5. punteggio grezzo → probabilità con saturazione, così i match deboli
   restano "bassa confidenza" invece di sembrare sicuri
6. spiegazione leggibile + segnali (le parole che hanno pesato di più)

Le stesse regole valgono per "Analizza con l'AI" quando Ollama non è attivo:
``analizza_testo`` è il ripiego automatico della route ``/api/analyze``.
"""
from __future__ import annotations

import re
import unicodedata
from difflib import SequenceMatcher
from typing import Any, Iterable

# --------------------------------------------------------------------------- #
#  Dizionari
# --------------------------------------------------------------------------- #

COMPETENCE_DIMENSION: dict[str, str] = {
    "alfabetica": "fare",
    "multilingue": "fare",
    "stem": "fare",
    "digitale": "lavorare",
    "personale": "essere",
    "cittadinanza": "essere",
    "imprenditoriale": "lavorare",
    "cultura": "essere",
}

# Frasi: peso alto perché sono molto specifiche.
PHRASES: dict[str, list[tuple[str, float]]] = {
    "cittadinanza": [
        ("primo soccorso", 3.0), ("croce rossa", 3.0), ("protezione civile", 3.0),
        ("educazione civica", 2.6), ("raccolta fondi", 2.4), ("banca del sangue", 2.6),
        ("pulizia del parco", 2.4), ("aiuto ai compagni", 1.8), ("diritti umani", 2.2),
        ("consiglio comunale", 2.2),
    ],
    "imprenditoriale": [
        ("lavoro di squadra", 2.2), ("gestione del budget", 2.6), ("business plan", 2.8),
        ("mercato solidale", 2.2), ("gestione del progetto", 2.4), ("problem solving", 1.8),
        ("capogruppo", 2.2), ("raccolta fondi", 2.2),
    ],
    "stem": [
        ("stampa 3d", 2.6), ("metodo scientifico", 2.6), ("analisi dei dati", 2.2),
        ("fisica quantistica", 2.4), ("occhio di bue", 1.2), ("esperimento di laboratorio", 2.6),
        ("disegno tecnico", 2.6), ("lavorazioni meccaniche", 2.4),
    ],
    "digitale": [
        ("intelligenza artificiale", 2.4), ("sito web", 2.2), ("social media", 1.8),
        ("montaggio video", 2.2), ("foglio di calcolo", 1.8), ("banca dati", 1.8),
        ("sicurezza informatica", 2.6),
    ],
    "multilingue": [
        ("certificazione linguistica", 3.0), ("scambio culturale", 2.4),
        ("madrelingua", 1.8), ("cambridge c1", 3.0), ("cambridge b2", 3.0),
        ("livello b2", 2.4), ("livello c1", 2.4), ("erasmus", 2.6),
    ],
    "personale": [
        ("metodo di studio", 2.4), ("gestione del tempo", 2.4), ("lavoro autonomo", 2.0),
        ("intelligenza emotiva", 2.0), ("pubblico parlare", 2.0), ("saper ascoltare", 1.8),
    ],
    "cultura": [
        ("storia dell'arte", 2.6), ("mostra fotografica", 2.4), ("educazione musicale", 2.2),
        ("patrimonio culturale", 2.4), ("disegno dal vero", 2.2), ("cortometraggio", 2.4),
    ],
    "alfabetica": [
        ("analisi del testo", 2.6), ("produzione scritta", 2.4), ("testo argomentativo", 2.6),
        ("lettura ad alta voce", 2.2), ("comprensione del testo", 2.4), ("giornalino scolastico", 2.4),
    ],
}

# Parole chiave: peso 0.8-2.0.
KEYWORDS: dict[str, dict[str, float]] = {
    "alfabetica": {
        "leggere": 1.6, "letto": 1.2, "lettura": 1.7, "libro": 1.5, "libri": 1.4,
        "romanzo": 1.6, "racconto": 1.5, "poesia": 1.5, "poeta": 1.5, "testo": 1.2,
        "testi": 1.2, "scrivere": 1.6, "scrittura": 1.7, "scritto": 1.3, "saggio": 1.5,
        "tema": 1.4, "recensione": 1.7, "articolo": 1.5, "giornalino": 1.8, "giornale": 1.3,
        "riassunto": 1.5, "dibattito": 1.8, "argomentare": 1.7, "argomentativo": 1.6,
        "grammatica": 1.4, "letteratura": 1.6, "biblioteca": 1.2, "romanzo": 1.5,
        "narrazione": 1.4, "raccontare": 1.2, "leggo": 1.5, "scriviamo": 1.4,
    },
    "multilingue": {
        "inglese": 1.8, "spagnolo": 1.8, "francese": 1.8, "tedesco": 1.8, "giapponese": 1.8,
        "cinese": 1.8, "arabo": 1.8, "lingua": 1.4, "lingue": 1.4, "linguistico": 1.6,
        "madrelingua": 1.8, "traduzione": 1.8, "tradurre": 1.7, "traduttore": 1.6,
        "cambridge": 2.0, "pet": 1.2, "fce": 1.8, "cae": 1.8, "ielts": 1.8, "toefl": 1.8,
        "delf": 1.8, "dele": 1.6, "goethe": 1.8, "erasmus": 1.8, "scambio": 1.4,
        "estero": 1.4, "bilinguismo": 1.8, "bilinguista": 1.8, "accento": 1.0,
        "reading": 1.4, "writing": 1.3, "listening": 1.3, "speaking": 1.3,
    },
    "stem": {
        "robot": 2.0, "robotica": 2.0, "arduino": 2.0, "elettronica": 1.8, "circuito": 1.8,
        "circuiti": 1.7, "sensore": 1.8, "sensori": 1.8, "esperimento": 1.8,
        "sperimentare": 1.2, "laboratorio": 1.4, "matematica": 1.8, "matematico": 1.6,
        "equazione": 1.8, "equazioni": 1.7, "geometria": 1.7, "algebra": 1.7,
        "fisica": 1.8, "chimica": 1.8, "biologia": 1.7, "scienze": 1.5, "scientifico": 1.6,
        "algoritmo": 1.8, "algoritmi": 1.7, "calcolo": 1.5, "calcolare": 1.3,
        "misura": 1.3, "misurazione": 1.4, "statistica": 1.7, "dati": 1.2, "grafico": 1.2,
        "cad": 1.6, "meccanica": 1.7, "astronomia": 1.8, "energia": 1.4, "cellula": 1.4,
        "dna": 1.5, "ecosistema": 1.4, "calvin": 1.2, "fotosintesi": 1.6, "teorema": 1.8,
        "tornio": 1.9, "officina": 1.5, "fresatrice": 1.9, "saldatura": 1.9,
        "manutenzione": 1.4, "impianto": 1.3, "motore": 1.5,
    },
    "digitale": {
        "computer": 1.4, "software": 1.8, "app": 1.8, "applicazione": 1.4, "sito": 1.8,
        "web": 1.6, "html": 1.8, "css": 1.8, "javascript": 1.8, "python": 1.8, "java": 1.6,
        "codice": 1.7, "programmare": 1.8, "programmazione": 1.8, "programmato": 1.7,
        "digitale": 1.7, "digitali": 1.5, "photoshop": 1.8, "canva": 1.8, "video": 1.6,
        "montaggio": 1.7, "audio": 1.5, "audacity": 1.8, "social": 1.6, "instagram": 1.6,
        "tiktok": 1.6, "youtube": 1.6, "podcast": 1.5, "database": 1.8, "sql": 1.8,
        "server": 1.5, "cybersecurity": 1.8, "privacy": 1.2, "stampante": 1.4, "pc": 1.2,
        "informatica": 1.8, "informatico": 1.7, "intelligenza": 1.0, "artificiale": 1.0,
    },
    "personale": {
        "organizzazione": 1.6, "organizzato": 1.5, "tempo": 1.4, "costanza": 1.8,
        "costante": 1.6, "disciplina": 1.7, "allenamento": 1.6, "allenare": 1.4,
        "sport": 1.6, "pallavolo": 1.8, "calcio": 1.8, "basket": 1.8, "nuoto": 1.8,
        "corsa": 1.6, "palestra": 1.6, "atletica": 1.8, "obiettivo": 1.0, "migliorare": 1.4,
        "miglioramento": 1.4, "motivazione": 1.5, "resilienza": 1.8, "autonomia": 1.6,
        "autostima": 1.6, "benessere": 1.5, "stress": 1.4, "emozioni": 1.5,
        "puntualità": 1.4, "responsabile": 1.4, "impegno": 1.3, "studio": 1.0,
        "concentrazione": 1.6, "ascolto": 1.5, "aiutare": 1.2, "collaborare": 1.4,
        "squadra": 1.3, "capitana": 1.6, "capitano": 1.6, "leadership": 1.6,
    },
    "cittadinanza": {
        "volontariato": 2.0, "volontario": 1.9, "volontaria": 1.9, "volunteer": 1.6,
        "comunità": 1.7, "quartiere": 1.6, "ambiente": 1.6, "ambientale": 1.6,
        "riciclo": 1.8, "riciclare": 1.7, "sostenibilità": 1.7, "sostenibile": 1.6,
        "solidarietà": 1.8, "solidale": 1.7, "donazione": 1.7, "donare": 1.5,
        "inclusione": 1.7, "inclusivo": 1.6, "diritti": 1.6, "cittadino": 1.6,
        "cittadinanza": 1.9, "assemblea": 1.4, "rappresentante": 1.7, "protezione": 1.2,
        "anziani": 1.7, "bambini": 1.5, "elementari": 1.3, "parrocchia": 1.5,
        "associazione": 1.5, "onlus": 1.7, "raccolta": 1.3, "pulizia": 1.4,
        "costituzione": 1.7, "legalità": 1.7, "pace": 1.5, "uguaglianza": 1.6,
    },
    "imprenditoriale": {
        "progetto": 1.5, "progettare": 1.4, "startup": 2.0, "impresa": 1.8,
        "imprenditore": 1.9, "imprenditoriale": 1.9, "mercatino": 1.9, "evento": 1.6,
        "organizzare": 1.7, "organizzazione": 1.5, "coordinare": 1.9, "coordinamento": 1.8,
        "budget": 1.9, "team": 1.5, "gruppo": 1.3, "leadership": 1.7, "vendita": 1.7,
        "vendere": 1.6, "marketing": 1.9, "pubblicità": 1.7, "sponsor": 1.8,
        "pianificare": 1.6, "pianificazione": 1.6, "gestione": 1.5, "gestire": 1.5,
        "economia": 1.6, "business": 1.9, "hackathon": 1.8, "trattativa": 1.7,
        "negoziare": 1.6, "cliente": 1.5, "clienti": 1.5, "impresa": 1.8, "responsabile": 1.4,
        "iniziativa": 1.7, "decidere": 1.2, "rischio": 1.2,
    },
    "cultura": {
        "arte": 1.8, "artistico": 1.7, "artista": 1.7, "disegno": 1.7, "disegnare": 1.6,
        "pittura": 1.8, "dipingere": 1.7, "scultura": 1.8, "musica": 1.8, "musicale": 1.7,
        "chitarra": 1.8, "pianoforte": 1.8, "violino": 1.8, "batteria": 1.6,
        "teatro": 1.8, "teatrale": 1.7, "recitazione": 1.8, "recitare": 1.7,
        "danza": 1.8, "ballo": 1.7, "fotografia": 1.7, "fotografico": 1.6, "foto": 1.4,
        "mostra": 1.7, "museo": 1.7, "cinema": 1.7, "film": 1.5, "cortometraggio": 1.9,
        "documentario": 1.7, "design": 1.6, "grafica": 1.6, "locandina": 1.8,
        "poesia": 1.5, "letteratura": 1.5, "storia": 1.3, "patrimonio": 1.6,
        "tradizioni": 1.6, "folklore": 1.6, "architettura": 1.7, "cori": 1.6,
        "band": 1.5, "concerto": 1.7, "spettacolo": 1.7, "colori": 1.2,
        "monumenti": 1.6, "archeologia": 1.6, "gita": 1.2, "viaggio": 1.1,
    },
}

# Radici: catturano i derivati (programm- → programmare, programmato, programmazione).
STEMS: dict[str, list[tuple[str, float]]] = {
    "alfabetica": [("scriv", 1.2), ("legg", 1.1), ("raccont", 1.1), ("narr", 1.0), ("argoment", 1.2)],
    "multilingue": [("tradur", 1.3), ("tradot", 1.2), ("lingu", 1.2)],
    "stem": [("programm", 1.3), ("speriment", 1.2), ("misur", 1.0), ("calcol", 1.1), ("scienz", 1.2)],
    "digitale": [("digital", 1.3), ("informatic", 1.4), ("montagg", 1.2), ("videomaking", 1.3)],
    "personale": [("allen", 1.2), ("organizz", 1.1), ("miglior", 1.0), ("responsabil", 1.1)],
    "cittadinanza": [("volontar", 1.5), ("solidal", 1.3), ("ricicl", 1.4), ("sostenibil", 1.3), ("inclus", 1.3)],
    "imprenditoriale": [("organizz", 1.3), ("coordin", 1.3), ("gest", 1.1), ("vend", 1.1), ("progett", 1.1)],
    "cultura": [("artist", 1.3), ("music", 1.3), ("teatr", 1.3), ("fotograf", 1.2), ("disegn", 1.2)],
}

NEGATIONS = {"non", "senza", "niente", "mai", "evitare", "evito", "smettere", "smetto", "no"}
NEGATION_WINDOW = 4
STOPWORDS = {
    "il", "lo", "la", "i", "gli", "le", "un", "uno", "una", "di", "da", "in", "con", "su",
    "per", "tra", "fra", "e", "ed", "o", "ma", "che", "chi", "cui", "come", "dove", "quando",
    "a", "al", "allo", "alla", "ai", "agli", "alle", "del", "dello", "della", "dei", "degli",
    "delle", "nel", "nello", "nella", "nei", "negli", "nelle", "sul", "sullo", "sulla",
    "sui", "sugli", "sulle", "mi", "ti", "si", "ci", "vi", "li", "le", "ne", "mio", "mia",
    "miei", "mie", "tuo", "tua", "suo", "sua", "questo", "questa", "quel", "quella",
    "sono", "sei", "è", "e", "siamo", "siete", "ho", "hai", "ha", "abbiamo", "hanno",
    "essere", "avere", "fare", "molto", "poco", "più", "meno", "anche", "già", "poi",
}

# Come spiegare la scelta, per competenza.
WHY: dict[str, str] = {
    "alfabetica": "lettura, scrittura e argomentazione",
    "multilingue": "uso reale di una lingua straniera",
    "stem": "metodo scientifico, logica e progettazione tecnica",
    "digitale": "creazione di contenuti e strumenti digitali",
    "personale": "costanza, autoregolazione e gestione di sé",
    "cittadinanza": "impegno civico e responsabilità verso la comunità",
    "imprenditoriale": "iniziativa, organizzazione e guida di un gruppo",
    "cultura": "espressione creativa e consapevolezza culturale",
}

FIELD_WEIGHTS = {"title": 1.0, "description": 0.62}


# --------------------------------------------------------------------------- #
#  Normalizzazione
# --------------------------------------------------------------------------- #

def normalizza(text: str) -> str:
    """Minuscole, senza accenti, apostrofi come spazio, punteggiatura via."""
    text = (text or "").lower().replace("’", "'")
    text = text.replace("'", " ")
    text = unicodedata.normalize("NFKD", text)
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def _tokens(text: str) -> list[str]:
    return [t for t in normalizza(text).split(" ") if t]


# --------------------------------------------------------------------------- #
#  Motore
# --------------------------------------------------------------------------- #

def _match_quality(token: str, keyword: str) -> float:
    """1.0 parola identica, 0.85 variante (radice/prefisso), 0.6 simile.

    Le regole morbide valgono solo per parole lunghe: senza questo limite
    "c1" somiglia a "cinese" e "tre" a "traduzione".
    """
    if token == keyword:
        return 1.0
    if len(keyword) >= 6 and len(token) >= 6:
        if token.startswith(keyword[:-1]) or keyword.startswith(token[:-1]):
            return 0.85
        if abs(len(token) - len(keyword)) <= 3:
            if SequenceMatcher(None, token, keyword).ratio() >= 0.88:
                return 0.60
    return 0.0


def _negated(tokens: list[str], index: int) -> bool:
    start = max(0, index - NEGATION_WINDOW)
    return any(t in NEGATIONS for t in tokens[start:index])


def _add(scores: dict[str, float], signals: dict[str, set[str]], competence: str,
         weight: float, signal: str) -> None:
    scores[competence] = scores.get(competence, 0.0) + weight
    if signal and 3 <= len(signal) <= 40:
        signals.setdefault(competence, set()).add(signal)


def punteggi(cosa: str, dettagli: str = "") -> dict[str, Any]:
    """Punteggi grezzi per competenza + i segnali che li hanno prodotti."""
    title_tokens = _tokens(cosa)
    detail_tokens = _tokens(dettagli)
    all_tokens = title_tokens + detail_tokens
    scores: dict[str, float] = {}
    signals: dict[str, set[str]] = {}

    # 1. frasi (sul testo normalizzato, così "primo soccorso" combacia)
    title_norm = " ".join(title_tokens)
    detail_norm = " ".join(detail_tokens)
    for competence, phrases in PHRASES.items():
        for phrase, weight in phrases:
            if phrase in title_norm:
                _add(scores, signals, competence, weight * FIELD_WEIGHTS["title"], phrase)
            elif phrase in detail_norm:
                _add(scores, signals, competence, weight * FIELD_WEIGHTS["description"], phrase)

    # 2. parole chiave, con bonus di campo e gestione negazioni
    lookup: dict[str, list[tuple[str, float]]] = {}
    for competence, words in KEYWORDS.items():
        for word, weight in words.items():
            lookup.setdefault(word, []).append((competence, weight))

    for index, token in enumerate(all_tokens):
        if token in STOPWORDS or len(token) < 2:
            continue
        field = FIELD_WEIGHTS["title"] if index < len(title_tokens) else FIELD_WEIGHTS["description"]
        neg = 0.25 if _negated(all_tokens, index) else 1.0
        for word, entries in lookup.items():
            quality = _match_quality(token, word)
            if not quality:
                continue
            for competence, weight in entries:
                _add(scores, signals, competence, weight * quality * field * neg, token)

    # 3. radici (solo se la parola esatta non ha già pesato)
    for index, token in enumerate(all_tokens):
        if token in STOPWORDS or len(token) < 5:
            continue
        field = FIELD_WEIGHTS["title"] if index < len(title_tokens) else FIELD_WEIGHTS["description"]
        neg = 0.25 if _negated(all_tokens, index) else 1.0
        for competence, stems in STEMS.items():
            for stem, weight in stems:
                if token.startswith(stem):
                    _add(scores, signals, competence, weight * 0.8 * field * neg, token)

    return {"scores": scores, "signals": signals, "tokens": all_tokens}


def _probabilita(raw: dict[str, float]) -> dict[str, float]:
    """Da punteggio grezzo a probabilità 0-1 con saturazione.

    Un solo segnale debole non deve sembrare una scelta sicura: la probabilità
    dipende sia dal confronto con la competenza migliore sia dalla forza
    assoluta dei segnali trovati.
    """
    if not raw:
        return {}
    best = max(raw.values())
    out: dict[str, float] = {}
    for competence, value in raw.items():
        relative = value / best if best else 0.0
        strength = min(1.0, value / 3.0)          # 3 unità di peso = segnale forte
        p = 0.35 + 0.63 * relative * (0.35 + 0.65 * strength)
        if relative < 0.55:
            p *= 0.85                              # i match deboli restano bassi
        out[competence] = round(max(0.05, min(0.98, p)), 2)
    return out


def confidenza(p: float) -> str:
    return "alta" if p >= 0.85 else "media" if p >= 0.6 else "bassa"


def _reason(competenze: list[dict[str, Any]], segnali: list[str]) -> str:
    if not competenze:
        return "nessun segnale riconosciuto: prova a raccontare meglio cosa fai e cosa impari"
    main = competenze[0]["id"]
    extra = competenze[1]["id"] if len(competenze) > 1 and competenze[1]["p"] >= 0.6 else None
    why = WHY.get(main, "competenze trasversali")
    if extra:
        why = f"{why}, con un richiamo a {WHY.get(extra, 'altre competenze')}"
    if segnali:
        return f"{why}. Segnali: {', '.join(segnali[:4])}"[:220]
    return why[:220]


def analizza_testo(cosa: str, dettagli: str = "", kind: str | None = None) -> dict[str, Any]:
    """Risultato nello stesso formato di ``/api/analyze`` (modello AI)."""
    base = punteggi(cosa, dettagli)
    raw = base["scores"]
    probs = _probabilita(raw)

    ordinati = sorted(probs.items(), key=lambda kv: kv[1], reverse=True)
    scelti = [{"id": cid, "p": p} for cid, p in ordinati[:2] if p >= 0.5]
    if not scelti and ordinati:
        scelti = [{"id": ordinati[0][0], "p": ordinati[0][1]}]

    if not scelti:
        # Nessun segnale: come l'analisi storica del frontend, ma dichiarata debole.
        scelti = [{"id": "personale", "p": 0.55}, {"id": "imprenditoriale", "p": 0.50}]
        segnali = ["interesse generale"]
        motivo = "il testo è generico: scegli un obiettivo più specifico per un collegamento preciso"
    else:
        segnali_set: set[str] = set()
        for item in scelti:
            segnali_set |= base["signals"].get(item["id"], set())
        if not segnali_set:
            for cid in raw:
                segnali_set |= base["signals"].get(cid, set())
        segnali = sorted(segnali_set)[:5]
        motivo = _reason(scelti, segnali)

    dims = sorted({COMPETENCE_DIMENSION[c["id"]] for c in scelti if c["id"] in COMPETENCE_DIMENSION})
    return {
        "comp": scelti,
        "dims": dims,
        "perche": motivo,
        "segnali": segnali,
        "conf": confidenza(scelti[0]["p"]),
        "engine": "algoritmo",
        "punteggi": {cid: p for cid, p in ordinati},
        "kind": kind,
    }


def top_competenze(cosa: str, dettagli: str = "", limite: int = 3) -> list[dict[str, Any]]:
    """Classifica completa (utile per mostrare "quanto" è forte ogni competenza)."""
    probs = _probabilita(punteggi(cosa, dettagli)["scores"])
    return [{"id": cid, "p": p} for cid, p in
            sorted(probs.items(), key=lambda kv: kv[1], reverse=True)[:limite]]
