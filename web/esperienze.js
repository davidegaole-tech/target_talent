/* ---------- CERTIFICAZIONI ED ESPERIENZE: esperienze scritte + documenti caricati (file salvati dal backend) ---------- */
const DOC_KINDS={certificato:'Certificazione',attestato:'Attestato',corso:'Corso',esperienza:'Esperienza',altro:'Altro'};
const DOCS={loaded:false,loading:false,offline:false,items:[],busy:{},armed:null,form:false};

async function loadDocs(force){
  if(DOCS.loading || (DOCS.loaded && !force)) return;
  DOCS.loading=true;
  try{
    const r=await fetch('/api/documents');
    if(!r.ok) throw new Error();
    DOCS.items=(await r.json()).documents.filter(d=>d.kind!=='appunti'); DOCS.offline=false;
  }catch(e){ DOCS.offline=true; }
  DOCS.loading=false; DOCS.loaded=true;
  if(['esperienze','cv','passaporto'].includes(state.route)) render();
}
function fmtSize(n){ return n>=1e6?(n/1e6).toFixed(1)+' MB':Math.max(1,Math.round(n/1e3))+' KB'; }
function docInDiario(id){ return state.evidences.some(e=>e.docId===id); }

function renderEsperienze(){
  if(!DOCS.loaded) loadDocs();
  const f=state.espFiltro||'tutto', cf=state.diarioFilter;
  const exp=(f==='documenti'?[]:state.evidences).filter(e=>!e.docId&&(!cf||e.comp.includes(cf))&&(f!=='extra'||e.ambito==='extra'));
  const filtri=[['tutto','Tutto'],['esperienze','Esperienze'],['extra','Sport e hobby'],['documenti','Certificati e documenti']];
  return `
  <div class="hero">
    <div>
      <h1>Certificazioni ed esperienze</h1>
      <p>Tutto quello che pensi ti caratterizzi: esperienze a scuola e fuori, sport, hobby, certificati e attestati. Sergio li analizza e li usa per competenze, CV e consigli. Con ★ scegli cosa mostrare nel passaporto.</p>
    </div>
    <div class="hero-side">
      <button class="btn primary sm" data-action="navigateNuova">+ Scrivi un'esperienza</button>
      <button class="btn sm" data-action="docForm">${icon('file',14)} Carica certificato</button>
    </div>
  </div>
  ${DOCS.form?renderDocForm():''}
  <div class="seg" style="margin-bottom:10px;flex-wrap:wrap">
    ${filtri.map(([k,l])=>`<button class="segbtn ${f===k?'on':''}" data-action="espFiltro" data-val="${k}">${l}</button>`).join('')}
  </div>
  ${f!=='documenti'?`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip filter ${!cf?'on':''}" data-action="dfilter" data-val="">Tutte le competenze</button>
    ${EU.map(c=>'<button class="chip filter '+(cf===c.id?'on':'')+'" data-action="dfilter" data-val="'+c.id+'">'+c.short+'</button>').join('')}
  </div>`:''}
  ${f==='tutto'||f==='documenti'?`<div class="section-title" style="margin-top:6px">Certificati e documenti</div><div class="section-sub">Caricati da te, letti da Sergio</div><div id="docList" style="margin-bottom:18px">${renderDocList()}</div>`:''}
  ${f!=='documenti'?`<div class="section-title">Esperienze</div><div class="section-sub">${exp.length} ${exp.length===1?'esperienza':'esperienze'}</div>
  <div class="grid g3">
    ${exp.length?exp.map(e=>renderEvidenceCard(e)).join(''):'<div class="card" style="grid-column:1/-1;text-align:center;color:var(--muted);padding:32px">Nessuna esperienza con questo filtro. <a href="#/nuova" style="color:var(--accent);font-weight:600">Scrivine una</a>.</div>'}
  </div>`:''}`;
}

