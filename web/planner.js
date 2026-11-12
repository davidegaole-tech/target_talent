/* ---------- PLANNER: attività future e obiettivi con scadenza, categorizzati da Sergio ---------- */
const PLAN={tipo:'attivita',armed:null,prefill:null};

function oggiISO(){ const d=new Date(); return new Date(d.getTime()-d.getTimezoneOffset()*6e4).toISOString().slice(0,10); }
function giorniA(data){ return Math.round((new Date(data+'T00:00:00')-new Date(oggiISO()+'T00:00:00'))/864e5); }
function quandoTesto(p){
  if(!p.data) return p.tipo==='obiettivo'?'senza scadenza':'data da decidere';
  const g=giorniA(p.data), d=fmtDate(p.data)+' '+p.data.slice(0,4);
  if(p.fatto) return d;
  if(p.tipo==='obiettivo'){
    if(g<0) return `entro il ${d} · scadenza passata`;
    if(g===0) return `entro oggi`;
    return `entro il ${d} · ${g===1?'manca 1 giorno':'mancano '+g+' giorni'}`;
  }
  if(g<0) return `${d} · già passata`;
  if(g===0) return 'oggi';
  if(g===1) return 'domani';
  return `${d} · tra ${g} giorni`;
}

function renderPlanner(){
  const pf=PLAN.prefill||{};
  const attivi=state.planner.filter(p=>!p.fatto);
  const att=attivi.filter(p=>p.tipo!=='obiettivo').sort((a,b)=>(a.data||'9999').localeCompare(b.data||'9999'));
  const obi=attivi.filter(p=>p.tipo==='obiettivo').sort((a,b)=>(a.data||'9999').localeCompare(b.data||'9999'));
  const fatti=state.planner.filter(p=>p.fatto);
  const tipo=pf.tipo||PLAN.tipo;
  return `
  <div class="hero">
    <div>
      <h1>Planner</h1>
      <p>Le attività che farai e gli obiettivi che vuoi raggiungere, con una data. Quando ne aggiungi una, Sergio la collega alle competenze europee.</p>
    </div>
  </div>
  <div class="grid g2" style="align-items:start">
    <div class="card">
      <div class="section-title">Aggiungi</div>
      <div class="section-sub">Un impegno in arrivo o un obiettivo da raggiungere</div>
      <div class="form-row">
        <div class="seg" id="planTipo">
          <button class="segbtn ${tipo!=='obiettivo'?'on':''}" data-action="planTipo" data-val="attivita">${icon('calendar',14)} Attività</button>
          <button class="segbtn ${tipo==='obiettivo'?'on':''}" data-action="planTipo" data-val="obiettivo">${icon('check',14)} Obiettivo</button>
        </div>
      </div>
      <div class="form-row"><label for="pl-titolo">Cosa</label><input id="pl-titolo" placeholder="${tipo==='obiettivo'?'es. Prendere la certificazione B2 di inglese':'es. Open day all\'ITS di Bologna'}" value="${escHTML(pf.titolo||'')}"/></div>
      <div class="form-row"><label for="pl-note">Dettagli (facoltativi)</label><textarea id="pl-note" rows="2" placeholder="Dove, con chi, cosa serve…">${escHTML(pf.note||'')}</textarea></div>
      <div class="form-row"><label for="pl-data" id="pl-data-l">${tipo==='obiettivo'?'Entro il':'Quando'}</label><input id="pl-data" type="date" min="${oggiISO()}"/></div>
      <button class="btn primary sm" data-action="planAdd">Aggiungi al planner</button>
    </div>
    <div>
      ${planSection('In programma','Le prossime attività',att,'Nessuna attività in programma.')}
      ${planSection('Obiettivi','Con la data entro cui vuoi riuscirci',obi,'Nessun obiettivo per ora.')}
      ${fatti.length?`<details class="card plan-done"><summary><span class="section-title">Completati</span> <span class="section-sub">${fatti.length}</span></summary>${fatti.map(planItem).join('')}</details>`:''}
    </div>
  </div>`;
}
function planSection(titolo,sub,lista,vuoto){
  return `<div class="card" style="margin-bottom:16px">
    <div class="section-title">${titolo}</div><div class="section-sub">${sub}</div>
    ${lista.length?lista.map(planItem).join(''):`<p class="section-sub" style="margin-top:6px">${vuoto}</p>`}
  </div>`;
}
function planItem(p){
  const g=p.data?giorniA(p.data):null;
  const urgente=!p.fatto&&g!=null&&g<=7;
  const chips=(p.comp||[]).map(id=>{const c=EU.find(x=>x.id===id);return c?'<span class="chip" style="background:'+c.color+'1f;color:var(--text2)">'+c.short+'</span>':'';}).join('');
  return `
  <div class="plan-item ${p.fatto?'fatto':''}">
    <button class="plan-check ${p.fatto?'on':''}" data-action="planDone" data-id="${p.id}" aria-pressed="${!!p.fatto}" title="${p.fatto?'Segna come da fare':'Segna come fatto'}">${p.fatto?icon('check',14):''}</button>
    <div style="flex:1;min-width:0">
      <div class="plan-t">${escHTML(p.titolo)}</div>
      <div class="plan-q ${urgente?'urgente':''}">${p.tipo==='obiettivo'?'🎯 ':''}${quandoTesto(p)}</div>
      ${p.note?`<div class="plan-n">${escHTML(p.note)}</div>`:''}
      <div class="plan-c">${p.pending?'<span class="ai-loading" style="font-size:11.5px"><span class="ai-spin"></span>Sergio la sta collegando alle competenze…</span>':chips}
        ${!p.pending&&p.fonte==='simulata'?'<span class="plan-src">categorizzata in automatico: Sergio non era disponibile</span>':''}</div>
      ${p.fatto&&!p.raccontata?`<button class="btn soft sm" style="margin-top:8px" data-action="planRacconta" data-id="${p.id}">Racconta com'è andata</button>`:''}
    </div>
    <button class="plan-del ${PLAN.armed===p.id?'armed':''}" data-action="planDel" data-id="${p.id}" title="Elimina">${PLAN.armed===p.id?'Elimina?':'✕'}</button>
  </div>`;
}

async function planCategorizza(item){
  try{
    const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({title:item.titolo,description:item.note||'',kind:'piano'})});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'errore');
    Object.assign(item,{comp:data.comp.map(c=>c.id),perche:data.perche,fonte:'modello'});
  }catch(e){
    const sim=analizza(item.titolo+' '+(item.note||''));
    Object.assign(item,{comp:sim.comp.map(c=>c.id),perche:sim.perche,fonte:'simulata'});
  }
  item.pending=false;
  if(state.route==='planner') render(); else saveState();
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]'); if(!el) return;
  const a=el.dataset.action, id=el.dataset.id;
  if(a==='planTipo'){
    PLAN.tipo=el.dataset.val; if(PLAN.prefill) PLAN.prefill.tipo=PLAN.tipo;
    document.querySelectorAll('#planTipo .segbtn').forEach(b=>b.classList.toggle('on',b===el));
    const l=$('pl-data-l'); if(l) l.textContent=PLAN.tipo==='obiettivo'?'Entro il':'Quando';
  }
  else if(a==='planAdd'){
    const titolo=$('pl-titolo').value.trim();
    if(!titolo){ toast('Scrivi cosa vuoi fare'); $('pl-titolo').focus(); return; }
    const item={id:'p'+Date.now(),tipo:PLAN.prefill?.tipo||PLAN.tipo,titolo,note:$('pl-note').value.trim(),data:$('pl-data').value||'',comp:[],pending:true,fatto:false};
    state.planner.push(item); PLAN.prefill=null; render();
    toast(item.tipo==='obiettivo'?'Obiettivo aggiunto':'Attività aggiunta');
    planCategorizza(item);
  }
  else if(a==='planDone'){
    const p=state.planner.find(x=>x.id===id); if(!p) return;
    p.fatto=!p.fatto; render(); if(p.fatto) toast(p.tipo==='obiettivo'?'Obiettivo raggiunto, complimenti!':'Fatto!');
  }
  else if(a==='planDel'){
    if(PLAN.armed!==id){ PLAN.armed=id; render(); clearTimeout(planDelTimer); planDelTimer=setTimeout(()=>{PLAN.armed=null; if(state.route==='planner') render();},3500); return; }
    PLAN.armed=null; state.planner=state.planner.filter(x=>x.id!==id); render(); toast('Eliminata');
  }
  else if(a==='planRacconta'){
    const p=state.planner.find(x=>x.id===id); if(!p) return;
    p.raccontata=true;
    state.prefill={titolo:p.titolo,desc:p.note||''}; state.pendingAmbito=null; navigate('#/nuova');
  }
  else if(a==='planFromMigliora'){
    const c=EU.find(x=>x.id===el.dataset.val); closeModal();
    PLAN.prefill={tipo:'obiettivo',titolo:'Migliorare: '+(c?c.nome.toLowerCase():''),note:(MIGLIORA[el.dataset.val]||{}).testo||''};
    navigate('#/planner');
  }
});
let planDelTimer=null;
// Attività rimaste "in categorizzazione" (pagina chiusa nel frattempo): riprova al caricamento
window.addEventListener('load',()=>{ (state.planner||[]).filter(p=>p.pending).forEach(planCategorizza); });
