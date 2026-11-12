/* ---------- PAGES ---------- */
/* Titoli assegnati quando una competenza è forte (punteggio ≥ 70) */
const TITOLI={
  digitale:{t:'Asso dell\'Informatica'}, stem:{t:'Mente scientifica'},
  alfabetica:{t:'Penna brillante'}, multilingue:{t:'Poliglotta'},
  personale:{t:'Spirito di squadra'}, cittadinanza:{t:'Cittadino attivo'},
  imprenditoriale:{t:'Leader nato'}, cultura:{t:'Anima creativa'}
};
const COMP_TECNICHE=['stem','digitale','multilingue','alfabetica'];
const COMP_SOCIO=['personale','cittadinanza','imprenditoriale','cultura'];
const RUOLI={studente:'Studente',lavoratore:'Lavoratore','studente-lavoratore':'Studente lavoratore'};
function livello(v){ return v>=80?'spicca':v>=65?'solida':v>=50?'buona':'in crescita'; }
function titoliOttenuti(){ return EU.filter(c=>scoreOf(c.id)>=70).sort((a,b)=>scoreOf(b.id)-scoreOf(a.id)).map(c=>({id:c.id,...TITOLI[c.id]})); }

function recapAttivita(){
  const giorni=state.recapPeriodo==='trimestre'?90:31;
  const oggi=new Date(); const da=new Date(oggi.getTime()-giorni*864e5).toISOString().slice(0,10);
  const nel=state.evidences.filter(e=>(e.data||'')>=da);
  const scelte=nel.filter(e=>e.evidenza);
  return {giorni, lista:(scelte.length?scelte:nel).slice(0,6), scelte:scelte.length>0, totale:nel.length};
}

