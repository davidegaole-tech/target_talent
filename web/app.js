/* ---------- APP ---------- */
state.diarioFilter=null;

const ROUTES={
 passaporto:renderPassaporto,
 competenze:renderCompetenze,
 planner:renderPlanner,
 esperienze:renderEsperienze,
 appunti:renderAppunti,
 portfolio:renderPortfolio,
 nuova:renderNuova,
 orientamento:renderOrientamento,
 cv:renderCv
};
// Vecchi indirizzi delle sezioni accorpate
const ROUTE_ALIASES={diario:'esperienze',esposizione:'esperienze',documenti:'esperienze',macroaree:'competenze',recap:'passaporto',voti:'appunti'};
function haVoti(){ return state.ruolo!=='lavoratore'; }
function resolveRoute(r){
  r=ROUTE_ALIASES[r]||r;
  if(r==='voti' && !haVoti()) r='passaporto';
  return ROUTES[r]?r:'passaporto';
}

function playScan(){
  const el=document.getElementById('scanline');
  if(el){ el.classList.remove('run'); void el.offsetWidth; el.classList.add('run'); }
  const view=document.getElementById('view');
  if(view){
    view.classList.remove('route-in'); void view.offsetWidth; view.classList.add('route-in');
    clearTimeout(playScan._t);
    playScan._t=setTimeout(()=>view.classList.remove('route-in'),900);
  }
}

function navigate(hash){
  const r=resolveRoute(hash.replace('#/','')||'passaporto');
  state.route=r;
  if(location.hash!=='#/'+r) location.hash='#/'+r;
  render();
  playScan();
  window.scrollTo(0,0);
}