function renderDocForm(){
  return `
  <div class="card" style="margin-bottom:16px">
    <div class="section-title">Carica un certificato o un documento</div>
    <div class="section-sub">PDF, DOCX, TXT o una foto (JPG, PNG) · massimo 10 MB</div>
    <div class="grid g2" style="gap:0 16px">
      <div class="form-row"><label for="d-file">File</label><input id="d-file" type="file" accept=".pdf,.docx,.txt,.md,.jpg,.jpeg,.png"/></div>
      <div class="form-row"><label for="d-kind">Tipo</label>
        <select id="d-kind">${Object.entries(DOC_KINDS).map(([k,l])=>`<option value="${k}">${l}</option>`).join('')}</select></div>
      <div class="form-row"><label for="d-title">Titolo</label><input id="d-title" placeholder="es. Certificato Cambridge B2 First"/></div>
      <div class="form-row"><label for="d-date">Data</label><input id="d-date" type="date"/></div>
    </div>
    <div class="form-row"><label for="d-note">Due righe, se vuoi</label><textarea id="d-note" rows="2" placeholder="Cosa hai fatto, quante ore, che livello, cosa ti è piaciuto…"></textarea></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn primary sm" data-action="docUpload">Carica</button>
      <button class="btn sm" data-action="docForm">Annulla</button>
    </div>
  </div>`;
}

function renderDocList(){
  if(!DOCS.loaded) return '<div class="card"><div class="ai-loading"><span class="ai-spin"></span>Carico i tuoi documenti…</div></div>';
  if(DOCS.offline) return `<div class="card" style="text-align:center;padding:32px;color:var(--muted);font-size:13px;line-height:1.6">
      I documenti vengono salvati sul tuo computer da Sergio, che ora non è avviato.<br/>Avvia l'app con <code>./scripts/start.sh</code> e ricarica la pagina.</div>`;
  if(!DOCS.items.length) return `<div class="card" style="text-align:center;padding:32px;color:var(--muted);font-size:13px;line-height:1.6">
      Non hai ancora caricato certificati.<br/>Qualche idea: una certificazione di lingua, un attestato ICDL, un corso estivo, il PCTO, un corso sulla sicurezza.</div>`;
  return `<div class="grid g2">${DOCS.items.map(renderDocCard).join('')}</div>`;
}

function renderDocCard(d){
  const a=d.analysis, busy=DOCS.busy[d.id];
  const chips=a?a.comp.map(c=>{const eu=EU.find(x=>x.id===c.id);return eu?'<span class="chip" style="background:'+eu.color+'1f;color:var(--text2)">'+eu.short+'</span>':'';}).join(''):'';
  const meta=[d.date?fmtDate(d.date):null, escHTML(d.filename), fmtSize(d.size)].filter(Boolean).join(' · ');
  return `
  <div class="card doc-card">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div class="evidence-icon">${icon(d.mime.startsWith('image/')?'image':'file',16)}</div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span class="chip">${DOC_KINDS[d.kind]||'Documento'}</span>
          <button class="star ${state.docEvidenza.includes(d.id)?'on':''}" style="margin-left:auto" data-action="toggleDocStar" data-id="${d.id}" title="Metti in evidenza nel passaporto" aria-label="Metti in evidenza nel passaporto" aria-pressed="${state.docEvidenza.includes(d.id)}"><span aria-hidden="true">★</span></button></div>
        <div style="font-weight:700;font-size:14px">${escHTML(d.title)}</div>
        <div style="font-size:11.5px;color:var(--muted);margin-top:2px;overflow-wrap:anywhere">${meta}</div>
      </div>
    </div>
    ${d.note?`<p style="font-size:12.5px;color:var(--text2);line-height:1.55;margin-top:10px">${escHTML(d.note)}</p>`:''}
    ${busy?'<div class="ai-loading" style="margin-top:12px"><span class="ai-spin"></span>Sergio sta leggendo il documento…</div>':''}
    ${a&&!busy?`
      <div class="doc-ai">
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">${chips}</div>
        <p><strong>Perché:</strong> ${escHTML(a.perche)}.</p>
        <p class="doc-tip"><strong>Un suggerimento di Sergio:</strong> ${escHTML(a.suggerimento||'')}</p>
      </div>`:''}
    ${!a&&!busy&&!d.has_text&&!d.note?'<p style="font-size:11.5px;color:var(--muted);margin-top:10px">Da questo file non si può leggere il testo: aggiungi due righe di descrizione per un\'analisi più precisa.</p>':''}
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">
      <a class="btn sm" href="/api/documents/${d.id}/file" target="_blank" rel="noopener">Apri</a>
      <button class="btn sm" data-action="docAnalyze" data-id="${d.id}" ${busy?'disabled':''}>${icon('sparkles',13)} ${a?'Rianalizza':'Analizza con l\'AI'}</button>
      ${a?(docInDiario(d.id)?'<span class="chip" style="align-self:center">✓ Conta nelle competenze</span>':`<button class="btn soft sm" data-action="docToDiario" data-id="${d.id}">Conta nelle competenze</button>`):''}
      ${a?`<button class="btn sm" data-action="askSergio" data-q="Ho caricato il documento «${escHTML(d.title)}». Mi dai qualche idea concreta su come andare avanti da qui o su come valorizzarlo nel CV?">${icon('chat',13)} Chiedi a Sergio</button>`:''}
      <button class="btn sm ${DOCS.armed===d.id?'danger-armed':''}" style="margin-left:auto;color:${DOCS.armed===d.id?'#fff':'var(--rose-text)'}" data-action="docDelete" data-id="${d.id}">${DOCS.armed===d.id?'Conferma eliminazione':'Elimina'}</button>
    </div>
  </div>`;
}

