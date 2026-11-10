/* ---------- EXTRA PAGES (Talent Radar features) ---------- */
function renderMacroaree(){
  const groups=[
    {nome:'Digitale e tecnologico',color:'#8b5cf6',comp:['digitale','stem'],desc:'Competenze tecniche, programmazione, strumenti digitali.'},
    {nome:'Personale e sociale',color:'#f59e0b',comp:['personale','cittadinanza'],desc:'Essere, relazioni, cittadinanza attiva.'},
    {nome:'Comunicazione e cultura',color:'#ec4899',comp:['alfabetica','multilingue','cultura'],desc:'Lingue, testi, espressione creativa.'},
    {nome:'Iniziativa e progetto',color:'#14b8a6',comp:['imprenditoriale'],desc:'Organizzazione, leadership, gestione.'}
  ];
  return `
  <div class="hero">
    <div>
      <h1>Panoramica macro-aree</h1>
      <p>Le tue competenze raggruppate in macro-aree per una lettura d'insieme.</p>
    </div>
    <div class="hero-side">
      <div class="stats">
        <div class="stat-box"><div class="stat-num">${state.streak}</div><div class="stat-lbl">streak giorni</div></div>
      </div>
    </div>
  </div>
  <div class="grid g2">
    ${groups.map(g=>`
      <div class="card">
        <div class="section-title" style="color:${g.color}">${g.nome}</div>
        <div class="section-sub">${g.desc}</div>
        ${g.comp.map(id=>{const c=EU.find(x=>x.id===id);const v=scoreOf(id);return `
          <div class="bar-row">
            <div class="bar-name" style="color:${c.color}">${c.nome}</div>
            <div class="bar-track"><div class="bar-fill" style="width:${v}%;background:${c.color}"></div></div>
            <div class="bar-val">${v}</div>
          </div>`;}).join('')}
      </div>`).join('')}
  </div>`;
}
function renderEsposizione(){
  const items=state.evidences.map(e=>({title:e.titolo,desc:e.descrizione,cat:e.tipo,comp:e.comp}));
  return `
  <div class="hero">
    <div>
      <h1>Area esposizione</h1>
      <p>Vetrina delle tue esperienze e sport: mostra ciò che sai fare.</p>
    </div>
  </div>
  <div class="grid g3">
    ${items.map(it=>`
      <div class="card">
        <div style="font-weight:700;font-size:13.5px;margin-bottom:6px">${it.title}</div>
        <p style="font-size:12.5px;color:var(--text2);line-height:1.55;margin-bottom:8px">${it.desc}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${(it.comp||[]).map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+c.color+'1f;color:'+c.color+'">'+c.short+'</span>';}).join('')}</div>
      </div>`).join('')}
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-title">Sport e hobby</div>
    <div class="section-sub">Le tue esperienze sportive diventano prove</div>
    <p style="font-size:13px;color:var(--text)">Ogni attività sportiva o hobby può essere documentata come prova e collegata alle competenze (teamwork, costanza, leadership).</p>
    <button class="btn primary sm" data-action="mission" data-val="documenta un'esperienza sportiva">Aggiungi esperienza sportiva</button>
  </div>`;
}
function renderCv(){
  const total=Object.values(state.prove).reduce((a,b)=>a+b,0);
  return `
  <div class="hero">
    <div>
      <h1>CV formato Europass</h1>
      <p>Genera il tuo CV in formato europeo dalle prove raccolte.</p>
    </div>
    <div class="hero-side">
      <button class="btn primary" data-action="stampa">Scarica PDF</button>
    </div>
  </div>
  <div class="portfolio">
    <h2>Curriculum Vitae (Europass)</h2>
    <div class="muted">Giulia Ferrari · 4B Liceo Scienze Applicate</div>
    <hr/>
    <section>
      <h3>Competenze chiave</h3>
      <ul>${EU.map(c=>'<li>'+c.nome+': '+scoreOf(c.id)+'/100</li>').join('')}</ul>
    </section>
    <section>
      <h3>Esperienze e prove</h3>
      <ul>${state.evidences.map(e=>'<li><strong>'+e.titolo+'</strong> — '+e.descrizione.slice(0,80)+'…</li>').join('')}</ul>
    </section>
    <section>
      <h3>Dimensioni (Essere, Fare, Lavorare)</h3>
      <ul>${DIMS.map(d=>'<li>'+d.nome+': '+dimScore(d.id)+'</li>').join('')}</ul>
    </section>
    <div class="muted" style="margin-top:12px">Bozza generata automaticamente · Talent Passport</div>
  </div>`;
}
function renderRecap(){
  const months=['Set','Ott','Nov'];
  return `
  <div class="hero">
    <div>
      <h1>Recap mensile / trimestrale</h1>
      <p>Sintesi del tuo progresso nel tempo.</p>
    </div>
  </div>
  <div class="grid g2">
    <div class="card">
      <div class="section-title">Questo mese</div>
      <div class="section-sub">Attività e crescita</div>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--text2);line-height:1.6">
        <li>Prove aggiunte: ${state.evidences.length}</li>
        <li>Competenze coperte: ${EU.filter(c=>state.prove[c.id]>0).length}/8</li>
        <li>Streak: ${state.streak} giorni consecutivi</li>
        <li>Dimensione più cresciuta: ${topDim(1)[0].nome}</li>
      </ul>
    </div>
    <div class="card">
      <div class="section-title">Trimestre</div>
      <div class="section-sub">Trend delle competenze</div>
      <p style="font-size:13px;color:var(--text);line-height:1.55">Nel trimestre le competenze tecniche (STEM, Digitale) sono cresciute costantemente. La dimensione "Essere" è la meno esplorata: una micro-sfida può aiutare a bilanciare.</p>
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-title">Guida giornaliera</div>
    <div class="section-sub">Un suggerimento al giorno dal tuo amico AI</div>
    <p style="font-size:13px;color:var(--text)">${state.dailyTip}</p>
    <button class="btn soft sm" style="margin-top:10px" data-action="mission" data-val="segui la guida giornaliera">Segui il consiglio</button>
  </div>`;
}
function renderSocial(){
  const tab=state.socialTab||'search';
  const tabs=[['search','Cerca utenti'],['requests','Richieste'],['messages','Messaggi']];
  const incoming=state.directory.filter(u=>u.relation==='incoming');
  const outgoing=state.directory.filter(u=>u.relation==='outgoing');
  const friends=state.directory.filter(u=>u.relation==='friend');
  let body='';
  if(tab==='search'){
    body=`
      <div class="form-row"><input id="socialSearch" placeholder="Cerca per nome, ruolo o scuola..." style="border:1px solid var(--line);border-radius:10px;padding:10px 12px"/></div>
      <div id="dirList">
        ${state.directory.map(u=>userRow(u)).join('')}
      </div>`;
  } else if(tab==='requests'){
    body=`
      <div class="section-title">In arrivo</div>
      <div class="section-sub">${incoming.length} richieste in attesa</div>
      ${incoming.length?incoming.map(u=>`
        <div class="trow" style="margin-bottom:10px">
          <div class="av" style="background:${u.color}">${u.name[0]}</div>
          <div class="info"><div class="name">${u.name}</div><div class="meta">${u.role}</div></div>
          <button class="btn primary sm" data-action="acceptRequest" data-val="${u.id}">Accetta</button>
          <button class="btn sm" data-action="declineRequest" data-val="${u.id}">Rifiuta</button>
        </div>`).join(''):'<p class="section-sub">Nessuna richiesta in arrivo.</p>'}
      <div class="section-title" style="margin-top:16px">Inviate</div>
      <div class="section-sub">${outgoing.length} richieste in sospeso</div>
      ${outgoing.length?outgoing.map(u=>`
        <div class="trow" style="margin-bottom:10px">
          <div class="av" style="background:${u.color}">${u.name[0]}</div>
          <div class="info"><div class="name">${u.name}</div><div class="meta">${u.role}</div></div>
          <span class="chip">In attesa</span>
        </div>`).join(''):'<p class="section-sub">Nessuna richiesta inviata.</p>'}`;
  } else {
    body=`
      <div style="display:flex;gap:14px;flex-wrap:wrap">
        <div style="flex:0 0 220px;min-width:180px">
          <div class="section-sub">Conversazioni</div>
          ${friends.length?friends.map(u=>`
            <div class="trow" data-action="openChat" data-val="${u.id}" style="cursor:pointer;${state.activeChat===u.id?'border-color:var(--accent);background:var(--accent-soft)':''}">
              <div class="av" style="background:${u.color}">${u.name[0]}</div>
              <div class="info"><div class="name">${u.name}</div><div class="meta">${((state.chats[u.id]||[]).slice(-1)[0]||{}).text?.slice(0,28)||'Nessun messaggio'}</div></div>
            </div>`).join(''):'<p class="section-sub">Aggiungi amici per iniziare a chattare.</p>'}
        </div>
        <div style="flex:1;min-width:260px">${renderThread(state.activeChat)}</div>
      </div>`;
  }
  return `
  <div class="hero">
    <div>
      <h1>Amici</h1>
      <p>Trova altri utenti, accetta le richieste e chatta con chi condivide il tuo percorso.</p>
    </div>
  </div>
  <div class="seg" style="margin-bottom:16px">
    ${tabs.map(([id,l])=>`<button class="segbtn ${tab===id?'on':''}" data-action="socialTab" data-val="${id}">${l}${id==='requests'&&incoming.length?' ('+incoming.length+')':''}</button>`).join('')}
  </div>
  <div class="card">${body}</div>`;
}
function userRow(u){
  let action='';
  if(u.relation==='none') action='<button class="btn primary sm" data-action="sendRequest" data-val="'+u.id+'">Aggiungi</button>';
  else if(u.relation==='outgoing') action='<span class="chip">Inviata</span>';
  else if(u.relation==='incoming') action='<button class="btn primary sm" data-action="acceptRequest" data-val="'+u.id+'">Accetta</button>';
  else action='<span class="chip">Amico</span>';
  return '<div class="trow" style="margin-bottom:8px" data-name="'+(u.name+' '+u.role).toLowerCase()+'">'
    +'<div class="av" style="background:'+u.color+'">'+u.name[0]+'</div>'
    +'<div class="info"><div class="name">'+u.name+'</div><div class="meta">'+u.role+'</div></div>'
    +action+'</div>';
}
function renderThread(userId){
  if(!userId){
    return '<div style="color:var(--muted);font-size:13px;padding:20px;text-align:center">Seleziona una conversazione per iniziare.</div>';
  }
  const u=state.directory.find(x=>x.id===userId);
  const msgs=state.chats[userId]||[];
  return `
    <div class="section-title" style="display:flex;align-items:center;gap:8px"><div class="av" style="width:28px;height:28px;font-size:11px;background:${u.color}">${u.name[0]}</div> ${u.name}</div>
    <div id="threadLog" style="max-height:320px;overflow:auto;padding:6px 2px">
      ${msgs.map(m=>'<div style="margin:6px 0;display:flex;'+(m.from==='me'?'justify-content:flex-end':'')+'"><div style="max-width:75%;padding:8px 12px;border-radius:14px;background:'+(m.from==='me'?'var(--accent)':'var(--soft)')+';color:'+(m.from==='me'?'#fff':'var(--text)')+';font-size:13px;line-height:1.5">'+m.text+'<div style="font-size:10px;opacity:.7;margin-top:3px">'+m.time+'</div></div></div>').join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:8px">
      <input id="msgInput" placeholder="Scrivi un messaggio..." style="flex:1;border:1px solid var(--line);border-radius:10px;padding:9px 12px"/>
      <button class="btn primary" data-action="sendMessage" data-val="${userId}">Invia</button>
    </div>`;
}
function renderSettings(){
  return `
  <div style="font-weight:700;font-size:16px;margin-bottom:4px">Impostazioni</div>
  <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Personalizza l'interfaccia del Passaporto.</div>
  <div class="form-row">
    <label>Tema</label>
    <div class="seg">
      <button class="segbtn ${state.theme==='light'?'on':''}" data-action="setTheme" data-val="light">Chiaro</button>
      <button class="segbtn ${state.theme==='dark'?'on':''}" data-action="setTheme" data-val="dark">Scuro</button>
    </div>
  </div>
  <div class="form-row">
    <label>Umore mascotte</label>
    <div class="seg">
      <button class="segbtn ${state.mascotMood==='felice'?'on':''}" data-action="setMood" data-val="felice">Felice</button>
      <button class="segbtn ${state.mascotMood==='curioso'?'on':''}" data-action="setMood" data-val="curioso">Curioso</button>
    </div>
  </div>
  <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
    <button class="btn soft sm" data-action="closeModal">Chiudi</button>
    <button class="btn primary sm" data-action="closeModal">Salva</button>
  </div>
  `;
}