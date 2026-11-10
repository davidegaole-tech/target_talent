/* ---------- PAGES ---------- */
function renderPassaporto(){
  const vals=EU.map(c=>scoreOf(c.id));
  const td=topDim(3);
  const recent=state.evidences.slice(0,3);
  const nome=state.profilo.nome||'';
  return `
  <div class="hero">
    <div>
      <h1>${nome?'Ciao '+escHTML(nome)+',':'Il tuo Passaporto'}</h1>
      <p>Questo è il tuo spazio. Ogni cosa che racconti, a scuola o fuori, mostra <strong>come sei</strong>, <strong>cosa realizzi</strong> e <strong>come operi</strong>. Nessun voto, nessun obiettivo da raggiungere: carichi quello che senti tuo.</p>
    </div>
    <div class="hero-side">
      <button class="btn primary" data-action="navigateNuova">+ Racconta qualcosa</button>
      <button class="btn soft" data-action="askSergio" data-q="Ho voglia di raccontare qualcosa nel mio passaporto ma non so da dove partire. Mi aiuti con qualche idea?">Non sai cosa raccontare?</button>
    </div>
  </div>
  <div class="grid g2">
    <div class="card">
      <div class="section-title">Il tuo modo di essere, fare, lavorare</div>
      <div class="section-sub">Come si distribuiscono le cose che hai raccontato</div>
      ${DIMS.map(d=>`
        <div class="bar-row">
          <div class="bar-name" style="color:${d.color}">${d.nome}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${dimScore(d.id)}%;background:${d.color}"></div></div>
          <div class="bar-count">${dimCount(d.id)} ${dimCount(d.id)===1?'prova':'prove'}</div>
        </div>`).join('')}
      <div style="margin-top:14px;padding:12px 14px;background:var(--surface2);border-radius:12px;font-size:12.5px;line-height:1.6;color:var(--text2)">
        Finora hai raccontato soprattutto il tuo modo di <strong>${td[0].nome.toLowerCase()}</strong>. Se ti va, prova a far emergere anche come sai <strong>${td[2].nome.toLowerCase()}</strong>: spesso c'è già, solo che non l'hai ancora scritto.
      </div>
    </div>
    <div class="card">
      <div class="section-title">Le tue competenze chiave</div>
      <div class="section-sub">Le 8 competenze europee che emergono dalle tue prove</div>
      <div id="radarWrap">${radarSVG(vals)}</div>
      <a href="#/macroaree" class="btn soft sm" style="margin-top:6px">Approfondisci nella panoramica ${icon('arrow',14)}</a>
    </div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Le tue ultime prove</div>
      <div class="section-sub">Quello che hai raccontato di recente</div>
      ${recent.map(e=>renderEvidenceCard(e)).join('')}
      <a href="#/diario" class="btn soft sm" style="margin-top:6px">Apri il diario ${icon('arrow',14)}</a>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="section-title">Una proposta per te</div>
        <div class="section-sub">Un'idea da esplorare, se ti incuriosisce</div>
        <p style="font-size:13px;line-height:1.55;color:var(--text);margin-bottom:12px">Ti va di raccontare come vi siete organizzati nel gruppo del robot? Chi faceva cosa, un problema che avete risolto insieme. È un modo per far vedere anche <strong>come lavori</strong> con gli altri.</p>
        <button class="btn primary sm" data-action="mission" data-val="Come ci siamo organizzati nel gruppo del robot" data-ambito="scuola">Mi interessa ${icon('arrow',14)}</button>
      </div>
      <div class="card">
        <div class="section-title">Una direzione da esplorare</div>
        <div class="section-sub">Ispirata a quello che hai raccontato</div>
        <p style="font-size:13px;line-height:1.55;color:var(--text);margin-bottom:12px">Le tue prove su sistemi e programmazione fanno pensare a un <strong>ITS Informatica e Robotica</strong>. È solo uno spunto: in Orientamento trovi altre strade e puoi chiedere a Sergio.</p>
        <a href="#/orientamento" class="btn soft sm">Esplora le direzioni ${icon('arrow',14)}</a>
      </div>
    </div>
  </div>`;
}
function renderEvidenceCard(e){
  const tipoIcon={foto:'image',link:'link',testo:'text',voce:'mic',documento:'file'}[e.tipo]||'text';
  const chips=e.comp.map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+c.color+'1f;color:'+c.color+'">'+c.short+'</span>';}).join('');
  const dimchips=(e.dims||[]).map(id=>{const d=DIMS.find(x=>x.id===id);return '<span class="chip" style="background:'+d.color+'1f;color:'+d.color+'">'+d.nome+'</span>';}).join('');
  return `<div class="evidence" data-action="openEv" data-id="${e.id}">
    <div class="evidence-head">
      <div class="evidence-icon">${icon(tipoIcon,16)}</div>
      <div style="flex:1;min-width:0">
        <div class="evidence-title">${e.titolo}</div>
        <div class="evidence-date">${fmtDate(e.data)} · ${e.tipo}</div>
      </div>
      <span class="conf">${(e.ambito==='extra'?'fuori da scuola':e.ambito==='doc'?'documento':'a scuola')}</span>
    </div>
    <div class="evidence-desc">${e.descrizione}</div>
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
      <h1>Aggiungi una prova</h1>
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
        <label>Titolo</label>
        <input id="p-titolo" placeholder="es. Robot per la gara regionale" value="${state.prefill?escHTML(state.prefill.titolo):''}"/>
      </div>
      <div class="form-row">
        <label>Descrizione (2-4 righe)</label>
        <textarea id="p-desc" placeholder="Cosa hai fatto, come, con chi, cosa hai imparato...">${state.prefill?escHTML(state.prefill.desc):''}</textarea>
      </div>
      <div class="form-row">
        <label>Data</label>
        <input type="date" id="p-data" value="2026-11-10"/>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" data-action="analizza">Analizza con l'AI ${icon('sparkles',14)}</button>
        <button class="btn" data-action="resetForm">Pulisci</button>
      </div>
      <p style="font-size:12px;color:var(--muted);margin-top:14px;line-height:1.5">Hai un attestato, una certificazione o un corso? Caricalo in <a href="#/documenti" style="color:var(--accent);font-weight:600">Documenti</a>: Sergio lo legge e ti suggerisce come valorizzarlo.</p>
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
    return '<span class="chip" style="background:'+eu.color+'1f;color:'+eu.color+';padding:6px 12px;font-size:12px">'+eu.short+' · '+Math.round(c.p*100)+'%</span>';
  }).join('');
  const dimchips=res.dims.map(id=>{const d=DIMS.find(x=>x.id===id);return '<span class="chip" style="background:'+d.color+'1f;color:'+d.color+';padding:6px 12px;font-size:12px">'+d.nome+'</span>';}).join('');
  const seg=res.segnali.map(s=>'<span class="chip">'+s+'</span>').join('');
  return `
  <div style="background:linear-gradient(135deg,var(--accent-soft),var(--surface2));border:1px solid var(--line-soft);border-radius:14px;padding:16px;margin-bottom:14px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      ${icon('sparkles',16)}<strong style="color:var(--accent)">Connessione trovata</strong>
      <span class="conf" style="margin-left:auto">confidenza ${res.conf}</span>
    </div>
    <div style="font-size:11.5px;color:#6b7280;margin-bottom:6px">Dimensioni del tuo stile:</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${dimchips}</div>
    <div style="font-size:11.5px;color:#6b7280;margin-bottom:6px">Competenze chiave:</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${chips}</div>
    <p style="font-size:12.5px;color:var(--text);line-height:1.55"><strong>${res.corretta?'Competenze':'Perché'}:</strong> ${res.perche}.</p>
    ${seg?`<div style="margin-top:10px;font-size:11.5px;color:var(--muted)">Segnali rilevati: ${seg}</div>`:''}
    <div class="ai-source">${res.fonte==='modello'?'Analisi del modello locale · '+res.modello:res.fonte==='simulata'?'Analisi simulata: '+res.motivo+'. Avvia Sergio per usare il modello vero.':''}</div>
  </div>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn primary" data-action="conferma">Aggiungi al Passaporto ${icon('check',14)}</button>
    <button class="btn" data-action="correggi">Correggi</button>
  </div>`;
}
function renderDiario(){
  const filters=EU.map(c=>'<button class="chip filter '+(state.diarioFilter===c.id?'on':'')+'" data-action="dfilter" data-val="'+c.id+'">'+c.short+'</button>').join('');
  const list=state.diarioFilter?state.evidences.filter(e=>e.comp.includes(state.diarioFilter)):state.evidences;
  return `
  <div class="hero">
    <div>
      <h1>Diario delle prove</h1>
      <p>Tutto quello che hai raccontato, a scuola e fuori, compresi i documenti che hai aggiunto. Filtra per competenza se vuoi ritrovare qualcosa.</p>
    </div>
    <div class="hero-side">
      <button class="btn primary sm" data-action="navigateNuova">+ Aggiungi prova</button>
      <a class="btn sm" href="#/documenti">${icon('file',14)} Carica un documento</a>
    </div>
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip filter ${!state.diarioFilter?'on':''}" data-action="dfilter" data-val="">Tutte</button>
    ${filters}
  </div>
  <div class="grid g3">
    ${list.length?list.map(e=>renderEvidenceCard(e)).join(''):'<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px">Ancora nessuna prova per questa competenza. <a href="#/nuova" style="color:var(--accent);font-weight:600">Racconta qualcosa</a>.</div>'}
  </div>`;
}
function renderOrientamento(){
  const dirs=[
   {titolo:'ITS Informatica e Robotica',tipo:'ITS post-diploma',match:87,
    cosa:'Un percorso di 2 anni dopo il diploma, molto pratico, fatto insieme alle aziende: tanto laboratorio e un tirocinio lungo. Si esce con un diploma di tecnico superiore.',
    why:'Hai raccontato più volte di progetti tecnici e strumenti digitali, come il robot con Arduino e il podcast.',comp:['stem','digitale'],col:'#14b8a6'},
   {titolo:'Ingegneria Informatica',tipo:'Laurea triennale',match:81,
    cosa:'Un corso universitario di 3 anni: matematica, programmazione, reti e sistemi. Più teorico di un ITS, apre anche alla laurea magistrale.',
    why:'Le tue prove mostrano logica e programmazione. Per un percorso lungo conta anche la costanza, che emerge dalla pallavolo.',comp:['stem','digitale','personale'],col:'#6366f1'},
   {titolo:'Sviluppatrice IoT / Robotics',tipo:'Mestiere',match:76,
    cosa:'Chi progetta oggetti "intelligenti" che leggono sensori e comunicano in rete: domotica, macchine industriali, dispositivi medici. Ci si arriva da ITS, università o corsi specifici.',
    why:'Unisce il lavoro sui sensori del robot con la capacità di coordinare un gruppo, come al mercatino.',comp:['stem','digitale','imprenditoriale'],col:'#ec4899'}
  ];
  const gaps=bottomComp(3);
  const proposte=[
   {t:'Racconta come vi organizzate nel gruppo del robot',why:'Per far emergere anche come lavori con gli altri',comp:['imprenditoriale','personale'],ambito:'scuola'},
   {t:'Prova un laboratorio di teatro o una mostra fotografica',why:'Un\'area che non hai ancora esplorato molto',comp:['cultura'],ambito:'extra'},
   {t:'Scrivi qualche riga su un libro che ti ha cambiato qualcosa',why:'Per raccontare qualcosa di più personale',comp:['alfabetica'],ambito:'extra'}
  ];
  const chip=id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+c.color+'1f;color:'+c.color+'">'+c.short+'</span>';};
  return `
  <div class="hero">
    <div>
      <h1>Orientamento</h1>
      <p>Alcune strade coerenti con quello che hai raccontato. Non sono un verdetto: sono spunti da esplorare, e ogni suggerimento ti dice da quali prove nasce.</p>
    </div>
    <div class="hero-side">
      <button class="btn soft" data-action="askSergio" data-q="Non ho ancora le idee chiare su cosa fare dopo il diploma. Mi aiuti a capire da dove partire, guardando il mio profilo?">${icon('chat',14)} Parlane con Sergio</button>
    </div>
  </div>
  <div class="section-title">Direzioni da esplorare</div>
  <div class="section-sub">Ordinate per coerenza con le tue prove</div>
  <div class="grid g3">
    ${dirs.map(d=>`
      <div class="card" style="display:flex;flex-direction:column">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span class="chip" style="background:${d.col}1f;color:${d.col}">${d.tipo}</span>
          <span style="font-size:11.5px;color:var(--muted)">coerenza <strong style="color:${d.col}">${d.match}%</strong></span>
        </div>
        <div style="font-weight:700;font-size:14px;margin-bottom:6px">${d.titolo}</div>
        <p style="font-size:12.5px;color:var(--text);line-height:1.55;margin-bottom:8px"><strong>Cos'è:</strong> ${d.cosa}</p>
        <p style="font-size:12.5px;color:var(--text2);line-height:1.55;margin-bottom:10px"><strong>Perché te lo suggeriamo:</strong> ${d.why}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">${d.comp.map(chip).join('')}</div>
        <button class="btn soft sm" style="margin-top:auto;align-self:flex-start" data-action="askSergio" data-q="Mi spieghi meglio ${escHTML(d.titolo)} (${escHTML(d.tipo)})? Cosa si studia o si fa, quanto dura, che sbocchi ha e perché potrebbe essere adatto a me?">${icon('chat',14)} Chiedi a Sergio</button>
      </div>`).join('')}
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Aree ancora poco raccontate</div>
      <div class="section-sub">Dove hai caricato meno prove finora</div>
      ${gaps.map(g=>`
        <div class="bar-row">
          <div class="bar-name">${g.nome}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${g.val}%;background:${COL[g.id]}"></div></div>
        </div>`).join('')}
      <p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5">Non è un giudizio e non c'è niente da completare: forse in queste aree fai già cose che non hai ancora raccontato, oppure sono semplicemente da scoprire.</p>
    </div>
    <div class="card">
      <div class="section-title">Proposte da esplorare</div>
      <div class="section-sub">Idee, se ti incuriosiscono</div>
      ${proposte.map(m=>`
        <div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px">
          <div style="font-weight:650;font-size:13px;margin-bottom:4px">${m.t}</div>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">${m.why}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="display:flex;gap:6px">${m.comp.map(chip).join('')}</div>
            <button class="btn soft sm" data-action="mission" data-val="${m.t}" data-ambito="${m.ambito}">Mi interessa</button>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}
function renderPortfolio(){
  return `
  <div class="hero no-print">
    <div>
      <h1>CV e portfolio</h1>
      <p>Il tuo E-Portfolio e il tuo CV nascono dalle prove e dai documenti che hai caricato. Puoi esportarli in PDF e condividerli con il tutor.</p>
    </div>
    <div class="hero-side">
      <button class="btn" data-action="rigenera">Rigenera bozza</button>
      <button class="btn" data-action="condividi">${icon('share',14)} Condividi con tutor</button>
      <button class="btn primary" data-action="stampa">Scarica PDF ${icon('file',14)}</button>
      <button class="btn" data-action="apriCv">${icon('file',14)} Apri il CV</button>
    </div>
  </div>
  <div class="portfolio">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div class="avatar" style="width:46px;height:46px;font-size:16px">${escHTML(iniziali())}</div>
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
          <div class="bar-name" style="width:130px;color:${d.color}">${d.nome}</div>
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
      <p><strong>Robot per la gara regionale</strong> — progettazione e programmazione di un robot con Arduino per la competizione scolastica. Ruolo: gestione sensori e test. Dimensioni: Fare, Lavorare. Competenze: STEM, Digitale.</p>
    </section>
    <section>
      <h3>Esperienze significative</h3>
      <ul>
        ${state.evidences.slice(0,5).map(e=>'<li><strong>'+e.titolo+'</strong> — '+e.descrizione.slice(0,90)+'… <em style="color:var(--label)">('+ (e.dims||[]).map(id=>DIMS.find(x=>x.id===id).nome).join(', ')+')</em></li>').join('')}
      </ul>
    </section>
    <section>
      <h3>Direzione di orientamento</h3>
      <p>ITS Informatica e Robotica (coerenza 87%). Il profilo è forte su STEM e Digitale; da rafforzare Cittadinanza e Cultura.</p>
    </section>
    <section>
      <h3>Cosa puoi ancora aggiungere, se vuoi</h3>
      <ul>
        <li>Una riflessione personale sul tuo percorso</li>
        <li>${state.shareWithTutor?'Hai condiviso il portfolio con il tutor':'La condivisione con il tutor, quando ti senti pronto'}</li>
      </ul>
    </section>
    <hr/>
    <div class="muted">Bozza generata automaticamente il 10 nov 2026 · da validare con il tutor · Talent Passport</div>
  </div>`;
}
function renderPrivacy(){
  const toggles=[
   {id:'tutor',label:'Visibilità al tutor',desc:'Il tutor vede le prove e il radar. Puoi nascondere prove singole.',val:state.privacy.tutor},
   {id:'orientatore',label:'Condivisione con orientatore esterno',desc:'Consenso per condividere il portfolio con un centro di orientamento.',val:state.privacy.orientatore},
   {id:'ai',label:'Uso dei dati per migliorare l\'AI',desc:'I tuoi dati (anonimizzati) aiutano a migliorare i suggerimenti.',val:state.privacy.ai},
   {id:'export',label:'Esportazione E-Portfolio',desc:'Permetti il download del portfolio in PDF.',val:state.privacy.export}
  ];
  return `
  <div class="hero">
    <div>
      <h1>Cassaforte dello studente</h1>
      <p>Decidi tu cosa vede il tutor. L'AI è spiegabile e correggibile: nessuna scatola nera.</p>
    </div>
  </div>
  <div class="grid g2">
    <div class="card">
      <div class="section-title">Privacy e controllo</div>
      <div class="section-sub">Le tue scelte, in ogni momento modificabili</div>
      ${toggles.map(t=>`
        <div style="display:flex;align-items:center;justify-content:space-between;gap:14px;padding:12px 0;border-bottom:1px solid var(--line)">
          <div style="flex:1">
            <div style="font-weight:650;font-size:13px">${t.label}</div>
            <div style="font-size:11.5px;color:var(--muted);margin-top:2px">${t.desc}</div>
          </div>
          <label style="position:relative;width:42px;height:24px;flex:none">
            <input type="checkbox" ${t.val?'checked':''} data-action="privacy" data-val="${t.id}" style="opacity:0;width:0;height:0;position:absolute"/>
            <span style="position:absolute;inset:0;background:${t.val?'var(--accent)':'#d1d5db'};border-radius:99px;transition:.2s;cursor:pointer"></span>
            <span style="position:absolute;top:3px;left:${t.val?'21px':'3px'};width:18px;height:18px;background:#fff;border-radius:50%;transition:.2s"></span>
          </label>
        </div>`).join('')}
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="section-title">Come funziona l'AI</div>
        <ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--text2);line-height:1.6">
          <li><strong>Spiegabile:</strong> vedi le parole che hanno attivato ogni dimensione.</li>
          <li><strong>Correggibile:</strong> puoi togliere o aggiungere competenze.</li>
          <li><strong>Locale:</strong> l'analisi gira sul dispositivo, i dati grezzi restano tuoi.</li>
          <li><strong>Minori:</strong> nessun dato sensibile, consenso esplicito per ogni condivisione.</li>
        </ul>
      </div>
      <div class="card">
        <div class="section-title">I tuoi dati</div>
        <p style="font-size:12.5px;color:var(--text2);line-height:1.55">Puoi esportare o cancellare tutte le tue prove in qualsiasi momento. Il tutor vede solo ciò che hai autorizzato.</p>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
          <button class="btn soft sm" data-action="exportData">Esporta dati</button>
          <button class="btn sm" style="color:var(--rose);border-color:#fecaca" data-action="deleteData">Cancella tutto</button>
        </div>
      </div>
    </div>
  </div>`;
}