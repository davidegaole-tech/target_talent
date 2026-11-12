/* ---------- Guida "Come funziona": passi chiari, una sezione alla volta ---------- */
const TOUR_ALL_STEPS=[
  {target:'.nav-item[data-route="passaporto"]',title:'Il passaporto',
   text:'È la tua carta d\'identità: foto, scuola, presentazione e i titoli che ti sei guadagnato. Lo vedono gli altri, lo modifichi solo tu.'},
  {target:'.nav-item[data-route="competenze"]',title:'Le competenze',
   text:'Il radar delle 8 competenze europee. Cresce ogni volta che aggiungi una prova: sotto il 60% trovi un\'idea concreta per migliorare.'},
  {target:'.nav-item[data-route="orientamento"]',title:'L\'orientamento',
   text:'ITS, università o mestiere: le direzioni si calcolano dalle tue prove, non da un test della personalità.'},
  {target:'.nav-item[data-route="planner"]',title:'Il planner',
   text:'Attività e obiettivi con una data. Quando ne aggiungi uno, Sergio lo collega da solo alle competenze giuste.'},
  {target:'.nav-item[data-route="esperienze"]',title:'Esperienze e certificati',
   text:'Due cose soltanto: quello che hai fatto e quello che puoi documentare. La stella mette in evidenza ciò che conta nel passaporto.'},
  {target:'.nav-item[data-route="appunti"]',title:'Appunti e voti',
   text:'Carica appunti e chiedi a Sergio riassunti, quiz e flashcard. Qui sotto trovi anche le materie con medie e andamento.'},
  {target:'.nav-item[data-route="portfolio"]',title:'CV e portfolio',
   text:'Si compila da solo con le tue prove: scegli le attività e scarica il CV in PDF, nel formato europeo.'},
  {target:'.switch-row',openSettings:true,title:'Le impostazioni',
   text:'Tema, testo grande e il permesso per <strong>migliorare l\'AI con i tuoi dati</strong>. Resta tutto sul tuo computer.'},
  {title:'Adesso tocca a te',center:true,last:true,
   text:'Aggiungi la prima attività: un progetto, uno sport, un volontariato. Bastano trenta secondi e il passaporto inizia a prendere forma.'}
];
let TOUR_STEPS=TOUR_ALL_STEPS;

const TOUR={i:0,startRoute:null,root:null};

function startTour(){
  TOUR_STEPS=TOUR_ALL_STEPS.filter(st=>!st.target||!st.target.includes('nav-item')||document.querySelector(st.target));
  TOUR.i=0; TOUR.startRoute=state.route;
  if(!TOUR.root){
    TOUR.root=document.createElement('div');
    TOUR.root.className='tour';
    TOUR.root.innerHTML='<div class="tour-hole"></div><div class="tour-card" role="dialog" aria-modal="true" aria-labelledby="tourTitle"></div>';
    document.body.appendChild(TOUR.root);
  }
  TOUR.root.hidden=false; document.body.classList.add('tour-on');
  showTourStep();
}
function endTour(goTo, completed){
  if(!TOUR.root) return;
  TOUR.root.hidden=true; document.body.classList.remove('tour-on');
  if(typeof closeModal==='function') closeModal();
  if(completed){
    state.tourDone=true;
    if(typeof saveState==='function') saveState();
  }
  const back=goTo||TOUR.startRoute;
  if(back && state.route!==back) navigate('#/'+back);
  const b=document.querySelector('.tour-btn'); if(b) b.focus();
}
function tourGo(d){
  const n=TOUR.i+d;
  if(n<0) return;
  if(n>=TOUR_STEPS.length){ endTour(undefined,true); return; }
  const prev=TOUR_STEPS[TOUR.i];
  if(prev.openSettings && typeof closeModal==='function') closeModal();
  TOUR.i=n; showTourStep();
}

