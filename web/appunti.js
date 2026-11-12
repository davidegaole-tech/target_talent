/* ---------- APPUNTI: file o testo incollato, salvati dal backend; Sergio ne fa riassunti, quiz e flashcard ---------- */
const NOTES={loaded:false,loading:false,offline:false,items:[],armed:null,form:false,mode:'file'};

async function loadNotes(force){
  if(NOTES.loading || (NOTES.loaded && !force)) return;
  NOTES.loading=true;
  try{
    const r=await fetch('/api/documents?kind=appunti',{headers:authHeaders()});
    if(r.status===401){ NOTES.loading=false; return; }
    if(!r.ok) throw new Error();
    NOTES.items=(await r.json()).documents; NOTES.offline=false;
  }catch(e){ NOTES.offline=true; }
  NOTES.loading=false; NOTES.loaded=true;
  if(state.route==='appunti') render();
}

function renderAppunti(){
  if(!NOTES.loaded) loadNotes();
  const conVoti=haVoti();
  return `
  <div class="hero">
    <div>
      <h1>${conVoti?'Appunti e voti':'Appunti'}</h1>
      <p>Carica i tuoi appunti o incollali: da ognuno puoi chiedere a Sergio un riassunto, un quiz o delle flashcard.${conVoti?' Sotto trovi le materie con i voti e l\'andamento nel tempo.':''}</p>
    </div>
    <div class="hero-side">
      <button class="btn primary" data-action="noteForm">+ Aggiungi appunti</button>
      ${conVoti?'<button class="btn soft" data-action="addMateria">+ Aggiungi materia</button>':''}
    </div>
  </div>
  ${NOTES.form?renderNoteForm():''}
  <div id="noteList">${renderNoteList()}</div>
  ${conVoti?`
  <div class="section-divider">
    <div>
      <div class="section-title">Voti e materie</div>
      <div class="section-sub" style="margin-bottom:0">Le medie e l'andamento di ogni materia</div>
    </div>
  </div>
  ${renderVotiBody()}`:''}`;
}

function renderNoteForm(){
  const file=NOTES.mode==='file';
  return `
  <div class="card" style="margin-bottom:16px">
    <div class="section-title">Nuovi appunti</div>
    <div class="seg" style="margin:8px 0 12px">
      <button class="segbtn ${file?'on':''}" data-action="noteMode" data-val="file">Carica un file</button>
      <button class="segbtn ${!file?'on':''}" data-action="noteMode" data-val="testo">Incolla il testo</button>
    </div>
    <div class="form-row"><label for="n-title">Titolo</label><input id="n-title" placeholder="es. Storia · Rivoluzione francese"/></div>
    ${file
      ?'<div class="form-row"><label for="n-file">File (PDF, DOCX, TXT, MD · massimo 10 MB)</label><input id="n-file" type="file" accept=".pdf,.docx,.txt,.md"/></div>'
      :'<div class="form-row"><label for="n-text">Testo</label><textarea id="n-text" rows="8" placeholder="Incolla qui i tuoi appunti…"></textarea></div>'}
    <div style="display:flex;gap:8px">
      <button class="btn primary sm" data-action="noteUpload">Salva</button>
      <button class="btn sm" data-action="noteForm">Annulla</button>
    </div>
  </div>`;
}