window.addEventListener('hashchange',()=>{
  const r=resolveRoute(location.hash.replace('#/','')||'passaporto');
  if(r!==state.route){ state.route=r; render(); playScan(); }
});

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');
  if(!el) return;
  const a=el.dataset.action;
  const v=el.dataset.val;
  if(a==='closeModal'){ closeModal(); return; }
  if(a==='ambito'){
    state.pendingAmbito=v;
    document.querySelectorAll('#ambitoSeg .segbtn').forEach(b=>b.classList.toggle('on',b.dataset.val===v));
    return;
  }
  if(a==='tipo'){
    state.pendingType=v;
    document.querySelectorAll('#tipoSeg .segbtn').forEach(b=>b.classList.toggle('on',b.dataset.val===v));
    ['foto','link','testo','voce'].forEach(t=>{ const el=$('extra-'+t); if(el) el.hidden=(t!==v); });
    return;
  }
  if(a==='analizza'){
    const titolo=$('p-titolo').value.trim();
    const desc=$('p-desc').value.trim();
    const tipo=state.pendingType||'foto';
    if(!titolo){ toast('Dai un titolo alla prova'); return; }
    analizzaConAI(titolo,desc,tipo,el);
    return;
  }
  if(a==='resetForm'){
    state.pending=null; state.prefill=null; state.pendingAmbito=null;
    ['p-titolo','p-desc','p-link','p-data'].forEach(id=>{ const f=$(id); if(f) f.value=''; });
    ['p-foto','p-voce'].forEach(id=>{ const f=$(id); if(f) f.value=''; });
    ['fotoPreview','vocePreview'].forEach(id=>{ const b=$(id); if(b) b.innerHTML=''; });
    const an=$('analisi'); if(an) an.innerHTML='Compila la prova e premi <strong>Analizza</strong>.';
    toast('Campi svuotati');
    return;
  }
  if(a==='conferma'){
    if(!state.pending) return;
    savePendingEvidence(state.pending);
    return;
  }
  if(a==='correggi'){ if(state.pending) openCorreggi('pending'); return; }
  if(a==='correggiEv'){ openCorreggi(el.dataset.id); return; }
  if(a==='toggleComp'){ el.classList.toggle('on'); const n=document.querySelectorAll('#corrComp .on').length; const w=$('corrWarn'); if(w) w.hidden=n>0&&n<=3; return; }
  if(a==='salvaCorrezione'){ salvaCorrezione(el.dataset.id); return; }
  if(a==='mission'){
    state.prefill={titolo:v,desc:'',ambito:el.dataset.ambito||null};
    state.pendingAmbito=el.dataset.ambito||null;
    navigate('#/nuova');
    return;
  }
  if(a==='askSergio'){ chiediASergio(el.dataset.q||v||''); return; }
  if(a==='editProfile'){ closeProfile(); openModal(renderProfileEditor()); return; }
  if(a==='saveProfile'){ salvaProfilo(); return; }
  if(a==='dfilter'){
    state.diarioFilter = v===''?null:v;
    render();
    return;
  }
  if(a==='openEv'){
    const e=state.evidences.find(x=>x.id===el.dataset.id);
    if(!e) return;
    const chips=e.comp.map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+tint(c.color)+';color:var(--text2)">'+c.short+'</span>';}).join('');
    const dimchips=(e.dims||[]).map(id=>{const d=DIMS.find(x=>x.id===id);return '<span class="chip" style="background:'+tint(d.color)+';color:var(--text2)">'+d.nome+'</span>';}).join('');
    openModal(`
      <button class="modal-close" data-action="closeModal" aria-label="Chiudi">${icon('plus',16)}</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:4px">${escHTML(e.titolo)}</div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">${fmtDate(e.data)} · ${(e.ambito==='extra'?'fuori da scuola':e.ambito==='doc'?'documento':'a scuola')} · ${escHTML(e.tipo)}</div>
      <p style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:12px">${escHTML(e.descrizione)}</p>
      ${e.link?`<p style="margin-bottom:12px"><a class="btn sm" href="${safeHref(e.link)}" target="_blank" rel="noopener noreferrer">Apri il link</a></p>`:''}
      ${e.attachment&&String(e.attachment.mime||'').startsWith('image/')?`<img src="${escHTML(fileUrl(e.attachment.url))}" alt="Foto della prova" style="max-width:100%;border-radius:12px;margin-bottom:12px"/>`:''}
      ${e.attachment&&String(e.attachment.mime||'').startsWith('audio/')?`<audio controls src="${escHTML(fileUrl(e.attachment.url))}" style="width:100%;margin-bottom:12px"></audio>`:''}
      <div style="margin-bottom:8px"><strong style="font-size:12px">Dimensioni:</strong> <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${dimchips}</div></div>
      <div style="margin-bottom:12px"><strong style="font-size:12px">Competenze:</strong> <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${chips}</div></div>
      <div style="background:var(--surface2);border-radius:12px;padding:12px 14px;font-size:12.5px;color:var(--text2);line-height:1.55"><strong>${e.corretta?'Competenze scelte da te':'Perché l\'AI l\'ha collegata'}:</strong> ${e.perche}.</div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn soft sm" data-action="correggiEv" data-id="${e.id}">Correggi le competenze</button>
        <button class="btn sm" data-action="editEv" data-id="${e.id}">Modifica</button>
        <button class="btn sm" data-action="deleteEv" data-id="${e.id}" style="color:var(--rose-text);border-color:var(--line)">Elimina</button>
        <button class="btn sm" data-action="closeModal">Chiudi</button>
      </div>
    `);
    return;
  }
  if(a==='editEv'){
    const e=state.evidences.find(x=>x.id===el.dataset.id); if(!e) return;
    openModal(`
      <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:12px">Modifica esperienza</div>
      <div class="form-row"><label for="ev-titolo">Titolo</label><input id="ev-titolo" value="${escHTML(e.titolo||'')}" maxlength="200"/></div>
      <div class="form-row"><label for="ev-desc">Descrizione</label><textarea id="ev-desc" rows="3">${escHTML(e.descrizione||'')}</textarea></div>
      <div class="form-row"><label for="ev-data">Data</label><input id="ev-data" type="date" value="${escHTML(e.data||'')}"/></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn sm" data-action="closeModal">Annulla</button>
        <button class="btn primary sm" data-action="saveEv" data-id="${e.id}">Salva</button>
      </div>`);
    return;
  }
  if(a==='saveEv'){
    const e=state.evidences.find(x=>x.id===el.dataset.id); if(!e) return;
    const titolo=$('ev-titolo').value.trim();
    const desc=$('ev-desc').value.trim();
    const data=$('ev-data').value;
    if(!titolo){ toast('Il titolo non può essere vuoto'); return; }
    e.titolo=titolo; e.descrizione=desc; if(data) e.data=data;
    closeModal(); render(); toast('Esperienza aggiornata');
    return;
  }
  if(a==='deleteEv'){
    const e=state.evidences.find(x=>x.id===el.dataset.id); if(!e) return;
    openModal(`
      <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:6px">Eliminare questa esperienza?</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.55">«${escHTML(e.titolo)}» verrà rimossa dal passaporto e dalle competenze.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn sm" data-action="closeModal">Annulla</button>
        <button class="btn primary sm" data-action="confirmDeleteEv" data-id="${e.id}" style="background:var(--rose);border-color:var(--rose-text)">Elimina</button>
      </div>`);
    return;
  }
  if(a==='confirmDeleteEv'){
    const e=state.evidences.find(x=>x.id===el.dataset.id); if(!e) return;
    state.evidences=state.evidences.filter(x=>x.id!==e.id);
    if(e.docId) state.docEvidenza=state.docEvidenza.filter(id=>id!==e.docId);
    closeModal(); render(); toast('Esperienza eliminata');
    return;
  }
  if(a==='privacy'){
    const id=el.dataset.val;
    const input=el.tagName==='INPUT'?el:el.querySelector('input');
    state.privacy[id]=input?input.checked:!state.privacy[id];
    render();
    if(typeof refreshSettings==='function') refreshSettings();
    return;
  }
  if(a==='exportData'){
    closeProfile();
    downloadStateExport();
    return;
  }
  if(a==='importData'){ closeProfile(); const inp=$('importState'); if(inp) inp.click(); return; }
  if(a==='deleteData'){ closeProfile(); confirmDeleteAll(); return; }
  if(a==='confirmDeleteAll'){ deleteAllData(); return; }
  if(a==='confirmImport'){ confirmImportBackup(); return; }
  if(a==='stampa'){ window.print(); return; }
  if(a==='navigateNuova'){ state.prefill=null; state.pending=null; state.pendingAmbito=el.dataset.ambito||null; navigate('#/nuova'); return; }
  if(a==='apriCv'){ navigate('#/cv'); return; }
  if(a==='openSettings'){ closeProfile(); openModal(renderSettings()); return; }
  if(a==='logout'){ closeProfile(); logout(); return; }
  if(a==='setRuolo'){ state.ruolo=v; render(); refreshSettings(); toast('Ruolo aggiornato'); return; }
  if(a==='startFresh'){
    openModal(`
      <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:6px">Partire da zero?</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.55">Vengono tolte le prove, i voti, il planner e i documenti in evidenza di questo account. Il profilo resta. L'operazione non si può annullare.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn sm" data-action="closeModal">Annulla</button>
        <button class="btn primary sm" data-action="confirmStartFresh" style="background:var(--rose);border-color:var(--rose-text)">Azzera il passaporto</button>
      </div>`);
    return;
  }
  if(a==='confirmStartFresh'){
    closeModal();
    state.evidences=[]; state.materie=[]; state.planner=[]; state.docEvidenza=[];
    state.prove={};
    state.profilo={...state.profilo,nome:currentUserName(),cognome:'',nascita:'',citta:'',email:'',telefono:'',
      scuola:'',classe:'',anno:'',presentazione:'',lingue:'',digitali:'',interessi:'',sport:''};
    state.isSample=false; state.sampleBanner=false; state.portfolioAt=null;
    render(); toast('Passaporto azzerato: aggiungi la prima prova');
    return;
  }
  if(a==='hideSample'){ state.sampleBanner=false; renderSampleBanner(); saveState(); return; }
  if(a==='goNuova'){ navigate('#/nuova'); return; }
  if(a==='changePhoto'){ pickProfilePhoto(); return; }
  if(a==='toggleStar'){ e.stopPropagation(); const ev=state.evidences.find(x=>x.id===el.dataset.id); if(ev){ ev.evidenza=!ev.evidenza; render(); toast(ev.evidenza?'In evidenza nel passaporto':'Tolta dal passaporto'); } return; }
  if(a==='toggleDocStar'){ const id=el.dataset.id; const i=state.docEvidenza.indexOf(id); if(i>=0) state.docEvidenza.splice(i,1); else state.docEvidenza.push(id); render(); toast(i>=0?'Tolto dal passaporto':'In evidenza nel passaporto'); return; }
  if(a==='passView'){ state.passView=v; render(); return; }
  if(a==='recapPeriodo'){ state.recapPeriodo=v; render(); return; }
  if(a==='migliora'){ openModal(renderMigliora(v)); return; }
  if(a==='toggleProfile'){ const m=$('profileMenu'); if(m){ m.hidden=!m.hidden; const b=document.querySelector('.profilebtn'); if(b) b.setAttribute('aria-expanded',String(!m.hidden)); } return; }
  if(a==='setTheme'){ state.theme=v; document.documentElement.setAttribute('data-theme',v); render(); refreshSettings(); return; }
  if(a==='setTextSize'){ state.textSize=v; applyVisuals(); render(); refreshSettings(); return; }
  if(a==='addMateria'){
    openModal(`
      <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:12px">Nuova materia</div>
      <div class="form-row"><label>Nome della materia</label><input id="materiaNome" placeholder="Es. Storia" style="border:1px solid var(--line);border-radius:10px;padding:10px 12px;background:var(--surface);color:var(--ink)"/></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn sm" data-action="closeModal">Annulla</button>
        <button class="btn primary sm" data-action="confermaMateria">Aggiungi</button>
      </div>`);
    return;
  }
  if(a==='confermaMateria'){
    const n=$('materiaNome'); if(!n || !n.value.trim()){ toast('Scrivi il nome della materia'); return; }
    const palette=['#2f4b7c','#a61b3f','#0e6b6b','#2f6f9f','#5b4b8a','#7a2e4a','#b0576e','#4f7a5a'];
    state.materie.push({id:'m'+Date.now(),nome:n.value.trim(),color:palette[state.materie.length%palette.length],voti:[]});
    closeModal(); render(); toast('Materia aggiunta');
    return;
  }
  if(a==='addVoto'){
    const m=state.materie.find(x=>x.id===v); const card=document.querySelector('[data-materia="'+v+'"]');
    if(!m || !card) return;
    const inp=card.querySelector('.vin'); const tipo=card.querySelector('.vtipo').value; const data=card.querySelector('.vdata').value||'2026-11-10';
    const val=parseFloat(inp.value);
    if(isNaN(val)||val<1||val>10){ toast('Inserisci un voto tra 1 e 10'); return; }
    m.voti.push({v:val,tipo:tipo,data:data}); inp.value=''; render();
    return;
  }
  if(a==='removeMateria'){
    const m=state.materie.find(x=>x.id===v); if(!m) return;
    openModal(`
      <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:6px">Rimuovere «${escHTML(m.nome)}»?</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.55">Verranno eliminati anche i ${ (m.voti||[]).length } voti registrati per questa materia.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn sm" data-action="closeModal">Annulla</button>
        <button class="btn primary sm" data-action="confirmRemoveMateria" data-val="${m.id}" style="background:var(--rose);border-color:var(--rose-text)">Rimuovi</button>
      </div>`);
    return;
  }
  if(a==='confirmRemoveMateria'){ state.materie=state.materie.filter(x=>x.id!==v); closeModal(); render(); toast('Materia rimossa'); return; }
  if(a==='pickPortfolio'){ openPortfolioPicker(); return; }
  if(a==='apriPortfolio'){ navigate('#/portfolio'); return; }
  if(a==='scaricaCv'){ downloadCvPdf(); return; }
  if(a==='savePortfolioSel'){
    state.portfolioSel=[...document.querySelectorAll('#modalRoot [data-pick]:checked')].map(i=>i.dataset.pick);
    closeModal(); render(); toast('Selezione salvata');
    return;
  }
  if(a==='rigenera'){ state.portfolioAt=Date.now(); render(); toast('Portfolio aggiornato'); return; }
  if(a==='condividi'){
    if(!state.privacy.tutor){ toast('Prima attiva il permesso del tutor nelle impostazioni'); openModal(renderSettings()); return; }
    state.shareWithTutor=true;
    toast('Portfolio condiviso con il tutor');
    render();
    return;
  }
});