function renderPassaporto(){
  if(!DOCS.loaded) loadDocs();
  const p=state.profilo;
  const owner=true;
  const certEv=(DOCS.items||[]).filter(d=>state.docEvidenza.includes(d.id));
  const titoli=titoliOttenuti();
  const chipComp=id=>{const c=EU.find(x=>x.id===id),v=scoreOf(id);return `<div class="pp-comp"><span class="pp-dot" style="background:${c.color}"></span><span class="pp-comp-n">${c.nome}</span><span class="pp-lv">${livello(v)}</span></div>`;};
  const tags=v=>(v||'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
  const rc=recapAttivita();
  const studio=[p.scuola, p.classe?'classe '+p.classe:''].filter(Boolean).join(' · ');
  return `
  ${!state.evidences.length?`<div class="card pp-empty">
    <div class="pp-empty-ico">${icon('sparkles',26)}</div>
    <div>
      <div class="section-title">Il tuo passaporto è vuoto</div>
      <div class="section-sub">Aggiungi la prima prova: un progetto, uno sport, un'esperienza di volontariato. Il resto cresce da lì.</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
        <button class="btn primary sm" data-action="goNuova">+ Aggiungi la prima prova</button>
        <button class="btn sm" data-action="startTour">Come funziona</button>
      </div>
    </div>
  </div>`:''}
  ${owner?'':``}
  <div class="card pp-head">
    <div class="pp-avatar-wrap">
      ${p.foto
        ? `<img class="pp-avatar pp-avatar-img" src="${escHTML(fileUrl(p.foto))}" alt="Foto di ${escHTML(nomeCompleto())}"/>`
        : `<div class="pp-avatar">${escHTML(iniziali())}</div>`}
      ${owner?`<button class="btn sm pp-photo-btn" data-action="changePhoto">${icon('image',13)} Foto</button>`:''}
    </div>
    <div class="pp-id">
      <h1>${escHTML(nomeCompleto())}</h1>
      <div class="pp-meta">
        ${state.ruolo?`<span class="chip">${RUOLI[state.ruolo]}</span>`:''}
        ${studio?`<span>${icon('passport',14)} ${escHTML(studio)}</span>`:''}
        ${p.citta?`<span>${icon('compass',14)} ${escHTML(p.citta)}</span>`:''}
      </div>
      <p class="pp-bio">${p.presentazione?escHTML(p.presentazione):(owner?'<span class="cv-missing">Scrivi due righe su di te: è la prima cosa che vedono gli altri.</span>':'')}</p>
    </div>
    ${owner?`<div class="pp-actions">
      <button class="btn primary sm" data-action="editProfile">Modifica</button>
    </div>`:''}
  </div>

  ${titoli.length?`<div class="card" style="margin-top:16px">
    <div class="section-title">Titoli</div>
    <div class="section-sub">Riconoscimenti che nascono dalle tue esperienze</div>
    <div class="pp-titoli">${titoli.map(t=>`<div class="pp-titolo" style="--tc:${COL[t.id]}"><span class="pp-dot" style="background:${COL[t.id]}"></span><span>${t.t}</span></div>`).join('')}</div>
  </div>`:''}

  ${state.evidences.length?`<div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Competenze tecniche</div>
      <div class="section-sub">Scienze, tecnologia, lingue e scrittura</div>
      ${COMP_TECNICHE.map(chipComp).join('')}
    </div>
    <div class="card">
      <div class="section-title">Competenze socio-culturali</div>
      <div class="section-sub">Relazioni, iniziativa, cittadinanza e cultura</div>
      ${COMP_SOCIO.map(chipComp).join('')}
    </div>
  </div>`:''}

  ${certEv.length?`<div class="card" style="margin-top:16px">
    <div class="section-title">Certificazioni in evidenza</div>
    <div class="section-sub">Scelte da ${owner?'te':escHTML(p.nome||'questa persona')}</div>
    <div class="pp-recap">${certEv.map(d=>`<div class="pp-rc" style="cursor:default"><div class="pp-rc-t"><span class="pp-dot" style="background:var(--amber)"></span> ${escHTML(d.title)}</div><div class="pp-rc-d">${DOC_KINDS[d.kind]||'Documento'}${d.date?' · '+d.date.slice(0,4):''}</div></div>`).join('')}</div>
  </div>`:''}

  ${rc.lista.length?`<div class="card" style="margin-top:16px">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
      <div>
        <div class="section-title">Recap ${state.recapPeriodo==='trimestre'?'del trimestre':'del mese'}</div>
        <div class="section-sub">${rc.scelte?'Le attività che hai messo in evidenza':'Le attività più recenti del periodo'}</div>
      </div>
      <div class="seg">
        <button class="segbtn ${state.recapPeriodo!=='trimestre'?'on':''}" data-action="recapPeriodo" data-val="mese">Mese</button>
        <button class="segbtn ${state.recapPeriodo==='trimestre'?'on':''}" data-action="recapPeriodo" data-val="trimestre">Trimestre</button>
      </div>
    </div>
    <div class="pp-recap">${rc.lista.map(e=>`
      <div class="pp-rc" data-action="openEv" data-id="${e.id}">
        <div class="pp-rc-t">${e.evidenza?'<span class="star-mini">'+icon('star',12)+'</span> ':''}${escHTML(e.titolo)}</div>
        <div class="pp-rc-d">${fmtDate(e.data)} · ${e.comp.map(id=>EU.find(c=>c.id===id)?.short).filter(Boolean).join(', ')}</div>
      </div>`).join('')}</div>
    ${owner&&!rc.scelte?`<p style="font-size:11.5px;color:var(--muted);margin-top:10px">Suggerimento: in <a href="#/esperienze" style="color:var(--accent)">Esperienze e certificati</a> premi la stella sulle attività a cui tieni di più, e compariranno qui.</p>`:''}
  </div>`:''}`;
}
function renderEvidenceCard(e){
  const tipoIcon={foto:'image',link:'link',testo:'text',voce:'mic',documento:'file'}[e.tipo]||'text';
  const chips=e.comp.map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+tint(c.color)+';color:var(--text2)">'+c.short+'</span>';}).join('');
  const dimchips=(e.dims||[]).map(id=>{const d=DIMS.find(x=>x.id===id);return '<span class="chip" style="background:'+tint(d.color)+';color:var(--text2)">'+d.nome+'</span>';}).join('');
  return `<div class="evidence" data-action="openEv" data-id="${e.id}">
    <div class="evidence-head">
      <div class="evidence-icon">${icon(tipoIcon,16)}</div>
      <div style="flex:1;min-width:0">
        <div class="evidence-title">${escHTML(e.titolo)}</div>
        <div class="evidence-date">${fmtDate(e.data)} · ${e.tipo}</div>
      </div>
      <span class="conf">${(e.ambito==='extra'?'fuori da scuola':e.ambito==='doc'?'documento':'a scuola')}</span>
      <button class="star ${e.evidenza?'on':''}" data-action="toggleStar" data-id="${e.id}" title="${e.evidenza?'Togli dal passaporto':'Metti in evidenza nel passaporto'}" aria-label="${e.evidenza?'Togli dal passaporto':'Metti in evidenza nel passaporto'}" aria-pressed="${!!e.evidenza}"><span aria-hidden="true">${icon('star',15)}</span></button>
    </div>
    <div class="evidence-desc">${escHTML(e.descrizione)}</div>
    ${e.attachment&&String(e.attachment.mime||'').startsWith('image/')?`<img src="${escHTML(fileUrl(e.attachment.url))}" alt="" style="width:100%;height:120px;object-fit:cover;border-radius:10px;margin-top:9px;border:1px solid var(--line)"/>`:''}
    ${e.attachment&&String(e.attachment.mime||'').startsWith('audio/')?`<div style="margin-top:9px"><audio controls src="${escHTML(fileUrl(e.attachment.url))}" style="width:100%" onclick="event.stopPropagation()"></audio></div>`:''}
    <div class="evidence-foot">${dimchips}${chips}<span style="font-size:10.5px;color:var(--label);margin-left:auto">${e.corretta?'competenze scelte da te':'confidenza '+e.conf}</span></div>
  </div>`;
}
function renderNuova(){
  const tipo=state.pending?.tipo || 'foto';
  const ambito=state.pendingAmbito || 'scuola';
  const tipi=[{id:'foto',l:'Foto'},{id:'link',l:'Link'},{id:'testo',l:'Testo'},{id:'voce',l:'Voce'}];
  return `
  <div class="hero">
    <div>
      <h1>Nuova esperienza</h1>
      <p>30 secondi. Anche una cosa fatta fuori scuola: una foto, un link, due righe. L'AI la collega al tuo modo di essere, fare e lavorare.</p>
    </div>
  </div>
  <div class="grid g2">
    <div class="card">
      <div class="section-title">Nuova prova</div>
      <div class="section-sub">Compila i campi e premi "Analizza con l'AI"</div>
      <div class="form-row">
        <label>Tipo di prova</label>
        <div class="seg" id="tipoSeg">
          ${tipi.map(t=>'<button class="segbtn '+(tipo===t.id?'on':'')+'" data-action="tipo" data-val="'+t.id+'">'+icon(t.id==='foto'?'image':t.id==='link'?'link':t.id==='testo'?'text':'mic',15)+' '+t.l+'</button>').join('')}
        </div>
      </div>
      <div class="form-row">
        <label>Dove è successo?</label>
        <div class="seg" id="ambitoSeg">
          <button class="segbtn ${ambito==='scuola'?'on':''}" data-action="ambito" data-val="scuola">A scuola</button>
          <button class="segbtn ${ambito==='extra'?'on':''}" data-action="ambito" data-val="extra">Fuori da scuola · hobby, sport, volontariato</button>
        </div>
      </div>
      <div class="form-row">
        <label for="p-titolo">Titolo</label>
        <input id="p-titolo" placeholder="es. Robot per la gara regionale" value="${state.prefill?escHTML(state.prefill.titolo):''}"/>
      </div>
      <div class="form-row">
        <label for="p-desc">Descrizione (2-4 righe)</label>
        <textarea id="p-desc" placeholder="Cosa hai fatto, come, con chi, cosa hai imparato...">${state.prefill?escHTML(state.prefill.desc):''}</textarea>
      </div>
      <div class="form-row">
        <label for="p-data">Data</label>
        <input type="date" id="p-data" value="2026-11-10"/>
      </div>
      <div class="form-row" id="extra-foto" ${tipo==='foto'?'':'hidden'}>
        <label for="p-foto">Foto</label>
        <input type="file" id="p-foto" accept="image/jpeg,image/png,image/webp,image/gif"/>
        <div id="fotoPreview" style="margin-top:8px"></div>
        <div style="font-size:11.5px;color:var(--muted)">JPG, PNG, WEBP o GIF · massimo 5 MB.</div>
      </div>
      <div class="form-row" id="extra-link" ${tipo==='link'?'':'hidden'}>
        <label for="p-link">Link</label>
        <input id="p-link" type="url" placeholder="https://..." autocomplete="off"/>
        <div style="font-size:11.5px;color:var(--muted)">Incolla un link pubblico (http/https).</div>
      </div>
      <div class="form-row" id="extra-voce" ${tipo==='voce'?'':'hidden'}>
        <label for="p-voce">Audio</label>
        <input type="file" id="p-voce" accept="audio/*"/>
        <div id="vocePreview" style="margin-top:8px"></div>
        <div style="font-size:11.5px;color:var(--muted)">MP3, WAV, M4A, OGG o WEBM · massimo 10 MB.</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" data-action="analizza">Analizza con l'AI ${icon('sparkles',14)}</button>
        <button class="btn" data-action="resetForm">Pulisci</button>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-top:14px;line-height:1.5">Hai un attestato, una certificazione o un corso? Caricalo in <a href="#/esperienze" style="color:var(--accent);font-weight:600">Esperienze e certificati</a>: Sergio lo legge e ti suggerisce come valorizzarlo.</p>
    </div>
    <div>
      <div class="card" id="analisiCard">
        <div class="section-title">Analisi AI</div>
        <div class="section-sub">Qui apparirà la connessione alle tue dimensioni</div>
        <div id="analisi" style="color:var(--muted);font-size:13px;line-height:1.55">
          Compila la prova e premi <strong>Analizza</strong>. L'AI proporrà le dimensioni e le competenze collegate con il <em>perché</em> e un livello di confidenza. Potrai sempre correggere.
        </div>
      </div>
      <div class="card" style="margin-top:16px">
        <div class="section-title">Come funziona</div>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--text2);line-height:1.6">
          <li>Nessuna scatola nera: vedi le parole che hanno attivato ogni dimensione.</li>
          <li>Se l'AI sbaglia, premi <strong>Correggi</strong> e scegli tu le competenze.</li>
          <li>La prova entra nel diario e aggiorna il tuo stile.</li>
        </ul>
      </div>
    </div>
  </div>`;
}
function renderAnalisi(res){
  const chips=res.comp.map(c=>{
    const eu=EU.find(x=>x.id===c.id);
    return '<span class="chip" style="background:'+tint(eu.color)+';color:var(--text2);padding:6px 12px;font-size:12px">'+eu.short+' · '+Math.round(c.p*100)+'%</span>';
  }).join('');
  const dimchips=res.dims.map(id=>{const d=DIMS.find(x=>x.id===id);return '<span class="chip" style="background:'+tint(d.color)+';color:var(--text2);padding:6px 12px;font-size:12px">'+d.nome+'</span>';}).join('');
  const seg=res.segnali.map(s=>'<span class="chip">'+s+'</span>').join('');
  return `
  <div style="background:linear-gradient(135deg,var(--accent-soft),var(--surface2));border:1px solid var(--line-soft);border-radius:14px;padding:16px;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      ${icon('sparkles',16)}<strong style="color:var(--accent)">Connessione trovata</strong>
      <span class="conf" style="margin-left:auto">confidenza ${res.conf}</span>
    </div>
    <div style="font-size:11.5px;color:var(--text2);margin-bottom:6px">Dimensioni del tuo stile:</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${dimchips}</div>
    <div style="font-size:11.5px;color:var(--text2);margin-bottom:6px">Competenze chiave:</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${chips}</div>
    <p style="font-size:12.5px;color:var(--text);line-height:1.55"><strong>${res.corretta?'Competenze':'Perché'}:</strong> ${res.perche}.</p>
    ${seg?`<div style="margin-top:10px;font-size:11.5px;color:var(--muted)">Segnali rilevati: ${seg}</div>`:''}
    <div class="ai-source">${res.fonte==='modello'?'Analisi del modello locale · '+res.modello:res.fonte==='simulata'?'Analisi simulata: '+res.motivo+'. Avvia Sergio per usare il modello vero.':''}</div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn primary" data-action="conferma">Salva l'esperienza ${icon('check',14)}</button>
    <button class="btn" data-action="correggi">Correggi</button>
  </div>`;
}
/* Percorsi possibili, uno per competenza: la pagina li ordina in base alle prove reali. */
const PERCORSI={
  stem:[
    {titolo:'ITS Informatica e Robotica',tipo:'ITS post-diploma',cosa:'Due anni molto pratici, con laboratorio e tirocinio in azienda. Si esce con un diploma di tecnico superiore.',comp:['stem','digitale']},
    {titolo:'Ingegneria Informatica',tipo:'Laurea triennale',cosa:'Matematica, programmazione, reti e sistemi. Più teorico di un ITS, apre anche alla magistrale.',comp:['stem','digitale','personale']}
  ],
  digitale:[
    {titolo:'Design e comunicazione digitale',tipo:'ITS o accademia',cosa:'Grafica, video, interfacce e contenuti per il web, con progetti veri commissionati dalle aziende.',comp:['digitale','cultura']},
    {titolo:'Sviluppo web e applicazioni',tipo:'Mestiere',cosa:'Chi costruisce siti e app: si impara con corsi, ITS o da autodidatta con un portfolio solido.',comp:['digitale','stem']}
  ],
  personale:[
    {titolo:'Scienze dell\'educazione e formazione',tipo:'Laurea triennale',cosa:'Studi su come si apprende e si accompagnano le persone, con tirocini in scuole e comunità.',comp:['personale','cittadinanza']},
    {titolo:'Tecnico del benessere e dello sport',tipo:'ITS o corso professionale',cosa:'Preparazione atletica, gestione di gruppi e prevenzione: unisce pratica sportiva e relazioni.',comp:['personale','imprenditoriale']}
  ],
  imprenditoriale:[
    {titolo:'Economia e management',tipo:'Laurea triennale',cosa:'Imprese, mercati, budget e organizzazione. Utile se ti piace decidere e far funzionare le cose.',comp:['imprenditoriale','stem']},
    {titolo:'Organizzazione di eventi e progetti',tipo:'ITS o corso professionalizzante',cosa:'Coordinare persone, tempi e risorse per portare a termine un evento o un progetto.',comp:['imprenditoriale','personale']}
  ],
  alfabetica:[
    {titolo:'Lettere e comunicazione',tipo:'Laurea triennale',cosa:'Testi, lingua e argomentazione: la base per editoria, giornalismo, insegnamento e uffici stampa.',comp:['alfabetica','cultura']},
    {titolo:'Editoria e scrittura professionale',tipo:'Mestiere',cosa:'Redazione, correzione bozze, contenuti web: si entra con un portfolio di testi pubblicati.',comp:['alfabetica','digitale']}
  ],
  multilingue:[
    {titolo:'Mediazione linguistica',tipo:'Laurea triennale',cosa:'Due o tre lingue, traduzione e comunicazione interculturale, con periodi di studio all\'estero.',comp:['multilingue','alfabetica']},
    {titolo:'Turismo e relazioni internazionali',tipo:'ITS o laurea',cosa:'Accoglienza, scambi e progetti con partner stranieri: la lingua è lo strumento di lavoro.',comp:['multilingue','imprenditoriale']}
  ],
  cittadinanza:[
    {titolo:'Scienze del servizio sociale',tipo:'Laurea triennale',cosa:'Diritti, welfare e accompagnamento delle persone fragili, con tirocini sul territorio.',comp:['cittadinanza','personale']},
    {titolo:'Progetti nel terzo settore',tipo:'Mestiere',cosa:'Cooperative e associazioni: progettazione sociale, volontariato organizzato, educativa di strada.',comp:['cittadinanza','imprenditoriale']}
  ],
  cultura:[
    {titolo:'DAMS e discipline artistiche',tipo:'Laurea triennale',cosa:'Cinema, teatro, musica e arti visive, con laboratori e produzioni studentesche.',comp:['cultura','alfabetica']},
    {titolo:'Design della comunicazione visiva',tipo:'Accademia o ITS',cosa:'Immagine, tipografia e allestimenti: si studia progettando, con un portfolio che cresce ogni anno.',comp:['cultura','digitale']}
  ]
};
const PROPOSTE={
  alfabetica:{t:'Scrivi la recensione di un libro che ti è piaciuto',why:'Racconta cosa ti ha colpito, non solo la trama',ambito:'extra'},
  multilingue:{t:'Segui un episodio in lingua e annota cinque espressioni nuove',why:'Poi raccontale come prova: bastano poche righe',ambito:'extra'},
  stem:{t:'Documenta un problema risolto con numeri o un esperimento',why:'Anche piccolo: conta il metodo che hai usato',ambito:'scuola'},
  digitale:{t:'Racconta uno strumento digitale che sai usare bene',why:'Un programma, un montaggio, un foglio di calcolo',ambito:'extra'},
  personale:{t:'Descrivi come organizzi studio, sport e tempo libero',why:'La costanza è una competenza, non un dettaglio',ambito:'extra'},
  cittadinanza:{t:'Partecipa a un\'iniziativa utile per gli altri e raccontala',why:'Volontariato, raccolta, aiuto a un compagno',ambito:'extra'},
  imprenditoriale:{t:'Organizza qualcosa con altre persone e annota compiti e budget',why:'Anche un piccolo evento con la classe',ambito:'scuola'},
  cultura:{t:'Visita una mostra o prova un laboratorio creativo',why:'Poi racconta cosa ti ha colpito e perché',ambito:'extra'}
};
function renderOrientamento(){
  const chip=id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+tint(c.color)+';color:var(--text2)">'+c.short+'</span>';};
  const conProve=state.evidences.length>0;

  // Le tre direzioni nascono dalle competenze più documentate, non da testi fissi.
  const direzioni=[];
  EU.forEach(c=>{
    (PERCORSI[c.id]||[]).forEach(p=>{
      const pesi=p.comp.map((id,i)=>scoreOf(id)*(i===0?0.65:0.35/ Math.max(1,p.comp.length-1)));
      const match=Math.round(pesi.reduce((a,b)=>a+b,0));
      if(match<=0) return;
      const prove=state.evidences.filter(e=>(e.comp||[]).includes(p.comp[0]));
      direzioni.push({...p,match,col:c.color,prove});
    });
  });
  direzioni.sort((a,b)=>b.match-a.match);
  const top=direzioni.slice(0,3);
  const gaps=bottomComp(3);
  const proposte=bottomComp(3).map(g=>({...PROPOSTE[g.id],comp:[g.id],val:g.val}));

  return `
  <div class="hero">
    <div>
      <h1>Orientamento</h1>
      <p>Strade coerenti con le prove che hai raccolto. Non sono un verdetto: ogni direzione nasce da esperienze concrete e ti dice quali.</p>
    </div>
    <div class="hero-side">
      <button class="btn soft" data-action="askSergio" data-q="Non ho ancora le idee chiare su cosa fare dopo il diploma. Mi aiuti a capire da dove partire, guardando il mio profilo?">${icon('chat',14)} Parlane con Sergio</button>
    </div>
  </div>
  ${!conProve?`<div class="card empty-state">
    <div class="empty-ico">${icon('compass',26)}</div>
    <div>
      <div class="section-title">Prima una prova, poi l'orientamento</div>
      <div class="section-sub">Senza esperienze non ci sono direzioni da calcolare: aggiungi la prima prova e questa pagina si popola da sola.</div>
      <button class="btn primary sm" data-action="goNuova">+ Aggiungi la prima prova</button>
    </div>
  </div>`:`
  <div class="section-title">Direzioni da esplorare</div>
  <div class="section-sub">Ordinate per coerenza con le prove che hai caricato</div>
  <div class="grid g3">
    ${top.map(d=>`
      <div class="card" style="display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span class="chip" style="background:${tint(d.col)};color:var(--text2)">${d.tipo}</span>
          <span style="font-size:11.5px;color:var(--muted)">coerenza <strong style="color:var(--text)">${d.match}%</strong></span>
        </div>
        <div style="font-weight:600;font-size:14px;margin-bottom:6px">${d.titolo}</div>
        <p style="font-size:12.5px;color:var(--text);line-height:1.55;margin-bottom:8px"><strong>Cos'è:</strong> ${d.cosa}</p>
        <p style="font-size:12.5px;color:var(--text2);line-height:1.55;margin-bottom:10px"><strong>Perché te lo suggeriamo:</strong> ${d.prove.length
          ? 'nasce da '+d.prove.slice(0,2).map(e=>'«'+escHTML(e.titolo)+'»').join(' e ')+'.'
          : 'le tue prove su '+EU.find(c=>c.id===d.comp[0]).nome.toLowerCase()+' sono ancora poche: è uno spunto da verificare.'}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${d.comp.map(chip).join('')}</div>
        <button class="btn soft sm" style="margin-top:auto;align-self:flex-start" data-action="askSergio" data-q="Mi spieghi meglio ${escHTML(d.titolo)} (${escHTML(d.tipo)})? Cosa si studia o si fa, quanto dura, che sbocchi ha e perché potrebbe essere adatto a me?">${icon('chat',14)} Chiedi a Sergio</button>
      </div>`).join('')}
  </div>`}
  ${conProve?`<div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Aree ancora poco raccontate</div>
      <div class="section-sub">Dove hai caricato meno prove finora</div>
      ${gaps.map(g=>`
        <div class="bar-row">
          <div class="bar-name">${g.nome}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${g.val}%;background:${COL[g.id]}"></div></div>
          <div class="bar-val">${g.val}%</div>
        </div>`).join('')}
      <p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5">Non è un giudizio: forse in queste aree fai già cose che non hai ancora raccontato.</p>
    </div>
    <div class="card">
      <div class="section-title">Proposte da esplorare</div>
      <div class="section-sub">Una per area, così il profilo si completa</div>
      ${proposte.map(m=>`
        <div style="border:1px solid var(--line);border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="font-weight:600;font-size:13px;margin-bottom:4px">${m.t}</div>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">${m.why}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="display:flex;gap:6px">${m.comp.map(chip).join('')}</div>
            <button class="btn soft sm" data-action="mission" data-val="${m.t}" data-ambito="${m.ambito}">Mi interessa</button>
          </div>
        </div>`).join('')}
    </div>
  </div>`:''}`;
}
function capolavoro(){
  const list=state.evidences.filter(e=>!e.docId);
  if(!list.length) return null;
  const starred=list.filter(e=>e.evidenza);
  const pool=starred.length?starred:list;
  const score=e=>(e.comp||[]).length*2 + (e.dims||[]).length + (e.conf==='alta'?2:e.conf==='media'?1:0);
  return [...pool].sort((a,b)=>score(b)-score(a) || String(b.data||'').localeCompare(String(a.data||'')))[0];
}
function direzioneOrientamento(){
  const top=topComp(2);
  if(!top.length || !top[0].val) return {coerenza:0, testo:'Aggiungi qualche prova per ricevere una direzione di orientamento.'};
  const weak=bottomComp(1)[0];
  const mappa={
    stem:'percorsi tecnici e scientifici (ITS, ingegneria, laboratori)',
    digitale:'percorsi digitali e creativi (ITS comunicazione, design, sviluppo)',
    personale:'percorsi che mettono al centro le persone (formazione, orientamento, lavoro di squadra)',
    imprenditoriale:'percorsi di organizzazione e progetto (eventi, management, imprenditoria)',
    alfabetica:'percorsi di comunicazione e scrittura (editoria, giornalismo, formazione)',
    multilingue:'percorsi internazionali e linguistici (scambi, mediazione, turismo)',
    cittadinanza:'percorsi civici e sociali (volontariato, servizi alla persona, terzo settore)',
    cultura:'percorsi artistici e culturali (design, musica, teatro, patrimonio)'
  };
  const coerenza=Math.round((top[0].val+top[1].val)/2);
  const nome=mappa[top[0].id]||'percorsi coerenti con le tue competenze';
  return {coerenza, testo:`${nome}. Coerenza col profilo: ${coerenza}%. Le tue competenze più evidenti sono ${top[0].nome} e ${top[1].nome}; ${weak.val?`la meno documentata è ${weak.nome}.`:'continua a raccogliere prove.'}`};
}
function portfolioDate(){
  const d=state.portfolioAt?new Date(state.portfolioAt):new Date();
  return d.toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'})+', '+d.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
}
function portfolioScelte(){
  const ids=(state.portfolioSel||[]).filter(id=>state.evidences.some(e=>e.id===id));
  if(ids.length) return state.evidences.filter(e=>ids.includes(e.id));
  const starred=state.evidences.filter(e=>e.evidenza);
  return (starred.length?starred:[...state.evidences]).slice(0,5);
}
function openPortfolioPicker(){
  const sel=new Set(portfolioScelte().map(e=>e.id));
  openModal(`
    <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
    <div class="section-title">Attività significative</div>
    <div class="section-sub">Scegli cosa mostrare nel portfolio e nel CV. Se non scegli nulla usiamo le prove con la stella.</div>
    <div class="pick-list">
      ${state.evidences.length?state.evidences.map(e=>`
        <label class="pick-row">
          <input type="checkbox" data-pick="${escHTML(e.id)}" ${sel.has(e.id)?'checked':''}/>
          <span><strong>${escHTML(e.titolo)}</strong>
          <small>${e.data?fmtDate(e.data)+' · ':''}${(e.comp||[]).map(id=>EU.find(c=>c.id===id)?.short).filter(Boolean).join(', ')||'senza competenze'}</small></span>
        </label>`).join(''):'<p class="section-sub">Aggiungi prima qualche prova.</p>'}
    </div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn sm" data-action="closeModal">Annulla</button>
      <button class="btn primary sm" data-action="savePortfolioSel">Salva selezione</button>
    </div>`);
}
function renderPortfolio(){
  const cap=capolavoro();
  const dir=direzioneOrientamento();
  const sig=portfolioScelte();
  if(!state.evidences.length){
    return `
    <div class="hero no-print">
      <div>
        <h1>CV e portfolio</h1>
        <p>Il portfolio e il CV nascono dalle prove che raccogli.</p>
      </div>
    </div>
    <div class="card empty-state">
      <div class="empty-ico">${icon('file',26)}</div>
      <div>
        <div class="section-title">Ancora niente da mostrare</div>
        <div class="section-sub">Aggiungi la prima attività: il portfolio e il CV si compilano da soli.</div>
        <button class="btn primary sm" data-action="goNuova">+ Aggiungi la prima prova</button>
      </div>
    </div>`;
  }
  return `
  <div class="hero no-print">
    <div>
      <h1>CV e portfolio</h1>
      <p>Il portfolio e il CV nascono dalle prove e dai documenti che hai caricato. Scegli tu le attività che ti rappresentano meglio.</p>
    </div>
    <div class="hero-side">
      <button class="btn" data-action="pickPortfolio">${icon('check',14)} Scegli le attività</button>
      <button class="btn" data-action="apriCv">${icon('file',14)} Apri il CV</button>
    </div>
  </div>
  <div class="portfolio">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      ${state.profilo.foto?`<img class="portfolio-avatar" src="${escHTML(fileUrl(state.profilo.foto))}" alt=""/>`:`<div class="avatar" style="width:46px;height:46px;font-size:16px">${escHTML(iniziali())}</div>`}
      <div>
        <h2>${escHTML(nomeCompleto())}</h2>
        <div class="muted">${escHTML([state.profilo.classe?'Classe '+state.profilo.classe:'',state.profilo.scuola,state.profilo.anno?'A.S. '+state.profilo.anno:''].filter(Boolean).join(' · '))}</div>
      </div>
    </div>
    <hr/>
    <section>
      <h3>Il tuo stile: essere, fare, lavorare</h3>
      ${DIMS.map(d=>`
        <div class="bar-row" style="padding:4px 0">
          <div class="bar-name" style="width:130px;color:var(--text2)">${d.nome}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${dimScore(d.id)}%;background:${d.color}"></div></div>
          <div class="bar-val">${dimScore(d.id)}</div>
        </div>`).join('')}
    </section>
    <section>
      <h3>Profilo di competenze</h3>
      ${EU.map(c=>`
        <div class="bar-row" style="padding:4px 0">
          <div class="bar-name" style="width:130px">${c.nome}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${scoreOf(c.id)}%;background:${c.color}"></div></div>
          <div class="bar-val">${scoreOf(c.id)}</div>
        </div>`).join('')}
    </section>
    <section>
      <h3>Capolavoro</h3>
      ${cap?`<p><strong>${escHTML(cap.titolo)}</strong> — ${escHTML(cap.descrizione||'')}${(cap.dims||[]).length?' Dimensioni: '+cap.dims.map(id=>DIMS.find(x=>x.id===id)?.nome).filter(Boolean).join(', ')+'.':''}${(cap.comp||[]).length?' Competenze: '+cap.comp.map(id=>EU.find(x=>x.id===id)?.nome).filter(Boolean).join(', ')+'.':''}</p>`:''}
    </section>
    <section>
      <h3>Attività significative</h3>
      <ul>
        ${sig.map(e=>'<li><strong>'+escHTML(e.titolo)+'</strong> — '+escHTML((e.descrizione||'').slice(0,110))+'… <em style="color:var(--label)">('+ (e.dims||[]).map(id=>DIMS.find(x=>x.id===id)?.nome).filter(Boolean).join(', ')+')</em></li>').join('') || '<li class="cv-missing">Nessuna esperienza ancora.</li>'}
      </ul>
    </section>
    <section>
      <h3>Direzione di orientamento</h3>
      <p>${escHTML(dir.testo)}</p>
    </section>
    <hr/>
    <div class="muted">Aggiornato il ${portfolioDate()} · Talent Radar</div>
  </div>`;
}
/* La vecchia "Cassaforte" è stata assorbita nelle impostazioni: i permessi AI vivono lì. */