function refreshDocList(){ const el=$('docList'); if(el && state.route==='esperienze') el.innerHTML=renderDocList(); }

async function uploadDoc(btn){
  const f=$('d-file')?.files[0];
  if(!f){ toast('Scegli un file da caricare'); return; }
  if(f.size>10*1024*1024){ toast('Il file è troppo grande (massimo 10 MB)'); return; }
  const fd=new FormData();
  fd.append('file',f); fd.append('kind',$('d-kind').value); fd.append('title',$('d-title').value.trim());
  fd.append('date',$('d-date').value); fd.append('note',$('d-note').value.trim());
  btn.disabled=true; btn.textContent='Carico…';
  try{
    const r=await fetch('/api/documents',{method:'POST',body:fd});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Caricamento non riuscito');
    DOCS.items.unshift(data); DOCS.form=false; render();
    toast('Documento caricato');
    analyzeDoc(data.id);
  }catch(e){
    toast(e instanceof TypeError?'Sergio non è avviato: non posso salvare il documento':e.message);
    if(btn.isConnected){ btn.disabled=false; btn.textContent='Carica'; }
  }
}

async function analyzeDoc(id){
  DOCS.busy[id]=true; refreshDocList();
  try{
    const r=await fetch('/api/documents/'+encodeURIComponent(id)+'/analyze',{method:'POST'});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Analisi non riuscita');
    DOCS.items=DOCS.items.map(d=>d.id===id?data:d);
  }catch(e){
    toast(e instanceof TypeError?'Sergio non è avviato':e.message);
  }finally{
    delete DOCS.busy[id]; refreshDocList();
  }
}

function docToDiario(id){
  const d=DOCS.items.find(x=>x.id===id); if(!d||!d.analysis||docInDiario(id)) return;
  const ids=d.analysis.comp.map(c=>c.id).filter(cid=>EU.some(x=>x.id===cid));
  state.evidences.unshift({id:'d'+id,docId:id,ambito:'doc',tipo:'documento',titolo:escHTML(d.title),
    descrizione:escHTML(d.note||(DOC_KINDS[d.kind]+' · '+d.filename)),data:d.date||new Date().toISOString().slice(0,10),
    comp:ids,dims:dimsOf(ids),conf:d.analysis.conf,perche:escHTML(d.analysis.perche)});
  ids.forEach(cid=>{state.prove[cid]=(state.prove[cid]||0)+1;});
  render(); toast('Ora conta nelle tue competenze');
}

async function deleteDoc(id){
  if(DOCS.armed!==id){
    DOCS.armed=id; refreshDocList();
    clearTimeout(deleteDoc._t); deleteDoc._t=setTimeout(()=>{ DOCS.armed=null; refreshDocList(); },3500);
    return;
  }
  DOCS.armed=null;
  try{
    const r=await fetch('/api/documents/'+encodeURIComponent(id),{method:'DELETE'});
    if(!r.ok && r.status!==404) throw new Error();
    DOCS.items=DOCS.items.filter(d=>d.id!==id); refreshDocList(); toast('Documento eliminato');
  }catch(e){ toast('Eliminazione non riuscita'); refreshDocList(); }
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]'); if(!el) return;
  const a=el.dataset.action, id=el.dataset.id;
  if(a==='docForm'){ DOCS.form=!DOCS.form; render(); }
  else if(a==='espFiltro'){ state.espFiltro=el.dataset.val; render(); }
  else if(a==='docUpload') uploadDoc(el);
  else if(a==='docAnalyze') analyzeDoc(id);
  else if(a==='docToDiario') docToDiario(id);
  else if(a==='docDelete') deleteDoc(id);
});
