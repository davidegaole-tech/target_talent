/* ---------- ACCESSO: login/registrazione, ruolo e sessione ---------- */
const AUTH_KEY='talent_auth';
const TOKEN_KEY='talent_token';
const USER_KEY='talent_user';
let gate=null;
let gateStep='login';
let regRole='studente';

function isLogged(){ try{ return !!localStorage.getItem(TOKEN_KEY); }catch(e){ return false; } }

function gateBrand(){
  return `
  <aside class="gate-brand">
    <svg class="gb-radar" viewBox="0 0 400 400" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#ffffff" stroke-opacity=".09" stroke-width="1">
        <circle cx="200" cy="200" r="58"/>
        <circle cx="200" cy="200" r="108"/>
        <circle cx="200" cy="200" r="158"/>
        <circle cx="200" cy="200" r="196"/>
        <path d="M4 200h392M200 4v392"/>
        <path d="M200 200 318 96" stroke-opacity=".16"/>
        <path d="M318 96a158 158 0 0 1 40 104" stroke-opacity=".16"/>
      </g>
      <circle cx="200" cy="200" r="3.2" fill="#ffffff" fill-opacity=".45"/>
      <circle cx="318" cy="96" r="4" fill="#e58ba3" fill-opacity=".85"/>
    </svg>
    <div class="gb-top">
      <img class="gb-logo" src="img/logo.png" alt="" width="38" height="38"/>
      <span class="gb-name">Talent Radar</span>
    </div>
    <div class="gb-main">
      <h2 class="gb-title">Il passaporto dei tuoi talenti.</h2>
      <p class="gb-sub">Trasforma quello che fai in prove concrete: esperienze, certificazioni, progetti. Le colleghiamo alle 8 competenze europee, così vedi dove sei forte e dove puoi crescere.</p>
      <ul class="gb-points">
        <li><span class="gb-ico">${icon('passport',15)}</span><div><strong>Prove reali, non un test</strong>Un robot, un volontariato, una recensione: conta quello che hai fatto.</div></li>
        <li><span class="gb-ico">${icon('sparkles',15)}</span><div><strong>Sergio, tutor sul tuo computer</strong>Riassunti, quiz e flashcard dai tuoi appunti, senza inviare nulla in rete.</div></li>
        <li><span class="gb-ico">${icon('lock',15)}</span><div><strong>I dati restano tuoi</strong>Ogni account vede solo il proprio passaporto.</div></li>
      </ul>
    </div>
    <div class="gb-foot">Talent Radar · prototipo locale</div>
  </aside>`;
}

function gateLogin(){
  return `<div class="gate-shell">${gateBrand()}
    <main class="gate-panel">
      <form class="gate-form" id="loginForm" novalidate>
        <h1 class="gate-h1">Accedi al tuo passaporto</h1>
        <p class="gate-lead">Inserisci le tue credenziali. Se è la prima volta, crea un account: bastano nome, cognome e una password.</p>
        <div class="gate-err" id="lg-err" role="alert" hidden></div>
        <div class="form-row">
          <label for="lg-user">Nome utente</label>
          <input id="lg-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" required/>
        </div>
        <div class="form-row">
          <label for="lg-pass">Password</label>
          <input id="lg-pass" name="password" type="password" autocomplete="current-password" required/>
        </div>
        <div class="gate-actions">
          <button class="btn primary gate-btn" type="submit">Accedi</button>
        </div>
        <p class="gate-alt" style="margin-bottom:8px">Non hai un account?</p>
        <a class="btn gate-btn" href="#" id="toRegister">Crea un account</a>
      </form>
    </main>
  </div>`;
}

