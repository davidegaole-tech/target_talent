# Design system · Talent Radar

Direzione: **strumento di orientamento**. L'interfaccia deve sembrare uno strumento di bordo per leggere i talenti, non una dashboard SaaS. Riferimenti: carta tecnica, radar, segnaletica. La foto di Sergio resta il volto del tutor, nei suoi ruoli (mascotte e pannello).

Registro visivo: **inverno freddo, luce radente**. Superfici chiare e fredde, inchiostro blu-notte, un solo rubino come segnale. Niente viola/indaco, niente gradienti decorativi, niente vetro.

## Palette · armocromia Inverno freddo

| Ruolo | Token | Valore |
|---|---|---|
| Sfondo | `--bg` | `#e8edf2` |
| Sfondo profondo | `--bg-2` | `#dee6ed` |
| Superficie | `--surface` | `#fcfdfe` |
| Superficie 2 | `--surface2` | `#f2f6f9` |
| Superficie 3 | `--soft` | `#e7eef4` |
| Inchiostro | `--ink` | `#0a1a28` |
| Testo | `--text` | `#1f3346` |
| Testo secondario | `--text2` | `#41586c` |
| Muto | `--muted` | `#5c7085` |
| Linea | `--line` | `#ccd8e2` |
| Linea forte | `--line-soft` | `#b1c2d1` |
| Accento (petrolio) | `--accent` | `#0b3b60` |
| Accento azioni | `--accent-strong` | `#0b3b60` |
| Accento soft | `--accent-soft` | `#dde9f2` |
| Accento secondario (ghiaccio) | `--accent-2` | `#2a6f8f` |
| Segnale (rubino) | `--rose` | `#a3183f` |
| Successo | `--green` | `#0d6b57` |
| Ambra | `--amber` | `#9d5b1c` |
| Rail | `--rail` | `#071726` |

Tema scuro: fondo `#060d16`, superfici `#0c1925` / `#122232`, testo `#c9d8e4`, accento `#a8cbdf`, azioni `#2f6489`, rubino `#e58ba3`. Le ombre sono nere e neutre in entrambi i temi.

**Competenze** (variabili `--c-*`, usate anche in SVG e `color-mix`):

| Competenza | Token | Valore (chiaro) | Valore (scuro) |
|---|---|---|---|
| Alfabetica | `--c-alfabetica` | `#2f55c8` | `#6f95ff` |
| Multilingue | `--c-multilingue` | `#1187bb` | `#54bde8` |
| STEM | `--c-stem` | `#0f8a6c` | `#3fd0a6` |
| Digitale | `--c-digitale` | `#6650c8` | `#a08bff` |
| Personale | `--c-personale` | `#c81e4e` | `#ff6b8f` |
| Cittadinanza | `--c-cittadinanza` | `#b02a78` | `#f06bb8` |
| Imprenditoriale | `--c-imprenditoriale` | `#c25a2e` | `#ff9a6b` |
| Cultura | `--c-cultura` | `#5f8f3a` | `#a3cc6a` |

Regola: il colore serve a orientare (stato, competenza, azione), non a decorare. Le tinte si ottengono con `color-mix(...)` (helper `tint()` in `data.js`), mai con alfa esadecimale: così funzionano in entrambi i temi.

## Tipografia

Font **self-hosted** in `web/fonts/` (subset latino, woff2): nessuna richiesta esterna a runtime.

- Display: **Spectral** 500/600 (serif editoriale, dettagli netti) — solo per il nome del prodotto, i titoli di pagina, il nome nel passaporto, il portfolio e le card-strumento.
- Interfaccia e corpo: **IBM Plex Sans** 400/500/600 (umanista tecnica) per tutto il resto, compresi i `section-title`.
- Corpo 14px/1.55, misura 62–70ch. Etichette 11–11.5px, mai tutto maiuscolo con tracking largo: solo `nav-label`, `kpi .l` e i titoli del portfolio usano il maiuscoletto, con `letter-spacing: .06–.09em`.
- Numeri (percentuali, voti, statistiche): `font-variant-numeric: tabular-nums`.

## Forma e profondità

- Raggio: 8px (controlli), 10px (card), 14px (modali e pannelli).
- Bordi `1px var(--line)`; ombra base quasi invisibile. L'elevazione arriva solo su hover/focus (`--shadow-raise`, offset e blur reali, niente aloni colorati).
- Focus: outline 2px `--accent-2` con offset 2px. Superfici browser curate: selezione, caret, scrollbar sottile.

## Navigazione

- Rail sinistro 244px in `--rail`, testo freddo, voce attiva con fondo petrolio trasparente e **marcatore rubino** da 3px (anima brevemente al cambio pagina). Su mobile il rail diventa una barra orizzontale sticky con il marcatore in basso.
- Topbar sticky con fondo semi-trasparente e blur leggero (serve a leggere mentre si scorre), hairline in basso.
- Firma: due aloni freddi larghissimi sul fondo (`body::before`) e, a ogni cambio pagina, una "messa a fuoco" del contenuto.

## Motion

- `--ease-out` esponenziale, durate 140/260/600ms.
- Un solo momento autoriale: `#view.route-in > *` entra con opacità + 6px + blur 4px, sfalsato di 40ms (max 5 elementi). Non si anima ogni sezione allo stesso modo.
- La scanline in cima (`#scanline`) segna il cambio pagina; barre e radar crescono da zero; le card interattive si alzano di 1px con ombra reale.
- `prefers-reduced-motion` disattiva tutto; l'app ha anche l'impostazione "riduci movimento".

## Stati

Hover, focus-visible, active (`translate` 1px), disabled (opacità .55) su ogni controllo. Stati vuoti: card tratteggiata, icona in cerchio `--accent-soft`, testo centrato e misura limitata a 52ch.

## Sergio

- `web/img/sergio.png` resta la mascotte in basso a destra e l'immagine del pannello tutor.
- Non sostituire l'immagine con emoji o avatar generici.
