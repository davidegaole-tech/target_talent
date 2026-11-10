/* Sergio, il tutor AI (ex Quaderno): pannello che si apre dalla mascotte.
   Parla solo con il backend sulla stessa origine (/api), che a sua volta usa Ollama in locale. */
(() => {
"use strict";
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const md = s => {
  try { if (window.marked && window.DOMPurify) return DOMPurify.sanitize(marked.parse(String(s ?? ""))); } catch (e) {}
  return "<p>" + esc(s).replace(/\n\n+/g, "</p><p>").replace(/\n/g, "<br>") + "</p>";
};
const TYPE = {
  summary: { label: "Riassunto", cls: "t-summary", verb: "il riassunto" },
  quiz: { label: "Quiz", cls: "t-quiz", verb: "il quiz" },
  flashcards: { label: "Flashcard", cls: "t-flashcards", verb: "le flashcard" },
};
const fmtDate = ts => new Date(ts).toLocaleDateString("it-IT", { day: "numeric", month: "short" });
const TOPIC_MAX = 120;

/* ---------- Markup ---------- */
const panel = document.createElement("section");
panel.className = "tt-panel"; panel.id = "tutor"; panel.setAttribute("aria-label", "Sergio, il tutor AI");
panel.innerHTML = `
  <div class="tt-head">
    <div class="tt-mark" aria-hidden="true">🐼</div>
    <div>
      <div class="tt-title">Sergio</div>
      <div class="tt-sub"><span class="tt-dot" id="ttDot"></span><span id="ttStat">Controllo Ollama…</span>
        <select id="ttModel" aria-label="Modello attivo" disabled><option>—</option></select></div>
    </div>
    <button class="tt-x" id="ttClose" aria-label="Chiudi" title="Chiudi">×</button>
  </div>
  <div class="tt-tabs" role="tablist">
    <button role="tab" id="ttTabChat" class="on">Chat</button>
    <button role="tab" id="ttTabLib">Le mie schede <span id="ttTabCount"></span></button>
  </div>
  <div class="tt-banner" id="ttBanner" role="status">
    <span id="ttBannerTxt"></span><code id="ttBannerCmd">ollama serve</code>
    <button id="ttBannerCopy">Copia</button><button id="ttBannerRetry">Riprova</button>
  </div>
  <div class="tt-body" id="ttChatView">
    <div class="tt-log" id="ttLog">
      <div class="tt-msg bot">Ciao, sono Sergio! Incolla appunti, allega un file (.txt, .md, .pdf, .docx) o scrivi un argomento. Poi scegli <b>Riassunto</b>, <b>Quiz</b> o <b>Flashcard</b>: ogni cosa che creo diventa una scheda. Puoi anche farmi domande libere.</div>
    </div>
    <div class="tt-composer">
      <div class="tt-chips" id="ttChips">
        <button class="tt-chip" data-ask="summary"><span class="tt-sw t-summary"></span>Riassunto</button>
        <button class="tt-chip" data-ask="quiz"><span class="tt-sw t-quiz"></span>Quiz</button>
        <button class="tt-chip" data-ask="flashcards"><span class="tt-sw t-flashcards"></span>Flashcard</button>
        <button class="tt-chip" data-ask="all">Tutti e tre</button>
      </div>
      <div class="tt-counts">
        <label>Domande quiz <input type="number" id="ttNQuiz" min="3" max="20" value="8"></label>
        <label>Flashcard <input type="number" id="ttNCards" min="4" max="40" value="12"></label>
      </div>
      <div class="tt-attached" id="ttAttached" hidden></div>
      <div class="tt-row">
        <label class="tt-ib" for="ttFile" title="Allega un file (.txt, .md, .pdf, .docx)">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.4 11.1l-9.2 9.2a6 6 0 01-8.5-8.5l9.2-9.2a4 4 0 015.7 5.7l-9.2 9.2a2 2 0 01-2.8-2.8l8.5-8.5"/></svg>
        </label>
        <input type="file" id="ttFile" accept=".txt,.md,.markdown,.pdf,.docx,text/plain,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden>
        <textarea id="ttInput" rows="1" placeholder="Incolla appunti o scrivi un argomento…"></textarea>
        <button class="tt-ib tt-send" id="ttSend" title="Invia" aria-label="Invia">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
    </div>
  </div>
  <div class="tt-lib" id="ttLibView" style="display:none">
    <div class="tt-libtools">
      <span class="tt-cnt" id="ttCount"></span>
      <button id="ttExport" title="Scarica tutte le schede in un file JSON">Esporta</button>
      <button id="ttImport" title="Reimporta schede da un file JSON">Importa</button>
      <input type="file" id="ttImportFile" accept=".json,application/json" hidden>
    </div>
    <div class="tt-filters" id="ttFilters">
      <button class="segbtn on" data-f="all">Tutte</button>
      <button class="segbtn" data-f="summary">Riassunti</button>
      <button class="segbtn" data-f="quiz">Quiz</button>
      <button class="segbtn" data-f="flashcards">Flashcard</button>
      <input type="search" id="ttSearch" placeholder="Cerca per titolo…" aria-label="Cerca schede">
    </div>
    <div id="ttGrid" style="display:flex;flex-direction:column;gap:10px"></div>
  </div>`;
document.body.appendChild(panel);

const viewer = document.createElement("div");
viewer.className = "tt-viewer"; viewer.setAttribute("role", "dialog"); viewer.setAttribute("aria-modal", "true");
viewer.innerHTML = `<div class="tt-sheet" id="ttSheet"></div>`;
document.body.appendChild(viewer);
const sheet = $("#ttSheet");

/* ---------- Apertura dalla mascotte ---------- */
let started = false;
function openTutor() {
  panel.classList.add("open"); document.body.classList.add("tt-open");
  if (!started) { started = true; loadItems(); checkHealth(); setInterval(() => { if (!busy && panel.classList.contains("open")) checkHealth(); }, 30000); }
  setTimeout(() => input.focus(), 50);
}
function closeTutor() { panel.classList.remove("open"); document.body.classList.remove("tt-open"); }
window.toggleTutor = () => panel.classList.contains("open") ? closeTutor() : openTutor();
window.openTutor = openTutor;
window.closeTutorPanel = closeTutor;
$("#ttClose").onclick = closeTutor;

function setTab(t) {
  $("#ttTabChat").classList.toggle("on", t === "chat"); $("#ttTabLib").classList.toggle("on", t === "lib");
  $("#ttChatView").style.display = t === "chat" ? "" : "none";
  $("#ttLibView").style.display = t === "lib" ? "" : "none";
}
$("#ttTabChat").onclick = () => setTab("chat");
$("#ttTabLib").onclick = () => setTab("lib");

/* ---------- API ---------- */
class ApiError extends Error { constructor(code, message) { super(message); this.code = code; } }
const NET_MSG = "Sergio non risponde: il server è spento. Avvia l'app con scripts/start.sh.";
async function api(path, opts = {}) {
  const init = { ...opts, headers: { ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(opts.headers || {}) } };
  let res;
  try { res = await fetch(path, init); }
  catch (e) { if (e.name === "AbortError") throw e; throw new ApiError("network", NET_MSG); }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error?.code || "http_" + res.status, data?.error?.message || "Errore del server (" + res.status + ").");
  return data;
}
async function streamNdjson(path, body, signal, onEvent) {
  let res;
  try { res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal }); }
  catch (e) { if (e.name === "AbortError") throw e; throw new ApiError("network", NET_MSG); }
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(data?.error?.code || "http_" + res.status, data?.error?.message || "Errore del server (" + res.status + ").");
  }
  const reader = res.body.getReader(), dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let nl;
    while ((nl = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
  if (buf.trim()) onEvent(JSON.parse(buf));
}

/* ---------- Esempi (solo a libreria vuota) ---------- */
const EXAMPLES = [
  { id: "ex-sum", example: true, type: "summary", title: "La fotosintesi", created_at: Date.now(),
    content: { text: "La **fotosintesi** è il processo con cui piante, alghe e alcuni batteri trasformano l'energia della luce in energia chimica.\n\n## Dove avviene\nNei **cloroplasti**, grazie alla **clorofilla**, il pigmento verde che assorbe soprattutto luce rossa e blu.\n\n## Le due fasi\n1. **Fase luminosa** (membrane dei tilacoidi): la luce scinde l'acqua, si libera ossigeno e si producono ATP e NADPH.\n2. **Ciclo di Calvin** (stroma): ATP e NADPH servono a fissare la CO₂ e produrre glucosio.\n\n## Equazione complessiva\n6 CO₂ + 6 H₂O + luce → C₆H₁₂O₆ + 6 O₂",
      keyPoints: ["Avviene nei cloroplasti grazie alla clorofilla", "Fase luminosa: produce O₂, ATP e NADPH", "Ciclo di Calvin: fissa la CO₂ e produce glucosio"] } },
  { id: "ex-quiz", example: true, type: "quiz", title: "Quiz sulla fotosintesi", created_at: Date.now(),
    content: { questions: [
      { q: "In quale organulo avviene la fotosintesi?", options: ["Mitocondrio", "Cloroplasto", "Ribosoma", "Nucleo"], answer: 1, explanation: "I cloroplasti contengono la clorofilla e tutti gli enzimi necessari." },
      { q: "Quale gas viene liberato durante la fase luminosa?", options: ["Anidride carbonica", "Azoto", "Ossigeno", "Idrogeno"], answer: 2, explanation: "La scissione dell'acqua (fotolisi) libera O₂." },
      { q: "Dove si svolge il ciclo di Calvin?", options: ["Nello stroma", "Nei tilacoidi", "Nel citoplasma", "Nella parete cellulare"], answer: 0, explanation: "Il ciclo di Calvin avviene nello stroma del cloroplasto." },
    ] } },
  { id: "ex-fc", example: true, type: "flashcards", title: "Flashcard: fotosintesi", created_at: Date.now(),
    content: { cards: [
      { front: "Clorofilla", back: "Pigmento verde dei cloroplasti che assorbe la luce, soprattutto rossa e blu." },
      { front: "Fotolisi dell'acqua", back: "Scissione di H₂O nella fase luminosa: libera O₂, protoni ed elettroni." },
      { front: "Ciclo di Calvin", back: "Serie di reazioni nello stroma che fissano la CO₂ in zuccheri usando ATP e NADPH." },
      { front: "Prodotti della fotosintesi", back: "Glucosio (C₆H₁₂O₆) e ossigeno (O₂)." },
    ] } },
];

/* ---------- Storage: /api/items ---------- */
let items = [];
async function loadItems() {
  try { items = (await api("/api/items")).items; }
  catch (e) { say("Non riesco a leggere le schede: " + e.message, true); }
  renderLib();
}
async function deleteItem(id) {
  try { await api("/api/items/" + encodeURIComponent(id), { method: "DELETE" }); items = items.filter(i => i.id !== id); renderLib(); }
  catch (e) { say("Eliminazione non riuscita: " + e.message, true); }
}
async function patchItem(id, data) {
  const it = items.find(i => i.id === id); if (!it || it.example) return;
  Object.assign(it, data);
  try { await api("/api/items/" + encodeURIComponent(id), { method: "PATCH", body: JSON.stringify(data) }); } catch (e) {}
  renderLib();
}

/* ---------- Libreria ---------- */
let filter = "all", query = "";
function renderLib() {
  const list = items.length ? items : EXAMPLES;
  const shown = list.filter(i => (filter === "all" || i.type === filter) && (!query || (i.title || "").toLowerCase().includes(query)));
  const n = items.length;
  $("#ttCount").textContent = n ? `${n} ${n === 1 ? "scheda" : "schede"}` : "Nessuna scheda ancora";
  $("#ttTabCount").textContent = n ? `(${n})` : "";
  $("#ttGrid").innerHTML = (items.length ? "" : `<p class="tt-note">Questi tre sono esempi: aprili per provarli, spariranno quando creerai la prima scheda.</p>`) +
    (shown.length ? "" : `<p class="tt-note">Nessuna scheda corrisponde al filtro.</p>`) +
    shown.map(i => {
      const t = TYPE[i.type] || TYPE.summary;
      return `<button class="tt-tile ${t.cls}" data-open="${esc(i.id)}">
        <span style="display:flex;gap:6px;align-items:center"><span class="tt-pill">${t.label}</span>${i.example ? '<span class="tt-ex">Esempio</span>' : ""}</span>
        <h4>${esc(i.title)}</h4>
        <span class="tt-peek">${esc(peek(i))}</span>
        <span class="tt-meta"><span>${esc(countLabel(i))}</span><span>${i.example ? "" : fmtDate(i.created_at)}</span></span>
      </button>`;
    }).join("");
}
function peek(i) {
  if (i.type === "summary") return (i.content?.text || "").replace(/[#*_>`]/g, "").slice(0, 160);
  if (i.type === "quiz") return (i.content?.questions || []).slice(0, 2).map(q => q.q).join(" · ");
  return (i.content?.cards || []).slice(0, 4).map(c => c.front).join(" · ");
}
function countLabel(i) {
  if (i.type === "summary") { const w = (i.content?.text || "").split(/\s+/).filter(Boolean).length; return `${w} parole`; }
  if (i.type === "quiz") { const n = (i.content?.questions || []).length; return `${n} domande${i.best_score != null ? ` · record ${i.best_score}/${n}` : ""}`; }
  return `${(i.content?.cards || []).length} carte`;
}
$("#ttGrid").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openItem(b.dataset.open); });
$("#ttFilters").addEventListener("click", e => {
  const b = e.target.closest("button[data-f]"); if (!b) return;
  filter = b.dataset.f; $("#ttFilters").querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b)); renderLib();
});
$("#ttSearch").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderLib(); });