function gateRegister(){
  const ruoli=[['studente','Studente'],['lavoratore','Lavoratore'],['studente-lavoratore','Studente lavoratore']];
  return `<div class="gate-shell">${gateBrand()}
    <main class="gate-panel">
      <form class="gate-form wide" id="registerForm" novalidate>
        <h1 class="gate-h1">Crea il tuo account</h1>
        <p class="gate-lead">Un minuto e il passaporto è intestato a te. Nome, cognome, nome utente e password sono obbligatori: il resto puoi aggiungerlo dopo.</p>
        <div class="gate-err" id="rg-err" role="alert" hidden></div>

        <div class="gate-pick-label">Sono…</div>
        <div class="gate-pick" id="rg-roles" role="group" aria-label="Ruolo">
          ${ruoli.map(([v,l])=>`<button type="button" class="${v===regRole?'on':''}" data-rg-role="${v}">${l}</button>`).join('')}
        </div>

        <div class="gate-fields">
          <div class="form-row"><label for="rg-nome">Nome</label><input id="rg-nome" name="given-name" autocomplete="given-name" required/></div>
          <div class="form-row"><label for="rg-cognome">Cognome</label><input id="rg-cognome" name="family-name" autocomplete="family-name" required/></div>
          <div class="form-row"><label for="rg-citta">Città di residenza <span class="opt">(facoltativo)</span></label><input id="rg-citta" name="address-level2" autocomplete="address-level2"/></div>
          <div class="form-row"><label for="rg-nascita">Data di nascita <span class="opt">(facoltativo)</span></label><input id="rg-nascita" type="date" name="bday" autocomplete="bday"/></div>
          <div class="form-row"><label for="rg-scuola">Scuola o istituto <span class="opt">(facoltativo)</span></label><input id="rg-scuola" placeholder="es. Liceo Scientifico"/></div>
          <div class="form-row"><label for="rg-classe">Classe <span class="opt">(facoltativo)</span></label><input id="rg-classe" placeholder="es. 4B"/></div>

          <div class="gate-sep"></div>

          <div class="form-row"><label for="rg-user">Nome utente</label><input id="rg-user" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" minlength="3" required/></div>
          <div class="form-row"><label for="rg-email">Email (facoltativa)</label><input id="rg-email" type="email" name="email" autocomplete="email"/></div>
          <div class="form-row"><label for="rg-pass">Password</label><input id="rg-pass" name="new-password" type="password" autocomplete="new-password" minlength="6" required/></div>
          <div class="form-row"><label for="rg-pass2">Ripeti password</label><input id="rg-pass2" type="password" autocomplete="new-password" minlength="6" required/></div>
          <p class="gate-note">Almeno 6 caratteri. Potrai modificare tutti i dati dal tuo profilo.</p>
        </div>

        <div class="gate-actions">
          <button class="btn primary gate-btn" type="submit">Crea account</button>
        </div>
        <p class="gate-alt">Hai già un account? <a href="#" id="toLogin">Accedi</a></p>
      </form>
    </main>
  </div>`;
}

function gateRuolo(){
  const r=[['studente','passport','Studente','Vai a scuola o all\'università'],
           ['lavoratore','trend','Lavoratore','Lavori e vuoi valorizzare le tue competenze'],
           ['studente-lavoratore','users','Studente lavoratore','Studi e lavori, o fai un percorso duale']];
  return `<div class="gate-shell">${gateBrand()}
    <main class="gate-panel">
      <div class="gate-form">
        <h1 class="gate-h1">Ciao! Tu sei…</h1>
        <p class="gate-lead">Così mostriamo le sezioni giuste per te. Potrai cambiarlo nelle impostazioni.</p>
        <div class="gate-roles">
          ${r.map(([v,e,t,d])=>`<button type="button" class="gate-role" data-ruolo="${v}">
            <span class="gate-re">${icon(e,19)}</span>
            <span><span class="gate-rt">${t}</span><span class="gate-rd">${d}</span></span>
            ${icon('arrow',16).replace('class="ic"','class="ic gate-chev"')}
          </button>`).join('')}
        </div>
      </div>
    </main>
  </div>`;
}

function showGate(step){
  gateStep=step;
  if(!gate){ gate=document.createElement('div'); gate.className='gate'; gate.setAttribute('role','dialog'); gate.setAttribute('aria-modal','true'); document.body.appendChild(gate); }
  document.body.classList.add('gate-on');
  if(window.closeTutorPanel) window.closeTutorPanel();
  gate.innerHTML = step==='ruolo' ? gateRuolo() : step==='register' ? gateRegister() : gateLogin();
  gate.hidden=false;
  const sel = step==='ruolo' ? '.gate-role' : step==='register' ? '#rg-nome' : '#lg-user';
  setTimeout(()=>gate.querySelector(sel)?.focus(),30);
}
function hideGate(){ if(gate) gate.hidden=true; document.body.classList.remove('gate-on'); }

function startHint(){
  return /Windows/i.test(navigator.userAgent) ? 'avvia scripts\\start.bat' : 'avvia scripts/start.sh';
}

function storeAuth(data){
  try{
    localStorage.setItem(TOKEN_KEY,data.token);
    localStorage.setItem(AUTH_KEY,JSON.stringify({user:data.user,at:Date.now()}));
  }catch(e){}
}