function showTourStep(){
  const step=TOUR_STEPS[TOUR.i];
  if(step.route && state.route!==step.route) navigate('#/'+step.route);
  if(step.openSettings && typeof openModal==='function' && typeof renderSettings==='function'){
    const modal=document.getElementById('modalRoot');
    if(!modal || !modal.classList.contains('on') || !modal.querySelector('.settings')) openModal(renderSettings());
  }
  const card=TOUR.root.querySelector('.tour-card');
  card.innerHTML=`
    <div class="tour-count">Passo ${TOUR.i+1} di ${TOUR_STEPS.length}</div>
    <div class="tour-title" id="tourTitle">${step.title}</div>
    <p class="tour-text">${step.text}</p>
    <div class="tour-dots">${TOUR_STEPS.map((_,k)=>`<span class="${k===TOUR.i?'on':''}"></span>`).join('')}</div>
    <div class="tour-actions">
      <span style="flex:1"></span>
      ${TOUR.i>0?'<button class="btn sm" data-tour="prev">Indietro</button>':''}
      ${step.last?`<button class="btn sm" data-tour="fine">Fine</button>
                   <button class="btn primary sm" data-tour="start">Aggiungi la prima attività</button>`
                 :`<button class="btn primary sm" data-tour="next">${TOUR.i===0?'Iniziamo':'Avanti'}</button>`}
    </div>`;
  requestAnimationFrame(()=>{ placeTour(); card.querySelector('[data-tour="next"],[data-tour="start"]')?.focus(); });
}

function placeTour(){
  if(!TOUR.root || TOUR.root.hidden) return;
  const step=TOUR_STEPS[TOUR.i];
  const hole=TOUR.root.querySelector('.tour-hole'), card=TOUR.root.querySelector('.tour-card');
  const el=step.center?null:(step.target?document.querySelector(step.target):null);
  const vw=window.innerWidth, vh=window.innerHeight, pad=6, gap=14, m=12;
  const cw=card.offsetWidth, ch=card.offsetHeight;
  if(!el || !el.getClientRects().length){
    TOUR.root.classList.add('tour-center'); hole.style.cssText='';
    card.style.left=Math.max(m,(vw-cw)/2)+'px'; card.style.top=Math.max(m,(vh-ch)/2)+'px';
    return;
  }
  TOUR.root.classList.remove('tour-center');
  el.scrollIntoView({block:'nearest',inline:'nearest'});
  const r=el.getBoundingClientRect();
  hole.style.cssText=`left:${r.left-pad}px;top:${r.top-pad}px;width:${r.width+pad*2}px;height:${r.height+pad*2}px`;
  let left, top;
  if(r.right+gap+cw+m<=vw){ left=r.right+gap; top=r.top+r.height/2-ch/2; }
  else if(r.bottom+gap+ch+m<=vh){ left=r.left+r.width/2-cw/2; top=r.bottom+gap; }
  else if(r.top-gap-ch-m>=0){ left=r.left+r.width/2-cw/2; top=r.top-gap-ch; }
  else { left=r.left-gap-cw; top=r.top+r.height/2-ch/2; }
  card.style.left=Math.min(Math.max(m,left),vw-cw-m)+'px';
  card.style.top=Math.min(Math.max(m,top),vh-ch-m)+'px';
}

document.addEventListener('click',e=>{
  if(e.target.closest('[data-action="startTour"]')){ startTour(); return; }
  const b=e.target.closest('[data-tour]'); if(!b) return;
  const t=b.dataset.tour;
  if(t==='next') tourGo(1);
  else if(t==='prev') tourGo(-1);
  else if(t==='fine') endTour(undefined,true);
  else if(t==='start') endTour('nuova',true);
});
document.addEventListener('keydown',e=>{
  if(!TOUR.root || TOUR.root.hidden) return;
  if(e.key==='Escape'){ e.stopPropagation(); endTour(); }
  else if(e.key==='ArrowRight') tourGo(1);
  else if(e.key==='ArrowLeft') tourGo(-1);
},true);
window.addEventListener('resize',placeTour);
window.addEventListener('scroll',placeTour,true);