/* Esporta / Importa */
$("#ttExport").onclick = async () => {
  try {
    const all = (await api("/api/items")).items;
    if (!all.length) { toast("Non ci sono ancora schede da esportare."); return; }
    const blob = new Blob([JSON.stringify({ app: "quaderno-locale", version: 1, exported_at: Date.now(), items: all }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `schede-sergio-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Esportate ${all.length} schede.`);
  } catch (e) { toast("Esportazione non riuscita: " + e.message); }
};
$("#ttImport").onclick = () => $("#ttImportFile").click();
$("#ttImportFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    const list = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(list)) throw new Error("il file non contiene schede");
    const clean = list.filter(i => i && TYPE[i.type] && i.title && i.content).map(i => ({
      id: i.id, type: i.type, title: String(i.title), content: i.content, source_name: i.source_name ?? null,
      model: i.model || "importato", best_score: i.best_score ?? i.best ?? null, created_at: i.created_at ?? i.createdAt ?? null,
    }));
    const r = await api("/api/items/import", { method: "POST", body: JSON.stringify({ items: clean }) });
    toast(`Importate ${r.imported} schede${r.skipped ? `, ${r.skipped} già presenti saltate` : ""}.`);
    await loadItems();
  } catch (err) { toast("Importazione non riuscita: " + (err.message || "file non valido")); }
});

