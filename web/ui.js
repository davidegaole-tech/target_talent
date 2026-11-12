/* ---------- UI HELPERS ---------- */
function $(id){return document.getElementById(id);}
function escHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function safeHref(url){ try{ const u=new URL(String(url), location.origin); if(u.protocol==='http:'||u.protocol==='https:') return escHTML(u.href); }catch(e){} return '#'; }
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('on'),2800);}
function openModal(html){const r=$('modalRoot');r.innerHTML='<div class="modal-backdrop" data-action="closeModal"></div><div class="modal-card" role="dialog" aria-modal="true">'+html+'</div>';r.classList.add('on');document.body.classList.add('modal-on');}
function closeModal(){const r=$('modalRoot');r.classList.remove('on');r.innerHTML='';document.body.classList.remove('modal-on');}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){ closeModal(); const pm=document.getElementById('profileMenu'); if(pm){ pm.hidden=true; const b=document.querySelector('.profilebtn'); if(b) b.setAttribute('aria-expanded','false'); } }
});
document.addEventListener('click',e=>{if(e.target.closest('[data-action="closeModal"]'))closeModal();});

function ringSVG(pct,size=86){
 const r=(size-10)/2,c=2*Math.PI*r;
 return '<svg viewBox="0 0 '+size+' '+size+'"><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="var(--track)" stroke-width="8"/><circle cx="'+(size/2)+'" cy="'+(size/2)+'" r="'+r+'" fill="none" stroke="var(--accent)" stroke-width="8" stroke-dasharray="'+c+'" stroke-dashoffset="'+(c*(1-pct/100))+'" transform="rotate(-90 '+(size/2)+' '+(size/2)+')" stroke-linecap="round"/></svg>';
}
function radarSVG(values,size=360,labels=EU){
 const cx=size/2,cy=size/2,R=size*0.30;
 const n=labels.length;
 let grid='',axes='',lbls='',dots='';
 [0.25,0.5,0.75,1].forEach(f=>{
  const pts=[...Array(n)].map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;return (cx+R*f*Math.cos(a)).toFixed(1)+','+(cy+R*f*Math.sin(a)).toFixed(1);}).join(' ');
  grid+='<polygon points="'+pts+'" fill="none" stroke="var(--track)" stroke-width="1"/>';
 });
 labels.forEach((c,i)=>{
  const a=-Math.PI/2+i*2*Math.PI/n;
  const x=cx+R*Math.cos(a),y=cy+R*Math.sin(a);
  axes+='<line x1="'+cx+'" y1="'+cy+'" x2="'+x.toFixed(1)+'" y2="'+y.toFixed(1)+'" stroke="var(--line)"/>';
  const lr=R+24;
  const lx=cx+lr*Math.cos(a),ly=cy+lr*Math.sin(a);
  const anchor=Math.abs(Math.cos(a))<0.2?'middle':(Math.cos(a)>0?'start':'end');
  const color=c.color||'#64748b';
  lbls+='<text x="'+lx.toFixed(1)+'" y="'+(ly+4).toFixed(1)+'" text-anchor="'+anchor+'" font-size="11" fill="var(--text2)" font-weight="600">'+c.short+'</text>';
  const v=(values[i]||0)/100;
  const px=cx+R*v*Math.cos(a),py=cy+R*v*Math.sin(a);
  dots+='<circle cx="'+px.toFixed(1)+'" cy="'+py.toFixed(1)+'" r="4" fill="'+(c.color||'#4f46e5')+'" stroke="#fff" stroke-width="2"/>';
 });
 const poly=[...Array(n)].map((_,i)=>{const a=-Math.PI/2+i*2*Math.PI/n;const v=(values[i]||0)/100;return (cx+R*v*Math.cos(a)).toFixed(1)+','+(cy+R*v*Math.sin(a)).toFixed(1);}).join(' ');
 const fill=labels.length===3?'rgba(91,75,138,.12)':'rgba(11,59,102,.12)';
 const stroke=labels.length===3?'#5b4b8a':'#0b3b66';
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
   {r:'competenze',l:'Competenze',i:'trend'},
   {r:'orientamento',l:'Orientamento',i:'compass'},
   {r:'planner',l:'Planner',i:'calendar'},
   {r:'esperienze',l:'Esperienze e certificati',i:'file'},
   {r:'appunti',l:haVoti()?'Appunti e voti':'Appunti',i:'text'},
   {r:'portfolio',l:'CV e portfolio',i:'share'}
  ].filter(Boolean);
  const attiva=r=>state.route===r||(r==='esperienze'&&state.route==='nuova')||(r==='appunti'&&state.route==='voti')||(r==='portfolio'&&state.route==='cv');
  return `
  <div class="brand">
    <img class="brand-logo" src="img/logo.png" alt="" width="36" height="36"/>
    <div class="brand-text">
      <div class="brand-name">Talent Radar</div>
    </div>
  </div>
  <div class="nav-label">Navigazione</div>
  <nav class="nav">
    ${nav.map(n=>'<a class="nav-item '+(attiva(n.r)?'on':'')+'" href="#/'+n.r+'" data-route="'+n.r+'" aria-label="'+n.l+'"'+(attiva(n.r)?' aria-current="page"':'')+'>'+icon(n.i,17)+'<span>'+n.l+'</span></a>').join('')}
  </nav>
  <button class="nav-item tour-btn" data-action="startTour" aria-label="Come funziona">${icon('help',17)}<span>Come funziona</span></button>
  <div class="side-foot">${state.isSample?'Dati di esempio · prototipo':'Dati sul tuo computer'}<br/>Talent Radar</div>`;
}
function topbarHTML(){
  const meta={
   passaporto:['Passaporto','Il tuo profilo pubblico'],
   competenze:['Competenze','Le 8 competenze chiave europee'],
   planner:['Planner','Attività e obiettivi in programma'],
   esperienze:['Esperienze e certificati','Quello che hai fatto e quello che puoi documentare'],
   nuova:['Nuova esperienza','Racconta qualcosa che hai fatto'],
   appunti:haVoti()?['Appunti e voti','I tuoi appunti, con Sergio · materie e andamento']:['Appunti','I tuoi appunti, con Sergio'],
  portfolio:['CV e portfolio','Generati dalle tue esperienze'],
   cv:['Il tuo CV','Compilato dal tuo profilo'],
   orientamento:['Orientamento','Direzioni coerenti con il tuo profilo']
  }[state.route]||['Talent Radar',''];
  return `
  <div>
    <div class="tb-title">${escHTML(meta[0])}</div>
    <div class="tb-sub">${escHTML(meta[1])}</div>
  </div>
  <div class="tb-right">
    ${state.isSample?'<span class="chip">Demo</span>':''}
    <span class="save-status" id="saveStatus" hidden></span>
    <div class="profile">
      <button class="profilebtn" data-action="toggleProfile" aria-haspopup="menu" aria-expanded="false" aria-label="${escHTML(iniziali())} — menu profilo">
        <div class="avatar" aria-hidden="true">${state.profilo.foto?`<img class="avatar-img" src="${escHTML(fileUrl(state.profilo.foto))}" alt=""/>`:escHTML(iniziali())}</div>
        <svg class="chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div class="profile-menu" id="profileMenu" hidden>
        <div class="pm-head">
          <div class="pm-name">${escHTML(nomeCompleto())}</div>
          <div class="pm-sub">${escHTML(classeScuola())}</div>
        </div>
        <button class="pm-item" data-action="editProfile">${icon('users',16)}<span>Il mio profilo</span></button>
        <button class="pm-item" data-action="openSettings">${icon('sparkles',16)}<span>Impostazioni</span></button>
        <div class="pm-sep"></div>
        <button class="pm-item" data-action="exportData">${icon('file',16)}<span>Esporta i miei dati</span></button>
        <button class="pm-item" data-action="importData">${icon('file',16)}<span>Importa i miei dati</span></button>
        <button class="pm-item pm-danger" data-action="deleteData">${icon('alert',16)}<span>Elimina tutti i dati</span></button>
        <div class="pm-sep"></div>
        <button class="pm-item" data-action="logout">${icon('arrow',16)}<span>Esci</span></button>
      </div>
    </div>
  </div>`;
}
function renderShell(){
  $('sidebar').innerHTML=sidebarHTML();
  $('topbar').innerHTML=topbarHTML();
  renderMascot();
}
/* La nuvoletta di Sergio resta 10 secondi dalla prima comparsa, poi sparisce fino al prossimo caricamento. */
const MASCOT_BUBBLE_MS=10000;
let mascotBubbleUntil=null;
function renderMascot(){
  let m=$('mascot');
  if(!m){ m=document.createElement('div'); m.id='mascot'; m.className='mascot'; document.body.appendChild(m); }
  // Il conto parte solo quando Sergio si vede davvero (dopo il login, non dietro la schermata di accesso)
  let logged=false; try{ logged=!!localStorage.getItem('talent_token'); }catch(e){}
  if(mascotBubbleUntil===null && logged && !document.body.classList.contains('gate-on')){
    mascotBubbleUntil=Date.now()+MASCOT_BUBBLE_MS;
    setTimeout(()=>{
      const b=document.querySelector('#mascot .mascot-bubble'); if(!b) return;
      b.classList.add('mascot-bubble-out');
      setTimeout(()=>b.remove(),400);
    },MASCOT_BUBBLE_MS);
  }
  const showBubble=mascotBubbleUntil===null||Date.now()<mascotBubbleUntil;
  const tips=[state.dailyTip,'Ciao! Sono Sergio: se hai un dubbio, cliccami.','Hai fatto qualcosa di bello ultimamente? Puoi raccontarlo qui.','Anche un hobby racconta chi sei.'];
  const tip=tips[Math.floor(Math.random()*tips.length)];
  m.innerHTML=(showBubble?'<div class="mascot-bubble">'+tip+'</div>':'')+'<button class="mascot-panda" title="Parla con Sergio" aria-label="Parla con Sergio" onclick="toggleTutor()"><img src="img/sergio.png" alt="" width="64" height="64"/></button>';
}