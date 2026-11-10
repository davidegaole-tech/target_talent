/* ---------- Guida "Come funziona": un passo alla volta, evidenzia un elemento e lo spiega ---------- */
const TOUR_ALL_STEPS=[
  {title:'Benvenuto in Talent Radar 👋',
   text:'Qui racconti chi sei: esperienze, certificati, sport, hobby. In un minuto ti mostro a cosa servono le sezioni.'},
  {route:'passaporto',target:'.nav-item[data-route="passaporto"]',title:'Passaporto',
   text:'Il tuo profilo pubblico: chi sei, dove studi, i tuoi <strong>titoli</strong>, le competenze, sport e hobby. Gli altri lo vedono, ma solo tu puoi modificarlo.'},
  {target:'.nav-item[data-route="competenze"]',title:'Competenze',
   text:'Le 8 competenze chiave europee con il radar e le percentuali. Dove sei più indietro trovi il pulsante <strong>Migliora</strong>.'},
  {target:'.nav-item[data-route="planner"]',title:'Planner',
   text:'Attività future e obiettivi con una data. Sergio le collega da solo alle competenze.'},
  {target:'.nav-item[data-route="esperienze"]',title:'Certificazioni ed esperienze',
   text:'Scrivi le tue esperienze e carica certificati e attestati. Con ★ scegli cosa mettere in evidenza nel passaporto.'},
  {target:'.nav-item[data-route="appunti"]',title:'Appunti',
   text:'Carica i tuoi appunti e chiedi a Sergio riassunti, quiz e flashcard per ripassare.'},
  {target:'.nav-item[data-route="voti"]',title:'Voti',
   text:'Le tue materie e i voti, con un grafico dell\'andamento per ognuna.'},
  {target:'.nav-item[data-route="portfolio"]',title:'CV e portfolio',
   text:'Il CV e l\'E-Portfolio si compilano da soli con il profilo, le esperienze e i certificati.'},
  {target:'.nav-item[data-route="social"]',title:'Amici',
   text:'Trova altre persone con interessi simili e chatta.'},
  {target:'.profilebtn',title:'Il tuo profilo',
   text:'Qui modifichi i tuoi dati, le <strong>impostazioni</strong> (ruolo, tema, testo grande) e la privacy. Da qui puoi anche uscire.'},
  {target:'.mascot-panda',title:'Sergio, il tuo tutor',
   text:'Cliccalo per fargli domande o farti aiutare a studiare. Gira sul tuo computer: quello che scrivi non esce da qui.'},
  {target:'.tour-btn',title:'Tutto qui!',
   text:'Puoi riaprire questa guida quando vuoi da questo pulsante.',last:true}
];
let TOUR_STEPS=TOUR_ALL_STEPS;

const TOUR={i:0,startRoute:null,root:null};

function startTour(){
  // Salta le sezioni che per questo utente non ci sono (es. Voti per i lavoratori)
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
function endTour(goTo){
  if(!TOUR.root) return;
  TOUR.root.hidden=true; document.body.classList.remove('tour-on');
  const back=goTo||TOUR.startRoute;
  if(back && state.route!==back) navigate('#/'+back);
  const b=document.querySelector('.tour-btn'); if(b) b.focus();
}
function tourGo(d){
  const n=TOUR.i+d;
  if(n<0) return;
  if(n>=TOUR_STEPS.length){ endTour(); return; }
  TOUR.i=n; showTourStep();
}

function showTourStep(){
  const step=TOUR_STEPS[TOUR.i];
  if(step.route && state.route!==step.route) navigate('#/'+step.route);
  const card=TOUR.root.querySelector('.tour-card');
  card.innerHTML=`
    <div class="tour-count">${TOUR.i+1} di ${TOUR_STEPS.length}</div>
    <div class="tour-title" id="tourTitle">${step.title}</div>
    <p class="tour-text">${step.text}</p>
    <div class="tour-dots">${TOUR_STEPS.map((_,k)=>`<span class="${k===TOUR.i?'on':''}"></span>`).join('')}</div>
    <div class="tour-actions">
      ${step.last?'':'<button class="btn sm" data-tour="close">Salta</button>'}
      <span style="flex:1"></span>
      ${TOUR.i>0?'<button class="btn sm" data-tour="prev">Indietro</button>':''}
      ${step.last?'<button class="btn primary sm" data-tour="close">Ho capito</button>'
                 :`<button class="btn primary sm" data-tour="next">${TOUR.i===0?'Iniziamo':'Avanti'}</button>`}
    </div>`;
  requestAnimationFrame(()=>{ placeTour(); card.querySelector('[data-tour="next"],[data-tour="start"]')?.focus(); });
}

function placeTour(){
  if(!TOUR.root || TOUR.root.hidden) return;
  const step=TOUR_STEPS[TOUR.i];
  const hole=TOUR.root.querySelector('.tour-hole'), card=TOUR.root.querySelector('.tour-card');
  const el=step.target?document.querySelector(step.target):null;
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
  // A destra se c'è spazio (barra laterale), altrimenti sotto, sopra o a sinistra
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
  else if(t==='close') endTour();
  else if(t==='start'){ endTour('nuova'); }
});
document.addEventListener('keydown',e=>{
  if(!TOUR.root || TOUR.root.hidden) return;
  if(e.key==='Escape'){ e.stopPropagation(); endTour(); }
  else if(e.key==='ArrowRight') tourGo(1);
  else if(e.key==='ArrowLeft') tourGo(-1);
},true);
window.addEventListener('resize',placeTour);
window.addEventListener('scroll',placeTour,true);