function validHttpUrl(raw){
  try{ const u=new URL(String(raw).trim()); if(u.protocol==='http:'||u.protocol==='https:') return u.href; }catch(e){}
  return null;
}
async function downloadCvPdf(){
  try{
    toast('Preparo il PDF…');
    const model=cvModel();
    const r=await fetch('/api/cv/pdf',{method:'POST',
      headers:authHeaders({'Content-Type':'application/json'}),body:JSON.stringify(model)});
    if(!r.ok) throw new Error('server');
    const blob=await r.blob();
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='curriculum-vitae.pdf';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast('CV scaricato in PDF');
  }catch(e){ toast('Non riesco a creare il PDF'); }
}
function pickProfilePhoto(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/png,image/jpeg,image/webp,image/gif';
  inp.style.display='none';
  document.body.appendChild(inp);
  inp.addEventListener('change',async()=>{
    const f=inp.files&&inp.files[0];
    if(!f){ inp.remove(); return; }
    if(f.size>5*1024*1024){ toast('Foto troppo grande (massimo 5 MB)'); inp.remove(); return; }
    toast('Carico la foto…');
    const att=await uploadAttachment(f,'foto');
    inp.remove();
    if(att&&att.url){ state.profilo.foto=att.url; render(); toast('Foto aggiornata'); }
  });
  inp.click();
}
async function uploadAttachment(file,kind){  const fd=new FormData(); fd.append('file',file); fd.append('kind',kind);
  try{
    const r=await fetch('/api/attachments',{method:'POST',headers:authHeaders(),body:fd});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Caricamento non riuscito');
    return data;
  }catch(e){
    toast(e instanceof TypeError?'Il server non risponde: non posso salvare il file':e.message);
    return null;
  }
}
async function savePendingEvidence(p){
  let link=null, attachment=null;
  if(p.tipo==='link'){
    const raw=$('p-link')?$('p-link').value.trim():'';
    if(raw){ link=validHttpUrl(raw); if(!link){ toast('Inserisci un link valido (http/https)'); return; } }
  }
  if(p.tipo==='foto'){
    const f=$('p-foto')?.files[0];
    if(f){
      if(f.size>5*1024*1024){ toast('La foto è troppo grande (massimo 5 MB)'); return; }
      attachment=await uploadAttachment(f,'foto'); if(!attachment) return;
    }
  }
  if(p.tipo==='voce'){
    const f=$('p-voce')?.files[0];
    if(f){
      if(f.size>10*1024*1024){ toast('L\'audio è troppo grande (massimo 10 MB)'); return; }
      attachment=await uploadAttachment(f,'voce'); if(!attachment) return;
    }
  }
  // Rilegge i campi: se l'utente li ha modificati dopo l'analisi, salva quello che vede.
  const titoloNow=($('p-titolo')?.value||p.titolo||'').trim();
  const descNow=($('p-desc')?.value||p.desc||'').trim();
  const ev={id:'e'+Date.now(),ambito:state.pendingAmbito||'scuola',titolo:titoloNow||p.titolo,descrizione:descNow,tipo:p.tipo,
    data:$('p-data').value||'2026-11-10',comp:p.res.comp.map(c=>c.id),dims:p.res.dims,conf:p.res.conf,
    perche:p.res.perche,corretta:!!p.res.corretta,nuovo:true};
  if(link) ev.link=link;
  if(attachment) ev.attachment=attachment;
  state.evidences.unshift(ev);
  state.pending=null; state.prefill=null; state.pendingAmbito=null;
  toast('Prova aggiunta al tuo diario');
  navigate('#/esperienze');
}
function previewFile(file,targetId,kind){
  const box=$(targetId); if(!box) return;
  box.innerHTML='';
  if(!file) return;
  const url=URL.createObjectURL(file);
  if(kind==='image'){
    const img=document.createElement('img');
    img.src=url; img.alt='Anteprima'; img.style.cssText='max-width:100%;max-height:220px;border-radius:12px;border:1px solid var(--line)';
    box.appendChild(img);
  }else{
    const audio=document.createElement('audio');
    audio.controls=true; audio.src=url; audio.style.width='100%';
    box.appendChild(audio);
  }
}

