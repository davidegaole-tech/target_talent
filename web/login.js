/* ---------- ACCESSO: login/registrazione, ruolo e sessione ---------- */
const AUTH_KEY='talent_auth';
const TOKEN_KEY='talent_token';
const USER_KEY='talent_user';
let gate=null;

function isLogged(){ try{ return !!localStorage.getItem(TOKEN_KEY); }catch(e){ return false; } }

function showGate(step){
  if(!gate){ gate=document.createElement('div'); gate.className='gate'; gate.setAttribute('role','dialog'); gate.setAttribute('aria-modal','true'); document.body.appendChild(gate); }
  document.body.classList.add('gate-on');
  if(window.closeTutorPanel) window.closeTutorPanel();
  gate.innerHTML = step==='ruolo' ? gateRuolo() : step==='register' ? gateRegister() : gateLogin();
  gate.hidden=false;
  const sel = step==='ruolo' ? '.gate-role' : step==='register' ? '#rg-user' : '#lg-user';
  setTimeout(()=>gate.querySelector(sel)?.focus(),30);
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
    <button class="btn gate-btn" type="button" id="demoLogin">Entra nella demo (admin / password)</button>
    <p class="gate-alt">Non hai un account? <a href="#" id="toRegister">Creane uno</a></p>
  </form>`;
}
function gateRegister(){
  return `
  <form class="gate-card" id="registerForm" novalidate>
    <img src="img/logo-login.png" alt="" width="96" height="96" class="gate-logo"/>
    <h1 class="gate-title">Crea il tuo account</h1>
    <p class="gate-sub">I tuoi dati restano tuoi. Potrai cambiare ruolo nelle impostazioni.</p>
    <div class="form-row"><label for="rg-user">Nome utente</label><input id="rg-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="3" required/></div>
    <div class="form-row"><label for="rg-pass">Password (min. 6 caratteri)</label><input id="rg-pass" name="password" type="password" autocomplete="new-password" minlength="6" required/></div>
    <div class="form-row"><label for="rg-pass2">Ripeti password</label><input id="rg-pass2" name="password2" type="password" autocomplete="new-password" minlength="6" required/></div>
    <div class="form-row"><label for="rg-role">Sono…</label>
      <select id="rg-role" name="role">
        <option value="studente">Studente</option>
        <option value="lavoratore">Lavoratore</option>
        <option value="studente-lavoratore">Studente lavoratore</option>
      </select>
    </div>
    <div class="gate-err" id="rg-err" role="alert" hidden></div>
    <button class="btn primary gate-btn" type="submit">Crea account</button>
    <p class="gate-alt">Hai già un account? <a href="#" id="toLogin">Accedi</a></p>
  </form>`;
}
function gateRuolo(){
  const r=[['studente','passport','Studente','Vai a scuola o all\'università'],
           ['lavoratore','trend','Lavoratore','Lavori e vuoi valorizzare le tue competenze'],
           ['studente-lavoratore','users','Studente lavoratore','Studi e lavori, o fai un percorso duale']];
  return `
  <div class="gate-card gate-wide">
    <img src="img/logo.png" alt="" width="56" height="56" class="gate-logo"/>
    <h1 class="gate-title">Ciao! Tu sei…</h1>
    <p class="gate-sub">Così mostriamo le sezioni giuste per te. Potrai cambiarlo nelle impostazioni.</p>
    <div class="gate-roles">
      ${r.map(([v,e,t,d])=>`<button class="gate-role" data-ruolo="${v}"><span class="gate-re">${icon(e,26)}</span><span class="gate-rt">${t}</span><span class="gate-rd">${d}</span></button>`).join('')}
    </div>
  </div>`;
}

function startHint(){
  return /Windows/i.test(navigator.userAgent) ? 'avvia scripts\\start.bat' : 'avvia scripts/start.sh';
}

function storeAuth(data){
  try{
    localStorage.setItem(TOKEN_KEY,data.token);
    localStorage.setItem(AUTH_KEY,JSON.stringify({user:data.user,at:Date.now()}));
  }catch(e){}
}

async function afterAuth(data){
  const prev=localStorage.getItem(USER_KEY);
  storeAuth(data);
  localStorage.setItem(USER_KEY,data.user.username);
  if(prev && prev!==data.user.username){
    // Utente diverso sullo stesso browser: riparti dai dati di default, poi carica i suoi.
    try{ localStorage.removeItem('talent_state'); }catch(e){}
    location.reload();
    return;
  }
  if(data.user.role && !state.ruolo) state.ruolo=data.user.role;
  if(typeof loadRemoteState==='function') await loadRemoteState();
  if(!state.ruolo) showGate('ruolo'); else { hideGate(); render(); }
}

async function doLogin(form){
  const err=$('lg-err'), btn=form.querySelector('button[type="submit"]');
  const username=$('lg-user').value.trim(), password=$('lg-pass').value;
  if(!username||!password){ err.textContent='Inserisci nome utente e password.'; err.hidden=false; return; }
  btn.disabled=true; btn.textContent='Accesso…'; err.hidden=true;
  try{
    const r=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username,password})});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Accesso non riuscito.');
    await afterAuth(data);
  }catch(e){
    err.textContent=e instanceof TypeError?'Il server non risponde: ' + startHint() + '.':e.message;
    err.hidden=false; $('lg-pass').value=''; $('lg-pass').focus();
  }finally{ if(btn.isConnected){ btn.disabled=false; btn.textContent='Accedi'; } }
}

async function doRegister(form){
  const err=$('rg-err'), btn=form.querySelector('button[type="submit"]');
  const username=$('rg-user').value.trim(), password=$('rg-pass').value, password2=$('rg-pass2').value;
  const role=$('rg-role').value;
  if(username.length<3){ err.textContent='Il nome utente deve avere almeno 3 caratteri.'; err.hidden=false; return; }
  if(password.length<6){ err.textContent='La password deve avere almeno 6 caratteri.'; err.hidden=false; return; }
  if(password!==password2){ err.textContent='Le due password non coincidono.'; err.hidden=false; return; }
  btn.disabled=true; btn.textContent='Creo l\'account…'; err.hidden=true;
  try{
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username,password,role})});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Registrazione non riuscita.');
    await afterAuth(data);
  }catch(e){
    err.textContent=e instanceof TypeError?'Il server non risponde: ' + startHint() + '.':e.message;
    err.hidden=false;
  }finally{ if(btn.isConnected){ btn.disabled=false; btn.textContent='Crea account'; } }
}

function logout(){
  let t=null; try{ t=localStorage.getItem(TOKEN_KEY); }catch(e){}
  if(t) fetch('/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+t}}).catch(()=>{});
  try{ localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(AUTH_KEY); localStorage.removeItem(USER_KEY); }catch(e){}
  showGate('login');
}

document.addEventListener('submit',e=>{
  if(e.target.id==='loginForm'){ e.preventDefault(); doLogin(e.target); }
  if(e.target.id==='registerForm'){ e.preventDefault(); doRegister(e.target); }
});
document.addEventListener('click',e=>{
  if(e.target.id==='toRegister'){ e.preventDefault(); showGate('register'); return; }
  if(e.target.id==='toLogin'){ e.preventDefault(); showGate('login'); return; }
  if(e.target.id==='demoLogin'){
    const form=document.getElementById('loginForm'); if(!form) return;
    document.getElementById('lg-user').value='admin';
    document.getElementById('lg-pass').value='password';
    doLogin(form);
    return;
  }
  const b=e.target.closest('.gate-role'); if(!b) return;
  state.ruolo=b.dataset.ruolo; hideGate(); navigate('#/passaporto');
});

// All'avvio: login, poi ruolo se manca
if(!isLogged()) showGate('login');
else if(!state.ruolo) showGate('ruolo');
