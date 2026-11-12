# Piano di produzione · Talent Radar

Obiettivo: rendere la demo usabile da un nuovo utente in meno di 10 secondi, con dati che restano, privacy coerente e documenti generati dalle prove reali.

Fonti: `README.md` (prodotto) e `prove/prova-1.md` (criticità del playtester). Ogni fase è verificabile nel browser.

## Fase 0 · Database e utenti (P0) — FATTO ✅
Database SQLite `data/talent.db`, registrazione/login con password hash, sessioni token, stato per utente (`GET/PUT /api/state`), tabelle normalizzate (prove, materie, voti, planner) e test.

## Fase 1 · Accesso e primo impatto (P0) — FATTO ✅
- Nella card di login mostrare le credenziali demo (`admin` / `password`) e aggiungere il pulsante **Entra nella demo** che le precompila.
- Correggere il messaggio di avvio per Windows e macOS e gestire il caso “server non avviato”.
- Dopo il login mostrare un banner **Dati di esempio** con CTA **Inizia da zero** (azzera prove e profilo demo).
- Aggiungere uno stato vuoto per chi non ha ancora prove, invece di mostrare subito il profilo di Giulia.
- Come vediamo che funziona: apro il sito, entro con un click, vedo il passaporto e il banner; “Inizia da zero” svuota e mostra lo stato vuoto.
- Tempo: 60–90 min.

## Fase 2 · Persistenza e gestione dati (P0) — FATTO ✅
- Estendere `saveState`/`loadState` a: `directory`, `chats`, `requestsIn/Out`, `activeChat`, `shareWithTutor`, `materie`, planner, appunti, ruolo.
- Aggiungere **Elimina esperienza** e la modifica di titolo, descrizione e data.
- Mettere una conferma (o undo) su **Rimuovi materia**.
- Indicare in UI quando un dato è salvato.
- Come vediamo che funziona: aggiungo esperienza, amicizia e messaggio, ricarico e restano; elimino un’esperienza e sparisce.
- Tempo: 60–90 min.

## Fase 3 · Backup, privacy e sicurezza (P0/P1) — FATTO ✅
- Cassaforte coerente: i toggle devono influenzare tutor, export e condivisione; se non è possibile, dichiarare chiaramente “demo”.
- Export dati reale in JSON (download) e Import con merge senza duplicati.
- Cancellazione dati con modale di conferma e reset allo stato iniziale.
- Sanitizzazione: `escHTML`/`textContent` su chat, nomi materia e titoli; DOMPurify per il markdown del tutor.
- Come vediamo che funziona: l’export scarica un file, l’import lo ricarica; un messaggio con `<img onerror>` non esegue codice.
- Tempo: 60–90 min.

## Fase 4 · Prove reali (P0/P1) — FATTO ✅
- **Foto**: input file con anteprima e limite di dimensione.
- **Link**: campo URL con validazione.
- **Voce**: upload audio (o registrazione, se disponibile). In alternativa rinominare il selettore in **Categoria** e togliere la promessa “foto, link, voce” dalla hero.
- Certificazioni/documenti: validazione tipo e dimensione, stato di caricamento, errori leggibili.
- Come vediamo che funziona: creo una prova foto/link/voce e la ritrovo con il suo allegato; un file troppo grande dà un errore chiaro.
- Tempo: 90–120 min.

## Fase 5 · Documenti e orientamento (P1) — FATTO ✅
- Calcolare **Capolavoro** e **Direzione di orientamento** dalle prove, non hardcoded.
- Far funzionare davvero **Rigenera bozza**.
- Sostituire “Scarica PDF” con un download reale oppure con l’etichetta **Stampa / Salva come PDF**.
- CV Europass: sezioni editabili e alimentate dai dati reali.
- Come vediamo che funziona: cambio le prove, rigenero e il portfolio cambia; il PDF si scarica (o si stampa consapevolmente).
- Tempo: 90–120 min.

## Fase 6 · Coerenza UI, mobile e accessibilità (P2)
- Copy coerente (foto/link/voce, “demo”, “livello di evidenza”).
- Stati vuoti per ogni sezione.
- Responsive: sidebar, chip Demo, menu profilo, card voti.
- Accessibilità: focus visibile, contrasto, `aria-label`, uso da tastiera.
- Come vediamo che funziona: da mobile le sezioni si usano; Tab/focus funzionano; contrasto leggibile.
- Tempo: 60–90 min.

## Fase 7 · Rifinitura con impeccable (P2)
- `/impeccable critique` su passaporto, competenze e documenti.
- `/impeccable polish` su gerarchia, tipografia, spaziature e motion.
- Come vediamo che funziona: checklist critique senza bloccanti e UI più pulita.
- Tempo: 45–60 min.

## Fase 8 · Verifica finale (P2)
- Eseguire `pytest` e correggere eventuali regressioni.
- Rilanciare il playtester e salvare `prove/prova-2.md`.
- Confrontare prova-1 e prova-2 (voto e bloccanti).
- Come vediamo che funziona: test verdi e secondo report con voto migliorato e meno blocchi.
- Tempo: 30–45 min.

## Priorità
- **P0 (bloccanti demo):** Fasi 1, 2, 3.
- **P1 (qualità percepita):** Fasi 4, 5.
- **P2 (rifinitura):** Fasi 6, 7, 8.

## Se siamo in ritardo, tagliamo
1. Prima: upload/registrazione voce (Fase 4) → rinominare in “Categoria”.
2. Poi: export/import JSON (Fase 3) → dichiarare “demo”.
3. Poi: PDF reale (Fase 5) → etichetta “Stampa / Salva come PDF”.
- Da non tagliare mai: login demo, persistenza, sanitizzazione.

## Ordine consigliato
Fase 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Dopo ogni blocco chiuso, se c’è tempo, rilanciare il playtester.
