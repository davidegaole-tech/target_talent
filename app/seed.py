"""Dati demo: crea l'account di default con un passaporto già popolato.

Viene usato sia dal seed automatico (database vuoto) sia da ``scripts/seed_mysql.py``.
"""
from __future__ import annotations

from typing import Any

from .security import hash_password

DEMO_USERNAME = "admin"
DEMO_PASSWORD = "password"

DEMO_STATE: dict[str, Any] = {
    "role": "studente",
    "ruolo": "studente",
    "prove": {"alfabetica": 2, "multilingue": 1, "stem": 1, "digitale": 3,
              "personale": 2, "cittadinanza": 2, "imprenditoriale": 1, "cultura": 1},
    "evidences": [
        {"id": "e1", "ambito": "scuola", "evidenza": True, "titolo": "Robot per la gara regionale",
         "tipo": "foto", "data": "2026-11-06",
         "descrizione": "Con il gruppo di laboratorio ho montato e programmato un robot con Arduino. Io ho gestito i sensori e i test.",
         "comp": ["stem", "digitale"], "dims": ["fare", "lavorare"], "conf": "alta",
         "perche": "Progettazione tecnica, programmazione e lavoro di squadra su un obiettivo concreto."},
        {"id": "e2", "ambito": "extra", "titolo": "Volontaria alla biblioteca di quartiere",
         "tipo": "testo", "data": "2026-11-02",
         "descrizione": "Due pomeriggi al mese aiuto a catalogare i libri e a leggere ai bambini delle elementari.",
         "comp": ["cittadinanza", "personale"], "dims": ["essere"], "conf": "alta",
         "perche": "Impegno civico continuativo e responsabilità verso gli altri."},
        {"id": "e3", "ambito": "scuola", "titolo": "Podcast in inglese con studenti spagnoli",
         "tipo": "link", "data": "2026-10-27",
         "descrizione": "Episodio di 12 minuti registrato con una classe di Valencia sul tema del clima. Ho scritto la scaletta e montato l'audio.",
         "comp": ["multilingue", "digitale"], "dims": ["fare", "lavorare"], "conf": "alta",
         "perche": "Uso reale di una lingua straniera e produzione audio digitale."},
        {"id": "e4", "ambito": "extra", "evidenza": True, "titolo": "Mercatino solidale di Natale",
         "tipo": "foto", "data": "2026-10-20",
         "descrizione": "Ho coordinato un gruppo di 6 persone: budget, contatti con i negozi, turni e comunicazione sui social.",
         "comp": ["imprenditoriale", "personale"], "dims": ["lavorare", "essere"], "conf": "alta",
         "perche": "Iniziativa, gestione di un budget e coordinamento di un gruppo."},
        {"id": "e5", "ambito": "scuola", "titolo": 'Recensione di "La coscienza di Zeno"',
         "tipo": "testo", "data": "2026-10-14",
         "descrizione": "Recensione di 900 parole pubblicata sul giornalino scolastico.",
         "comp": ["alfabetica"], "dims": ["fare"], "conf": "media",
         "perche": "Produzione di un testo argomentativo destinato a un pubblico reale."},
        {"id": "e6", "ambito": "scuola", "titolo": "Locandina per la mostra fotografica",
         "tipo": "foto", "data": "2026-10-08",
         "descrizione": "Ho progettato la locandina della mostra della classe usando Photoshop e i colori della scuola.",
         "comp": ["cultura", "digitale"], "dims": ["essere", "lavorare"], "conf": "alta",
         "perche": "Alfabetizzazione visiva e uso consapevole di strumenti di design."},
        {"id": "e7", "ambito": "extra", "titolo": "Capitana della squadra di pallavolo",
         "tipo": "testo", "data": "2026-09-30",
         "descrizione": "Gestisco gli allenamenti quando l'allenatore è assente e tengo i rapporti con le altre squadre.",
         "comp": ["personale", "cittadinanza"], "dims": ["essere"], "conf": "media",
         "perche": "Leadership, costanza e gestione delle relazioni."},
    ],
    "planner": [
        {"id": "p1", "tipo": "attivita", "titolo": "Corso di primo soccorso con la Croce Rossa",
         "note": "Tre incontri il sabato mattina", "data": "2026-12-05",
         "comp": ["cittadinanza", "personale"], "perche": "impegno verso gli altri e responsabilità",
         "fonte": "esempio", "fatto": False},
        {"id": "p2", "tipo": "obiettivo", "titolo": "Certificazione Cambridge C1",
         "note": "Preparare reading e writing", "data": "2027-05-30",
         "comp": ["multilingue"], "perche": "uso di una lingua straniera a livello avanzato",
         "fonte": "esempio", "fatto": False},
    ],
    "materie": [
        {"id": "m1", "nome": "Matematica", "color": "#2f4b7c",
         "voti": [{"v": 8, "tipo": "scritto", "data": "2026-10-02"},
                  {"v": 7.5, "tipo": "orale", "data": "2026-10-15"},
                  {"v": 9, "tipo": "scritto", "data": "2026-11-05"}]},
        {"id": "m2", "nome": "Italiano", "color": "#a61b3f",
         "voti": [{"v": 7, "tipo": "orale", "data": "2026-10-10"},
                  {"v": 8, "tipo": "scritto", "data": "2026-11-02"}]},
        {"id": "m3", "nome": "Scienze", "color": "#0e6b6b",
         "voti": [{"v": 6.5, "tipo": "pratico", "data": "2026-10-20"},
                  {"v": 7.5, "tipo": "scritto", "data": "2026-11-08"}]},
    ],
    "profilo": {
        "nome": "Giulia", "cognome": "Ferrari", "nascita": "2009-03-14", "citta": "Bologna",
        "email": "giulia.ferrari@example.com", "telefono": "",
        "scuola": "Liceo Scientifico opzione Scienze Applicate", "classe": "4B", "anno": "2026/27",
        "presentazione": "Studentessa di quarta, appassionata di robotica e fotografia. "
                         "Documento quello che imparo per capire dove andare dopo il diploma.",
        "lingue": "Italiano (madrelingua); Inglese (B2); Spagnolo (A2)",
        "digitali": "Arduino, Python di base, Photoshop, Audacity",
        "interessi": "Robotica, fotografia, podcast", "sport": "Pallavolo",
    },
    "privacy": {"tutor": True, "orientatore": False, "export": True},
    "theme": "light",
    "textSize": "normale",
    "streak": 5,
    "isSample": True,
    "sampleBanner": True,
    "recapPeriodo": "mese",
    "dailyTip": "Oggi prova a documentare un'esperienza sportiva o un hobby: diventa una prova nel tuo passaporto.",
}


def seed_default_data(db: Any) -> None:
    """Popola il database vuoto con l'account demo (idempotente)."""
    if db.get_user_by_username(DEMO_USERNAME):
        return
    user = db.create_user(DEMO_USERNAME, hash_password(DEMO_PASSWORD), "studente", "Giulia Ferrari",
                          "giulia.ferrari@example.com")
    db.save_state(user["id"], DEMO_STATE)
    db.save_profile(user["id"], DEMO_STATE["profilo"])