/* "Analizza con l'AI": modello locale via /api/analyze, con ripiego sull'analisi simulata */
let analisiCtrl=null;
async function analizzaConAI(titolo,desc,tipo,btn){
  if(analisiCtrl) analisiCtrl.abort();
  const ctrl=analisiCtrl=new AbortController();
  const label=btn?btn.innerHTML:'';
  if(btn){ btn.disabled=true; btn.innerHTML='Analizzo… '+icon('sparkles',14); }
  const box=$('analisi');
  if(box) box.innerHTML='<div class="ai-loading"><span class="ai-spin"></span>Il modello sta leggendo la prova…</div>';
  let res, motivo='';
  try{
    const r=await fetch('/api/analyze',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),signal:ctrl.signal,
      body:JSON.stringify({title:titolo,description:desc,kind:tipo})});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||('Errore del server ('+r.status+')'));
    res={comp:data.comp,dims:dimsOf(data.comp.map(c=>c.id)),perche:escHTML(data.perche),
      segnali:data.segnali.map(escHTML),conf:data.conf,fonte:'modello',modello:escHTML(data.model)};
  }catch(e){
    if(e.name==='AbortError') return;
    motivo=e instanceof TypeError?'il server di Sergio non è avviato':e.message;
    res={...analizza(titolo+' '+desc),fonte:'simulata',motivo:escHTML(motivo)};
  }finally{
    if(analisiCtrl===ctrl) analisiCtrl=null;
    if(btn && btn.isConnected){ btn.disabled=false; btn.innerHTML=label; }
  }
  if(state.route!=='nuova' || !$('analisi')) return;   // l'utente ha cambiato pagina
  state.pending={titolo,desc,tipo,res};
  $('analisi').innerHTML=renderAnalisi(res);
}

