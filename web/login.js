/* ---------- ACCESSO: login provvisorio (credenziali fisse controllate dal server) e scelta del ruolo ---------- */
const AUTH_KEY='talent_auth';
let gate=null;

function isLogged(){ try{ return !!localStorage.getItem(AUTH_KEY); }catch(e){ return false; } }

function showGate(step){
  if(!gate){ gate=document.createElement('div'); gate.className='gate'; gate.setAttribute('role','dialog'); gate.setAttribute('aria-modal','true'); document.body.appendChild(gate); }
  document.body.classList.add('gate-on');
  if(window.closeTutorPanel) window.closeTutorPanel();
  gate.innerHTML=step==='ruolo'?gateRuolo():gateLogin();
  gate.hidden=false;
  setTimeout(()=>gate.querySelector(step==='ruolo'?'.gate-role':'#lg-user')?.focus(),30);
}
function hideGate(){ if(gate) gate.hidden=true; document.body.classList.remove('gate-on'); }

function gateLogin(){
  return `
  <form class="gate-card" id="loginForm" novalidate>
    <img src="img/logo-login.png" alt="" width="96" height="96" class="gate-logo"/>
    <h1 class="gate-title">Talent Radar</h1>
    <p class="gate-sub">Racconta chi sei, scopri le tue competenze.</p>
    <div class="form-row"><label for="lg-user">Nome utente</label><input id="lg-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required/></div>
    <div class="form-row"><label for="lg-pass">Password</label><input id="lg-pass" name="password" type="password" autocomplete="current-password" required/></div>
    <div class="gate-err" id="lg-err" role="alert" hidden></div>
    <button class="btn primary gate-btn" type="submit">Accedi</button>
  </form>`;
}
function gateRuolo(){
  const r=[['studente','🎒','Studente','Vai a scuola o all\'università'],
           ['lavoratore','💼','Lavoratore','Lavori e vuoi valorizzare le tue competenze'],
           ['studente-lavoratore','📚','Studente lavoratore','Studi e lavori, o fai un percorso duale']];
  return `
  <div class="gate-card gate-wide">
    <img src="img/logo.png" alt="" width="56" height="56" class="gate-logo"/>
    <h1 class="gate-title">Ciao! Tu sei…</h1>
    <p class="gate-sub">Così mostriamo le sezioni giuste per te. Potrai cambiarlo nelle impostazioni.</p>
    <div class="gate-roles">
      ${r.map(([v,e,t,d])=>`<button class="gate-role" data-ruolo="${v}"><span class="gate-re">${e}</span><span class="gate-rt">${t}</span><span class="gate-rd">${d}</span></button>`).join('')}
    </div>
  </div>`;
}

async function doLogin(form){
  const err=$('lg-err'), btn=form.querySelector('button[type="submit"]');
  const username=$('lg-user').value.trim(), password=$('lg-pass').value;
  if(!username||!password){ err.textContent='Inserisci nome utente e password.'; err.hidden=false; return; }
  btn.disabled=true; btn.textContent='Accesso…'; err.hidden=true;
  try{
    const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Accesso non riuscito.');
    try{ localStorage.setItem(AUTH_KEY,JSON.stringify({user:data.user,at:Date.now()})); }catch(e){}
    if(!state.ruolo) showGate('ruolo'); else { hideGate(); render(); }
  }catch(e){
    err.textContent=e instanceof TypeError?'Il server non risponde: avvia l\'app con scripts/start.sh.':e.message;
    err.hidden=false; $('lg-pass').value=''; $('lg-pass').focus();
  }finally{ if(btn.isConnected){ btn.disabled=false; btn.textContent='Accedi'; } }
}

function logout(){
  try{ localStorage.removeItem(AUTH_KEY); }catch(e){}
  showGate('login');
}

document.addEventListener('submit',e=>{
  if(e.target.id==='loginForm'){ e.preventDefault(); doLogin(e.target); }
});
document.addEventListener('click',e=>{
  const b=e.target.closest('.gate-role'); if(!b) return;
  state.ruolo=b.dataset.ruolo; hideGate(); navigate('#/passaporto');
});

// All'avvio: login, poi ruolo se manca
if(!isLogged()) showGate('login');
else if(!state.ruolo) showGate('ruolo');
