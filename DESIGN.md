# Design system · Talent Radar

Direzione: **strumento di orientamento**. L'interfaccia deve sembrare uno strumento di bordo per leggere i talenti, non una dashboard SaaS. Riferimenti: carta tecnica, radar, segnaletica. La foto di Sergio resta il volto del tutor, nei suoi ruoli (mascotte e pannello).

## Palette · armocromia Inverno freddo

| Ruolo | Token | Valore |
|---|---|---|
| Sfondo | `--bg` | `#eef2f6` |
| Superficie | `--surface` | `#ffffff` |
| Inchiostro | `--ink` | `#081625` |
| Testo | `--text` | `#1d2e42` |
| Testo secondario | `--text2` | `#3a4e63` |
| Muto | `--muted` | `#4f6376` |
| Linea | `--line` | `#d5dfe7` |
| Accento (blu inverno) | `--accent` | `#0b3b66` |
| Accento forte (azioni) | `--accent-strong` | `#0b3b66` |
| Accento soft | `--accent-soft` | `#dce8f2` |
| Segnale (rubino) | `--amber` | `#a61b3f` |
| Blu ghiaccio | `--violet` | `#2e5e8c` |
| Segnale errore | `--rose` | `#a61b3f` |
| Successo | `--green` | `#0e6b57` |

Tema scuro: fondo `#070f18`, superfici `#0e1b28`, testo `#c6d4e0`, accento `#9cc3e0`, azioni `#2b5f86`, rubino `#e0738f`.

Regola: il colore serve a orientare (stato, competenza, azione), non a decorare. Le barre e i punti possono usare i colori delle competenze; il testo resta in `--text`/`--text2`.

## Tipografia

- Display e titoli: **Georgia / serif di sistema**, peso 700, tracking leggermente negativo.
- Interfaccia e corpo: **Segoe UI / Aptos / system sans**.
- Numeri (percentuali, voti, statistiche): `font-variant-numeric: tabular-nums`.
- Etichette: sentence case, mai tutto maiuscolo con tracking.

## Forma e profondità

- Raggio: 8px (controlli), 10px (card), 12px (prove), 14px (modali).
- Bordi sottili `1px var(--line)`; ombre quasi assenti. La gerarchia viene dal bordo, dal peso e dallo spazio, non dall'ombra.
- Nessun gradiente viola/indaco, nessun blur decorativo.

## Navigazione

- Rail sinistro in inchiostro `#0b1b2b`, testo chiaro, attivo in petrolio `#173b4a` con testo ottone.
- Topbar piatto su `--bg`, senza blur.
- Firma: una leggera trama radar (alone radiale in petrolio) sull'intestazione del Passaporto.

## Sergio

- `web/img/sergio.png` resta la mascotte in basso a destra e l'immagine del pannello tutor.
- Non sostituire l'immagine con emoji o avatar generici.
