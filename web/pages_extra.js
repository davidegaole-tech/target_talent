/* ---------- EXTRA PAGES (Talent Radar features) ---------- */
/* Proposte fisse per migliorare ogni competenza (in futuro le sceglierà Sergio in base al profilo) */
const MIGLIORA={
  alfabetica:{testo:'Leggi un libro che ti incuriosisce e scrivine una breve recensione, o proponi un articolo al giornalino della scuola.',link:'https://www.liberliber.it',nome:'Liber Liber · libri gratuiti in italiano'},
  multilingue:{testo:'Allenati con contenuti brevi ogni giorno e cerca occasioni reali: uno scambio, un gemellaggio, un podcast in lingua.',link:'https://www.bbc.co.uk/learningenglish',nome:'BBC Learning English'},
  stem:{testo:'Video e esercizi gratuiti di matematica e scienze, con il tuo ritmo.',link:'https://it.khanacademy.org',nome:'Khan Academy in italiano'},
  digitale:{testo:'Corsi gratuiti di programmazione e pensiero computazionale per studenti.',link:'https://programmailfuturo.it',nome:'Programma il Futuro'},
  personale:{testo:'Prova un\'attività di gruppo nuova (sport di squadra, coro, teatro) e annota cosa impari su di te. Puoi chiedere a Sergio un piano per organizzare meglio lo studio.',link:'',nome:''},
  cittadinanza:{testo:'Il volontariato è il modo più diretto: i Centri di Servizio per il Volontariato ti indicano le associazioni vicino a te.',link:'https://www.csvnet.it',nome:'CSVnet · volontariato in Italia'},
  imprenditoriale:{testo:'Partecipa a un progetto in cui si crea una mini-impresa con la classe, oppure organizza un evento o una raccolta fondi.',link:'https://www.jaitalia.org',nome:'Junior Achievement Italia'},
  cultura:{testo:'Visita un museo o una mostra (la prima domenica del mese molti sono gratuiti) e racconta cosa ti ha colpito.',link:'https://cultura.gov.it/domenicalmuseo',nome:'Domenica al museo'}
};
function renderMigliora(id){
  const c=EU.find(x=>x.id===id), m=MIGLIORA[id]; if(!c||!m) return '';
  return `
    <button class="modal-close" data-action="closeModal">✕</button>
    <div style="font-size:11px;font-weight:700;color:${c.color};text-transform:uppercase;letter-spacing:.08em">Migliora</div>
    <div style="font-weight:700;font-size:17px;margin:4px 0 10px">${c.nome}</div>
    <p style="font-size:13.5px;line-height:1.6;color:var(--text)">${m.testo}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
      ${m.link?`<a class="btn primary sm" href="${m.link}" target="_blank" rel="noopener noreferrer">${m.nome} ↗</a>`:''}
      <button class="btn soft sm" data-action="askSergio" data-q="Vorrei migliorare la competenza «${c.nome}». Guardando il mio profilo, cosa mi consigli di fare in concreto nelle prossime settimane?">${icon('chat',14)} Chiedi a Sergio</button>
      <button class="btn sm" data-action="planFromMigliora" data-val="${id}">Aggiungi al Planner</button>
    </div>
    <p style="font-size:11px;color:var(--label);margin-top:14px">Il link apre un sito esterno.</p>`;
}
function renderCompetenze(){
  const vals=EU.map(c=>scoreOf(c.id));
  const groups=[['digitale','stem'],['personale','cittadinanza'],['alfabetica','multilingue','cultura'],['imprenditoriale']];
  const groupOf=id=>groups.findIndex(g=>g.includes(id));
  const pairs={};
  state.evidences.forEach(e=>{
    const c=[...new Set(e.comp)].sort();
    for(let i=0;i<c.length;i++) for(let j=i+1;j<c.length;j++){ const k=c[i]+'|'+c[j]; (pairs[k]=pairs[k]||[]).push(e.titolo); }
  });
  const links=Object.entries(pairs).sort((a,b)=>b[1].length-a[1].length).slice(0,4);
  const short=id=>EU.find(x=>x.id===id).short;
  const voti=haVoti()?state.materie.map(m=>({m,media:mediaVoti(m.voti),comp:materiaToComp(m.nome)})).filter(v=>v.media!=null):[];
  return `
  <div class="hero">
    <div>
      <h1>Le tue competenze chiave</h1>
      <p>Le 8 competenze europee, calcolate da esperienze e certificazioni. Dove sei sotto il 60% trovi un'idea per migliorare.</p>
    </div>
    <div class="hero-side">
      <a class="btn soft" href="#/orientamento">${icon('compass',14)} Orientamento</a>
    </div>
  </div>
  <div class="grid g2">
    <div class="card">
      <div class="section-title">Il tuo radar</div>
      <div class="section-sub">Le 8 competenze a colpo d'occhio</div>
      <div id="radarWrap">${radarSVG(vals)}</div>
    </div>
    <div class="card">
      <div class="section-title">Livello per competenza</div>
      <div class="section-sub">Cresce con ogni esperienza collegata</div>
      ${EU.map(c=>{const v=scoreOf(c.id);return `
        <div class="comp-row">
          <div class="comp-name" style="color:${c.color}">${c.nome}</div>
          <div class="comp-bar"><div class="bar-track"><div class="bar-fill" style="width:${v}%;background:${c.color}"></div></div><span class="bar-val">${v}%</span></div>
          ${v<60?`<button class="btn soft sm comp-up" data-action="migliora" data-val="${c.id}">Migliora</button>`:'<span class="comp-up"></span>'}
        </div>`;}).join('')}
    </div>
  </div>
  <div class="grid g2" style="margin-top:16px">
    <div class="card">
      <div class="section-title">Come si collegano</div>
      <div class="section-sub">Competenze che usi insieme nelle stesse esperienze</div>
      ${links.length?links.map(([k,titles])=>{const [x,y]=k.split('|');return `
        <div class="link-row">
          <div><span class="chip" style="background:${COL[x]}1f;color:${COL[x]}">${short(x)}</span> + <span class="chip" style="background:${COL[y]}1f;color:${COL[y]}">${short(y)}</span>
            ${groupOf(x)!==groupOf(y)?'<span class="link-bridge">ponte tra due aree</span>':''}</div>
          <div class="link-ev">${titles.length} ${titles.length===1?'esperienza':'esperienze'}: ${titles.slice(0,2).join(', ')}${titles.length>2?'…':''}</div>
        </div>`;}).join(''):'<p class="section-sub">Quando un\'esperienza tocca più competenze, il collegamento comparirà qui.</p>'}
    </div>
    ${haVoti()?`<div class="card">
      <div class="section-title">Cosa dicono i tuoi voti</div>
      <div class="section-sub">Ogni materia accanto alla sua competenza</div>
      ${voti.length?voti.map(v=>{const c=v.comp&&EU.find(x=>x.id===v.comp);return `
        <div class="bar-row">
          <div class="bar-name" style="color:${v.m.color}">${escHTML(v.m.nome)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${v.media*10}%;background:${v.m.color}"></div></div>
          <div class="bar-val">${v.media}</div>
          <div class="bar-count">${c?c.short:''}</div>
        </div>`;}).join('')+`<p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5">${votiLettura(voti)}</p>`
      :'<p class="section-sub">Aggiungi qualche voto nella sezione <a href="#/voti" style="color:var(--accent)">Voti</a> per vederli qui.</p>'}
    </div>`:''}
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
    <div class="muted" style="margin-top:12px">CV generato con Talent Radar</div>
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
  <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Le modifiche si applicano subito.</div>
  <div class="form-row">
    <label>Sei…</label>
    <div class="seg">
      <button class="segbtn ${state.ruolo==='studente'?'on':''}" data-action="setRuolo" data-val="studente">Studente</button>
      <button class="segbtn ${state.ruolo==='lavoratore'?'on':''}" data-action="setRuolo" data-val="lavoratore">Lavoratore</button>
      <button class="segbtn ${state.ruolo==='studente-lavoratore'?'on':''}" data-action="setRuolo" data-val="studente-lavoratore">Studente lavoratore</button>
    </div>
  </div>
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
    <label>Umore di Sergio</label>
    <div class="seg">
      <button class="segbtn ${state.mascotMood==='felice'?'on':''}" data-action="setMood" data-val="felice">Felice</button>
      <button class="segbtn ${state.mascotMood==='curioso'?'on':''}" data-action="setMood" data-val="curioso">Curioso</button>
    </div>
  </div>
  <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
    <button class="btn primary sm" data-action="closeModal">Fatto</button>
  </div>
  `;
}