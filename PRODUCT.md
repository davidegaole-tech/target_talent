# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
Frontend statico HTML/CSS/JS senza build step (`web/`) + backend FastAPI/SQLite (`app/`) + tutor AI locale via Ollama. Dati del passaporto in `localStorage`, schede/documenti in SQLite.

## Users
- Studenti 14–19 che devono orientarsi dopo il diploma.
- Studenti-lavoratori e adulti in transizione (cambio lavoro, ricerca).
- Tutor/orientatori che accompagnano gli studenti.
Contesto: demo hackathon con dati di esempio, nessun account reale.

## Product Purpose
Raccogliere prove concrete (esperienze, certificazioni, voti, appunti), collegarle alle 8 competenze chiave europee e trasformarle in un passaporto con radar, orientamento, CV/e-portfolio e consigli. Ha funzionato se un nuovo utente capisce cosa fare in 10 secondi, aggiunge una prova e vede il profilo aggiornarsi.

## Positioning
Non un CV né un test della personalità: prove reali + competenze riconosciute + AI locale, con privacy e controllo dei dati nelle mani dell'utente.

## Operating Context
Demo locale su http://localhost:8765, dati fittizi, Ollama opzionale (senza modello il tutor ripiega sull'analisi simulata). Nessun modello incluso nel progetto.
