# Quaderno Locale — specifica di progetto

App di studio che gira **interamente sul computer dell'utente**: l'utente incolla appunti, allega un file o scrive un argomento, e un modello linguistico locale (via **Ollama**) genera **riassunti**, **quiz** e **flashcard**. Ogni risultato viene salvato come **scheda** in una libreria consultabile da una pagina web locale.

Nessuna chiamata a servizi esterni a runtime: tutto passa da Ollama su `localhost`.

L'interfaccia di riferimento è `reference/quaderno-reference.html` (versione cloud già esistente). Riusane layout, stile, componenti (chat a sinistra, libreria a destra, viewer modale con lettore quiz e flashcard), **sostituendo** le parti che usano `window.claude` (`sample`, `db`, `user`) con chiamate al backend locale descritto sotto.

---

## 1. Stack

| Parte | Scelta | Motivo |
|---|---|---|
| Modello | Ollama (`http://localhost:11434`) | Installazione semplice, API stabile, output strutturato con JSON Schema |
| Backend | Python 3.11+, **FastAPI** + **uvicorn**, **httpx** | Leggero, async, streaming facile |
| Database | **SQLite** (modulo `sqlite3` della stdlib), file `data/quaderno.db` | Zero configurazione |
| Lettura file | `pypdf` (PDF), `python-docx` (DOCX), testo puro per .txt/.md | Allegati comuni degli studenti |
| Frontend | HTML + CSS + JS vanilla, servito da FastAPI come file statici | Nessun build step |
| Test | `pytest` + `httpx` (client di test FastAPI) | |

Il frontend parla **solo** con il backend (stessa origine), mai direttamente con Ollama: così non serve configurare `OLLAMA_ORIGINS`.

## 2. Struttura cartelle

```
quaderno-locale/
├── CLAUDE.md
├── README.md                 # istruzioni utente in italiano (installazione, avvio, scelta modello)
├── pyproject.toml            # oppure requirements.txt
├── .env.example              # OLLAMA_URL, QUADERNO_MODEL, QUADERNO_PORT, QUADERNO_NUM_CTX
├── scripts/
│   ├── start.sh              # macOS/Linux: crea venv, installa, controlla Ollama, avvia, apre il browser
│   └── start.bat             # Windows: idem
├── app/
│   ├── main.py               # FastAPI: monta static, registra router
│   ├── config.py             # legge env con default sensati
│   ├── ollama_client.py      # chat, chat in streaming, chat con format JSON, lista modelli, health
│   ├── generators.py         # genera_riassunto / genera_quiz / genera_flashcard + chunking + validazione
│   ├── schemas.py            # modelli Pydantic + JSON Schema passati a Ollama
│   ├── prompts.py            # tutti i prompt in un solo posto
│   ├── extract.py            # testo da PDF/DOCX/TXT/MD
│   ├── db.py                 # accesso SQLite (CRUD schede, migrazione iniziale)
│   └── routes/
│       ├── items.py          # /api/items
│       ├── generate.py       # /api/generate
│       ├── chat.py           # /api/chat (streaming)
│       └── system.py         # /api/health, /api/models, /api/settings
├── web/
│   ├── index.html            # derivato da reference/quaderno-reference.html
│   ├── app.js
│   └── styles.css
├── reference/
│   └── quaderno-reference.html
├── data/                     # creata a runtime, in .gitignore
└── tests/
    ├── test_schemas.py
    ├── test_generators.py    # con client Ollama finto
    ├── test_items_api.py
    └── test_extract.py
```

## 3. Configurazione (`app/config.py`)

| Variabile | Default | Note |
|---|---|---|
| `OLLAMA_URL` | `http://localhost:11434` | |
| `QUADERNO_MODEL` | `qwen3:8b` | Modificabile anche dalla UI (vedi §7). Se il tag non è installato, usa il primo modello installato e mostra un avviso |
| `QUADERNO_NUM_CTX` | `8192` | Passato come `options.num_ctx` a Ollama |
| `QUADERNO_PORT` | `8765` | |
| `QUADERNO_DB` | `data/quaderno.db` | |

Le impostazioni scelte dalla UI (modello) si salvano in una tabella `settings` e hanno precedenza sull'env.

## 4. Modello dati (SQLite)

