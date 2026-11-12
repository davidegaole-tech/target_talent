"""Analisi algoritmica delle competenze: nessun modello AI, solo regole."""
from __future__ import annotations

from app.competenze import analizza_testo, normalizza, punteggi

CASES = [
    ("Prendere la certificazione Cambridge C1", "reading e writing", "multilingue"),
    ("Corso di primo soccorso con la Croce Rossa", "", "cittadinanza"),
    ("Robot per la gara regionale con Arduino", "programmare i sensori", "stem"),
    ("Scrivere la recensione di un libro per il giornalino", "", "alfabetica"),
    ("Organizzare il mercatino solidale", "coordinare il gruppo e gestire il budget", "imprenditoriale"),
    ("Migliorare la costanza negli allenamenti di pallavolo", "", "personale"),
    ("Costruire un sito web per la biblioteca", "HTML e CSS", "digitale"),
    ("Imparare a suonare la chitarra", "", "cultura"),
]


def test_normalizza_accenti_e_punteggiatura() -> None:
    assert normalizza("Perché è così? Città!") == "perche e cosi citta"
    assert normalizza("l'audio") == "l audio"


def test_competenza_attesa_per_ogni_obiettivo() -> None:
    for cosa, dettagli, attesa in CASES:
        result = analizza_testo(cosa, dettagli)
        assert result["comp"][0]["id"] == attesa, (cosa, result["comp"])
        assert 0.5 <= result["comp"][0]["p"] <= 0.98
        assert result["engine"] == "algoritmo"
        assert result["perche"]


def test_testo_generico_ha_bassa_confidenza() -> None:
    result = analizza_testo("Fare qualcosa di nuovo")
    assert result["conf"] == "bassa"
    assert result["comp"][0]["id"] in ("personale", "imprenditoriale")


def test_negazione_non_conta_come_segnale() -> None:
    result = analizza_testo("Non voglio fare sport ma voglio fare teatro")
    assert result["comp"][0]["id"] == "cultura"


def test_titolo_pesa_piu_dei_dettagli() -> None:
    solo_titolo = punteggi("Corso di inglese")["scores"].get("multilingue", 0)
    solo_dettagli = punteggi("", "Corso di inglese")["scores"].get("multilingue", 0)
    assert solo_titolo > solo_dettagli


def test_massimo_due_competenze() -> None:
    result = analizza_testo("Progetto Erasmus con teatro e robotica", "budget e volontariato")
    assert 1 <= len(result["comp"]) <= 2


def test_segnali_presenti_nel_testo() -> None:
    testo = "Robot con Arduino per la gara"
    result = analizza_testo(testo)
    normalizzato = normalizza(testo)
    for segnale in result["segnali"]:
        assert normalizza(segnale) in normalizzato or normalizza(segnale) in normalizzato.replace(" ", "")
