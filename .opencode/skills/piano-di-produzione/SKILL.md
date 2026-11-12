---
name: piano-di-produzione
description: Trasforma idea.md in un piano di produzione a passi piccoli (piano.md) e nel contesto per la skill impeccable (PRODUCT.md). Caricala nella fase Piano, quando il gruppo chiede un piano, o prima di iniziare a costruire il gioco o la pagina di vendita.
---

# Piano di produzione

Versione ridotta per il laboratorio della skill "writing-plans" di superpowers (Jesse Vincent).

**Tenuto dall'originale:** il piano è fatto di passi piccoli, ognuno con il suo controllo. Deve essere chiaro anche per qualcuno che non ha visto la conversazione.

**Tolto:** test automatici, git, commit, worktree, sotto-agenti esecutori. Qui si produce un solo file HTML e lo si costruisce in questa stessa sessione.

## Passo 1 · Leggi
- Leggi `AGENTS.md` e `idea.md`.
- Se `idea.md` non c'è, fermati e scrivi: "Prima serve la fase Idea (skill grill-me)."

## Passo 2 · Scrivi PRODUCT.md
È il file che la skill **impeccable** legge per capire il prodotto: così non deve fare altre domande. Usa questo schema e scrivi solo fatti presi da `idea.md`:

```
# Product

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
static HTML/CSS/JS, un solo file (deciso dal laboratorio)

## Users
<chi usa il gioco o la pagina, in che situazione, per fare cosa>

## Product Purpose
<cosa fa e cosa vuol dire "ha funzionato">

## Positioning
<cosa lo rende diverso>

## Operating Context
Laboratorio ITS di 4 ore. Si apre con doppio clic nel browser, senza internet.
```

## Passo 3 · Scrivi piano.md

```
# Piano di produzione · <Nome>
Obiettivo: <una frase>
File da produrre: gioco.html (oppure vendita.html)

## Passi
1. <cosa si fa, 1-2 righe>
   Come vediamo che funziona: <cosa si fa nel browser e cosa si deve vedere>
   Tempo: <minuti>
2. ...

## Se siamo in ritardo, tagliamo
- ...
```

Regole del piano:
- **Massimo 8 passi.**
- Il passo 1 è una versione minima ma che **già si usa** (si gioca, o si arriva alla scelta finale), pronta in circa 15 minuti.
- Ogni passo aggiunge una cosa sola, che si vede nel browser.
- Gli ultimi due passi sono la rifinitura con impeccable: `/impeccable critique` e poi `/impeccable polish`.
- Niente server, librerie esterne, account o installazioni.
- **Niente codice nel piano**: il piano dice cosa fare, non come scriverlo.

## Passo 4 · Controlla
Rileggi il piano e correggilo se:
- un passo non produce niente di visibile;
- un passo ne contiene due;
- la somma dei tempi supera 50 minuti.

## Passo 5 · Mostra e aspetta
Mostra `piano.md` al gruppo e chiedi se vuole tagliare o riordinare qualcosa. **Non iniziare a costruire** finché il gruppo non scrive "vai".