function renderNoteList(){
  if(!NOTES.loaded) return '<div class="card"><div class="ai-loading"><span class="ai-spin"></span>Carico i tuoi appunti…</div></div>';
  if(NOTES.offline) return `<div class="card" style="text-align:center;padding:32px;color:var(--muted);font-size:13px;line-height:1.6">
      Gli appunti vengono salvati sul tuo computer da Sergio, che ora non è avviato.<br/>Avvia l'app con lo script di avvio nella cartella <code>scripts/</code> e ricarica la pagina.</div>`;
  if(!NOTES.items.length) return `<div class="card" style="text-align:center;padding:32px;color:var(--muted);font-size:13px;line-height:1.6">
      Non hai ancora aggiunto appunti.<br/>Carica un file o incolla il testo di una lezione: Sergio ti aiuta a ripassarla.</div>`;
  return `<div class="grid g2">${NOTES.items.map(n=>`
    <div class="card note-card">
      <div style="display:flex;gap:12px;align-items:flex-start">
        <div class="evidence-icon">${icon('text',16)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:700;font-size:14px">${escHTML(n.title)}</div>
          <div style="font-size:11.5px;color:var(--muted);margin-top:2px;overflow-wrap:anywhere">${fmtDate(new Date(n.created_at).toISOString())} · ${escHTML(n.filename)} · ${fmtSize(n.size)}</div>
        </div>
      </div>
      ${n.has_text?`<div class="note-actions">
        <span>Chiedi a Sergio:</span>
        <button class="btn soft sm" data-action="noteGen" data-kind="summary" data-id="${n.id}">Riassunto</button>
        <button class="btn soft sm" data-action="noteGen" data-kind="quiz" data-id="${n.id}">Quiz</button>
        <button class="btn soft sm" data-action="noteGen" data-kind="flashcards" data-id="${n.id}">Flashcard</button>
      </div>`:'<p style="font-size:11.5px;color:var(--muted);margin-top:10px">Da questo file non si riesce a leggere il testo (forse è una scansione).</p>'}
      <div style="display:flex;gap:6px;margin-top:10px">
        ${n.has_file!==false?`<a class="btn sm" href="${escHTML(fileUrl('/api/documents/'+n.id+'/file'))}" target="_blank" rel="noopener">Apri</a>`:'<span class="chip">testo importato · file non nel backup</span>'}
        <button class="btn sm ${NOTES.armed===n.id?'danger-armed':''}" style="margin-left:auto;color:${NOTES.armed===n.id?'#fff':'var(--rose-text)'}" data-action="noteDel" data-id="${n.id}">${NOTES.armed===n.id?'Conferma eliminazione':'Elimina'}</button>
      </div>
    </div>`).join('')}</div>`;
}
function refreshNotes(){ const el=$('noteList'); if(el && state.route==='appunti') el.innerHTML=renderNoteList(); }

async function uploadNote(btn){
  const title=$('n-title').value.trim();
  let file;
  if(NOTES.mode==='file'){
    file=$('n-file')?.files[0];
    if(!file){ toast('Scegli un file'); return; }
  }else{
    const t=$('n-text').value.trim();
    if(!t){ toast('Incolla il testo degli appunti'); return; }
    file=new File([t],(title||'appunti').replace(/[^\w\- ]+/g,'').trim().slice(0,60)+'.txt',{type:'text/plain'});
  }
  if(file.size>10*1024*1024){ toast('Il file è troppo grande (massimo 10 MB)'); return; }
  const fd=new FormData(); fd.append('file',file); fd.append('kind','appunti'); fd.append('title',title);
  btn.disabled=true; btn.textContent='Salvo…';
  try{
    const r=await fetch('/api/documents',{method:'POST',headers:authHeaders(),body:fd});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Salvataggio non riuscito');
    NOTES.items.unshift(data); NOTES.form=false; render(); toast('Appunti salvati');
  }catch(e){
    toast(e instanceof TypeError?'Il server non è avviato: non posso salvare gli appunti':e.message);
    if(btn.isConnected){ btn.disabled=false; btn.textContent='Salva'; }
  }
}

async function noteGenerate(id,kind){
  if(!window.sergioGenerate){ toast('Sergio non è disponibile'); return; }
  try{
    const r=await fetch('/api/documents/'+encodeURIComponent(id)+'/text',{headers:authHeaders()});
    const data=await r.json().catch(()=>null);
    if(!r.ok) throw new Error(data?.error?.message||'Non riesco a leggere gli appunti');
    window.sergioGenerate(kind,data.text,data.name);
  }catch(e){ toast(e instanceof TypeError?'Sergio non è avviato':e.message); }
}

async function deleteNote(id){
  if(NOTES.armed!==id){
    NOTES.armed=id; refreshNotes();
    clearTimeout(deleteNote._t); deleteNote._t=setTimeout(()=>{ NOTES.armed=null; refreshNotes(); },3500);
    return;
  }
  NOTES.armed=null;
  try{
    const r=await fetch('/api/documents/'+encodeURIComponent(id),{method:'DELETE',headers:authHeaders()});
    if(!r.ok && r.status!==404) throw new Error();
    NOTES.items=NOTES.items.filter(n=>n.id!==id); refreshNotes(); toast('Appunti eliminati');
  }catch(e){ toast('Eliminazione non riuscita'); refreshNotes(); }
}

document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]'); if(!el) return;
  const a=el.dataset.action, id=el.dataset.id;
  if(a==='noteForm'){ NOTES.form=!NOTES.form; render(); }
  else if(a==='noteMode'){ NOTES.mode=el.dataset.val; render(); }
  else if(a==='noteUpload') uploadNote(el);
  else if(a==='noteGen') noteGenerate(id,el.dataset.kind);
  else if(a==='noteDel') deleteNote(id);
});
