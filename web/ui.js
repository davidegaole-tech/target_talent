/* ---------- UI HELPERS ---------- */
function $(id){return document.getElementById(id);}
function escHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),2800);}
function openModal(html){const r=$('modalRoot');r.innerHTML='<div class="modal-backdrop" data-action="closeModal"></div><div class="modal-card">'+html+'</div>';r.classList.add('on');}
function closeModal(){const r=$('modalRoot');r.classList.remove('on');r.innerHTML='';}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal(); if(e.target && e.target.id==='msgInput' && e.key==='Enter'){ e.preventDefault(); const b=document.querySelector('[data-action="sendMessage"]'); if(b) b.click(); }});
document.addEventListener('input',e=>{
  if(e.target.id==='socialSearch'){
    const q=e.target.value.toLowerCase();
    document.querySelectorAll('#dirList .trow').forEach(r=>{ r.style.display = (r.dataset.name||'').includes(q) ? '' : 'none'; });
  }
});
document.addEventListener('click',e=>{if(e.target.closest('[data-action="closeModal"]'))closeModal();});

function ringSVG(pct,size=86){
 const r=(size-10)/2,c=2*Math.PI*r;
 return '<svg viewBox="0 0 '+size+' '+size+'"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#6366f1"/><stop offset="1" stop-color="#a855f7"/></linearGradient></defs><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="#e8eaf2" stroke-width="8"/><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="url(#g)" stroke-width="8" stroke-dasharray="'+c+'" stroke-dashoffset="'+(c*(1-pct/100))+'" transform="rotate(-90 '+(size/2)+' '+(size/2)+')" stroke-linecap="round"/></svg>';
}
function radarSVG(values,size=360,labels=EU){
 const cx=size/2,cy=size/2,R=size*0.30;
 const n=labels.length;
 let grid='',axes='',lbls='',dots='';
 [0.25,0.5,0.75,1].forEach(f=>{
  const pts=[...Array(n)].map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return (cx+R*f*Math.cos(a)).toFixed(1)+','+(cy+R*f*Math.sin(a)).toFixed(1);}).join(' ');
  grid+='<polygon points="'+pts+'" fill="none" stroke="#e8eaf2" stroke-width="1"/>';
 });
 labels.forEach((c,i)=>{
  const a=-Math.PI/2+i*2*Math.PI/n;
  const x=cx+R*Math.cos(a),y=cy+R*Math.sin(a);
  axes+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="#eceef5"/>';
  const lr=R+24;
  const lx=cx+lr*Math.cos(a),ly=cy+lr*Math.sin(a);
  const anchor=Math.abs(Math.cos(a))<0.2?'middle':(Math.cos(a)>0?'start':'end');
  const color=c.color||'#64748b';
  lbls+='<text x="'+lx.toFixed(1)+'" y="'+(ly+4).toFixed(1)+'" text-anchor="'+anchor+'" font-size="11" fill="'+color+'" font-weight="600">'+c.short+'</text>';
  const v=(values[i]||0)/100;
  const px=cx+R*v*Math.cos(a),py=cy+R*v*Math.sin(a);
  dots+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4" fill="'+(c.color||'#4f46e5')+'" stroke="#fff" stroke-width="2"/>';
 });
 const poly=[...Array(n)].map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;const v=(values[i]||0)/100;return (cx+R*v*Math.cos(a)).toFixed(1)+','+(cy+R*v*Math.sin(a)).toFixed(1);}).join(' ');
 const fill=labels.length===3?'rgba(139,92,246,.15)':'rgba(79,70,229,.15)';
 const stroke=labels.length===3?'#8b5cf6':'#4f46e5';
 return '<svg viewBox="-30 -10 '+(size+60)+' '+(size+20)+'" width="100%" style="max-width:360px">'+grid+axes+'<polygon points="'+poly+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="2" stroke-linejoin="round"/>'+dots+lbls+'</svg>';
}
function tweenRadar(target,labels=EU){
  const wrap=$('radarWrap'); if(!wrap) return;
  const from = state.radarValues ? state.radarValues.slice() : target.map(()=>0);
  const t0=performance.now(),dur=720;
  function step(now){
    const t=Math.min(1,(now-t0)/dur);
    const e=1-Math.pow(1-t,3);
    const vals=target.map((v,i)=>Math.round(from[i]+(v-from[i])*e));
    wrap.innerHTML=radarSVG(vals,360,labels);
    if(t<1) requestAnimationFrame(step); else { state.radarValues=vals.slice(); }
  }
  requestAnimationFrame(step);
}
function sidebarHTML(){
  const nav=[
   {r:'passaporto',l:'Passaporto',i:'passport'},
   {r:'diario',l:'Diario',i:'list'},
   {r:'macroaree',l:'Macro-aree',i:'trend'},
   {r:'esposizione',l:'Esperienze e sport',i:'image'},
   {r:'orientamento',l:'Orientamento',i:'compass'},
   {r:'portfolio',l:'Documenti',i:'file'},
   {r:'social',l:'Amici',i:'users'},
   {r:'privacy',l:'Cassaforte',i:'lock'}
  ];
  return `
  <div class="brand">
    <div class="brand-mark">${icon('sparkles',20)}</div>
    <div class="brand-text">
      <div class="brand-name">Talent Passport</div>
      <div class="brand-sub">Radar engine</div>
    </div>
  </div>
  <div class="nav-label">Navigazione</div>
  <nav class="nav">
    ${nav.map(n=>'<a class="nav-item '+(state.route===n.r?'on':'')+'" href="#/'+n.r+'" data-route="'+n.r+'">'+icon(n.i,17)+'<span>'+n.l+'</span></a>').join('')}
  </nav>
  <div class="side-foot">Prototipo demo<br/>Dati di esempio · Tutor AI locale<br/>GDPR: dati fittizi</div>`;
}
function topbarHTML(){
  const meta={
   passaporto:['Il tuo Passaporto','Giulia Ferrari · 4B Liceo Scienze Applicate'],
   diario:['Diario delle prove','22 prove raccolte'],
   macroaree:['Panoramica macro-aree','Le tue competenze raggruppate'],
   esposizione:['Area esposizione','Esperienze e sport in vetrina'],
   orientamento:['Orientamento','Direzioni coerenti con il tuo profilo'],
   social:['Amici','Cerca utenti, richieste e messaggi'],
   portfolio:['E-Portfolio','Bozza generata automaticamente'],
   privacy:['Cassaforte','Decidi tu cosa vede il tutor']
  }[state.route]||['Talent Passport',''];
  return `
  <div>
    <div class="tb-title">${meta[0]}</div>
    <div class="tb-sub">${meta[1]}</div>
  </div>
  <div class="tb-right">
    <span class="chip">Demo</span>
    <button class="btn soft sm" data-action="openSettings" title="Impostazioni" style="padding:8px 10px">&#9881;&#65039;</button>
    <div class="avatar">GF</div>
  </div>`;
}
function renderShell(){
  $('sidebar').innerHTML=sidebarHTML();
  $('topbar').innerHTML=topbarHTML();
  renderMascot();
}
function renderMascot(){
  let m=$('mascot');
  if(!m){ m=document.createElement('div'); m.id='mascot'; m.className='mascot'; document.body.appendChild(m); }
  const tips={
    felice:[state.dailyTip,'Streak attuale: '+state.streak+' giorni!','Aggiungi una prova oggi per far crescere il tuo passaporto.','Sei sulla strada giusta!'],
    curioso:['Cosa ti incuriosisce oggi? Prova a documentare un nuovo hobby.','Streak attuale: '+state.streak+' giorni! Scopri una nuova competenza.','Il tuo amico AI ha una curiosità: quale sport o arte vuoi esplorare?']
  };
  const list=Object.keys(tips).includes(state.mascotMood)?tips[state.mascotMood]:tips.felice;
  const tip=list[Math.floor(Math.random()*list.length)];
  const mood=state.mascotMood==='curioso'?'🤔':'😊';
  m.innerHTML='<div class="mascot-bubble">'+tip+'</div><div class="mascot-panda" title="Panda studioso · apri il tutor AI" onclick="toggleTutor()">'+mood+'</div>';
}