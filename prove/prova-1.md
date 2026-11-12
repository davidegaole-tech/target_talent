# Prova 1 — 12 novembre 2026

## Cosa ho capito nei primi 10 secondi

Vedo una schermata di accesso a tutta pagina: logo, titolo **Talent Radar**, payoff «Racconta chi sei, scopri le tue competenze», due campi e un pulsante **Accedi**. Capisco che è un passaporto delle competenze per studenti, ma non capisco perché devo autenticarmi né con quali credenziali. Non c'è registrazione, non c'è un pulsante «prova la demo», non c'è nessun suggerimento. Dopo dieci secondi sono già fermo.

Se inserisco `admin` / `password` — credenziali che esistono solo nel codice del server (`app/config.py:32-33`), non nella pagina — arrivo alla scelta del ruolo. Quella è chiara: studente, lavoratore, studente lavoratore. Poi si apre il passaporto, già pieno dei dati di **Giulia Ferrari**: titoli, competenze, esperienze, sport. Non c'è un onboarding che dica «questi sono dati di esempio, sostituiscili». L'unica traccia è il chip «Demo» in alto e la nota in fondo alla sidebar (`ui.js:83`), che però su mobile sparisce. La UI è curata, il radar e le card funzionano visivamente, ma la prima cosa che provo a fare — aggiungere una mia esperienza con una foto — non è possibile.

## Dove mi sono bloccato

- **Login senza via d'uscita.** `login.js:17-28` mostra il form, `login.js:44-59` gestisce l'accesso, ma nessun testo dice quali credenziali usare. Se sbaglio, ricevo solo «Nome utente o password non corretti». Se il server non è avviato, il messaggio mi dice di lanciare `scripts/start.sh` anche su Windows; se apro `index.html` direttamente dal file, il login non funziona affatto perché la `fetch('/api/login')` non ha un server a cui parlare.
- **I tipi di prova non fanno quello che promettono.** In «Nuova esperienza» scelgo **Foto**, **Link** o **Voce**, ma il form mostra sempre e solo titolo, descrizione e data (`pages.js:123-187`). Non c'è un campo per caricare una foto, non c'è un campo URL, non c'è registrazione audio. Il tipo viene solo salvato come etichetta (`app.js:70-80`). La hero dice «una foto, un link, due righe», ma la foto e il link non si possono inserire.
- **Non posso eliminare un'esperienza.** In «Certificazioni ed esperienze» posso aprire una card e correggere le competenze, ma non c'è né «Elimina» né modifica di titolo/descrizione/data (`pages.js:105-122`, `app.js:99-118`). Se inserisco una prova sbagliata, resta lì per sempre.
- **La Cassaforte è cosmetica.** Spengo «Visibilità al tutor», ma Sergio continua a ricevere tutto il contesto del profilo (`app.js:285-298`). Il valore `state.privacy` viene salvato, ma non viene letto da nessun'altra parte del codice (`pages.js:351-399`). «Esporta dati» e «Cancella tutto» mostrano solo un toast: `app.js:127-128` non scarica niente e non cancella niente. La pagina però dice «Il tutor vede solo ciò che hai autorizzato» (`pages.js:394`): è falso.
- **Amici non resta salvato.** Accetto una richiesta e mando un messaggio; ricaricando la pagina tornano i dati iniziali. `saveState` (`app.js:310-320`) non salva `directory`, `chats`, `requestsIn/Out` né `shareWithTutor`, quindi tutte le azioni social spariscono.
- **Il portfolio è in parte finto.** «Capolavoro» è sempre il robot con Arduino, anche se cambio le esperienze; «Direzione di orientamento» è sempre ITS Informatica e Robotica all'87%; la data di generazione è fissa (`pages.js:285-349`). «Rigenera bozza» (`pages.js:293`, `app.js:180`) mostra un toast e ridisegna la stessa cosa.
- **Nota tecnica:** i messaggi della chat e i nomi delle materie vengono inseriti nell'HTML senza escaping (`pages_extra.js:236` e `pages_extra.js:281`). Chi scrive `<img src=x onerror=...>` può eseguire codice: è almeno self-XSS, ma resta un buco di sicurezza.