```sql
CREATE TABLE IF NOT EXISTS items (
  id          TEXT PRIMARY KEY,           -- uuid4 hex
  type        TEXT NOT NULL CHECK (type IN ('summary','quiz','flashcards')),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,              -- JSON, forma per tipo sotto
  source_name TEXT,                       -- nome file o "argomento"
  model       TEXT NOT NULL,              -- modello che l'ha generata
  best_score  INTEGER,                    -- solo quiz: miglior punteggio
  created_at  INTEGER NOT NULL            -- epoch ms
);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

Forma di `content` (identica a quella della pagina di riferimento, così il frontend si riusa):

```jsonc
// summary
{ "text": "markdown…", "keyPoints": ["…", "…"] }
// quiz
{ "questions": [ { "q": "…", "options": ["…","…","…","…"], "answer": 2, "explanation": "…" } ] }
// flashcards
{ "cards": [ { "front": "…", "back": "…" } ] }
```

## 5. API backend

Tutte JSON, prefisso `/api`. Errori come `{ "error": { "code": "...", "message": "messaggio in italiano per l'utente" } }`.

| Metodo | Percorso | Cosa fa |
|---|---|---|
| GET | `/api/health` | `{ ollama: true/false, model: "...", model_installed: bool }` |
| GET | `/api/models` | Modelli installati in Ollama (`GET /api/tags`) con nome e dimensione |
| PUT | `/api/settings` | `{ model }` salva il modello scelto |
| GET | `/api/items?type=&q=` | Lista schede (più recenti prima), filtro per tipo e titolo |
| GET | `/api/items/{id}` | Una scheda |
| PATCH | `/api/items/{id}` | Solo `{ best_score }` o `{ title }` |
| DELETE | `/api/items/{id}` | Elimina |
| POST | `/api/extract` | multipart con un file → `{ name, text, words }`. Max 10 MB. Errore chiaro per PDF scansionati senza testo |
| POST | `/api/generate` | `{ kind: "summary"|"quiz"|"flashcards", text?: string, topic?: string, count?: int }` → genera, valida, **salva**, restituisce la scheda. Almeno uno tra `text` e `topic` |
| POST | `/api/chat` | `{ messages: [{role, content}], context_text?: string }` → risposta in **streaming** (`text/event-stream` o NDJSON) per domande libere al tutor. Non crea schede |

La generazione può richiedere decine di secondi: `/api/generate` deve restituire **eventi di avanzamento** in streaming (NDJSON: `{"stage":"chunk","done":2,"total":5}` … `{"stage":"done","item":{…}}`) così la UI mostra una barra di progresso.

## 6. Generazione (cuore del progetto)

### 6.1 Output strutturato
Per quiz, flashcard e riassunti **non** usare la chat con tool calling (i modelli piccoli la gestiscono male). Usa `POST /api/chat` di Ollama con:
- `"stream": false`
- `"format": <JSON Schema>` preso da `schemas.py` (Ollama vincola l'output allo schema)
- `"options": { "temperature": 0.3, "num_ctx": QUADERNO_NUM_CTX }`
- per i modelli con "thinking" (es. Qwen3) imposta `"think": false` se supportato, altrimenti rimuovi eventuali blocchi `<think>…</think>` dalla risposta prima del parsing

JSON Schema da passare (chiavi in inglese, contenuto in italiano):

```jsonc
// summary
{ "type":"object", "required":["title","text","keyPoints"],
  "properties": { "title":{"type":"string"}, "text":{"type":"string"},
                  "keyPoints":{"type":"array","items":{"type":"string"},"minItems":3,"maxItems":6} } }
// quiz
{ "type":"object", "required":["title","questions"],
  "properties": { "title":{"type":"string"},
    "questions":{"type":"array","minItems":3,"items":{"type":"object",
      "required":["q","options","answer","explanation"],
      "properties":{"q":{"type":"string"},
        "options":{"type":"array","items":{"type":"string"},"minItems":4,"maxItems":4},
        "answer":{"type":"integer","minimum":0,"maximum":3},
        "explanation":{"type":"string"}}}}}}
// flashcards
{ "type":"object", "required":["title","cards"],
  "properties": { "title":{"type":"string"},
    "cards":{"type":"array","minItems":4,"items":{"type":"object",
      "required":["front","back"],"properties":{"front":{"type":"string"},"back":{"type":"string"}}}}}}