/* ---------- Viewer ---------- */
function findItem(id) { return items.find(i => i.id === id) || EXAMPLES.find(i => i.id === id); }
function openItem(id) {
  const it = findItem(id); if (!it) return;
  const t = TYPE[it.type];
  sheet.innerHTML = `<div class="tt-shead ${t.cls}">
      <div class="tt-titles"><span class="tt-pill">${t.label}</span><h2>${esc(it.title)}</h2>
        <span class="tt-ssub">${esc(countLabel(it))}${it.example ? " · esempio" : " · creata il " + fmtDate(it.created_at) + (it.model ? " · " + esc(it.model) : "")}</span></div>
      <div class="tt-sact">
        ${it.type === "summary" ? '<button class="btn sm" id="ttVCopy">Copia testo</button>' : ""}
        ${it.example ? "" : '<button class="btn sm" id="ttVDel" style="color:var(--rose)">Elimina</button>'}
        <button class="btn sm" id="ttVClose" aria-label="Chiudi">Chiudi</button>
      </div></div>
    <div class="tt-sbody" id="ttVBody"></div>`;
  viewer.classList.add("open");
  $("#ttVClose").onclick = closeViewer;
  const del = $("#ttVDel");
  if (del) {
    let timer = null;
    del.onclick = () => {
      if (!del.classList.contains("armed")) {
        del.classList.add("armed"); del.textContent = "Conferma eliminazione";
        timer = setTimeout(() => { del.classList.remove("armed"); del.textContent = "Elimina"; }, 3500); return;
      }
      clearTimeout(timer); deleteItem(it.id); closeViewer();
    };
  }
  const cp = $("#ttVCopy");
  if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(it.content.text); cp.textContent = "Copiato"; } catch (e) { cp.textContent = "Copia non consentita"; } };
  if (it.type === "summary") renderSummary(it);
  else if (it.type === "quiz") startQuiz(it);
  else startCards(it);
  $("#ttVClose").focus();
}
function closeViewer() { viewer.classList.remove("open"); document.removeEventListener("keydown", fcKeys); }
viewer.addEventListener("click", e => { if (e.target === viewer) closeViewer(); });
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (viewer.classList.contains("open")) closeViewer();
  else if (panel.classList.contains("open")) closeTutor();
});

