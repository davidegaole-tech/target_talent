/* ---------- PAGES ---------- */
function renderPassaporto(){
  const vals=EU.map(c=>scoreOf(c.id));
  const total=Object.values(state.prove).reduce((a,b)=>a+b,0);
  const top=topComp(2), bot=bottomComp(2);
  const td=topDim(3);
  const recent=state.evidences.slice(0,3);
  return `
  <div class="hero">
    <div>
      <h1>Il tuo Passaporto</h1>
      <p>Ogni prova che aggiungi racconta <strong>come sei</strong>, <strong>cosa realizzi</strong> e <strong>come operi</strong>. Nessun voto: solo evidenze del tuo modo di essere, fare e lavorare.</p>
    </div>
    <div class="hero-side">
      <div class="ring-wrap">${ringSVG(Math.round(vals.reduce((a,b)=>a+b,0)/vals.length))}<div class="ring-val">${Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)}%</div></div>
      <div class="stats">
        <div class="stat-box"><div class="stat-num">${total}</div><div class="stat-lbl">prove</div></div>
        <div class="stat-box"><div class="stat-num">3</div><div class="stat-lbl">dimensioni</div></div>
        <div class="stat-box"><div class="stat-num">+3</div><div class="stat-lbl">questa settimana</div></div>
      </div>
    </div>
  </div>
  <div class="grid g2">
    <div class="card">
      <div class="section-title">Il tuo modo di essere, fare, lavorare</div>
      <div class="section-sub">3 dimensioni che descrivono il tuo stile personale</div>
      ${DIMS.map(d=>`
        <div class="bar-row">
          <div class="bar-name" style="color:${d.color}">${d.nome}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${dimScore(d.id)}%;background:${d.color}"></div></div>
          <div class="bar-val">${dimScore(d.id)}</div>
          <div class="bar-count">${dimCount(d.id)} prove</div>
        </div>`).join('')}
      <div style="margin-top:14px;padding:12px 14px;background:var(--surface2);border-radius:12px;font-size:12.5px;line-height:1.55;color:var(--text2)">
        <strong style="color:var(--ink)">Lettura AI:</strong> la tua dimensione più espressa è <strong>${td[0].nome} (${td[0].val})</strong>. ${td[2].nome} (${td[2].val}) è la meno esplorata: una micro-sfida può aiutarti a bilanciare il tuo stile.
      </div>
    </div>
    <div class="card">
      <div class="section-title">Le tue competenze chiave</div>
      <div class="section-sub">8 competenze europee · dettaglio del profilo</div>
      <div id="radarWrap">${radarSVG(vals)}</div>
    </div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Ultime prove</div>
      <div class="section-sub">Le più recenti che hai aggiunto</div>
      ${recent.map(e=>renderEvidenceCard(e)).join('')}
      <a href="#/diario" class="btn soft sm" style="margin-top:6px">Vedi tutte le prove ${icon('arrow',14)}</a>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="section-title">Prossima micro-sfida</div>
        <div class="section-sub">Suggerita dall'AI per bilanciare il tuo stile</div>
        <p style="font-size:13px;line-height:1.55;color:var(--text);margin-bottom:12px">Documenta come hai organizzato il lavoro del gruppo robot: chi fa cosa, come avete risolto un problema. Sblocca <strong>Lavorare</strong> e <strong>Essere</strong>.</p>
        <button class="btn primary sm" data-action="mission" data-val="organizza il lavoro del gruppo robot">Accetta la sfida ${icon('arrow',14)}</button>
      </div>
      <div class="card">
        <div class="section-title">Direzione suggerita</div>
        <div class="section-sub">Dal tuo profilo attuale</div>
        <p style="font-size:13px;line-height:1.55;color:var(--text);margin-bottom:12px">Le tue prove su sistemi e programmazione indicano un <strong>ITS Informatica e Robotica</strong> come percorso coerente.</p>
        <a href="#/orientamento" class="btn soft sm">Esplora le direzioni ${icon('arrow',14)}</a>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-title">Recap del periodo</div>
    <div class="section-sub">Mensile / trimestrale</div>
    <ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--text2);line-height:1.6">
      <li>Prove raccolte: ${state.evidences.length}</li>
      <li>Competenze coperte: ${EU.filter(c=>state.prove[c.id]>0).length}/8</li>
      <li>Streak attivo: ${state.streak} giorni</li>
      <li>Dimensione più cresciuta: ${topDim(1)[0].nome}</li>
    </ul>
    <a href="#/recap" class="btn soft sm" style="margin-top:10px">Apri il recap completo ${icon('arrow',14)}</a>
  </div>`;
}
function renderEvidenceCard(e){
  const tipoIcon={foto:'image',link:'link',testo:'text',voce:'mic'}[e.tipo]||'text';
  const chips=e.comp.map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+c.color+'1f;color:'+c.color+'">'+c.short+'</span>';}).join('');
  const dimchips=(e.dims||[]).map(id=>{const d=DIMS.find(x=>x.id===id);return '<span class="chip" style="background:'+d.color+'1f;color:'+d.color+'">'+d.nome+'</span>';}).join('');
  return `<div class="evidence" data-action="openEv" data-id="${e.id}">
    <div class="evidence-head">
      <div class="evidence-icon">${icon(tipoIcon,16)}</div>
      <div style="flex:1;min-width:0">
        <div class="evidence-title">${e.titolo}</div>
        <div class="evidence-date">${fmtDate(e.data)} · ${e.tipo}</div>
      </div>
      <span class="conf">${e.conf}</span>
    </div>
    <div class="evidence-desc">${e.descrizione}</div>
    <div class="evidence-foot">${dimchips}${chips}<span style="font-size:10.5px;color:var(--label);margin-left:auto">confidenza ${e.conf}</span></div>
  </div>`;
}
function renderNuova(){
  const tipo=state.pending?.tipo || 'foto';
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
        <label>Titolo</label>
        <input id="p-titolo" placeholder="es. Robot per la gara regionale" value="${state.prefill?state.prefill.titolo:''}"/>
      </div>
      <div class="form-row">
        <label>Descrizione (2-4 righe)</label>
        <textarea id="p-desc" placeholder="Cosa hai fatto, come, con chi, cosa hai imparato...">${state.prefill?state.prefill.desc:''}</textarea>
      </div>
      <div class="form-row">
        <label>Data</label>
        <input type="date" id="p-data" value="2026-11-10"/>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn primary" data-action="analizza">Analizza con l'AI ${icon('sparkles',14)}</button>
        <button class="btn" data-action="resetForm">Pulisci</button>
      </div>
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
          <li>Se l'AI sbaglia, correggi con un click.</li>
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
    <p style="font-size:12.5px;color:var(--text);line-height:1.55"><strong>Perché:</strong> ${res.perche}.</p>
    <div style="margin-top:10px;font-size:11.5px;color:#6b7280">Segnali rilevati: ${seg}</div>
    <div class="ai-source">${res.fonte==='modello'?'Analisi del modello locale · '+res.modello:res.fonte==='simulata'?'Analisi simulata: '+res.motivo+'. Avvia il tutor per usare il modello vero.':''}</div>
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
      <p>Tutte le evidenze che hai raccolto. Filtra per competenza per vedere dove sei più forte.</p>
    </div>
    <div class="hero-side">
      <button class="btn primary sm" data-action="navigateNuova">+ Aggiungi prova</button>
      <div class="stats">
        <div class="stat-box"><div class="stat-num">${state.evidences.length}</div><div class="stat-lbl">prove</div></div>
        <div class="stat-box"><div class="stat-num">${EU.filter(c=>state.prove[c.id]>0).length}/8</div><div class="stat-lbl">competenze</div></div>
      </div>
    </div>
  </div>
  <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip filter ${!state.diarioFilter?'on':''}" data-action="dfilter" data-val="">Tutte</button>
    ${filters}
  </div>
  <div class="grid g3">
    ${list.length?list.map(e=>renderEvidenceCard(e)).join(''):'<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px">Nessuna prova per questa competenza. <a href="#/nuova" style="color:var(--accent);font-weight:600">Aggiungine una</a>.</div>'}
  </div>`;
}
function renderOrientamento(){
  const dirs=[
   {titolo:'ITS Informatica e Robotica',tipo:'ITS post-diploma',match:87,why:'6 prove su STEM e 7 su Digitale, trend in crescita. Il tuo profilo è coerente con un percorso tecnico applicato.',comp:['stem','digitale'],col:'#14b8a6'},
   {titolo:'Ingegneria Informatica',tipo:'Laurea triennale',match:81,why:'Forte su logica e programmazione. La componente personale e comunicativa è da rafforzare per reggere un corso lungo.',comp:['stem','digitale','personale'],col:'#6366f1'},
   {titolo:'Sviluppatrice IoT / Robotics',tipo:'Mestiere',match:76,why:'Combina le tue prove su sistemi embedded con la capacità di coordinare un gruppo. Mestiere emergente, alta domanda.',comp:['stem','digitale','imprenditoriale'],col:'#ec4899'}
  ];
  const gaps=bottomComp(3);
  const missions=[
   {t:'Documenta come organizzi il lavoro del gruppo robot',why:'Sblocca Lavorare ed Essere',comp:['imprenditoriale','personale']},
   {t:'Partecipa a un laboratorio di teatro o mostra fotografica',why:'Esplora Cultura, oggi la meno coperta',comp:['cultura']},
   {t:'Scrivi 5 righe su un libro che ti ha cambiato qualcosa',why:'Rafforza Fare con una prova personale',comp:['alfabetica']}
  ];
  return `
  <div class="hero">
    <div>
      <h1>Orientamento</h1>
      <p>Direzioni coerenti con le tue prove, non con un test della personalità. Ogni suggerimento porta le evidenze che lo motivano.</p>
    </div>
  </div>
  <div class="section-title">Direzioni suggerite</div>
  <div class="section-sub">Ordinate per coerenza con il tuo profilo attuale</div>
  <div class="grid g3">
    ${dirs.map(d=>`
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <span class="chip" style="background:${d.col}1f;color:${d.col}">${d.tipo}</span>
          <div style="font-size:22px;font-weight:700;color:${d.col};letter-spacing:-.4px">${d.match}%</div>
        </div>
        <div style="font-weight:700;font-size:14px;margin-bottom:6px">${d.titolo}</div>
        <p style="font-size:12.5px;color:var(--text2);line-height:1.55;margin-bottom:10px">${d.why}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${d.comp.map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+c.color+'1f;color:'+c.color+'">'+c.short+'</span>';}).join('')}</div>
      </div>`).join('')}
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Competenze da esplorare</div>
      <div class="section-sub">Le meno coperte dal tuo profilo</div>
      ${gaps.map(g=>`
        <div class="bar-row">
          <div class="bar-name">${g.nome}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${g.val}%;background:${COL[g.id]}"></div></div>
          <div class="bar-val">${g.val}</div>
        </div>`).join('')}
      <p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5">Non è un giudizio: è una mappa. Le micro-sfide qui sotto aiutano a esplorare.</p>
    </div>
    <div class="card">
      <div class="section-title">Micro-sfide</div>
      <div class="section-sub">Piccole azioni che fanno crescere il tuo stile</div>
      ${missions.map(m=>`
        <div style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:10px">
          <div style="font-weight:650;font-size:13px;margin-bottom:4px">${m.t}</div>
          <div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">${m.why}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
            <div style="display:flex;gap:6px">${m.comp.map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+c.color+'1f;color:'+c.color+'">'+c.short+'</span>';}).join('')}</div>
            <button class="btn soft sm" data-action="mission" data-val="${m.t}">Accetta</button>
          </div>
        </div>`).join('')}
    </div>
  </div>`;
}
function renderPortfolio(){
  const total=Object.values(state.prove).reduce((a,b)=>a+b,0);
  return `
  <div class="hero no-print">
    <div>
      <h1>E-Portfolio</h1>
      <p>Bozza del Capolavoro generata automaticamente dalle tue prove. Modificabile, esportabile in PDF, condivisibile con il tutor.</p>
    </div>
    <div class="hero-side">
      <button class="btn" data-action="rigenera">Rigenera bozza</button>
      <button class="btn" data-action="condividi">${icon('share',14)} Condividi con tutor</button>
      <button class="btn primary" data-action="stampa">Scarica PDF ${icon('file',14)}</button>
      <button class="btn" data-action="apriCv">Apri CV Europass</button>
    </div>
  </div>
  <div class="portfolio">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px">
      <div class="avatar" style="width:46px;height:46px;font-size:16px">GF</div>
      <div>
        <h2>Giulia Ferrari</h2>
        <div class="muted">Classe 4B · Liceo Scientifico Scienze Applicate · A.S. 2026/27</div>
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
        ${state.evidences.slice(0,5).map(e=>'<li><strong>'+e.titolo+'</strong> — '+e.descrizione.slice(0,90)+'… <em style="color:#9ca3af">('+ (e.dims||[]).map(id=>DIMS.find(x=>x.id===id).nome).join(', ')+')</em></li>').join('')}
      </ul>
    </section>
    <section>
      <h3>Direzione di orientamento</h3>
      <p>ITS Informatica e Robotica (coerenza 87%). Il profilo è forte su STEM e Digitale; da rafforzare Cittadinanza e Cultura.</p>
    </section>
    <section>
      <h3>Checklist di completezza</h3>
      <ul>
        <li>✅ Profilo competenze (8/8)</li>
        <li>✅ Almeno 10 prove (${total} raccolte)</li>
        <li>✅ Capolavoro selezionato</li>
        <li>⬜ Riflessione personale (da aggiungere)</li>
        <li>${state.shareWithTutor?'✅':'⬜'} Condivisione con il tutor ${state.shareWithTutor?'(inviato)':'(da inviare)'}</li>
      </ul>
      <div style="margin-top:10px;font-size:12px;color:var(--muted)">Completezza stimata: <strong style="color:var(--ink)">78%</strong></div>
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