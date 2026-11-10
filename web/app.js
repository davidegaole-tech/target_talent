/* ---------- APP ---------- */
state.diarioFilter=null;

const ROUTES={
 passaporto:renderPassaporto,
 nuova:renderNuova,
 diario:renderDiario,
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
    const res=analizza(titolo+' '+desc);
    state.pending={titolo,desc,tipo,res};
    $('analisi').innerHTML=renderAnalisi(res);
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
    const ev={id:'e'+Date.now(),titolo:p.titolo,descrizione:p.desc,tipo:p.tipo,data:$('p-data').value||'2026-11-10',comp:p.res.comp.map(c=>c.id),dims:p.res.dims,conf:p.res.conf,perche:p.res.perche,nuovo:true};
    state.evidences.unshift(ev);
    p.res.comp.forEach(c=>{state.prove[c.id]=(state.prove[c.id]||0)+1;});
    state.pending=null; state.prefill=null;
    toast('Prova aggiunta: il tuo stile si è aggiornato');
    navigate('#/passaporto');
    return;
  }
  if(a==='correggi'){ toast('Modalità correzione: clicca una competenza per rimuoverla'); return; }
  if(a==='mission'){
    state.prefill={titolo:v,desc:'Sfida accettata: '+v};
    navigate('#/nuova');
    return;
  }
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
      <div style="font-size:11.5px;color:var(--muted);margin-bottom:12px">${fmtDate(e.data)} · ${e.tipo} · confidenza ${e.conf}</div>
      <p style="font-size:13px;color:#374151;line-height:1.6;margin-bottom:12px">${e.descrizione}</p>
      <div style="margin-bottom:8px"><strong style="font-size:12px">Dimensioni:</strong> <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${dimchips}</div></div>
      <div style="margin-bottom:12px"><strong style="font-size:12px">Competenze:</strong> <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">${chips}</div></div>
      <div style="background:#f6f7fb;border-radius:12px;padding:12px 14px;font-size:12.5px;color:#4b5563;line-height:1.55"><strong>Perché l'AI l'ha collegata:</strong> ${e.perche}.</div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="btn soft sm" data-action="closeModal">Correggi</button>
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
  if(a==='exportData'){ toast('Esportazione dati avviata (demo)'); return; }
  if(a==='deleteData'){ toast('Dati cancellati (demo)'); return; }
  if(a==='stampa'){ window.print(); return; }
  if(a==='navigateNuova'){ state.prefill=null; navigate('#/nuova'); return; }
  if(a==='apriCv'){ navigate('#/cv'); return; }
  if(a==='openSettings'){ openModal(renderSettings()); return; }
  if(a==='setTheme'){ state.theme=v; document.documentElement.setAttribute('data-theme',v); render(); return; }
  if(a==='setMood'){ state.mascotMood=v; renderMascot(); render(); return; }
  if(a==='socialTab'){ state.socialTab=v; render(); return; }
  if(a==='sendRequest'){ const u=state.directory.find(x=>x.id===v); if(u){ u.relation='outgoing'; if(!state.requestsOut.includes(v)) state.requestsOut.push(v); toast('Richiesta di amicizia inviata a '+u.name); } render(); return; }
  if(a==='acceptRequest'){ const u=state.directory.find(x=>x.id===v); if(u){ u.relation='friend'; state.requestsIn=state.requestsIn.filter(x=>x!==v); state.chats[v]=state.chats[v]||[]; toast('Hai accettato la richiesta di '+u.name); } render(); return; }
  if(a==='declineRequest'){ const u=state.directory.find(x=>x.id===v); if(u){ u.relation='none'; state.requestsIn=state.requestsIn.filter(x=>x!==v); } render(); return; }
  if(a==='openChat'){ state.activeChat=v; state.socialTab='messages'; render(); return; }
  if(a==='sendMessage'){ const inp=$('msgInput'); const t=inp?inp.value.trim():''; if(!t) return; (state.chats[v]=state.chats[v]||[]).push({from:'me',text:t,time:'adesso'}); if(inp) inp.value=''; render(); return; }
  if(a==='rigenera'){ toast('Bozza rigenerata'); render(); return; }
  if(a==='condividi'){
    state.shareWithTutor=true;
    toast('Portfolio condiviso con il tutor');
    render();
    return;
  }
});

// init
if(!location.hash) location.hash='#/passaporto';
state.route=location.hash.replace('#/','')||'passaporto';

function saveState(){
  try{
    localStorage.setItem('talent_state', JSON.stringify({
      prove:state.prove, evidences:state.evidences, diarioFilter:state.diarioFilter,
      privacy:state.privacy, dailyTip:state.dailyTip, mascotMood:state.mascotMood,
      theme:state.theme, streak:state.streak
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
    }
  }catch(e){}
}
function applyVisuals(){
  const theme=state.theme||'light';
  document.documentElement.setAttribute('data-theme',theme);
}
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