/* ---------- Correggi le competenze di una prova (o del risultato dell'analisi) ---------- */
function openCorreggi(target){
  const cur=target==='pending'?(state.pending?.res.comp||[]).map(c=>c.id):(state.evidences.find(x=>x.id===target)?.comp||[]);
  openModal(`
    <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
    <div style="font-weight:700;font-size:16px;margin-bottom:4px">Correggi le competenze</div>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px;line-height:1.5">Scegli da 1 a 3 competenze che questa prova racconta davvero. Conta il tuo punto di vista.</div>
    <div id="corrComp" style="display:flex;gap:8px;flex-wrap:wrap">
      ${EU.map(c=>`<button class="segbtn comp-toggle ${cur.includes(c.id)?'on':''}" data-action="toggleComp" data-comp="${c.id}" style="--cc:${c.color}">${c.nome}</button>`).join('')}
    </div>
    <div id="corrWarn" class="section-sub" style="color:var(--rose-text);margin-top:10px" hidden>Scegli da 1 a 3 competenze.</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn sm" data-action="closeModal">Annulla</button>
      <button class="btn primary sm" data-action="salvaCorrezione" data-id="${target}">Salva</button>
    </div>`);
}
function salvaCorrezione(target){
  const ids=[...document.querySelectorAll('#corrComp .on')].map(b=>b.dataset.comp);
  if(!ids.length||ids.length>3){ const w=$('corrWarn'); if(w) w.hidden=false; return; }
  const perche='scelte da te: '+ids.map(id=>EU.find(c=>c.id===id).short).join(', ');
  if(target==='pending'){
    const r=state.pending?.res; if(!r) return;
    r.comp=ids.map(id=>({id,p:(r.comp.find(c=>c.id===id)||{}).p||0.9}));
    r.dims=dimsOf(ids); r.perche=perche; r.corretta=true; r.segnali=r.segnali||[];
    closeModal(); const box=$('analisi'); if(box) box.innerHTML=renderAnalisi(r);
    return;
  }
  const e=state.evidences.find(x=>x.id===target); if(!e) return;
  e.comp=ids; e.dims=dimsOf(ids); e.perche=perche; e.corretta=true;
  closeModal(); render(); toast('Competenze aggiornate');
}