## 5 bug, in ordine di gravità

1. **Login impenetrabile per un nuovo utente.** La pagina di accesso (`login.js:17-28`) non espone le credenziali demo, non offre registrazione, non ha un link di aiuto. Le credenziali di default esistono solo nel server (`app/config.py:32-33`): chi guarda solo il sito non entra. In più, senza server il login non funziona nemmeno aprendo il file, quindi non esiste una modalità demo statica.
2. **Privacy e diritti sui dati sono finti.** I toggle di «Cassaforte» cambiano solo lo stato locale e non influenzano né il tutor né l'export (`pages.js:351-399`); «Esporta dati» e «Cancella tutto» sono due toast senza effetti (`app.js:127-128`). È il bug più grave dopo il login perché il prodotto promette controllo e GDPR, ma non lo fa.
3. **«Nuova esperienza» non permette di allegare foto, link o voce.** Il selettore cambia solo un'etichetta; non esistono input file, URL o registrazione (`pages.js:123-187`). La funzione centrale del passaporto — raccogliere prove — è monca.
4. **Il portfolio non è generato dai dati; il CV è solo stampa.** Capolavoro, orientamento e data sono hardcoded (`pages.js:285-349`), «Rigenera bozza» è un no-op (`app.js:180`), «Scarica PDF» apre la stampa del browser invece di scaricare un PDF. Un utente può esportare un portfolio che parla di un robot che non ha mai fatto.
5. **Le azioni social non sopravvivono al refresh.** `saveState` non include `directory`, `chats`, `requestsIn`, `requestsOut`, `activeChat` e `shareWithTutor` (`app.js:310-320`), quindi richieste, amicizie e messaggi si perdono a ogni ricarica. La UI non avvisa che sono temporanei.

## 5 migliorie possibili

1. **Sbloccare subito l'accesso:** scrivere nella card di login le credenziali demo (es. `admin` / `password`) e aggiungere un pulsante «Entra nella demo» che le precompila; prevedere anche un messaggio d'avvio corretto per Windows e macOS. Dopo il login, mostrare un banner «stai vedendo dati di esempio» con un pulsante per iniziare da zero.
2. **Rendere reali i tipi di prova:** input file per Foto, campo URL validato per Link, registrazione o upload audio per Voce. Se non si vuole implementarli, rinominare il selettore in «Categoria» e togliere dalla hero la promessa di foto e link.
3. **Rendere coerente la Cassaforte:** collegare i toggle a ciò che il tutor riceve, all'export e alla condivisione; implementare davvero il download JSON e la cancellazione con conferma; finché non funzionano, mostrare un banner «demo: queste impostazioni non hanno effetto».
4. **Completare la gestione dei dati:** salvare nel `localStorage` anche `directory`, `chats`, richieste e `shareWithTutor`; aggiungere «Elimina esperienza» e la modifica di titolo/descrizione/data; mettere una conferma o un undo su «Rimuovi materia». Sanitizzare con `escHTML`/`textContent` messaggi e nomi materia.
5. **Generare davvero portfolio e CV:** calcolare Capolavoro e orientamento dalle prove e dai documenti, far funzionare «Rigenera bozza», sostituire «Scarica PDF» con un download reale o con l'etichetta «Stampa / Salva come PDF». Aggiungere uno stato vuoto per chi arriva la prima volta, invece di mostrare subito il profilo di Giulia.

## Lo utilizzerei?

**2/5** — L'idea del passaporto e il radar sono chiari e la UI è curata, ma un nuovo utente non riesce a entrare e le funzioni che promettono privacy, salvataggio ed export sono in gran parte finte: così non è utilizzabile per un caso reale.
