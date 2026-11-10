/* ---------- APP ---------- */
state.diarioFilter=null;

const ROUTES={
 passaporto:renderPassaporto,
 nuova:renderNuova,
 diario:renderDiario,
 documenti:renderDocumenti,
 voti:renderVoti,
 macroaree:renderMacroaree,
 esposizione:renderEsposizione,
 orientamento:renderOrientamento,
 cv:renderCv,
 recap:renderRecap,
 social:renderSocial,
 portfolio:renderPortfolio,
 privacy:renderPrivacy
};

function render(){
  const r=state.route;
  if(!ROUTES[r]) state.route='passaporto';
  renderShell();
  $('view').innerHTML=ROUTES[state.route]();
  if(state.route==='passaporto'){
    const vals=EU.map(c=>scoreOf(c.id));
    if(!state.radarValues) state.radarValues=vals.map(()=>0);
    tweenRadar(vals);
  }
}

function navigate(hash){
  const r=hash.replace('#/','')||'passaporto';
  state.route=r;
  location.hash='#/'+r;
  render();
}

window.addEventListener('hashchange',()=>{
  const r=location.hash.replace('#/','')||'passaporto';
  if(r!==state.route){ state.route=r; render(); }
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
    state.pending=null; state.prefill=null;
    $('p-titolo').value=''; $('p-desc').value='';
    $('analisi').innerHTML='Compila la prova e premi <strong>Analizza</strong>.';
    return;
  }
  if(a==='conferma'){
    if(!state.pending) return;
    const p=state.pending;
    const ev={id:'e'+Date.now(),ambito:state.pendingAmbito||'scuola',titolo:escHTML(p.titolo),descrizione:escHTML(p.desc),tipo:p.tipo,data:$('p-data').value||'2026-11-10',comp:p.res.comp.map(c=>c.id),dims:p.res.dims,conf:p.res.conf,perche:p.res.perche,corretta:!!p.res.corretta,nuovo:true};
    state.evidences.unshift(ev);
    p.res.comp.forEach(c=>{state.prove[c.id]=(state.prove[c.id]||0)+1;});
    state.pending=null; state.prefill=null; state.pendingAmbito=null;
    toast('Prova aggiunta al tuo diario');
    navigate(ev.ambito==='extra'?'#/esposizione':'#/diario');
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
    const chips=e.comp.map(id=>{const c=EU.find(x=>x.id===id);return '<span class="chip" style="background:'+c.color+'1f;color:'+c.color+'">'+c.short+'</span>';}).join('');
    const dimchips=(e.dims||[]).map(id=>{const d=DIMS.find(x=>x.id===id);return '<span class="chip" style="background:'+d.color+'1f;color:'+d.color+'">'+d.nome+'</span>';}).join('');
    openModal(`
      <button class="modal-close" data-action="closeModal">${icon('plus',16)}</button>
      <div style="font-weight:700;font-size:16px;margin-bottom:4px">${e.titolo}</div>
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">${fmtDate(e.data)} · ${(e.ambito==='extra'?'fuori da scuola':e.ambito==='doc'?'documento':'a scuola')} · ${e.tipo}</div>
      <p style="font-size:13px;color:var(--text);line-height:1.6;margin-bottom:12px">${e.descrizione}</p>
      <div style="margin-bottom:8px"><strong style="font-size:12px">Dimensioni:</strong> <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${dimchips}</div></div>
      <div style="margin-bottom:12px"><strong style="font-size:12px">Competenze:</strong> <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${chips}</div></div>
      <div style="background:var(--surface2);border-radius:12px;padding:12px 14px;font-size:12.5px;color:var(--text2);line-height:1.55"><strong>${e.corretta?'Competenze scelte da te':'Perché l\'AI l\'ha collegata'}:</strong> ${e.perche}.</div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn soft sm" data-action="correggiEv" data-id="${e.id}">Correggi le competenze</button>
        <button class="btn sm" data-action="closeModal">Chiudi</button>
      </div>
    `);
    return;
  }
  if(a==='privacy'){
    const id=el.dataset.val;
    const cb=el.querySelector('input');
    const nv=cb?cb.checked:!state.privacy[id];
    state.privacy[id]=nv;
    render();
    return;
  }
  if(a==='exportData'){ closeProfile(); toast('Esportazione dati avviata (demo)'); return; }
  if(a==='deleteData'){ closeProfile(); toast('Dati cancellati (demo)'); return; }
  if(a==='stampa'){ window.print(); return; }
  if(a==='navigateNuova'){ state.prefill=null; state.pending=null; state.pendingAmbito=el.dataset.ambito||null; navigate('#/nuova'); return; }
  if(a==='apriCv'){ navigate('#/cv'); return; }
  if(a==='openSettings'){ closeProfile(); openModal(renderSettings()); return; }
  if(a==='toggleProfile'){ const m=$('profileMenu'); if(m) m.hidden=!m.hidden; return; }
  if(a==='gotoPrivacy'){ closeProfile(); navigate('#/privacy'); return; }
  if(a==='setTheme'){ state.theme=v; document.documentElement.setAttribute('data-theme',v); render(); return; }
  if(a==='setMood'){ state.mascotMood=v; renderMascot(); render(); return; }
  if(a==='setReduceMotion'){ state.reduceMotion=(v==='on'); applyVisuals(); render(); return; }
  if(a==='setTextSize'){ state.textSize=v; applyVisuals(); render(); return; }
  if(a==='socialTab'){ state.socialTab=v; render(); return; }
  if(a==='sendRequest'){ const u=state.directory.find(x=>x.id===v); if(u){ u.relation='outgoing'; if(!state.requestsOut.includes(v)) state.requestsOut.push(v); toast('Richiesta di amicizia inviata a '+u.name); } render(); return; }
  if(a==='acceptRequest'){ const u=state.directory.find(x=>x.id===v); if(u){ u.relation='friend'; state.requestsIn=state.requestsIn.filter(x=>x!==v); state.chats[v]=state.chats[v]||[]; toast('Hai accettato la richiesta di '+u.name); } render(); return; }
  if(a==='declineRequest'){ const u=state.directory.find(x=>x.id===v); if(u){ u.relation='none'; state.requestsIn=state.requestsIn.filter(x=>x!==v); } render(); return; }
  if(a==='openChat'){ state.activeChat=v; state.socialTab='messages'; render(); return; }
  if(a==='sendMessage'){ const inp=$('msgInput'); const t=inp?inp.value.trim():''; if(!t) return; (state.chats[v]=state.chats[v]||[]).push({from:'me',text:t,time:'adesso'}); if(inp) inp.value=''; render(); return; }
  if(a==='addMateria'){
    openModal(`
      <button class="modal-close" data-action="closeModal">✕</button>
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
    const palette=['#6366f1','#ec4899','#14b8a6','#f59e0b','#8b5cf6','#ef4444','#0ea5e9','#84cc16'];
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
  if(a==='removeMateria'){ state.materie=state.materie.filter(x=>x.id!==v); render(); return; }
  if(a==='rigenera'){ toast('Bozza rigenerata'); render(); return; }
  if(a==='condividi'){
    state.shareWithTutor=true;
    toast('Portfolio condiviso con il tutor');
    render();
    return;
  }
});

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
    const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},signal:ctrl.signal,
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
    <button class="modal-close" data-action="closeModal">✕</button>
    <div style="font-weight:700;font-size:16px;margin-bottom:4px">Correggi le competenze</div>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px;line-height:1.5">Scegli da 1 a 3 competenze che questa prova racconta davvero. Conta il tuo punto di vista.</div>
    <div id="corrComp" style="display:flex;gap:8px;flex-wrap:wrap">
      ${EU.map(c=>`<button class="segbtn comp-toggle ${cur.includes(c.id)?'on':''}" data-action="toggleComp" data-comp="${c.id}" style="--cc:${c.color}">${c.nome}</button>`).join('')}
    </div>
    <div id="corrWarn" class="section-sub" style="color:var(--rose);margin-top:10px" hidden>Scegli da 1 a 3 competenze.</div>
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
  e.comp.forEach(id=>{ state.prove[id]=Math.max(0,(state.prove[id]||0)-1); });
  ids.forEach(id=>{ state.prove[id]=(state.prove[id]||0)+1; });
  e.comp=ids; e.dims=dimsOf(ids); e.perche=perche; e.corretta=true;
  closeModal(); render(); toast('Competenze aggiornate');
}

/* ---------- Profilo dello studente (usato da CV, portfolio e intestazioni) ---------- */
const PROFILE_FIELDS=[
  ['nome','Nome'],['cognome','Cognome'],['nascita','Data di nascita','date'],['citta','Città'],
  ['email','Email','email'],['telefono','Telefono','tel'],['scuola','Scuola'],['classe','Classe'],['anno','Anno scolastico'],
  ['presentazione','Due righe su di te (per il CV)','area'],['lingue','Lingue e livelli','area'],
  ['digitali','Competenze digitali (strumenti, programmi)','area'],['interessi','Interessi e hobby','area']
];
function renderProfileEditor(){
  const p=state.profilo;
  const field=([k,l,t])=>t==='area'
    ?`<div class="form-row"><label for="pf-${k}">${l}</label><textarea id="pf-${k}" rows="2">${escHTML(p[k]||'')}</textarea></div>`
    :`<div class="form-row"><label for="pf-${k}">${l}</label><input id="pf-${k}" type="${t||'text'}" value="${escHTML(p[k]||'')}"/></div>`;
  return `
    <button class="modal-close" data-action="closeModal">✕</button>
    <div style="font-weight:700;font-size:16px;margin-bottom:4px">Il mio profilo</div>
    <div style="font-size:12.5px;color:var(--muted);margin-bottom:14px">Questi dati servono a compilare il CV in automatico. Restano solo su questo dispositivo.</div>
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
  if(!window.askSergio){ toast('Sergio non è disponibile: avvia l\'app con scripts/start.sh'); return; }
  window.askSergio(domanda, contestoProfilo());
}

// init
if(!location.hash) location.hash='#/passaporto';
state.route=location.hash.replace('#/','')||'passaporto';

function saveState(){
  try{
    localStorage.setItem('talent_state', JSON.stringify({
      prove:state.prove, evidences:state.evidences, diarioFilter:state.diarioFilter,
      privacy:state.privacy, dailyTip:state.dailyTip, mascotMood:state.mascotMood,
      theme:state.theme, streak:state.streak, reduceMotion:state.reduceMotion, textSize:state.textSize,
      materie:state.materie, profilo:state.profilo
    }));
  }catch(e){}
}
function loadState(){
  try{
    const raw=localStorage.getItem('talent_state');
    if(raw){
      const p=JSON.parse(raw);
      state.prove=p.prove||state.prove;
      state.evidences=p.evidences||state.evidences;
      state.diarioFilter=p.diarioFilter===undefined?null:p.diarioFilter;
      state.privacy=p.privacy||state.privacy;
      state.dailyTip=p.dailyTip||state.dailyTip;
      state.mascotMood=p.mascotMood||'felice';
      state.theme=p.theme||'light';
      state.streak=p.streak||state.streak;
      state.reduceMotion=!!p.reduceMotion;
      state.textSize=p.textSize||'normale';
      if(Array.isArray(p.materie)) state.materie=p.materie;
      if(p.profilo) state.profilo={...state.profilo,...p.profilo};
      // Prove salvate prima che esistesse l'ambito: quelle note fuori da scuola, le altre a scuola
      const extra=['e2','e4','e7'];
      state.evidences.forEach(e=>{ if(!e.ambito) e.ambito=extra.includes(e.id)?'extra':'scuola'; });
    }
  }catch(e){}
}
function applyVisuals(){
  const theme=state.theme||'light';
  document.documentElement.setAttribute('data-theme',theme);
  document.body.classList.toggle('reduce-motion', !!state.reduceMotion);
  document.body.classList.toggle('text-large', state.textSize==='grande');
}
function closeProfile(){ const m=$('profileMenu'); if(m) m.hidden=true; }
document.addEventListener('click',e=>{
  if(!e.target.closest('.profile')){
    const m=$('profileMenu'); if(m && !m.hidden) m.hidden=true;
  }
});
function render(){
  const r=state.route;
  if(!ROUTES[r]) state.route='passaporto';
  applyVisuals();
  renderShell();
  $('view').innerHTML=ROUTES[state.route]();
  if(state.route==='passaporto'){
    const vals=EU.map(c=>scoreOf(c.id));
    if(!state.radarValues) state.radarValues=vals.map(()=>0);
    tweenRadar(vals);
  }
  saveState();
}
loadState();
applyVisuals();
render();