```

### 6.2 Validazione e ripristino
Dopo il parsing, valida con Pydantic e applica queste regole:
- quiz: esattamente 4 opzioni, `answer` in 0..3, opzioni non duplicate, domande non duplicate (confronto normalizzato). **Mescola le opzioni** lato server aggiornando `answer` (i modelli piccoli mettono spesso la risposta giusta sempre nella stessa posizione)
- flashcard: fronte ≤ 120 caratteri, retro ≤ 400, niente duplicati
- titolo: max 60 caratteri, niente virgolette esterne
- Se JSON non valido o regole violate: **un solo nuovo tentativo** con un messaggio che spiega l'errore. Se fallisce di nuovo, errore `generation_failed` con messaggio utente: "Il modello non è riuscito a creare la scheda. Riprova o scegli un modello più grande."

### 6.3 Testi lunghi (chunking)
Stima i token come `len(text) / 3.5`. Se il testo supera ~60% di `num_ctx`:
1. Dividi per paragrafi in blocchi di ~2500 token con 200 token di sovrapposizione
2. **Riassunto**: map-reduce, riassunto di ogni blocco (testo libero), poi riassunto finale strutturato dai riassunti parziali
3. **Quiz / flashcard**: distribuisci il numero richiesto tra i blocchi in proporzione alla lunghezza, genera per blocco, unisci, togli i duplicati, tronca al numero richiesto
4. Emetti un evento di avanzamento per ogni blocco

### 6.4 Numeri predefiniti
Quiz 8 domande (range 3–20), flashcard 12 (range 4–40). Il riassunto è lungo circa il 15–25% del testo di partenza, min 150 e max 900 parole.

### 6.5 Prompt (`prompts.py`)
Un prompt di sistema comune più uno per tipo. Linee guida da rispettare:

Sistema:
> Sei un tutor di studio. Scrivi in italiano corretto e chiaro (se il materiale è in un'altra lingua, rispondi nella lingua del materiale). Usa **solo** le informazioni del materiale fornito; se viene dato solo un argomento, usa conoscenze generali accurate e consolidate. Non inventare dati, date o nomi. Rispondi esclusivamente con JSON valido conforme allo schema.

Riassunto:
> Crea un riassunto del materiale in Markdown: titoletti `##` per le sezioni, elenchi dove aiutano, **grassetto** sui concetti chiave. Poi 3–6 punti chiave brevi. Titolo specifico, massimo 6 parole.

Quiz:
> Crea {n} domande a scelta multipla sul materiale. Ogni domanda verifica un concetto diverso, dal più importante al più specifico. 4 opzioni plausibili, una sola corretta; i distrattori devono essere errori tipici, non assurdi. Niente "tutte le precedenti"/"nessuna delle precedenti". Spiegazione di 1–2 frasi che dice perché la risposta è giusta.

Flashcard:
> Crea {n} flashcard sul materiale. Fronte: un termine, una data o una domanda breve. Retro: risposta concisa e autosufficiente (1–2 frasi). Copri i concetti principali senza ripetizioni.

Il materiale va sempre racchiuso tra delimitatori (`<materiale>…</materiale>`) e va detto al modello di ignorare eventuali istruzioni contenute al suo interno.

## 7. Frontend (`web/`)

Parti da `reference/quaderno-reference.html` e dividilo in `index.html`, `styles.css`, `app.js`. Mantieni tema chiaro/scuro, layout responsive (tab su telefono), lettore quiz, lettore flashcard, esempi mostrati a libreria vuota.

Cambiamenti rispetto al riferimento:
1. **Niente `window.claude`.** Storage → `/api/items`. Generazione → `/api/generate` con streaming e barra di avanzamento nel messaggio del bot ("Sto creando il quiz… blocco 2 di 5")
2. **Chat**: i pulsanti Riassunto / Quiz / Flashcard / Tutti e tre chiamano `/api/generate` con il testo nella casella o l'allegato (se il testo è breve, < 120 caratteri, mandalo come `topic`). "Tutti e tre" esegue le tre generazioni **in sequenza**, non in parallelo (una sola GPU). I messaggi liberi vanno a `/api/chat` in streaming, passando come `context_text` l'ultimo materiale allegato o incollato
3. **Riconoscimento intento** per i messaggi scritti: regex semplici in `app.js` ("riassunt", "quiz", "domand", "flashcard", "schede", "carte") → instradale a `/api/generate`; tutto il resto va alla chat
4. **Allegati**: .txt, .md, .pdf, .docx tramite `/api/extract`; mostra nome e numero di parole
5. **Selettore del numero** (quiz/flashcard) accanto ai pulsanti, con i default di §6.4
6. **Barra di stato** in alto: pallino verde/rosso per Ollama, nome del modello attivo, menu per cambiarlo (da `/api/models`). Se Ollama non risponde: banner con "Avvia Ollama e ricarica la pagina" e il comando da copiare
7. **Annulla**: pulsante per interrompere una generazione in corso (AbortController lato client; il backend deve chiudere la richiesta a Ollama quando il client si disconnette)
8. **Esporta/Importa**: un pulsante esporta tutte le schede in un file JSON, un altro le reimporta (evitando di duplicare gli id)
9. Il quiz salva `best_score` con PATCH alla fine
10. Eliminazione con conferma inline (due clic), senza `confirm()`