async function afterAuth(data, isNewAccount){
  const prev=localStorage.getItem(USER_KEY);
  storeAuth(data);
  localStorage.setItem(USER_KEY,data.user.username);
  // Un account appena creato deve vedere il tutorial, sempre.
  if(isNewAccount){ state.tourDone=false; }
  if(prev && prev!==data.user.username){
    // Utente diverso sullo stesso browser: riparti dai dati di default, poi carica i suoi.
    if(isNewAccount){ try{ sessionStorage.setItem('talent_tour_force','1'); }catch(e){} }
    try{ localStorage.removeItem('talent_state'); }catch(e){}
    location.reload();
    return;
  }
  if(data.user.role && !state.ruolo) state.ruolo=data.user.role;
  if(typeof loadRemoteState==='function') await loadRemoteState();
  if(!state.ruolo) showGate('ruolo');
  else {
    hideGate(); render();
    // Dopo la registrazione il tour parte subito e per forza; altrimenti solo
    // se l'utente non l'ha ancora completato.
    if(isNewAccount){ state.tourDone=false; startTour(); }
    else if(typeof maybeStartTour==='function') maybeStartTour();
  }
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
  const val=id=>(($(id)||{}).value||'').trim();
  const nome=val('rg-nome'), cognome=val('rg-cognome');
  const username=val('rg-user'), email=val('rg-email');
  const password=$('rg-pass').value, password2=$('rg-pass2').value;
  const citta=val('rg-citta'), nascita=val('rg-nascita'), scuola=val('rg-scuola'), classe=val('rg-classe');

  if(!nome||!cognome){ err.textContent='Scrivi nome e cognome.'; err.hidden=false; (nome?$('rg-cognome'):$('rg-nome')).focus(); return; }
  if(username.length<3){ err.textContent='Il nome utente deve avere almeno 3 caratteri.'; err.hidden=false; $('rg-user').focus(); return; }
  if(email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){ err.textContent='Controlla l\'indirizzo email.'; err.hidden=false; $('rg-email').focus(); return; }
  if(password.length<6){ err.textContent='La password deve avere almeno 6 caratteri.'; err.hidden=false; $('rg-pass').focus(); return; }
  if(password!==password2){ err.textContent='Le due password non coincidono.'; err.hidden=false; $('rg-pass2').focus(); return; }

  btn.disabled=true; btn.textContent='Creo l\'account…'; err.hidden=true;
  try{
    const payload={username,password,role:regRole,first_name:nome,last_name:cognome,
      email:email||null,birth_date:nascita||null,city:citta||null,school:scuola||null,class_name:classe||null};
    const r=await fetch('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Registrazione non riuscita.');
    await afterAuth(data, true);
  }catch(e){
    err.textContent=e instanceof TypeError?'Il server non risponde: ' + startHint() + '.':e.message;
    err.hidden=false;
  }finally{ if(btn.isConnected){ btn.disabled=false; btn.textContent='Crea account'; } }
}

function logout(){
  let t=null; try{ t=localStorage.getItem(TOKEN_KEY); }catch(e){}
  if(t) fetch('/api/auth/logout',{method:'POST',headers:{Authorization:'Bearer '+t}}).catch(()=>{});
  try{
    localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(AUTH_KEY); localStorage.removeItem(USER_KEY);
    // Via anche la copia locale del passaporto: il prossimo utente parte pulito.
    localStorage.removeItem('talent_state');
  }catch(e){}
  if(typeof applyEmptyState==='function'){ applyEmptyState(); if(typeof render==='function') render(); }
  showGate('login');
}

document.addEventListener('submit',e=>{
  if(e.target.id==='loginForm'){ e.preventDefault(); doLogin(e.target); }
  if(e.target.id==='registerForm'){ e.preventDefault(); doRegister(e.target); }
});
document.addEventListener('click',e=>{
  if(e.target.id==='toRegister'){ e.preventDefault(); showGate('register'); return; }
  if(e.target.id==='toLogin'){ e.preventDefault(); showGate('login'); return; }
  const pick=e.target.closest('[data-rg-role]');
  if(pick){
    regRole=pick.dataset.rgRole;
    document.querySelectorAll('#rg-roles button').forEach(b=>b.classList.toggle('on',b===pick));
    return;
  }
  const b=e.target.closest('.gate-role'); if(!b) return;
  state.ruolo=b.dataset.ruolo; hideGate(); navigate('#/passaporto');
});

// All'avvio: solo il login, se manca la sessione. Il ruolo viene valutato
// dopo che lo stato è arrivato dal server (in app.js), altrimenti comparirebbe
// la scelta del ruolo a ogni ricarica.
if(!isLogged()) showGate('login');
