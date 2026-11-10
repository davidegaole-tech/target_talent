# Quaderno locale

Riassunti, quiz e flashcard generati da un modello linguistico **che gira sul tuo computer**.
Incolli appunti, alleghi un file (.txt, .md, .pdf, .docx) o scrivi un argomento: Quaderno crea la scheda e la salva in una libreria che consulti dal browser.

- È gratis e funziona offline.
- I tuoi appunti non escono mai dal computer: l'app parla solo con Ollama su `localhost`.
- È più lento di un servizio cloud e un po' meno preciso sui quiz difficili.

## Installazione in 3 passi

Ti servono **Python 3.11 o più recente** ([python.org](https://www.python.org/downloads/)) e circa 6 GB liberi per il modello.

1. **Installa Ollama** da <https://ollama.com/download> (su Linux: `curl -fsSL https://ollama.com/install.sh | sh`) e avvialo: apri l'app oppure esegui `ollama serve`.
2. **Scarica un modello** (vedi la tabella sotto), per esempio:
   ```
   ollama pull qwen3:8b
   ```
3. **Avvia Quaderno**:
   - macOS / Linux: `./scripts/start.sh`
   - Windows: doppio clic su `scripts\start.bat`

   La prima volta lo script crea l'ambiente Python e installa le dipendenze. Poi apre il browser su <http://localhost:8765>.
   Se il modello configurato non è installato, lo script ti chiede se scaricarlo.

## Quale modello scegliere

| Memoria del computer | Dimensione modello | Esempi (controlla i tag) |
|---|---|---|
| ~8 GB di RAM | 3–4 miliardi di parametri | `qwen3:4b`, `gemma3:4b` |
| 16 GB di RAM | 7–8 miliardi (**predefinito**) | `qwen3:8b` |
| 32 GB di RAM o GPU da 24 GB | 14–32 miliardi | `qwen3:14b`, `qwen3:32b`, `gemma3:27b` |

- Per l'italiano vanno bene le famiglie **Qwen** e **Gemma**.
- I nomi dei modelli cambiano spesso: controlla i tag aggiornati su <https://ollama.com/library>.
- I modelli più grandi sbagliano meno le domande dei quiz, ma sono più lenti.

## Cambiare modello

- **Dalla pagina**: il menu in alto a destra elenca i modelli installati in Ollama. Quello che scegli resta salvato anche dopo il riavvio.
- **Da file**: copia `.env.example` in `.env` e modifica `QUADERNO_MODEL`. La scelta fatta dalla pagina ha la precedenza.

Per installare un nuovo modello: `ollama pull <nome>`, poi ricarica la pagina.

Altre impostazioni in `.env`: `OLLAMA_URL`, `QUADERNO_PORT` (porta della pagina, default 8765), `QUADERNO_NUM_CTX` (finestra di contesto, default 8192: aumentala se hai molta memoria e testi lunghi).

## Come si usa

- Scrivi un argomento breve (es. “la Rivoluzione francese”) oppure incolla un testo lungo o allega un file.
- Premi **Riassunto**, **Quiz**, **Flashcard** o **Tutti e tre**. Accanto ai pulsanti scegli quante domande o carte vuoi.
- Puoi anche scrivere richieste come “fammi un quiz di 10 domande sulla fotosintesi”.
- Le altre domande (“non ho capito il ciclo di Calvin”) vanno al tutor, che risponde basandosi sull'ultimo materiale che hai dato.
- Una generazione in corso si interrompe con **Annulla**.

## Dove sono i dati

Le schede stanno nel file `data/quaderno.db` (SQLite), nella cartella del progetto. Restano dopo il riavvio.

**Backup**: premi **Esporta** nella libreria per scaricare tutte le schede in un file JSON. Con **Importa** le ricarichi, anche su un altro computer; le schede già presenti non vengono duplicate.

## Risoluzione problemi

**“Ollama non risponde”** — Ollama non è avviato. Apri l'app Ollama oppure esegui `ollama serve` in un terminale, poi ricarica la pagina. Le schede salvate restano consultabili anche senza Ollama.

**Il modello è troppo lento** — Su un computer senza scheda video dedicata un modello da 8B può impiegare 1–3 minuti per scheda. Prova un modello più piccolo (`qwen3:4b`), chiedi meno domande, oppure chiudi altri programmi pesanti. La prima richiesta dopo l'avvio è più lenta perché il modello viene caricato in memoria.

**“Il modello non è riuscito a creare la scheda”** — Il modello ha prodotto due volte un risultato non valido. Riprova, oppure scegli un modello più grande.

**PDF senza testo** — Se il PDF è una scansione (immagini delle pagine), non contiene testo da leggere. Usa un PDF con testo selezionabile o passalo prima in un programma di OCR.

**Memoria insufficiente** — Se Ollama si blocca o segnala errori di memoria, il modello è troppo grande per il tuo computer: scegline uno più piccolo dalla tabella. Puoi anche ridurre `QUADERNO_NUM_CTX` a 4096 in `.env`.

**La porta 8765 è occupata** — Imposta un'altra porta con `QUADERNO_PORT` in `.env`.

## Per sviluppatori

```
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest          # i test non richiedono Ollama
.venv/bin/python -m uvicorn app.main:get_app --factory --reload --port 8765
```

Struttura: `app/` (FastAPI, client Ollama, generatori, SQLite), `web/` (HTML/CSS/JS senza build, `marked` e `DOMPurify` serviti in locale da `web/vendor/`), `tests/`.