/* ---------- Profilo dello studente (usato da CV, portfolio e intestazioni) ---------- */
const PROFILE_FIELDS=[
  ['nome','Nome'],['cognome','Cognome'],['nascita','Data di nascita','date'],['citta','Città di residenza'],
  ['email','Email','email'],['telefono','Telefono','tel'],['scuola','Scuola'],['classe','Classe (facoltativa)'],['anno','Anno scolastico'],
  ['presentazione','Due righe su di te (visibili nel passaporto e nel CV)','area'],['sport','Sport praticati (separati da virgola)'],
  ['interessi','Hobby e interessi (separati da virgola)'],['lingue','Lingue e livelli','area'],
  ['digitali','Competenze digitali (strumenti, programmi)','area']
];
function renderProfileEditor(){
  const p=state.profilo;
  const field=([k,l,t])=>t==='area'
    ?`<div class="form-row"><label for="pf-${k}">${l}</label><textarea id="pf-${k}" rows="2">${escHTML(p[k]||'')}</textarea></div>`
    :`<div class="form-row"><label for="pf-${k}">${l}</label><input id="pf-${k}" type="${t||'text'}" value="${escHTML(p[k]||'')}"/></div>`;
  return `
    <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
    <div style="font-weight:700;font-size:16px;margin-bottom:4px">Il mio profilo</div>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Nome, scuola, classe, città, presentazione, sport e hobby compaiono nel tuo passaporto, che gli altri possono vedere ma solo tu puoi modificare. Email, telefono e data di nascita servono solo per il CV.</div>
    <div class="profile-grid">${PROFILE_FIELDS.map(field).join('')}</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px">
      <button class="btn sm" data-action="closeModal">Annulla</button>
      <button class="btn primary sm" data-action="saveProfile">Salva</button>
    </div>`;
}
function salvaProfilo(){
  PROFILE_FIELDS.forEach(([k])=>{ const el=$('pf-'+k); if(el) state.profilo[k]=el.value.trim(); });
  closeModal(); render(); toast('Profilo salvato');
}
function nomeCompleto(){ const p=state.profilo; return [p.nome,p.cognome].filter(Boolean).join(' ')||'Il tuo nome'; }
function iniziali(){ const p=state.profilo; return ((p.nome||'?')[0]+((p.cognome||'')[0]||'')).toUpperCase(); }
function classeScuola(){ const p=state.profilo; return [p.classe,p.scuola].filter(Boolean).join(' · '); }

