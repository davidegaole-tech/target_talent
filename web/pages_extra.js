/* ---------- EXTRA PAGES (Talent Radar features) ---------- */
function renderMacroaree(){
  const groups=[
    {nome:'Digitale e tecnologico',color:'#8b5cf6',comp:['digitale','stem'],desc:'Competenze tecniche, programmazione, strumenti digitali.'},
    {nome:'Personale e sociale',color:'#f59e0b',comp:['personale','cittadinanza'],desc:'Essere, relazioni, cittadinanza attiva.'},
    {nome:'Comunicazione e cultura',color:'#ec4899',comp:['alfabetica','multilingue','cultura'],desc:'Lingue, testi, espressione creativa.'},
    {nome:'Iniziativa e progetto',color:'#14b8a6',comp:['imprenditoriale'],desc:'Organizzazione, leadership, gestione.'}
  ];
  const groupOf=id=>groups.find(g=>g.comp.includes(id));
  const avg=g=>Math.round(g.comp.reduce((a,id)=>a+scoreOf(id),0)/g.comp.length);
  const top=[...groups].sort((a,b)=>avg(b)-avg(a));
  // Competenze che compaiono insieme nella stessa prova: i collegamenti tra aree
  const pairs={};
  state.evidences.forEach(e=>{
    const c=[...new Set(e.comp)].sort();
    for(let i=0;i<c.length;i++) for(let j=i+1;j<c.length;j++){
      const k=c[i]+'|'+c[j]; (pairs[k]=pairs[k]||[]).push(e.titolo);
    }
  });
  const links=Object.entries(pairs).sort((a,b)=>b[1].length-a[1].length).slice(0,5);
  const bridge=links.find(([k])=>{const [x,y]=k.split('|');return groupOf(x)!==groupOf(y);});
  const short=id=>EU.find(x=>x.id===id).short;
  const voti=state.materie.map(m=>({m,media:mediaVoti(m.voti),comp:materiaToComp(m.nome)})).filter(v=>v.media!=null);
  return `
  <div class="hero">
    <div>
      <h1>Panoramica</h1>
      <p>Per chi vuole approfondire: le competenze raggruppate in macro-aree, come si collegano tra loro e cosa raccontano anche i tuoi voti.</p>
    </div>
    <div class="hero-side">
      <button class="btn soft" data-action="askSergio" data-q="Guardando le mie prove e i miei voti, quali inclinazioni vedi in me? Come si collegano tra loro le aree in cui vado meglio?">${icon('chat',14)} Chiedi a Sergio una lettura</button>
    </div>
  </div>
  <div class="card" style="margin-bottom:16px">
    <div class="section-title">Le tue inclinazioni</div>
    <div class="section-sub">Una visione d'insieme</div>
    <p style="font-size:13px;line-height:1.6;color:var(--text)">Le tue prove parlano soprattutto di <strong style="color:${top[0].color}">${top[0].nome.toLowerCase()}</strong>, seguito da <strong style="color:${top[1].color}">${top[1].nome.toLowerCase()}</strong>.
    ${bridge?`Le aree non sono separate: in una stessa esperienza ne usi più di una, come <strong>${short(bridge[0].split('|')[0])}</strong> e <strong>${short(bridge[0].split('|')[1])}</strong> in «${bridge[1][0]}».`:''}</p>
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
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Come si collegano</div>
      <div class="section-sub">Competenze che compaiono insieme nelle stesse prove</div>
      ${links.length?links.map(([k,titles])=>{const [x,y]=k.split('|');const gx=groupOf(x),gy=groupOf(y);return `
        <div class="link-row">
          <div><span class="chip" style="background:${COL[x]}1f;color:${COL[x]}">${short(x)}</span> + <span class="chip" style="background:${COL[y]}1f;color:${COL[y]}">${short(y)}</span>
            ${gx!==gy?'<span class="link-bridge">ponte tra due aree</span>':''}</div>
          <div class="link-ev">${titles.length} ${titles.length===1?'prova':'prove'}: ${titles.slice(0,2).join(', ')}${titles.length>2?'…':''}</div>
        </div>`;}).join(''):'<p class="section-sub">Quando una prova tocca più competenze, il collegamento comparirà qui.</p>'}
    </div>
    <div class="card">
      <div class="section-title">Cosa dicono i tuoi voti</div>
      <div class="section-sub">Dalla sezione <a href="#/voti" style="color:var(--accent)">Voti</a>, letti insieme alle prove</div>
      ${voti.length?voti.map(v=>{const c=v.comp&&EU.find(x=>x.id===v.comp);return `
        <div class="bar-row">
          <div class="bar-name" style="color:${v.m.color}">${escHTML(v.m.nome)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${v.media*10}%;background:${v.m.color}"></div></div>
          <div class="bar-val">${v.media}</div>
          <div class="bar-count">${c?c.short:''}</div>
        </div>`;}).join('')+`<p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5">${votiLettura(voti)}</p>`
      :'<p class="section-sub">Aggiungi qualche voto nella sezione Voti per vederli qui accanto alle prove.</p>'}
    </div>
  </div>`;
}
/* Collega una materia alla competenza europea più vicina (per leggere voti e prove insieme). */
function materiaToComp(nome){
  const n=(nome||'').toLowerCase();
  if(/matemat|fisic|scienz|chimic|biolog|informat|tecnolog|elettr|meccan/.test(n)) return 'stem';
  if(/italian|letter|latin|grec/.test(n)) return 'alfabetica';
  if(/ingles|spagnol|frances|tedesc|lingu|cinese|russo/.test(n)) return 'multilingue';
  if(/arte|disegn|music|storia dell.arte/.test(n)) return 'cultura';
  if(/storia|filosof|diritto|educazione civica|religion/.test(n)) return 'cittadinanza';
  if(/motori|sport|educazione fisica/.test(n)) return 'personale';
  if(/econom/.test(n)) return 'imprenditoriale';
  return null;
}
function votiLettura(voti){
  const best=[...voti].sort((a,b)=>b.media-a.media)[0];
  if(!best) return '';
  const c=best.comp&&EU.find(x=>x.id===best.comp);
  if(!c) return `La materia in cui vai meglio è ${escHTML(best.m.nome)}.`;
  const forte=topComp(3).some(t=>t.id===c.id);
  return forte
    ? `${escHTML(best.m.nome)} va bene e ${c.short} emerge anche dalle tue prove: è un'inclinazione che si vede sia a scuola sia fuori.`
    : `${escHTML(best.m.nome)} va bene, ma nelle prove ${c.short} compare ancora poco: forse fai cose in quest'area che non hai ancora raccontato.`;
}
function renderEsposizione(){
  const list=state.evidences.filter(e=>e.ambito==='extra');
  return `
  <div class="hero">
    <div>
      <h1>Esperienze e sport</h1>
      <p>La vetrina di quello che fai <strong>fuori da scuola</strong>: hobby, sport, volontariato, passioni. Il diario raccoglie tutto; qui trovi solo queste esperienze.</p>
    </div>
    <div class="hero-side">
      <button class="btn primary sm" data-action="navigateNuova" data-ambito="extra">+ Aggiungi esperienza</button>
    </div>
  </div>
  <div class="grid g3">
    ${list.length?list.map(e=>renderEvidenceCard(e)).join(''):`<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px;line-height:1.6">Qui compariranno le esperienze fuori da scuola.<br/>Uno sport, uno strumento, il volontariato, un progetto tuo: tutto conta.</div>`}
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-title">Perché raccontarle</div>
    <p style="font-size:13px;color:var(--text);line-height:1.6;margin-top:6px">Anche quello che fai per passione mostra chi sei: la costanza negli allenamenti, il lavoro di squadra, la cura per gli altri. Quando aggiungi una prova, scegli <strong>Fuori da scuola</strong> e la troverai qui.</p>
  </div>`;
}
function renderCv(){
  if(!DOCS.loaded) loadDocs();
  const p=state.profilo;
  const miss=t=>`<span class="cv-missing">${t||'da completare nel profilo'}</span>`;
  const val=v=>v?escHTML(v):miss();
  const lista=v=>(v||'').split(/;|\n/).map(x=>x.trim()).filter(Boolean);
  const nascita=p.nascita?new Date(p.nascita).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}):'';
  const extra=state.evidences.filter(e=>e.ambito==='extra');
  const scuola=state.evidences.filter(e=>e.ambito==='scuola');
  const docs=DOCS.items||[];
  const cert=docs.filter(d=>d.kind!=='corso');
  const corsi=docs.filter(d=>d.kind==='corso');
  const mancano=['email','telefono','presentazione'].filter(k=>!p[k]);
  const sezione=(t,body)=>`<section><h3>${t}</h3>${body}</section>`;
  return `
  <div class="hero no-print">
    <div>
      <h1>Il tuo CV</h1>
      <p>Si compila da solo con i dati del tuo profilo, le esperienze e i documenti che hai caricato. Rileggilo e scaricalo in PDF.</p>
    </div>
    <div class="hero-side">
      <button class="btn" data-action="editProfile">Modifica profilo</button>
      <button class="btn primary" data-action="stampa">Scarica PDF</button>
    </div>
  </div>
  ${mancano.length?`<div class="card no-print cv-hint">Mancano alcuni dati (${mancano.map(k=>({email:'email',telefono:'telefono',presentazione:'presentazione'})[k]).join(', ')}). <button class="btn soft sm" data-action="editProfile">Completa il profilo</button></div>`:''}
  <div class="portfolio cv">
    <h2>${escHTML(nomeCompleto())}</h2>
    <div class="muted">${[p.citta,p.email,p.telefono,nascita?'nata/o il '+nascita:''].filter(Boolean).map(escHTML).join(' · ')||miss('contatti da completare nel profilo')}</div>
    <hr/>
    ${sezione('Presentazione',`<p>${val(p.presentazione)}</p>`)}
    ${sezione('Istruzione e formazione',`<ul>
      <li><strong>${p.anno?'A.S. '+escHTML(p.anno)+' — ':''}${p.classe?'Classe '+escHTML(p.classe)+', ':''}${val(p.scuola)}</strong>${p.citta?' · '+escHTML(p.citta):''}</li>
      ${corsi.map(d=>`<li>${escHTML(d.title)}${d.date?' ('+fmtDate(d.date)+' '+d.date.slice(0,4)+')':''}${d.note?' — '+escHTML(d.note):''}</li>`).join('')}
    </ul>`)}
    ${sezione('Esperienze extrascolastiche e volontariato',extra.length?`<ul>${extra.map(e=>`<li><strong>${e.titolo}</strong> — ${e.descrizione}</li>`).join('')}</ul>`:`<p>${miss('aggiungi una prova "Fuori da scuola"')}</p>`)}
    ${sezione('Progetti scolastici',scuola.length?`<ul>${scuola.slice(0,6).map(e=>`<li><strong>${e.titolo}</strong> — ${e.descrizione}</li>`).join('')}</ul>`:`<p>${miss('nessun progetto ancora')}</p>`)}
    ${sezione('Certificazioni e attestati',DOCS.offline?`<p>${miss('avvia Sergio per includere i documenti')}</p>`:cert.length?`<ul>${cert.map(d=>`<li><strong>${escHTML(d.title)}</strong>${d.date?' — '+d.date.slice(0,4):''}</li>`).join('')}</ul>`:`<p>${miss('carica attestati e certificati in Documenti')}</p>`)}
    ${sezione('Competenze linguistiche',lista(p.lingue).length?`<ul>${lista(p.lingue).map(l=>`<li>${escHTML(l)}</li>`).join('')}</ul>`:`<p>${miss()}</p>`)}
    ${sezione('Competenze digitali',`<p>${val(p.digitali)}</p>`)}
    ${sezione('Competenze trasversali',`<p>Dalle esperienze raccolte emergono soprattutto: ${topComp(3).map(c=>EU.find(x=>x.id===c.id).nome.toLowerCase()).join(', ')}.</p>`)}
    ${sezione('Interessi',`<p>${val(p.interessi)}</p>`)}
    <div class="muted" style="margin-top:12px">CV generato con Talent Passport</div>
  </div>`;
}
function renderRecap(){
  return `
  <div class="hero">
    <div>
      <h1>Il tuo periodo</h1>
      <p>Uno sguardo indietro, senza classifiche.</p>
    </div>
  </div>
  <div class="grid g2">
    <div class="card">
      <div class="section-title">Questo mese</div>
      <div class="section-sub">Quello che hai raccontato</div>
      <ul style="margin:8px 0 0;padding-left:18px;font-size:12.5px;color:var(--text2);line-height:1.6">
        ${state.evidences.slice(0,5).map(e=>'<li>'+e.titolo+'</li>').join('')}
      </ul>
    </div>
    <div class="card">
      <div class="section-title">Il trimestre</div>
      <div class="section-sub">Come si sta muovendo il tuo profilo</div>
      <p style="font-size:13px;color:var(--text);line-height:1.55">Nel trimestre hai raccontato spesso progetti tecnici e digitali. Il tuo modo di "essere" emerge meno: se ti va, una proposta in Orientamento può darti qualche idea.</p>
    </div>
  </div>
  <div class="card" style="margin-top:16px">
    <div class="section-title">Uno spunto per oggi</div>
    <div class="section-sub">Da Sergio</div>
    <p style="font-size:13px;color:var(--text)">${state.dailyTip}</p>
    <button class="btn soft sm" style="margin-top:10px" data-action="mission" data-val="Un'esperienza sportiva o un hobby" data-ambito="extra">Mi interessa</button>
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
function mediaVoti(voti){ if(!voti || !voti.length) return null; const s=voti.reduce((a,b)=>a+b.v,0); return Math.round(s/voti.length*10)/10; }
function votiChartSVG(voti,color,w=260,h=90){
  if(!voti || !voti.length) return '<div style="color:var(--muted);font-size:12px;padding:8px 0">Nessun voto ancora.</div>';
  const sorted=[...voti].sort((a,b)=>a.data.localeCompare(b.data));
  const n=sorted.length;
  const padL=22,padR=8,padT=12,padB=16;
  const iw=w-padL-padR, ih=h-padT-padB;
  const min=4,max=10;
  const x=i=>padL + (n===1? iw/2 : iw*i/(n-1));
  const y=v=>padT + ih*(1-(v-min)/(max-min));
  let grid='';
  [4,6,8,10].forEach(g=>{ const gy=y(g); grid+='<line x1="'+padL+'" y1="'+gy.toFixed(1)+'" x2="'+(w-padR)+'" y2="'+gy.toFixed(1)+'" stroke="var(--track)" stroke-width="1"/>'; grid+='<text x="4" y="'+(gy+3).toFixed(1)+'" font-size="9" fill="var(--label)">'+g+'</text>'; });
  const pts=sorted.map((v,i)=>x(i).toFixed(1)+','+y(v.v).toFixed(1));
  const poly='<polyline points="'+pts.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  let dots='',labels='';
  sorted.forEach((v,i)=>{ const px=x(i).toFixed(1), py=y(v.v).toFixed(1); dots+='<circle cx="'+px+'" cy="'+py+'" r="3.5" fill="'+color+'" stroke="var(--surface)" stroke-width="1.5"/>'; labels+='<text x="'+px+'" y="'+(y(v.v)-7).toFixed(1)+'" text-anchor="middle" font-size="10" font-weight="700" fill="'+color+'">'+v.v+'</text>'; });
  return '<svg width="100%" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="xMidYMid meet">'+grid+poly+dots+labels+'</svg>';
}
function renderVoti(){
  return `
  <div class="hero">
    <div>
      <h1>I tuoi voti</h1>
      <p>Inserisci a mano i voti delle tue materie e segui l'andamento nel tempo.</p>
    </div>
    <div class="hero-side">
      <button class="btn primary" data-action="addMateria">+ Aggiungi materia</button>
    </div>
  </div>
  <div class="grid g2" id="votiGrid">
    ${state.materie.map(m=>{
      const media=mediaVoti(m.voti);
      const sorted=[...m.voti].sort((a,b)=>b.data.localeCompare(a.data));
      return `
      <div class="card" data-materia="${m.id}">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:10px;height:10px;border-radius:3px;background:${m.color}"></span>
            <span class="section-title" style="margin:0">${m.nome}</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="chip">media ${media!=null?media:'—'}</span>
            <button class="btn sm" data-action="removeMateria" data-val="${m.id}" title="Rimuovi materia">✕</button>
          </div>
        </div>
        <div style="margin-bottom:10px">${votiChartSVG(m.voti,m.color)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${sorted.map(v=>'<span class="chip" style="background:'+m.color+'1f;color:'+m.color+'">'+v.v+' <small style="opacity:.75">('+v.tipo+')</small></span>').join('') || '<span class="section-sub" style="margin:0">Nessun voto.</span>'}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <input type="number" min="1" max="10" step="0.25" class="vin" placeholder="Voto" style="width:64px;border:1px solid var(--line);border-radius:9px;padding:7px 9px;background:var(--surface);color:var(--ink)"/>
          <select class="vtipo" style="border:1px solid var(--line);border-radius:9px;padding:7px 9px;background:var(--surface);color:var(--ink)">
            <option value="scritto">scritto</option><option value="orale">orale</option><option value="pratico">pratico</option>
          </select>
          <input type="date" class="vdata" value="2026-11-10" style="border:1px solid var(--line);border-radius:9px;padding:6px 9px;background:var(--surface);color:var(--ink)"/>
          <button class="btn primary sm" data-action="addVoto" data-val="${m.id}">Aggiungi</button>
        </div>
      </div>`;
    }).join('')}
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
    <label>Dimensione testo</label>
    <div class="seg">
      <button class="segbtn ${state.textSize==='normale'?'on':''}" data-action="setTextSize" data-val="normale">Normale</button>
      <button class="segbtn ${state.textSize==='grande'?'on':''}" data-action="setTextSize" data-val="grande">Grande</button>
    </div>
  </div>
  <div class="form-row">
    <label>Animazioni</label>
    <div class="seg">
      <button class="segbtn ${!state.reduceMotion?'on':''}" data-action="setReduceMotion" data-val="off">Attive</button>
      <button class="segbtn ${state.reduceMotion?'on':''}" data-action="setReduceMotion" data-val="on">Ridotte</button>
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