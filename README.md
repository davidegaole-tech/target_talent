# Talent Radar

Prototipo di **passaporto dei talenti** per studenti: raccogli prove (foto, link, testi), le colleghi alle 8 competenze chiave europee e alle dimensioni *Essere · Fare · Lavorare*, e segui il tuo profilo nel radar, nel diario, nell'orientamento e nell'e-portfolio.

Dentro c'è **Sergio**, un tutor AI che gira **sul tuo computer** grazie a [Ollama](https://ollama.com): si apre cliccando la **mascotte** (la faccina in basso a destra) e crea riassunti, quiz e flashcard dai tuoi appunti.

Anche **"Analizza con l'AI"** (pagina *Aggiungi una prova*) usa lo stesso modello locale per collegare ogni prova alle competenze chiave.

> È un prototipo: i dati del passaporto sono di esempio e restano nel browser.

## Installazione in 3 passi

Ti servono **Python 3.11 o più recente** ([python.org](https://www.python.org/downloads/)) e circa 6 GB liberi per il modello.

1. **Installa Ollama** da <https://ollama.com/download> (su Linux: `curl -fsSL https://ollama.com/install.sh | sh`) e avvialo: apri l'app oppure esegui `ollama serve`.
2. **Scarica un modello** (vedi la tabella sotto), per esempio:
   ```
   ollama pull qwen3:8b
   ```
3. **Avvia l'app**:
   - macOS / Linux: `./scripts/start.sh`
   - Windows: doppio clic su `scripts\start.bat`

   La prima volta lo script crea l'ambiente Python e installa le dipendenze, poi apre il browser su <http://localhost:8765>.
   Se il modello configurato non è installato, lo script ti chiede se scaricarlo.

> Aprendo `web/index.html` direttamente dal file, il passaporto si vede ma Sergio non funziona e "Analizza con l'AI" torna all'analisi simulata (lo dice sotto il risultato): serve il server avviato dallo script.

## Sergio, il tutor AI

Clicca la mascotte in basso a destra per aprire il pannello (si chiude con × o con Esc).

- **Chat**: fai domande libere ("non ho capito il ciclo di Calvin"). Sergio risponde basandosi sull'ultimo materiale che gli hai dato.
- **Riassunto, Quiz, Flashcard, Tutti e tre**: scrivi un argomento breve (es. "la Rivoluzione francese"), incolla un testo lungo o allega un file (.txt, .md, .pdf, .docx), poi premi un pulsante. Accanto scegli quante domande o carte vuoi.
- Puoi anche scrivere richieste come "fammi un quiz di 10 domande sulla fotosintesi".
- Una generazione in corso si ferma con **Annulla**.
- **Le mie schede**: tutto quello che Sergio crea viene salvato qui. Apri una scheda per leggere il riassunto, fare il quiz (il miglior punteggio viene ricordato) o ripassare le flashcard.
- In alto nel pannello vedi se Ollama è attivo e puoi **cambiare modello**.

## Accesso

All'apertura c'è la pagina di login. **Per ora le credenziali sono fisse: `admin` / `password`** (si cambiano con `TALENT_USER` e `TALENT_PASSWORD` in `.env`). Dopo il primo accesso scegli se sei **studente, lavoratore o studente lavoratore**: per i lavoratori la sezione Voti non compare. Il ruolo si cambia nelle impostazioni; per uscire usa il menu del profilo → **Esci**.

> È un accesso provvisorio, in attesa del database degli utenti: le API restano aperte e i dati del passaporto stanno nel browser.

## Le sezioni

Per una visita guidata premi **Come funziona** in fondo al menu a sinistra.

- **Passaporto**: il tuo profilo pubblico (nome, scuola, classe se vuoi, presentazione, titoli come "Asso dell'Informatica", competenze tecniche e socio-culturali, sport e hobby) e un recap del mese o del trimestre. Gli altri lo vedono, solo tu lo modifichi: **Vedi come gli altri** mostra l'anteprima.
- **Competenze**: il radar delle 8 competenze europee e le barre in percentuale; sotto il 60% c'è **Migliora** con una proposta e un link (per ora fissi).
- **Planner**: attività future e obiettivi con una data; Sergio li collega alle competenze appena li aggiungi.
- **Certificazioni ed esperienze**: scrivi esperienze (a scuola o fuori) e carica certificati e attestati (PDF, DOCX, TXT, JPG, PNG, massimo 10 MB). Sergio li analizza; con ★ scegli cosa mettere in evidenza nel passaporto.
- **Appunti**: carica o incolla appunti e chiedi a Sergio riassunto, quiz o flashcard.
- **Voti** (studenti): materie e voti con il grafico dell'andamento per ogni materia.
- **CV e portfolio**: come prima. Dal pannello Competenze si arriva anche a **Orientamento**.

## Analizza con l'AI

Nella pagina **Aggiungi una prova** scrivi titolo e descrizione e premi **Analizza con l'AI**. Il modello sceglie le 1–2 competenze chiave europee che la prova dimostra meglio, con una percentuale, il *perché* e i *segnali*: parole prese dal tuo testo che giustificano la scelta. Puoi poi aggiungere la prova al passaporto.

- Con un modello da 8B l'analisi richiede in genere 15–30 secondi; la prima dopo l'avvio è più lenta perché il modello viene caricato in memoria.
- Se il server o Ollama non rispondono, l'app usa l'analisi simulata a parole chiave e lo scrive sotto il risultato.

## Quale modello scegliere

| Memoria del computer | Dimensione modello | Esempi (controlla i tag) |
|---|---|---|
| ~8 GB di RAM | 3–4 miliardi di parametri | `qwen3:4b`, `gemma3:4b` |
| 16 GB di RAM | 7–8 miliardi (**predefinito**) | `qwen3:8b` |
| 32 GB di RAM o GPU da 24 GB | 14–32 miliardi | `qwen3:14b`, `qwen3:32b`, `gemma3:27b` |

- Per l'italiano vanno bene le famiglie **Qwen** e **Gemma**.
- I nomi dei modelli cambiano spesso: controlla i tag aggiornati su <https://ollama.com/library>.
- I modelli più grandi sbagliano meno le domande dei quiz, ma sono più lenti.

Per cambiare modello:
- **Dal pannello di Sergio**: il menu accanto allo stato di Ollama elenca i modelli installati. La scelta resta salvata anche dopo il riavvio.
- **Da file**: copia `.env.example` in `.env` e modifica `QUADERNO_MODEL`. La scelta fatta dal pannello ha la precedenza.

Altre impostazioni in `.env`: `OLLAMA_URL`, `QUADERNO_PORT` (porta della pagina, default 8765), `QUADERNO_NUM_CTX` (finestra di contesto, default 8192).

## Database MySQL (XAMPP)

L'app salva tutto in **MySQL/MariaDB** (XAMPP), non più solo nel browser. Lo schema completo è in `sql/talent_radar.sql`.

1. Avvia **MySQL** dal pannello di XAMPP (e Apache per phpMyAdmin).
2. Apri <http://localhost/phpmyadmin> → **Importa** → `sql/talent_radar.sql` → Esegui.
   Da terminale: `C:\xampp\mysql\bin\mysql.exe -u root < sql\talent_radar.sql`
3. Copia `.env.example` in `.env` e imposta le credenziali (`TALENT_MYSQL_*`).
4. Avvia l'app.

Due file SQL:
- `sql/talent_radar.sql` — struttura, cataloghi (competenze/dimensioni) e account demo: è il punto di partenza pulito.
- `sql/talent_radar_dati.sql` — **snapshot completo con i dati esistenti** (utenti, profili, prove, voti, planner, appunti, documenti, schede): importalo solo per ripristinare quei dati. Contiene i dati degli account (non le sessioni) e ricrea il database da zero.

Lo script crea il database `talent_radar`, l'utente applicativo `talent` e due account:

| Account | Password | Contenuto |
|---|---|---|
| `admin` | `password` | profilo, 7 prove, 3 materie con voti, planner, appunti |
| `demo2` | `password` | account vuoto: serve a verificare l'isolamento dei dati |

Tabelle principali: `users`, `personal_data`, `sessions`, `evidences` + `evidence_competences` + `evidence_dimensions`, `subjects`, `grades`, `planner_items` + `planner_competences`, `competency_analyses` (storico delle analisi), `notes`, `documents`, `ai_items`, `attachments`, `user_state` (snapshot JSON riscritto a ogni salvataggio). Ci sono anche tre viste per i report: `v_competenze_utente`, `v_obiettivi_competenze`, `v_riepilogo_utenti`.

Per tornare al vecchio file SQLite basta `TALENT_DB_DRIVER=sqlite` nel `.env`.

## Competenze degli obiettivi

Il planner collega ogni voce alle competenze europee leggendo il **"Cosa"** (più i dettagli) con l'analisi di `app/competenze.py`:

- dizionario pesato per competenza (frasi, parole chiave, radici) e bonus per il titolo rispetto ai dettagli;
- gestione delle negazioni ("non voglio fare sport…");
- punteggi 0-1 con saturazione, così i testi generici restano a bassa confidenza;
- spiegazione (`perche`) e segnali (le parole che hanno pesato).

Se Ollama è attivo l'analisi la fa il modello; altrimenti (o se il modello fallisce) interviene questo algoritmo, e il planner mostra "analisi automatica · confidenza …". Ogni analisi viene registrata in `competency_analyses`. Per provarla da sola: `POST /api/analyze/competenze` con `{"title": "...", "description": "..."}`.

## Dove sono i dati

- **Account, profilo, prove, voti, planner, appunti, schede**: nel database MySQL `talent_radar` (vedi sopra). Ogni utente vede solo i propri dati.
- **File caricati** (documenti e allegati): in `data/documents/` e `data/attachments/`; nel database restano i metadati.
- **Copia locale nel browser**: il passaporto viene tenuto anche in `localStorage` come cache, ma la verità è sul server; al login lo stato viene ricaricato da MySQL.

**Backup delle schede**: in *Le mie schede* premi **Esporta** per scaricarle in un file JSON. Con **Importa** le ricarichi, anche su un altro computer; quelle già presenti non vengono duplicate.

## Risoluzione problemi

**"Sergio non è collegato"** — Il server non è avviato, o hai aperto `index.html` dal file. Avvia l'app con lo script e apri <http://localhost:8765>.

**"Ollama non risponde"** — Apri l'app Ollama oppure esegui `ollama serve`, poi premi **Riprova** nel pannello. Le schede salvate restano consultabili.

**Il modello è troppo lento** — Senza scheda video dedicata un modello da 8B può impiegare 1–3 minuti per scheda. Prova un modello più piccolo (`qwen3:4b`) o chiedi meno domande. La prima richiesta dopo l'avvio è più lenta perché il modello viene caricato in memoria.

**"Il modello non è riuscito a creare la scheda"** — Il modello ha prodotto due volte un risultato non valido. Riprova, oppure scegli un modello più grande.

**PDF senza testo** — Un PDF scansionato contiene solo immagini. Usa un PDF con testo selezionabile o passalo prima in un programma di OCR.

**Memoria insufficiente** — Scegli un modello più piccolo dalla tabella, oppure riduci `QUADERNO_NUM_CTX` a 4096 in `.env`.

**La porta 8765 è occupata** — Imposta un'altra porta con `QUADERNO_PORT` in `.env`.

## Per sviluppatori

```
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m pytest          # i test non richiedono Ollama
.venv/bin/python -m uvicorn app.main:get_app --factory --reload --port 8765
```

Struttura:
- `web/` — frontend senza build step. `index.html`, `app.js`, `data.js`, `ui.js`, `pages*.js`, `styles.css` sono Talent Radar; `esperienze.js`, `planner.js`, `appunti.js` e `login.js` sono le sezioni omonime e l'accesso; `tour.js` è la guida "Come funziona"; `img/` contiene logo e mascotte; `tutor.js` e `tutor.css` sono il pannello di Sergio, il tutor AI; `vendor/` contiene `marked` e `DOMPurify` serviti in locale.
- `app/` — backend FastAPI: client Ollama, generatori di riassunti/quiz/flashcard con validazione e chunking, analisi delle prove (`analyze.py`, `POST /api/analyze`), archivio documenti (`/api/documents`), SQLite, API sotto `/api`.
- `tests/` — test `pytest` con un client Ollama finto.
- `scripts/` — avvio per macOS/Linux e Windows.
