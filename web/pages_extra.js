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
    <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
    <div style="font-size:11px;font-weight:700;color:var(--text2);text-transform:uppercase;letter-spacing:.08em">Migliora</div>
    <div style="font-weight:700;font-size:17px;margin:4px 0 10px">${c.nome}</div>
    <p style="font-size:13.5px;line-height:1.6;color:var(--text)">${m.testo}</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px">
      ${m.link?`<a class="btn primary sm" href="${safeHref(m.link)}" target="_blank" rel="noopener noreferrer">${escHTML(m.nome)}</a>`:''}
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
      <a class="btn soft" href="#/planner">${icon('calendar',14)} Planner</a>
    </div>
  </div>
  ${!state.evidences.length?`<div class="card empty-state">
    <div class="empty-ico">${icon('compass',26)}</div>
    <div>
      <div class="section-title">Il radar è vuoto</div>
      <div class="section-sub">Aggiungi una prova: il radar si popola con le competenze che quella prova dimostra.</div>
      <button class="btn primary sm" data-action="goNuova">+ Aggiungi la prima prova</button>
    </div>
  </div>`:''}
  ${state.evidences.length?`<div class="grid g2">
    <div class="card">
      <div class="section-title">Il tuo radar</div>
      <div class="section-sub">Le 8 competenze a colpo d'occhio</div>
      <div id="radarWrap">${radarSVG(vals)}</div>
    </div>
    <div class="card">
      <div class="section-title">Livello per competenza</div>
      <div class="section-sub">Cresce con ogni esperienza collegata · è un livello di evidenza, non un voto</div>
      ${EU.map(c=>{const v=scoreOf(c.id);return `
        <div class="comp-row">
          <div class="comp-name">${c.nome}</div>
          <div class="comp-bar"><div class="bar-track"><div class="bar-fill" style="width:${v}%;background:${c.color}"></div></div><span class="bar-val">${v}%</span></div>
          ${v<60?`<button class="btn soft sm comp-up" data-action="migliora" data-val="${c.id}">Migliora</button>`:'<span class="comp-up"></span>'}
        </div>`;}).join('')}
    </div>
  </div>`:''}
  ${(links.length||haVoti())?`<div class="grid ${links.length&&haVoti()?'g2':''}" style="margin-top:16px">
    ${links.length?`<div class="card">
      <div class="section-title">Come si collegano</div>
      <div class="section-sub">Competenze che usi insieme nelle stesse esperienze</div>
      ${links.map(([k,titles])=>{const [x,y]=k.split('|');return `
        <div class="link-row">
          <div><span class="chip" style="background:${tint(COL[x])};color:var(--text2)">${short(x)}</span> + <span class="chip" style="background:${tint(COL[y])};color:var(--text2)">${short(y)}</span>
            ${groupOf(x)!==groupOf(y)?'<span class="link-bridge">ponte tra due aree</span>':''}</div>
          <div class="link-ev">${titles.length} ${titles.length===1?'esperienza':'esperienze'}: ${titles.slice(0,2).join(', ')}${titles.length>2?'…':''}</div>
        </div>`;}).join('')}
    </div>`:''}
    ${haVoti()?`<div class="card">
      <div class="section-title">Cosa dicono i tuoi voti</div>
      <div class="section-sub">Ogni materia accanto alla sua competenza</div>
      ${voti.length?voti.map(v=>{const c=v.comp&&EU.find(x=>x.id===v.comp);return `
        <div class="bar-row">
          <div class="bar-name" style="color:var(--text2)">${escHTML(v.m.nome)}</div>
          <div class="bar-track"><div class="bar-fill" style="width:${v.media*10}%;background:${v.m.color}"></div></div>
          <div class="bar-val">${v.media}</div>
          <div class="bar-count">${c?c.short:''}</div>
        </div>`;}).join('')+`<p style="font-size:12px;color:var(--muted);margin-top:10px;line-height:1.5">${votiLettura(voti)}</p>`
      :'<p class="section-sub">Aggiungi qualche voto nella sezione <a href="#/appunti" style="color:var(--accent)">Appunti e voti</a> per vederli qui.</p>'}
    </div>`:''}
  </div>`:''}`;
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
/* ---------- CV: formato europeo, come il modello Word allegato ---------- */
function lingueProfilo(){
  return (state.profilo.lingue||'').split(/[;\n]/).map(x=>x.trim()).filter(Boolean).map(s=>{
    const m=s.match(/^([^(]+?)\s*\(([^)]+)\)/);
    return m?{nome:m[1].trim(),livello:m[2].trim()}:{nome:s,livello:''};
  });
}
function livelloQCEF(liv){
  const v=(liv||'').toUpperCase();
  if(/A1|A2|ELEMENTARE/.test(v)) return 'elementare';
  if(/B1|B2|BUONO/.test(v)) return 'buono';
  if(/C1|C2|ECCELLENTE|MADRELINGUA/.test(v)) return 'eccellente';
  return liv||'';
}
function cvCompTesto(ids,descrizione){
  const list=Array.isArray(ids)?ids:[ids];
  const prove=state.evidences.filter(e=>list.some(id=>(e.comp||[]).includes(id)));
  if(!prove.length) return '';
  const titoli=[...new Set(prove.map(e=>e.titolo))].slice(0,3);
  return descrizione+(titoli.length?' Esperienze: '+titoli.join('; ')+'.':'');
}
/* Un solo modello di CV: la pagina HTML e il PDF partono da qui. */
function cvModel(){
  const p=state.profilo;
  const docs=DOCS.items||[];
  const corsi=docs.filter(d=>d.kind==='corso');
  const cert=docs.filter(d=>d.kind!=='corso'&&d.kind!=='appunti');
  const scelte=portfolioScelte();
  const extra=scelte.filter(e=>e.ambito==='extra');
  const lingue=lingueProfilo();
  const madre=lingue.find(l=>/madrelingua/i.test(l.livello))||lingue[0]||{nome:'Italiano',livello:'madrelingua'};
  const altre=lingue.filter(l=>l!==madre);
  const nascita=p.nascita?new Date(p.nascita).toLocaleDateString('it-IT',{day:'numeric',month:'long',year:'numeric'}):'';
  const materie=(state.materie||[]).map(m=>m.nome).join(', ');
  const v=x=>{const s=(x==null?'':String(x)).trim();return s||'—';};

  const personale=[
    {label:'Nome',value:v([p.cognome,p.nome].filter(Boolean).join(', '))},
    {label:'Indirizzo',value:v(p.citta)},
    {label:'Telefono',value:v(p.telefono)},
    {label:'Fax',value:'—'},
    {label:'E-mail',value:v(p.email)},
    {label:'Nazionalità',value:v(p.nazionalita)},
    {label:'Data di nascita',value:v(nascita)}
  ];

  const esperienza=[];
  if(extra.length){
    extra.forEach(e=>{
      esperienza.push({label:'• Date (da – a)',value:v(e.data?fmtDate(e.data)+' '+e.data.slice(0,4):'')});
      esperienza.push({label:'• Nome e indirizzo del datore di lavoro',value:v(e.titolo)});
      esperienza.push({label:'• Tipo di azienda o settore',value:'Attività extrascolastica / volontariato'});
      esperienza.push({label:'• Tipo di impiego',value:'Progetto personale'});
      esperienza.push({label:'• Principali mansioni e responsabilità',value:v(e.descrizione)});
    });
  }else{
    esperienza.push({label:'• Date (da – a)',value:'—'});
    esperienza.push({label:'• Nome e indirizzo del datore di lavoro',value:'Nessuna esperienza lavorativa registrata'});
  }

  const istruzione=[
    {label:'• Date (da – a)',value:v(p.anno)},
    {label:'• Nome e tipo di istituto di istruzione o formazione',value:v(p.scuola)},
    {label:'• Principali materie / abilità professionali oggetto dello studio',value:v(materie)},
    {label:'• Qualifica conseguita',value:v([p.classe?'Classe '+p.classe:'',p.anno?'A.S. '+p.anno:''].filter(Boolean).join(' · '))},
    {label:'• Livello nella classificazione nazionale (se pertinente)',value:'—'}
  ];
  corsi.forEach(d=>{
    istruzione.push({label:'• Date (da – a)',value:v(d.date?fmtDate(d.date)+' '+d.date.slice(0,4):'')});
    istruzione.push({label:'• Nome e tipo di istituto di istruzione o formazione',value:v(d.title)});
    istruzione.push({label:'• Principali materie / abilità professionali oggetto dello studio',value:v(d.note)});
    istruzione.push({label:'• Qualifica conseguita',value:'Corso frequentato'});
  });

  const competenze=[
    {label:'Madrelingua',value:v(madre.nome+' ('+(madre.livello||'madrelingua')+')')}
  ];
  if(altre.length){
    altre.slice(0,3).forEach(l=>{
      competenze.push({label:'Altre lingua',value:v(l.nome+(l.livello?' — '+l.livello:''))});
      competenze.push({label:'• Capacità di lettura',value:v(livelloQCEF(l.livello))});
      competenze.push({label:'• Capacità di scrittura',value:v(livelloQCEF(l.livello))});
      competenze.push({label:'• Capacità di espressione orale',value:v(livelloQCEF(l.livello))});
    });
  }else{
    competenze.push({label:'Altre lingua',value:'—'});
  }
  competenze.push({label:'Capacità e competenze relazionali',value:v(cvCompTesto(['personale','cittadinanza'],'Capacità relazionali, costanza e impegno civico.'))});
  competenze.push({label:'Capacità e competenze organizzative',value:v(cvCompTesto('imprenditoriale','Iniziativa, coordinamento di gruppi e gestione di progetti.'))});
  competenze.push({label:'Capacità e competenze tecniche',value:v([p.digitali?p.digitali+'.':'',cvCompTesto(['digitale','stem'],'Uso consapevole di strumenti digitali e metodo scientifico.')].filter(Boolean).join(' '))});
  competenze.push({label:'Capacità e competenze artistiche',value:v(cvCompTesto('cultura','Espressione creativa e sensibilità culturale.'))});
  competenze.push({label:'Altre capacità e competenze',value:v([p.interessi||'',p.sport||''].filter(Boolean).join(' · '))});
  competenze.push({label:'Patente o patenti',value:'—'});

  return {
    title:'Formato europeo per il curriculum vitae',
    sections:[
      {title:'Informazioni personali',rows:personale},
      {title:'Esperienza lavorativa',rows:esperienza},
      {title:'Istruzione e formazione',rows:istruzione},
      {title:'Capacità e competenze personali',
       note:'Acquisite nel corso della vita e della carriera ma non necessariamente riconosciute da certificati o diplomi ufficiali.',
       rows:competenze},
      {title:'Ulteriori informazioni',
       rows:[{label:'Note',value:v([p.presentazione,state.evidences.length?state.evidences.length+' attività documentate su Talent Radar':''].filter(Boolean).join(' '))}]},
      {title:'Allegati',
       rows:[{label:'Certificazioni e attestati',value:v(cert.map(d=>d.title+(d.date?' ('+d.date.slice(0,4)+')':'')).join('; '))}]}
    ]
  };
}

function renderCv(){
  if(!DOCS.loaded) loadDocs();
  const model=cvModel();
  const mancano=['email','telefono','presentazione'].filter(k=>!state.profilo[k]);
  return `
  <div class="hero no-print">
    <div>
      <h1>Il tuo CV</h1>
      <p>Compilato con il profilo, le attività scelte per il portfolio e i documenti caricati. Formato europeo, pronto da scaricare.</p>
    </div>
    <div class="hero-side">
      <button class="btn" data-action="apriPortfolio">${icon('arrow',14)} Torna al portfolio</button>
      <button class="btn" data-action="pickPortfolio">${icon('check',14)} Scegli le attività</button>
      <button class="btn" data-action="editProfile">Modifica profilo</button>
      <button class="btn" data-action="scaricaCv">${icon('file',14)} Scarica CV in PDF</button>
    </div>
  </div>
  ${mancano.length?`<div class="card no-print cv-hint">Mancano alcuni dati (${mancano.map(k=>({email:'email',telefono:'telefono',presentazione:'presentazione'})[k]).join(', ')}). <button class="btn soft sm" data-action="editProfile">Completa il profilo</button></div>`:''}

  <div class="cv-sheet">
    <div class="cv-top">
      <div class="cv-top-t">${escHTML(model.title)}</div>
      <img class="cv-flag" src="img/cv-eu-flag.png" alt="Unione europea" width="60" height="42"/>
    </div>
    ${model.sections.map(s=>`
      <h2 class="cv-sec">${escHTML(s.title)}</h2>
      ${s.note?`<p class="cv-note">${escHTML(s.note)}</p>`:''}
      <table class="cv-tbl">${s.rows.map(r=>`<tr><th>${escHTML(r.label)}</th><td>${escHTML(r.value)}</td></tr>`).join('')}</table>
    `).join('')}
  </div>`;
}

function mediaVoti(voti){ if(!voti || !voti.length) return null; const s=voti.reduce((a,b)=>a+b.v,0); return Math.round(s/voti.length*10)/10; }
function votiChartSVG(voti,color,w=260,h=90){
  if(!voti || !voti.length) return '<div style="color:var(--muted);font-size:12px;padding:8px 0">Nessun voto ancora.</div>';
  const sorted=[...voti].sort((a,b)=>a.data.localeCompare(b.data));
  const n=sorted.length;
  const padL=22,padR=8,padT=12,padB=16;
  const iw=w-padL-padR, ih=h-padT-padB;
  const min=1,max=10;
  const x=i=>padL + (n===1? iw/2 : iw*i/(n-1));
  const y=v=>padT + ih*(1-(v-min)/(max-min));
  let grid='';
  [4,6,8,10].forEach(g=>{ const gy=y(g); grid+='<line x1="'+padL+'" y1="'+gy.toFixed(1)+'" x2="'+(w-padR)+'" y2="'+gy.toFixed(1)+'" stroke="var(--track)" stroke-width="1"/>'; grid+='<text x="4" y="'+(gy+3).toFixed(1)+'" font-size="9" fill="var(--label)">'+g+'</text>'; });
  const pts=sorted.map((v,i)=>x(i).toFixed(1)+','+y(v.v).toFixed(1));
  const poly='<polyline points="'+pts.join(' ')+'" pathLength="1" class="voti-line" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  let dots='',labels='';
  sorted.forEach((v,i)=>{ const px=x(i).toFixed(1), py=y(v.v).toFixed(1); dots+='<circle cx="'+px+'" cy="'+py+'" r="3.5" fill="'+color+'" stroke="var(--surface)" stroke-width="1.5"/>'; labels+='<text x="'+px+'" y="'+(y(v.v)-7).toFixed(1)+'" text-anchor="middle" font-size="10" font-weight="700" fill="var(--text2)">'+v.v+'</text>'; });
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
  ${renderVotiBody()}`;
}
function renderVotiBody(){
  return `
  ${!state.materie.length?`<div class="card empty-state">
    <div class="empty-ico">${icon('trend',26)}</div>
    <div>
      <div class="section-title">Nessuna materia ancora</div>
      <div class="section-sub">Aggiungi la prima materia e i suoi voti: il grafico mostrerà l'andamento nel tempo.</div>
      <button class="btn primary sm" data-action="addMateria">+ Aggiungi la prima materia</button>
    </div>
  </div>`:''}
  <div class="voti-grid" id="votiGrid">
    ${state.materie.map(m=>{
      const media=mediaVoti(m.voti);
      const sorted=[...m.voti].sort((a,b)=>b.data.localeCompare(a.data));
      return `
      <div class="card" data-materia="${m.id}">
        <div class="voti-head">
          <div class="voti-id">
            <span class="voti-dot" style="background:${m.color}"></span>
            <span class="section-title" style="margin:0">${escHTML(m.nome)}</span>
          </div>
          <div class="voti-media" style="--mc:${m.color}">
            <span class="voti-media-num">${media!=null?media:'—'}</span>
            <span class="voti-media-lbl">media${m.voti.length?' · '+m.voti.length+(m.voti.length===1?' voto':' voti'):''}</span>
          </div>
          <button class="btn sm" data-action="removeMateria" data-val="${m.id}" title="Rimuovi materia" aria-label="Rimuovi ${escHTML(m.nome)}">✕</button>
        </div>
        <div style="margin-bottom:10px">${votiChartSVG(m.voti,m.color)}</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
          ${sorted.map(v=>'<span class="chip" style="background:'+tint(m.color)+';color:var(--text2)">'+v.v+' <small>('+v.tipo+')</small></span>').join('') || '<span class="section-sub" style="margin:0">Nessun voto.</span>'}
        </div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
          <input type="number" min="1" max="10" step="0.25" class="vin" placeholder="Voto" aria-label="Voto" style="width:64px;border:1px solid var(--line);border-radius:9px;padding:7px 9px;background:var(--surface);color:var(--ink)"/>
          <select class="vtipo" aria-label="Tipo di voto" style="border:1px solid var(--line);border-radius:9px;padding:7px 9px;background:var(--surface);color:var(--ink)">
            <option value="scritto">scritto</option><option value="orale">orale</option><option value="pratico">pratico</option>
          </select>
          <input type="date" class="vdata" aria-label="Data del voto" value="2026-11-10" style="border:1px solid var(--line);border-radius:9px;padding:6px 9px;background:var(--surface);color:var(--ink)"/>
          <button class="btn primary sm" data-action="addVoto" data-val="${m.id}">Aggiungi</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
function renderSettings(){
  const role=(v,l)=>`<button class="segbtn ${state.ruolo===v?'on':''}" data-action="setRuolo" data-val="${v}" aria-pressed="${state.ruolo===v}">${l}</button>`;
  const size=(v,l)=>`<button class="segbtn ${state.textSize===v?'on':''}" data-action="setTextSize" data-val="${v}" aria-pressed="${state.textSize===v}">${l}</button>`;
  const theme=(v,l)=>`<button class="theme-tile ${state.theme===v?'on':''}" data-action="setTheme" data-val="${v}" aria-pressed="${state.theme===v}">
    <span class="theme-preview ${v}"><i></i><i></i><i></i></span>
    <span class="theme-name">${l}</span>
    <span class="theme-check">${icon('check',14)}</span>
  </button>`;
  const sw=(id,label,desc)=>`
    <div class="switch-row">
      <div class="switch-text"><span class="switch-label">${label}</span><span class="switch-desc">${desc}</span></div>
      <label class="switch">
        <input type="checkbox" ${state.privacy[id]?'checked':''} data-action="privacy" data-val="${id}" aria-label="${label}"/>
        <span class="switch-track"><span class="switch-dot"></span></span>
      </label>
    </div>`;
  return `
  <div class="settings">
    <div class="set-head">
      <div class="set-ico">${icon('sparkles',18)}</div>
      <div>
        <div class="set-title">Impostazioni</div>
        <div class="set-sub">Aspetto e permessi. Le modifiche si applicano subito.</div>
      </div>
    </div>
    <div class="set-group">
      <div class="set-label">Profilo</div>
      <div class="set-hint">Cambia il modo in cui l'app parla di te.</div>
      <div class="seg">${role('studente','Studente')}${role('lavoratore','Lavoratore')}${role('studente-lavoratore','Studente lavoratore')}</div>
    </div>
    <div class="set-group">
      <div class="set-label">Tema</div>
      <div class="set-hint">Scegli la luce dell'interfaccia.</div>
      <div class="theme-grid">${theme('light','Chiaro')}${theme('dark','Scuro')}</div>
    </div>
    <div class="set-group">
      <div class="set-label">Dimensione testo</div>
      <div class="set-hint">Più grande per leggere meglio, senza cambiare il layout.</div>
      <div class="seg">${size('normale','Normale')}${size('grande','Grande')}</div>
    </div>
    <div class="set-group">
      <div class="set-label">Intelligenza artificiale</div>
      <div class="set-hint">Sergio e l'analisi automatica girano su questo computer: decidi tu cosa possono usare.</div>
      ${sw('ai','Migliorare l\'AI con i miei dati','Disattivato: i dati non escono dal computer.')}
    </div>
    <div class="set-foot">
      <button class="btn primary" data-action="closeModal">Fatto</button>
    </div>
  </div>`;
}