function renderSummary(it) {
  const kp = it.content.keyPoints || [];
  $("#ttVBody").innerHTML = `<div class="tt-prose">${md(it.content.text)}</div>` +
    (kp.length ? `<div class="tt-kp"><h3>Punti chiave</h3><ul>${kp.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>` : "");
}

/* Lettore quiz */
function startQuiz(it) {
  const qs = it.content.questions || [];
  let i = 0, score = 0; const log = [];
  const body = $("#ttVBody");
  const L = "ABCDEFGH";
  function show() {
    const q = qs[i];
    body.innerHTML = `<div class="tt-prog"><span>${i + 1} / ${qs.length}</span><div class="tt-bar"><i style="width:${(i / qs.length) * 100}%"></i></div><span>${score} corrette</span></div>
      <div class="tt-q">${esc(q.q)}</div>
      <div class="tt-opts">${q.options.map((o, k) => `<button class="tt-opt" data-k="${k}"><span class="tt-k">${L[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
      <div id="ttQx"></div>`;
    body.querySelectorAll(".tt-opt").forEach(b => b.onclick = () => pick(+b.dataset.k));
  }
  function pick(k) {
    const q = qs[i], ok = k === q.answer;
    if (ok) score++;
    log.push({ q: q.q, ok, right: q.options[q.answer] });
    body.querySelectorAll(".tt-opt").forEach(b => { const n = +b.dataset.k; b.disabled = true; if (n === q.answer) b.classList.add("right"); else if (n === k) b.classList.add("wrong"); });
    $("#ttQx").innerHTML = `<div class="tt-explain"><b class="${ok ? "ok" : "ko"}">${ok ? "Giusto." : "Non proprio."}</b> ${esc(q.explanation || "")}</div>
      <div class="tt-end"><button class="btn primary" id="ttQNext">${i + 1 < qs.length ? "Prossima domanda" : "Vedi risultato"}</button></div>`;
    $("#ttQNext").onclick = () => { i++; i < qs.length ? show() : end(); };
    $("#ttQNext").focus();
  }
  function end() {
    const pct = Math.round((score / qs.length) * 100);
    const record = !it.example && (it.best_score == null || score > it.best_score);
    if (record) patchItem(it.id, { best_score: score });
    const msg = pct === 100 ? "Perfetto, lo sai benissimo." : pct >= 70 ? "Ottimo lavoro, ripassa solo gli errori." : pct >= 40 ? "Buona base: rivedi le risposte sbagliate." : "Conviene ripassare l'argomento e riprovare.";
    body.innerHTML = `<div class="tt-score"><div class="tt-big">${score}/${qs.length}</div><p>${msg}${record && it.best_score != null ? " Nuovo record!" : ""}</p>
      <div class="tt-review">${log.map(l => `<div class="${l.ok ? "" : "miss"}">${esc(l.q)}${l.ok ? "" : `<br><b>Risposta giusta:</b> ${esc(l.right)}`}</div>`).join("")}</div>
      <div class="tt-end" style="justify-content:center"><button class="btn primary" id="ttQAgain">Rifai il quiz</button></div></div>`;
    $("#ttQAgain").onclick = () => startQuiz(it);
  }
  show();
}

/* Lettore flashcard */
let fcKeys = () => {};
function startCards(it) {
  let deck = (it.content.cards || []).map((c, n) => ({ ...c, n }));
  let i = 0, flipped = false; const known = new Set();
  const body = $("#ttVBody");
  function show() {
    const c = deck[i];
    body.innerHTML = `<div class="tt-fcs"><button class="tt-fc ${flipped ? "flipped" : ""}" id="ttFc" aria-label="Gira la carta">
        <div class="tt-face"><span class="tt-lbl">Domanda</span><div class="tt-txt">${esc(c.front)}</div></div>
        <div class="tt-face tt-back"><span class="tt-lbl">Risposta</span><div class="tt-txt">${esc(c.back)}</div></div>
      </button></div>
      <p class="tt-hint">Clicca la carta o premi Spazio per girarla · frecce per scorrere</p>
      <div class="tt-know"><button class="btn sm" id="ttFNo" style="color:var(--rose)">Da ripassare</button><button class="btn sm" id="ttFYes" style="color:var(--green)">La so</button></div>
      <div class="tt-fnav"><span>${i + 1} / ${deck.length} · ${known.size} sapute</span>
        <div class="tt-grp"><button class="btn sm" id="ttFShuf">Mescola</button><button class="btn sm" id="ttFPrev">Indietro</button><button class="btn sm primary" id="ttFNext">Avanti</button></div></div>`;
    $("#ttFc").onclick = flip;
    $("#ttFPrev").onclick = () => go(-1);
    $("#ttFNext").onclick = () => go(1);
    $("#ttFYes").onclick = () => { known.add(c.n); go(1); };
    $("#ttFNo").onclick = () => { known.delete(c.n); go(1); };
    $("#ttFShuf").onclick = () => { deck = deck.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); i = 0; flipped = false; show(); };
  }
  function flip() { flipped = !flipped; $("#ttFc").classList.toggle("flipped", flipped); }
  function go(d) { i = (i + d + deck.length) % deck.length; flipped = false; show(); }
  document.removeEventListener("keydown", fcKeys);
  fcKeys = e => {
    if (!viewer.classList.contains("open")) return;
    if (e.key === " " && (document.activeElement?.tagName !== "BUTTON" || document.activeElement?.id === "ttFc")) { e.preventDefault(); flip(); }
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  };
  document.addEventListener("keydown", fcKeys);
  show();
}

/* ---------- Stato Ollama e modello ---------- */
let ollamaOk = false, lastHealthKey = "";
async function checkHealth() {
  let h = null;
  try { h = await api("/api/health"); } catch (e) { h = null; }
  ollamaOk = !!h?.ollama;
  $("#ttDot").className = "tt-dot " + (ollamaOk ? "ok" : "bad");
  $("#ttStat").textContent = !h ? "Server spento" : ollamaOk ? "Ollama attivo" : "Ollama spento";
  const banner = $("#ttBanner");
  if (!h) {
    banner.className = "tt-banner show";
    $("#ttBannerTxt").innerHTML = "<b>Sergio non è collegato.</b> Avvia l'app con:";
    $("#ttBannerCmd").textContent = "./scripts/start.sh";
  } else if (!ollamaOk) {
    banner.className = "tt-banner show";
    $("#ttBannerTxt").innerHTML = "<b>Ollama non risponde.</b> Avvialo e riprova. Le schede salvate restano consultabili.";
    $("#ttBannerCmd").textContent = "ollama serve";
  } else if (h.warning) {
    banner.className = "tt-banner show warn";
    $("#ttBannerTxt").textContent = h.warning;
    $("#ttBannerCmd").textContent = `ollama pull ${h.configured_model}`;
  } else banner.className = "tt-banner";
  const key = JSON.stringify([ollamaOk, h?.model, h?.configured_model]);
  if (key !== lastHealthKey) { lastHealthKey = key; await loadModels(h); }
}
async function loadModels(h) {
  const sel = $("#ttModel");
  if (!ollamaOk) { sel.innerHTML = `<option>${esc(h?.configured_model || "—")}</option>`; sel.disabled = true; return; }
  try {
    const { models, current } = await api("/api/models");
    const active = h?.model || current;
    const names = models.map(m => m.name);
    sel.innerHTML = (names.includes(current) || names.includes(current + ":latest") ? "" : `<option value="${esc(current)}" disabled>${esc(current)} (non installato)</option>`) +
      models.map(m => `<option value="${esc(m.name)}">${esc(m.name)}${m.size ? " · " + (m.size / 1e9).toFixed(1) + " GB" : ""}</option>`).join("");
    sel.value = active;
    sel.disabled = !models.length;
  } catch (e) { sel.disabled = true; }
}
$("#ttModel").addEventListener("change", async e => {
  try { await api("/api/settings", { method: "PUT", body: JSON.stringify({ model: e.target.value }) }); toast(`Modello attivo: ${e.target.value}`); }
  catch (err) { toast("Non sono riuscito a cambiare modello: " + err.message); }
  checkHealth();
});
$("#ttBannerCopy").onclick = async () => {
  const b = $("#ttBannerCopy");
  try { await navigator.clipboard.writeText($("#ttBannerCmd").textContent); b.textContent = "Copiato"; }
  catch (e) { b.textContent = "Copialo a mano"; }
  setTimeout(() => { b.textContent = "Copia"; }, 2500);
};
$("#ttBannerRetry").onclick = checkHealth;

/* ---------- Chat ---------- */
const logEl = $("#ttLog"), input = $("#ttInput"), sendBtn = $("#ttSend");
const history = [];
let attachedText = "", attachedName = "";
let material = { text: "", name: "", topic: "" };
let busy = false, controller = null;

function addMsg(role, html, cls = "") {
  const d = document.createElement("div");
  d.className = `tt-msg ${role} ${cls}`;
  if (role === "user") d.textContent = html; else d.innerHTML = html;
  logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; return d;
}
function say(t, err = false) { addMsg("bot", esc(t), err ? "err" : ""); }
function setBusy(b) {
  busy = b;
  panel.classList.toggle("tt-busy", b);
}
/* Durante una generazione i comandi restano cliccabili ma spiegano perché non partono. */
let busyNoticeAt = 0;
function busyNotice() {
  if (Date.now() - busyNoticeAt < 4000) return;
  busyNoticeAt = Date.now();
  say("Sto ancora lavorando alla richiesta precedente: aspetta che finisca oppure premi Annulla. Il testo che hai scritto resta nella casella.");
}
const clampN = (el, lo, hi, def) => { const n = parseInt(el.value, 10); const v = Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def; el.value = v; return v; };

function resolveSource(typed, topicHint) {
  if (attachedText) {
    material = { text: attachedText, name: attachedName, topic: topicHint || "" };
    clearAttach();
  } else if (typed && typed.length >= TOPIC_MAX) {
    material = { text: typed, name: "testo incollato", topic: "" };
  } else if (typed || topicHint) {
    material = { text: "", name: "argomento", topic: topicHint || typed };
  }
  return material.text || material.topic ? { ...material } : null;
}

async function runGenerations(kinds, src, counts) {
  setBusy(true);
  controller = new AbortController();
  const made = [];
  const bubble = addMsg("bot", "");
  const label = kinds.length > 1 ? (k, n) => `Sto creando ${TYPE[k].verb} (${n} di ${kinds.length})…` : k => `Sto creando ${TYPE[k].verb}…`;
  bubble.innerHTML = `<div class="tt-gen"><div class="tt-grow"><span class="tt-gtxt"></span><button class="tt-gstop">Annulla</button></div><div class="tt-bar"><i class="indet"></i></div></div>`;
  const gtxt = $(".tt-gtxt", bubble), gbar = $(".tt-bar i", bubble);
  $(".tt-gstop", bubble).onclick = () => controller?.abort();
  let failed = null;
  try {
    for (let n = 0; n < kinds.length; n++) {
      const kind = kinds[n];
      const base = label(kind, n + 1);
      gtxt.textContent = base; gbar.className = "indet"; gbar.style.width = "";
      const body = { kind, source_name: src.name || null };
      if (src.text) { body.text = src.text; if (src.topic) body.topic = src.topic; } else body.topic = src.topic;
      if (kind !== "summary") body.count = counts[kind];
      let item = null, err = null;
      await streamNdjson("/api/generate", body, controller.signal, ev => {
        if (ev.stage === "start" || ev.stage === "chunk") {
          const total = ev.total || 1, done = ev.done || 0;
          if (total > 1) { gtxt.textContent = `${base} blocco ${Math.min(done + 1, total)} di ${total}`; gbar.className = ""; gbar.style.width = `${(done / total) * 100}%`; }
        } else if (ev.stage === "warning") say(ev.message);
        else if (ev.stage === "done") item = ev.item;
        else if (ev.stage === "error") err = ev.error;
      });
      if (err) { failed = err; break; }
      if (item) { made.push(item); items = [item, ...items.filter(i => i.id !== item.id)]; renderLib(); }
    }
  } catch (e) {
    failed = e.name === "AbortError" ? { code: "aborted", message: "Generazione annullata." } : { code: e.code, message: e.message };
  } finally {
    controller = null; setBusy(false);
  }
  let html = "";
  if (made.length) html += md(made.length === 1 ? "Fatto! Ho salvato la scheda in **Le mie schede**." : `Fatto! Ho salvato ${made.length} schede in **Le mie schede**.`) + `<div class="tt-made">${made.map(it => `<button class="${TYPE[it.type].cls}" data-open="${esc(it.id)}">Apri: ${esc(it.title)}</button>`).join("")}</div>`;
  if (failed) html += `<p>${esc(failed.message || "Qualcosa è andato storto. Riprova.")}</p>`;
  bubble.classList.toggle("err", !!failed && failed.code !== "aborted");
  bubble.innerHTML = html;
  bubble.querySelector(".tt-made")?.addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openItem(b.dataset.open); });
  if (failed?.code === "ollama_unavailable" || failed?.code === "network") checkHealth();
  logEl.scrollTop = logEl.scrollHeight;
}

async function runChat(userText, sentText = userText) {
  setBusy(true);
  controller = new AbortController();
  history.push({ role: "user", content: sentText });
  const bubble = addMsg("bot", "Sto pensando…", "thinking");
  const stop = document.createElement("div");
  stop.className = "tt-gen"; stop.innerHTML = `<div class="tt-grow"><span></span><button class="tt-gstop">Interrompi</button></div>`;
  bubble.appendChild(stop); $(".tt-gstop", stop).onclick = () => controller?.abort();
  let answer = "", err = null;
  try {
    await streamNdjson("/api/chat", { messages: history.slice(-12), context_text: material.text || null }, controller.signal, ev => {
      if (ev.delta) {
        answer += ev.delta;
        bubble.classList.remove("thinking"); bubble.innerHTML = md(answer);
        bubble.appendChild(stop); $(".tt-gstop", stop).onclick = () => controller?.abort();
        logEl.scrollTop = logEl.scrollHeight;
      } else if (ev.reset) {
        // Il modello aveva scritto il suo ragionamento interno: lo tolgo e aspetto la risposta vera.
        answer = "";
        bubble.classList.add("thinking"); bubble.textContent = "Sto pensando…";
        bubble.appendChild(stop); $(".tt-gstop", stop).onclick = () => controller?.abort();
      } else if (ev.error) err = ev.error;
    });
  } catch (e) { err = e.name === "AbortError" ? null : { message: e.message, code: e.code }; }
  finally { controller = null; setBusy(false); }
  stop.remove();
  bubble.classList.remove("thinking");
  if (err) { bubble.classList.add("err"); bubble.innerHTML = (answer ? md(answer) : "") + `<p>${esc(err.message)}</p>`; if (err.code === "ollama_unavailable" || err.code === "network") checkHealth(); }
  else if (!answer) bubble.innerHTML = "<p><i>Risposta interrotta.</i></p>";
  if (answer) history.push({ role: "assistant", content: answer }); else history.pop();
}

/* Riconoscimento intento */
/* Tolleranti agli errori di battitura: "flashacard", "flascard", "quizz", "riasunto", "domade"… */
const RE_SUMMARY = /\bri?a?s{1,2}u[mn]|\bsintes|\bsintetizz/;
const RE_QUIZ = /\bq\w?u?i+z+|\bdoma\w?d/;
const RE_CARDS = /\bfla\w{0,3}\s*-?\s*ca?r?d|\bflash|\bcards?\b|\bschede\b|\bcarte\b|\bcartoncin/;
function detectKinds(t) {
  const s = t.toLowerCase();
  if (/tutti e tre|tutte e tre|tutto quanto/.test(s)) return ["summary", "quiz", "flashcards"];
  const k = [];
  if (RE_SUMMARY.test(s)) k.push("summary");
  if (RE_QUIZ.test(s)) k.push("quiz");
  if (RE_CARDS.test(s)) k.push("flashcards");
  return k;
}
function topicFrom(t) {
  const m = t.match(/\b(?:su|sul|sullo|sulla|sui|sugli|sulle|sull'|riguardo a|riguardo|a proposito di|about)\s*(.+)$/i);
  return m ? m[1].replace(/[.?!]+$/, "").trim() : "";
}
function countFrom(t, kind) {
  const re = kind === "quiz" ? /(\d{1,2})\s*(?:doma\w?d|quesit)/i : /(\d{1,2})\s*(?:fla\w{0,3}\s*-?\s*ca?r?d|flash|cards?|carte|schede)/i;
  const m = t.match(re); return m ? parseInt(m[1], 10) : null;
}
function currentCounts(text = "") {
  const q = countFrom(text, "quiz"), c = countFrom(text, "flashcards");
  if (q) $("#ttNQuiz").value = q; if (c) $("#ttNCards").value = c;
  return { quiz: clampN($("#ttNQuiz"), 3, 20, 8), flashcards: clampN($("#ttNCards"), 4, 40, 12) };
}

async function send() {
  const text = input.value.trim();
  if (!text && !attachedText) return;
  if (busy) { busyNotice(); return; }
  const kinds = text.length < 300 ? detectKinds(text) : [];
  addMsg("user", (text || "Ecco il mio materiale.") + (attachedText ? `\n📎 ${attachedName}` : ""));
  input.value = ""; autosize();
  if (kinds.length) {
    const hint = topicFrom(text);
    let src;
    if (attachedText || hint) src = resolveSource("", hint);
    else src = material.text || material.topic ? { ...material } : null;
    if (!src) { say("Su cosa vuoi studiare? Incolla del materiale, allega un file o scrivi un argomento."); return; }
    return runGenerations(kinds, src, currentCounts(text));
  }
  if (attachedText) {
    material = { text: attachedText, name: attachedName, topic: "" }; clearAttach();
    if (!text) { say(`Ho letto «${material.name}». Scegli Riassunto, Quiz o Flashcard, oppure fammi una domanda sul materiale.`); return; }
  } else if (text.length >= TOPIC_MAX && history.length === 0) {
    material = { text, name: "testo incollato", topic: "" };
    say("Ho tenuto questo testo come materiale. Scegli Riassunto, Quiz o Flashcard, oppure fammi una domanda.");
    return;
  }
  return runChat(text);
}

$("#ttChips").addEventListener("click", e => {
  const b = e.target.closest("[data-ask]"); if (!b) return;
  if (busy) { busyNotice(); return; }
  const typed = input.value.trim();
  const src = attachedText ? resolveSource("", typed.length < TOPIC_MAX ? typed : "")
    : typed ? resolveSource(typed, typed.length < TOPIC_MAX ? typed : "")
    : (material.text || material.topic ? { ...material } : null);
  if (!src) { input.placeholder = "Prima incolla appunti o scrivi un argomento…"; input.focus(); return; }
  const kinds = b.dataset.ask === "all" ? ["summary", "quiz", "flashcards"] : [b.dataset.ask];
  const what = { summary: "Riassunto", quiz: "Quiz", flashcards: "Flashcard", all: "Riassunto, quiz e flashcard" }[b.dataset.ask];
  const about = src.text ? (src.name && src.name !== "testo incollato" ? `📎 ${src.name}` : `il testo incollato (${src.text.split(/\s+/).length} parole)`) : src.topic;
  addMsg("user", `${what} su: ${about}`);
  input.value = ""; autosize();
  runGenerations(kinds, src, currentCounts());
});
sendBtn.onclick = () => send();
input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 150) + "px"; }
input.addEventListener("input", autosize);

/* Allegati: /api/extract */
$("#ttFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  if (f.size > 10 * 1024 * 1024) { say("Il file è troppo grande (massimo 10 MB).", true); return; }
  const a = $("#ttAttached"); a.hidden = false; a.innerHTML = `📎 <span>Leggo ${esc(f.name)}…</span>`;
  try {
    const fd = new FormData(); fd.append("file", f);
    const r = await api("/api/extract", { method: "POST", body: fd });
    attachedText = r.text; attachedName = r.name;
    a.innerHTML = `📎 <span>${esc(r.name)} · ${r.words.toLocaleString("it-IT")} parole</span><button id="ttRmAttach">Rimuovi</button>`;
    $("#ttRmAttach").onclick = clearAttach;
  } catch (err) { clearAttach(); say(err.message, true); }
});
function clearAttach() { attachedText = ""; attachedName = ""; const a = $("#ttAttached"); a.hidden = true; a.innerHTML = ""; }

/* Domanda da un'altra pagina (es. Orientamento): si vede la domanda, al modello arriva anche il contesto */
window.askSergio = (question, context = "") => {
  openTutor(); setTab("chat");
  if (busy) { busyNotice(); return; }
  addMsg("user", question);
  runChat(question, context ? `${context}\n\nDomanda: ${question}` : question);
};

/* Genera una scheda da un testo che arriva da un'altra pagina (es. Appunti) */
window.sergioGenerate = (kind, text, name) => {
  openTutor(); setTab("chat");
  if (busy) { busyNotice(); return; }
  material = { text, name, topic: "" };
  const kinds = kind === "all" ? ["summary", "quiz", "flashcards"] : [kind];
  const what = { summary: "Riassunto", quiz: "Quiz", flashcards: "Flashcard", all: "Riassunto, quiz e flashcard" }[kind];
  addMsg("user", `${what} su: 📎 ${name}`);
  runGenerations(kinds, { ...material }, currentCounts());
};

/* Vecchi link alla pagina #/chat: aprono il pannello */
function chatHash() { if (location.hash === "#/chat") { location.hash = "#/passaporto"; openTutor(); } }
window.addEventListener("hashchange", chatHash);
chatHash();

renderLib();
})();