/* ---------- "Chiedi a Sergio": domanda con il contesto del profilo (prove, voti) ---------- */
function contestoProfilo(){
  const comp=topComp(3).map(c=>c.nome).join(', ');
  const prove=state.evidences.slice(0,8).map(e=>'- '+e.titolo.replace(/&[a-z#0-9]+;/g,' ')+' ('+(e.ambito==='extra'?'fuori da scuola':'a scuola')+')').join('\n');
  const voti=state.materie.map(m=>{const md=mediaVoti(m.voti);return md!=null?m.nome+' '+md:null;}).filter(Boolean).join(', ');
  return 'Contesto sul mio profilo (non ripeterlo, usalo solo se serve):\n'
    +'Classe: '+(classeScuola()||'non indicata')+'\n'
    +'Competenze più raccontate: '+comp+'\n'
    +(voti?'Medie dei voti: '+voti+'\n':'')
    +'Alcune mie prove:\n'+prove;
}
function chiediASergio(domanda){
  if(!window.askSergio){ toast('Sergio non è disponibile: avvia l\'app con lo script nella cartella scripts'); return; }
  // Il profilo serve a personalizzare la risposta; Sergio gira in locale, quindi non esce dal computer.
  window.askSergio(domanda, contestoProfilo());
}

/* Il modale delle impostazioni è statico: dopo ogni scelta lo ridisegno, così il pulsante selezionato cambia. */
function refreshSettings(){
  const card=document.querySelector('#modalRoot .modal-card');
  if(card && card.querySelector('[data-action="setTheme"]')) card.innerHTML=renderSettings();
}

// init
if(!location.hash) location.hash='#/passaporto';
state.route=resolveRoute(location.hash.replace('#/','')||'passaporto');

function snapshotState(){
  return {
    evidences:state.evidences, diarioFilter:state.diarioFilter,
    privacy:state.privacy, dailyTip:state.dailyTip,
    theme:state.theme, streak:state.streak, textSize:state.textSize,
    materie:state.materie, profilo:state.profilo, ruolo:state.ruolo, planner:state.planner,
    docEvidenza:state.docEvidenza, recapPeriodo:state.recapPeriodo,
    isSample:state.isSample, sampleBanner:state.sampleBanner, portfolioAt:state.portfolioAt,
    portfolioSel:state.portfolioSel||[],
    tourDone:state.tourDone||false,
    shareWithTutor:state.shareWithTutor, espFiltro:state.espFiltro||null
  };
}
/* ---------- Backup completo: passaporto + documenti/appunti + schede di Sergio ---------- */
async function downloadStateExport(){
  try{
    toast('Preparo il backup completo…');
    const r=await fetch('/api/export',{headers:authHeaders()});
    if(!r.ok) throw new Error('server');
    const bundle=await r.json();
    const blob=new Blob([JSON.stringify(bundle,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download='talent-radar-backup-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    const n=(bundle.items||[]).length, d=(bundle.documents||[]).length;
    toast(`Backup scaricato: passaporto, ${d} documenti, ${n} schede`);
  }catch(e){
    toast('Non riesco a preparare il backup: il server risponde?');
  }
}
let pendingImport=null;
async function importStateFile(file){
  if(!file) return;
  try{
    const data=JSON.parse(await file.text());
    if(!data || typeof data!=='object' || (!data.state && !data.documents && !data.items)) throw new Error('bad');
    if(data.app && data.app!=='Talent Radar') throw new Error('bad');
    pendingImport=data;
    const st=data.state||{};
    const ev=(st.evidences||[]).length, docs=(data.documents||[]).length, items=(data.items||[]).length;
    openModal(`
      <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:6px">Ripristinare questo backup?</div>
      <p style="font-size:13px;color:var(--text2);line-height:1.55">Contiene ${ev} prove, ${docs} documenti/appunti e ${items} schede di Sergio. Il passaporto attuale verrà <strong>sostituito</strong>; i documenti già presenti sul server restano.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
        <button class="btn sm" data-action="closeModal">Annulla</button>
        <button class="btn primary sm" data-action="confirmImport">Ripristina</button>
      </div>`);
  }catch(e){ toast('File di backup non valido'); }
}
async function confirmImportBackup(){
  if(!pendingImport) return;
  const bundle=pendingImport; pendingImport=null; closeModal();
  try{
    const r=await fetch('/api/import',{method:'POST',headers:authHeaders({'Content-Type':'application/json'}),
      body:JSON.stringify(bundle)});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error((data&&data.error&&data.error.message)||'Import non riuscito');
    try{ localStorage.removeItem('talent_state'); }catch(e){}
    toast(`Ripristinato: ${(data.items_added||0)+(data.items_updated||0)} schede, ${data.documents_added||0} documenti`);
    setTimeout(()=>location.reload(),800);
  }catch(e){ toast(e.message||'Import non riuscito'); }
}
function confirmDeleteAll(){
  openModal(`
    <button class="modal-close" data-action="closeModal" aria-label="Chiudi">✕</button>
    <div style="font-weight:700;font-size:16px;margin-bottom:6px">Eliminare tutti i tuoi dati?</div>
    <p style="font-size:13px;color:var(--text2);line-height:1.55">Verranno cancellati prove, materie, planner e impostazioni, sia nel browser sia sul server. L'account resta attivo.</p>
    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">
      <button class="btn sm" data-action="closeModal">Annulla</button>
      <button class="btn primary sm" data-action="confirmDeleteAll" style="background:var(--rose);border-color:var(--rose-text)">Elimina tutto</button>
    </div>`);
}
async function deleteAllData(){
  closeModal();
  const t=authToken();
  if(t){ try{ await fetch('/api/state',{method:'DELETE',headers:{'Authorization':'Bearer '+t}}); }catch(e){} }
  try{ localStorage.removeItem('talent_state'); }catch(e){}
  location.reload();
}
document.addEventListener('change',e=>{
  if(e.target.id==='importState'){ importStateFile(e.target.files[0]); e.target.value=''; }
  if(e.target.id==='p-foto'){ previewFile(e.target.files[0],'fotoPreview','image'); }
  if(e.target.id==='p-voce'){ previewFile(e.target.files[0],'vocePreview','audio'); }
});
let saveTimer=null;
let stateReady=false;
function authToken(){ try{ return localStorage.getItem('talent_token'); }catch(e){ return null; } }
function setSaveStatus(status){
  const el=$('saveStatus'); if(!el) return;
  if(status==='saving'){ el.hidden=false; el.textContent='Salvataggio…'; el.className='save-status saving'; }
  else if(status==='saved'){
    el.hidden=false; el.textContent='✓ Salvato'; el.className='save-status saved';
    clearTimeout(el._t); el._t=setTimeout(()=>{ el.hidden=true; },2500);
  }
  else if(status==='error'){ el.hidden=false; el.textContent='Non salvato'; el.className='save-status error'; }
  else { el.hidden=true; }
}
function pushState(){
  if(!stateReady) return;
  const t=authToken(); if(!t){ setSaveStatus('off'); return; }
  setSaveStatus('saving');
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{
    fetch('/api/state',{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+t},
      body:JSON.stringify({state:snapshotState()})})
      .then(r=>setSaveStatus(r.ok?'saved':'error'))
      .catch(()=>setSaveStatus('error'));
  },700);
}
function applySavedState(p){
  if(!p) return;
  state.evidences=p.evidences||[];
  state.diarioFilter=p.diarioFilter===undefined?null:p.diarioFilter;
  state.privacy=p.privacy||state.privacy;
  state.dailyTip=p.dailyTip||state.dailyTip;

  state.theme=p.theme||'light';
  state.streak=p.streak||state.streak;

  state.textSize=p.textSize||'normale';
  if(Array.isArray(p.materie)) state.materie=p.materie;
  if(p.profilo) state.profilo={...state.profilo,...p.profilo};
  if(p.ruolo) state.ruolo=p.ruolo;
  if(Array.isArray(p.planner)) state.planner=p.planner;
  if(Array.isArray(p.docEvidenza)) state.docEvidenza=p.docEvidenza;
  if(p.recapPeriodo) state.recapPeriodo=p.recapPeriodo;
  if(typeof p.isSample==='boolean') state.isSample=p.isSample;
  if(typeof p.sampleBanner==='boolean') state.sampleBanner=p.sampleBanner;
  if(p.portfolioAt) state.portfolioAt=p.portfolioAt;
  if(Array.isArray(p.portfolioSel)) state.portfolioSel=p.portfolioSel;
  if(typeof p.tourDone==='boolean') state.tourDone=p.tourDone;
  if(p.espTab) state.espTab=p.espTab;
  if(typeof p.shareWithTutor==='boolean') state.shareWithTutor=p.shareWithTutor;
  if(p.espFiltro) state.espFiltro=p.espFiltro;

  // Prove salvate prima che esistesse l'ambito: quelle note fuori da scuola, le altre a scuola
  const extra=['e2','e4','e7'];
  state.evidences.forEach(e=>{ if(!e.ambito) e.ambito=extra.includes(e.id)?'extra':'scuola'; });
}
function saveState(){
  pushState();
}
function loadState(){
  /* Lo stato non viene più letto da localStorage: ogni account carica il proprio
     dal server. Così due utenti sullo stesso browser non si vedono i dati. */
}
function applyEmptyState(){
  state.evidences=[]; state.materie=[]; state.planner=[]; state.docEvidenza=[];
  state.prove={}; state.portfolioAt=null; state.diarioFilter=null;
  state.profilo={nome:'',cognome:'',nascita:'',citta:'',email:'',telefono:'',scuola:'',classe:'',
    anno:'',presentazione:'',lingue:'',digitali:'',interessi:'',sport:'',foto:''};
  state.isSample=false; state.sampleBanner=false; state.shareWithTutor=false;
}
async function loadRemoteState(){
  const t=authToken();
  if(t){
    try{
      const r=await fetch('/api/state',{headers:{'Authorization':'Bearer '+t}});
      if(r.status===401){
        try{ localStorage.removeItem('talent_token'); localStorage.removeItem('talent_auth'); localStorage.removeItem('talent_state'); }catch(e){}
        applyEmptyState();
        if(typeof showGate==='function') showGate('login');
      }else if(r.ok){
        const data=await r.json();
        if(data && data.state) applySavedState(data.state); else applyEmptyState();
      }
    }catch(e){ applyEmptyState(); }
  }
  stateReady=true;
  return !!t;
}
function applyVisuals(){
  const theme=state.theme||'light';
  document.documentElement.setAttribute('data-theme',theme);
  document.body.classList.toggle('text-large', state.textSize==='grande');
}
function closeProfile(){ const m=$('profileMenu'); if(m) m.hidden=true; const b=document.querySelector('.profilebtn'); if(b) b.setAttribute('aria-expanded','false'); }
document.addEventListener('click',e=>{
  if(!e.target.closest('.profile')){
    const m=$('profileMenu'); if(m && !m.hidden) m.hidden=true;
  }
});
function renderSampleBanner(){
  const el=$('sampleBanner'); if(!el) return;
  if(!state.sampleBanner){ el.hidden=true; el.innerHTML=''; return; }
  el.hidden=false;
  el.innerHTML='<div class="sb-inner"><div class="sb-txt"><strong>Dati di esempio.</strong> Il passaporto è precaricato per la demo: puoi esplorarlo o partire da zero.</div><div class="sb-actions"><button class="btn primary sm" data-action="startFresh">Inizia da zero</button><button class="btn sm" data-action="hideSample">Ho capito</button></div></div>';
}
function currentUserName(){
  try{ const a=JSON.parse(localStorage.getItem('talent_auth')||'{}'); return (a.user&&(a.user.display_name||a.user.username))||''; }catch(e){ return ''; }
}
function render(){
  state.route=resolveRoute(state.route);
  applyVisuals();
  renderShell();
  renderSampleBanner();
  $('view').innerHTML=ROUTES[state.route]();
  if(state.route==='competenze'){
    const vals=EU.map(c=>scoreOf(c.id));
    if(!state.radarValues) state.radarValues=vals.map(()=>0);
    tweenRadar(vals);
  }
  saveState();
}
loadState();
applyVisuals();
function maybeStartTour(){
  // Il tutorial è imposto al primo accesso e dopo la registrazione: finché non
  // lo si completa (o c'è un avvio forzato) riappare.
  let forced=false;
  try{
    forced=sessionStorage.getItem('talent_tour_force')==='1';
    if(forced) sessionStorage.removeItem('talent_tour_force');
  }catch(e){}
  if((forced || !state.tourDone) && typeof startTour==='function'){ setTimeout(startTour,500); }
}
if(authToken()){
  // Con una sessione attiva si aspetta lo stato del server: niente dati demo
  // di un altro account nemmeno per un istante.
  loadRemoteState().then(()=>{ if(!state.ruolo) showGate('ruolo'); render(); playScan(); maybeStartTour(); });
}else{
  render(); playScan();
}