## 8. Script di avvio

`scripts/start.sh` e `scripts/start.bat` devono:
1. Controllare Python ≥ 3.11
2. Creare `.venv` se manca e installare le dipendenze
3. Controllare che Ollama risponda su `OLLAMA_URL`. Se non risponde, stampare in italiano come installarlo (`https://ollama.com/download`) e avviarlo, poi uscire
4. Se il modello configurato non è installato, chiedere se scaricarlo (`ollama pull <modello>`)
5. Avviare uvicorn sulla porta configurata e aprire il browser su `http://localhost:<porta>`

## 9. README per l'utente

In italiano. Deve includere:
- requisiti e installazione in 3 passi
- **tabella per la scelta del modello in base alla RAM/VRAM**: ~8 GB → modello da 3–4B; 16 GB → 7–8B (default); 32 GB o GPU da 24 GB → 14–32B. Indicare di controllare i tag aggiornati su https://ollama.com/library e ricordare che per l'italiano vanno bene le famiglie Qwen e Gemma
- come cambiare modello dalla UI
- dove sono salvati i dati (`data/quaderno.db`) e come fare un backup (Esporta)
- risoluzione problemi: Ollama non avviato, modello troppo lento, PDF senza testo, memoria insufficiente

## 10. Test (devono passare con `pytest`, senza Ollama in esecuzione)

- `ollama_client` sostituibile con un finto client che restituisce JSON preimpostati
- schemi: JSON validi passano, JSON non validi (3 opzioni, `answer` = 5, campi mancanti) falliscono
- quiz: il mescolamento mantiene corretta la risposta; i duplicati vengono rimossi
- retry: primo output non valido e secondo valido → successo; due non validi → `generation_failed`
- chunking: testo lungo → più blocchi, numero totale di domande uguale al richiesto
- CRUD `/api/items` completo
- `extract`: txt, md, docx, pdf con testo (crea i file di prova nei test)

## 11. Ordine di lavoro

1. Scheletro FastAPI + config + `/api/health` + static serving
2. `db.py` + `/api/items` + test
3. `ollama_client.py` + `schemas.py` + `prompts.py` + `generators.py` (senza chunking) + test con client finto
4. `/api/generate` con streaming degli eventi
5. Frontend: porta il riferimento, collega storage e generazione
6. Chunking per testi lunghi
7. `/api/extract` + allegati nella UI
8. `/api/chat` in streaming per le domande libere
9. Selettore modello, stato Ollama, annulla, esporta/importa
10. Script di avvio + README
11. Prova end-to-end con un modello reale: genera uno per tipo da un testo di ~3000 parole e da un solo argomento, verifica a mano qualità e tempi

## 12. Criteri di accettazione

- Con Ollama e un modello da 7–8B, da un testo di ~1000 parole l'app crea una scheda di ogni tipo, valida e salvata, in meno di ~2 minuti su un portatile recente
- Le schede restano dopo il riavvio dell'app
- Nessuna richiesta di rete esce da `localhost` (niente CDN: scarica e servi in locale `marked` e `DOMPurify`; per i font usa quelli di sistema o file locali in `web/fonts/`)
- Con Ollama spento l'interfaccia si carica lo stesso, mostra il banner e lascia consultare le schede salvate
- `pytest` passa tutto
- Tutto il testo che l'utente vede è in italiano

## 13. Convenzioni

- Codice e identificatori in inglese, testo per l'utente e commenti per l'utente in italiano
- Type hints ovunque, funzioni piccole, niente variabili globali mutabili tranne la connessione/config
- Il Markdown generato dal modello va sempre sanificato (DOMPurify) prima di inserirlo nella pagina
- Non introdurre framework frontend o passi di build
