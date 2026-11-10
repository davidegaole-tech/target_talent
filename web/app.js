/* Quaderno locale — frontend. Parla solo con il backend sulla stessa origine (/api). */
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
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
};

/* ---------- Tema ---------- */
const root = document.documentElement;
const savedTheme = store.get("quaderno-theme");
if (savedTheme) root.dataset.theme = savedTheme;
$("#themeBtn").onclick = () => {
  const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = dark ? "light" : "dark";
  store.set("quaderno-theme", root.dataset.theme);
};

/* ---------- API ---------- */
class ApiError extends Error { constructor(code, message) { super(message); this.code = code; } }
async function api(path, opts = {}) {
  const init = { ...opts, headers: { ...(opts.body && !(opts.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...(opts.headers || {}) } };
  let res;
  try { res = await fetch(path, init); }
  catch (e) { if (e.name === "AbortError") throw e; throw new ApiError("network", "Il server di Quaderno non risponde. È ancora avviato?"); }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error?.code || "http_" + res.status, data?.error?.message || "Errore del server (" + res.status + ").");
  return data;
}
/* Legge una risposta NDJSON e chiama onEvent per ogni riga. */
async function streamNdjson(path, body, signal, onEvent) {
  let res;
  try { res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal }); }
  catch (e) { if (e.name === "AbortError") throw e; throw new ApiError("network", "Il server di Quaderno non risponde. È ancora avviato?"); }
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
  catch (e) { toast("Non riesco a leggere la libreria: " + e.message, true); }
  renderLib();
}
async function deleteItem(id) {
  try { await api("/api/items/" + encodeURIComponent(id), { method: "DELETE" }); items = items.filter(i => i.id !== id); renderLib(); }
  catch (e) { toast("Eliminazione non riuscita: " + e.message, true); }
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
  $("#count").textContent = n ? `${n} ${n === 1 ? "scheda" : "schede"}` : "Nessuna scheda ancora";
  $("#tabCount").textContent = n ? `(${n})` : "";
  const g = $("#grid");
  g.innerHTML = (items.length ? "" : `<p class="empty-note">Ecco come appariranno le tue schede. Questi tre sono esempi: aprili per provarli, spariranno quando creerai la prima scheda.</p>`) +
    (shown.length ? "" : `<p class="empty-note">Nessuna scheda corrisponde al filtro.</p>`) +
    shown.map(i => {
      const t = TYPE[i.type] || TYPE.summary;
      return `<button class="tile ${t.cls}" data-open="${esc(i.id)}">
        <span class="band"></span>
        <span class="body">
          <span style="display:flex;gap:6px;align-items:center"><span class="pill">${t.label}</span>${i.example ? '<span class="example-tag">Esempio</span>' : ""}</span>
          <h3>${esc(i.title)}</h3>
          <span class="peek">${esc(peek(i))}</span>
          <span class="meta"><span>${esc(countLabel(i))}</span><span>${i.example ? "" : fmtDate(i.created_at)}</span></span>
        </span>
      </button>`;
    }).join("");
}
function peek(i) {
  if (i.type === "summary") return (i.content?.text || "").replace(/[#*_>`]/g, "").slice(0, 180);
  if (i.type === "quiz") return (i.content?.questions || []).slice(0, 2).map(q => q.q).join(" · ");
  return (i.content?.cards || []).slice(0, 4).map(c => c.front).join(" · ");
}
function countLabel(i) {
  if (i.type === "summary") { const w = (i.content?.text || "").split(/\s+/).filter(Boolean).length; return `${w} parole`; }
  if (i.type === "quiz") { const n = (i.content?.questions || []).length; return `${n} domande${i.best_score != null ? ` · record ${i.best_score}/${n}` : ""}`; }
  return `${(i.content?.cards || []).length} carte`;
}
$("#grid").addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openItem(b.dataset.open); });
$("#filters").addEventListener("click", e => {
  const b = e.target.closest("button[data-f]"); if (!b) return;
  filter = b.dataset.f; $("#filters").querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b)); renderLib();
});
$("#search").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderLib(); });

/* Esporta / Importa */
$("#exportBtn").onclick = async () => {
  try {
    const all = (await api("/api/items")).items;
    if (!all.length) { toast("Non ci sono ancora schede da esportare."); return; }
    const blob = new Blob([JSON.stringify({ app: "quaderno-locale", version: 1, exported_at: Date.now(), items: all }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `quaderno-schede-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`Esportate ${all.length} schede.`);
  } catch (e) { toast("Esportazione non riuscita: " + e.message, true); }
};
$("#importBtn").onclick = () => $("#importFile").click();
$("#importFile").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    const list = Array.isArray(data) ? data : data.items;
    if (!Array.isArray(list)) throw new Error("il file non contiene schede di Quaderno");
    const clean = list.filter(i => i && TYPE[i.type] && i.title && i.content).map(i => ({
      id: i.id, type: i.type, title: String(i.title), content: i.content, source_name: i.source_name ?? null,
      model: i.model || "importato", best_score: i.best_score ?? i.best ?? null, created_at: i.created_at ?? i.createdAt ?? null,
    }));
    const r = await api("/api/items/import", { method: "POST", body: JSON.stringify({ items: clean }) });
    toast(`Importate ${r.imported} schede${r.skipped ? `, ${r.skipped} già presenti saltate` : ""}.`);
    await loadItems();
  } catch (err) { toast("Importazione non riuscita: " + (err.message || "file non valido"), true); }
});

/* ---------- Viewer ---------- */
const viewer = $("#viewer"), sheet = $("#sheet");
function findItem(id) { return items.find(i => i.id === id) || EXAMPLES.find(i => i.id === id); }
function openItem(id) {
  const it = findItem(id); if (!it) return;
  const t = TYPE[it.type];
  sheet.innerHTML = `<div class="sheet-head ${t.cls}">
      <div class="titles"><span class="pill">${t.label}</span><h2 id="vTitle">${esc(it.title)}</h2>
        <span class="sub">${esc(countLabel(it))}${it.example ? " · esempio" : " · creata il " + fmtDate(it.created_at) + (it.model ? " · " + esc(it.model) : "")}</span></div>
      <div class="sheet-actions">
        ${it.type === "summary" ? '<button class="btn" id="vCopy">Copia testo</button>' : ""}
        ${it.example ? "" : '<button class="btn danger" id="vDel">Elimina</button>'}
        <button class="btn" id="vClose" aria-label="Chiudi">Chiudi</button>
      </div></div>
    <div class="sheet-body" id="vBody"></div>`;
  viewer.classList.add("open");
  $("#vClose").onclick = closeViewer;
  const del = $("#vDel");
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
  const cp = $("#vCopy");
  if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(it.content.text); cp.textContent = "Copiato"; } catch (e) { cp.textContent = "Copia non consentita"; } };
  if (it.type === "summary") renderSummary(it);
  else if (it.type === "quiz") startQuiz(it);
  else startCards(it);
  $("#vClose").focus();
}
function closeViewer() { viewer.classList.remove("open"); document.removeEventListener("keydown", fcKeys); }
viewer.addEventListener("click", e => { if (e.target === viewer) closeViewer(); });
document.addEventListener("keydown", e => { if (e.key === "Escape" && viewer.classList.contains("open")) closeViewer(); });

function renderSummary(it) {
  const kp = it.content.keyPoints || [];
  $("#vBody").innerHTML = `<div class="prose">${md(it.content.text)}</div>` +
    (kp.length ? `<div class="keypoints"><h3>Punti chiave</h3><ul>${kp.map(k => `<li>${esc(k)}</li>`).join("")}</ul></div>` : "");
}

/* Lettore quiz */
function startQuiz(it) {
  const qs = it.content.questions || [];
  let i = 0, score = 0; const log = [];
  const body = $("#vBody");
  const L = "ABCDEFGH";
  function show() {
    const q = qs[i];
    body.innerHTML = `<div class="progress"><span>${i + 1} / ${qs.length}</span><div class="bar"><i style="width:${(i / qs.length) * 100}%"></i></div><span>${score} corrette</span></div>
      <div class="question">${esc(q.q)}</div>
      <div class="options">${q.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="k">${L[k]}</span><span>${esc(o)}</span></button>`).join("")}</div>
      <div id="qx"></div>`;
    body.querySelectorAll(".opt").forEach(b => b.onclick = () => pick(+b.dataset.k));
  }
  function pick(k) {
    const q = qs[i], ok = k === q.answer;
    if (ok) score++;
    log.push({ q: q.q, ok, right: q.options[q.answer] });
    body.querySelectorAll(".opt").forEach(b => { const n = +b.dataset.k; b.disabled = true; if (n === q.answer) b.classList.add("right"); else if (n === k) b.classList.add("wrong"); });
    $("#qx").innerHTML = `<div class="explain"><b class="${ok ? "ok" : "ko"}">${ok ? "Giusto." : "Non proprio."}</b> ${esc(q.explanation || "")}</div>
      <div class="row-end"><button class="btn primary" id="qNext">${i + 1 < qs.length ? "Prossima domanda" : "Vedi risultato"}</button></div>`;
    $("#qNext").onclick = () => { i++; i < qs.length ? show() : end(); };
    $("#qNext").focus();
  }
  function end() {
    const pct = Math.round((score / qs.length) * 100);
    const record = !it.example && (it.best_score == null || score > it.best_score);
    if (record) patchItem(it.id, { best_score: score });
    const msg = pct === 100 ? "Perfetto, lo sai benissimo." : pct >= 70 ? "Ottimo lavoro, ripassa solo gli errori." : pct >= 40 ? "Buona base: rivedi le risposte sbagliate." : "Conviene ripassare l'argomento e riprovare.";
    body.innerHTML = `<div class="score"><div class="big">${score}/${qs.length}</div><p>${msg}${record && it.best_score != null ? " Nuovo record!" : ""}</p>
      <div class="review">${log.map(l => `<div class="${l.ok ? "" : "miss"}">${esc(l.q)}${l.ok ? "" : `<br><b>Risposta giusta:</b> ${esc(l.right)}`}</div>`).join("")}</div>
      <div class="row-end" style="justify-content:center"><button class="btn primary" id="qAgain">Rifai il quiz</button></div></div>`;
    $("#qAgain").onclick = () => startQuiz(it);
  }
  show();
}

/* Lettore flashcard */
let fcKeys = () => {};
function startCards(it) {
  let deck = (it.content.cards || []).map((c, n) => ({ ...c, n }));
  let i = 0, flipped = false; const known = new Set();
  const body = $("#vBody");
  function show() {
    const c = deck[i];
    body.innerHTML = `<div class="fc-stage"><button class="fc ${flipped ? "flipped" : ""}" id="fc" aria-label="Gira la carta">
        <div class="fc-face"><span class="lbl">Domanda</span><div class="txt">${esc(c.front)}</div></div>
        <div class="fc-face fc-back"><span class="lbl">Risposta</span><div class="txt">${esc(c.back)}</div></div>
      </button></div>
      <p class="hint">Clicca la carta o premi Spazio per girarla · frecce per scorrere</p>
      <div class="know"><button class="btn ko" id="fNo">Da ripassare</button><button class="btn ok" id="fYes">La so</button></div>
      <div class="fc-nav"><span class="pos">${i + 1} / ${deck.length} · ${known.size} sapute</span>
        <div class="grp"><button class="btn" id="fShuf">Mescola</button><button class="btn" id="fPrev">Indietro</button><button class="btn primary" id="fNext">Avanti</button></div></div>`;
    $("#fc").onclick = flip;
    $("#fPrev").onclick = () => go(-1);
    $("#fNext").onclick = () => go(1);
    $("#fYes").onclick = () => { known.add(c.n); go(1); };
    $("#fNo").onclick = () => { known.delete(c.n); go(1); };
    $("#fShuf").onclick = () => { deck = deck.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(v => v[1]); i = 0; flipped = false; show(); };
  }
  function flip() { flipped = !flipped; $("#fc").classList.toggle("flipped", flipped); }
  function go(d) { i = (i + d + deck.length) % deck.length; flipped = false; show(); }
  document.removeEventListener("keydown", fcKeys);
  fcKeys = e => {
    if (!viewer.classList.contains("open")) return;
    if (e.key === " " && (document.activeElement?.tagName !== "BUTTON" || document.activeElement?.id === "fc")) { e.preventDefault(); flip(); }
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
  $("#olDot").className = "dot " + (ollamaOk ? "ok" : "bad");
  $("#olTxt").textContent = !h ? "Server non raggiungibile" : ollamaOk ? "Ollama attivo" : "Ollama spento";
  const banner = $("#banner");
  if (!ollamaOk) {
    banner.className = "banner show";
    $("#bannerTxt").innerHTML = "<b>Ollama non risponde.</b> Avvia Ollama e ricarica la pagina. Le schede salvate restano consultabili.";
    $("#bannerCmd").textContent = "ollama serve"; $("#bannerCmd").hidden = false; $("#bannerCopy").hidden = false;
  } else if (h.warning) {
    banner.className = "banner show warn";
    $("#bannerTxt").textContent = h.warning;
    const cmd = `ollama pull ${h.configured_model}`;
    $("#bannerCmd").textContent = cmd; $("#bannerCmd").hidden = false; $("#bannerCopy").hidden = false;
  } else banner.className = "banner";
  const key = JSON.stringify([ollamaOk, h?.model, h?.configured_model]);
  if (key !== lastHealthKey) { lastHealthKey = key; await loadModels(h); }
}
async function loadModels(h) {
  const sel = $("#modelSel");
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
$("#modelSel").addEventListener("change", async e => {
  try { await api("/api/settings", { method: "PUT", body: JSON.stringify({ model: e.target.value }) }); toast(`Modello attivo: ${e.target.value}.`); }
  catch (err) { toast("Non sono riuscito a cambiare modello: " + err.message, true); }
  checkHealth();
});
$("#bannerCopy").onclick = async () => {
  try { await navigator.clipboard.writeText($("#bannerCmd").textContent); $("#bannerCopy").textContent = "Copiato"; }
  catch (e) { $("#bannerCopy").textContent = "Selezionalo e copialo a mano"; }
  setTimeout(() => { $("#bannerCopy").textContent = "Copia comando"; }, 2500);
};
$("#bannerRetry").onclick = checkHealth;

/* ---------- Chat ---------- */
const logEl = $("#log"), input = $("#input"), sendBtn = $("#send");
const history = [];                 // solo le domande libere al tutor
let attachedText = "", attachedName = "";
let material = { text: "", name: "", topic: "" };   // ultimo materiale (allegato, incollato o argomento)
let busy = false, controller = null;

function addMsg(role, html, cls = "") {
  const d = document.createElement("div");
  d.className = `msg ${role} ${cls}`;
  if (role === "user") d.textContent = html; else d.innerHTML = html;
  logEl.appendChild(d); logEl.scrollTop = logEl.scrollHeight; return d;
}
function toast(t, err = false) { addMsg("bot", esc(t), err ? "err" : ""); }
function setBusy(b) {
  busy = b; sendBtn.disabled = b;
  document.querySelectorAll("#chips .chip").forEach(c => c.disabled = b);
}
const clampN = (el, lo, hi, def) => { const n = parseInt(el.value, 10); const v = Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : def; el.value = v; return v; };

/* Ricava cosa mandare al generatore dal testo scritto, dall'allegato o dall'ultimo materiale. */
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
  const bubble = addMsg("bot", "", "gen-msg");
  const label = kinds.length > 1 ? (k, n) => `Sto creando ${TYPE[k].verb} (${n} di ${kinds.length})…` : k => `Sto creando ${TYPE[k].verb}…`;
  bubble.innerHTML = `<div class="gen"><div class="row"><span class="gtxt"></span><button class="gstop">Annulla</button></div><div class="bar"><i class="indet"></i></div></div>`;
  const gtxt = $(".gtxt", bubble), gbar = $(".bar i", bubble);
  $(".gstop", bubble).onclick = () => controller?.abort();
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
        } else if (ev.stage === "warning") toast(ev.message);
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
  if (made.length) html += md(made.length === 1 ? "Fatto! Ho salvato la scheda nella libreria." : `Fatto! Ho salvato ${made.length} schede nella libreria.`) + `<div class="made">${made.map(it => `<button class="${TYPE[it.type].cls}" data-open="${esc(it.id)}">Apri: ${esc(it.title)}</button>`).join("")}</div>`;
  if (failed) html += `<p>${esc(failed.message || "Qualcosa è andato storto. Riprova.")}</p>`;
  bubble.classList.toggle("err", !!failed && failed.code !== "aborted");
  bubble.innerHTML = html;
  bubble.querySelector(".made")?.addEventListener("click", e => { const b = e.target.closest("[data-open]"); if (b) openItem(b.dataset.open); });
  if (failed?.code === "ollama_unavailable") checkHealth();
  logEl.scrollTop = logEl.scrollHeight;
}

async function runChat(userText) {
  setBusy(true);
  controller = new AbortController();
  history.push({ role: "user", content: userText });
  const bubble = addMsg("bot", "Sto pensando…", "thinking");
  const stop = document.createElement("div");
  stop.className = "gen"; stop.innerHTML = `<div class="row"><span></span><button class="gstop">Interrompi</button></div>`;
  bubble.appendChild(stop); $(".gstop", stop).onclick = () => controller?.abort();
  let answer = "", err = null;
  try {
    await streamNdjson("/api/chat", { messages: history.slice(-12), context_text: material.text || null }, controller.signal, ev => {
      if (ev.delta) {
        answer += ev.delta;
        bubble.classList.remove("thinking"); bubble.innerHTML = md(answer);
        bubble.appendChild(stop); $(".gstop", stop).onclick = () => controller?.abort();
        logEl.scrollTop = logEl.scrollHeight;
      } else if (ev.error) err = ev.error;
    });
  } catch (e) { err = e.name === "AbortError" ? null : { message: e.message, code: e.code }; }
  finally { controller = null; setBusy(false); }
  stop.remove();
  bubble.classList.remove("thinking");
  if (err) { bubble.classList.add("err"); bubble.innerHTML = (answer ? md(answer) : "") + `<p>${esc(err.message)}</p>`; if (err.code === "ollama_unavailable") checkHealth(); }
  else if (!answer) bubble.innerHTML = "<p><i>Risposta interrotta.</i></p>";
  if (answer) history.push({ role: "assistant", content: answer }); else history.pop();
}

/* Riconoscimento intento (§7.3) */
function detectKinds(t) {
  const s = t.toLowerCase();
  if (/tutti e tre|tutte e tre|tutto quanto/.test(s)) return ["summary", "quiz", "flashcards"];
  const k = [];
  if (/riassunt|sintesi|riassum/.test(s)) k.push("summary");
  if (/quiz|domand/.test(s)) k.push("quiz");
  if (/flash ?card|schede|carte/.test(s)) k.push("flashcards");
  return k;
}
function topicFrom(t) {
  const m = t.match(/\b(?:su|sul|sullo|sulla|sui|sugli|sulle|sull'|riguardo a|riguardo|a proposito di|about)\s*(.+)$/i);
  return m ? m[1].replace(/[.?!]+$/, "").trim() : "";
}
function countFrom(t, kind) {
  const re = kind === "quiz" ? /(\d{1,2})\s*(?:domand|quesit)/i : /(\d{1,2})\s*(?:flash ?card|carte|schede)/i;
  const m = t.match(re); return m ? parseInt(m[1], 10) : null;
}
function currentCounts(text = "") {
  const q = countFrom(text, "quiz"), c = countFrom(text, "flashcards");
  if (q) $("#nQuiz").value = q; if (c) $("#nCards").value = c;
  return { quiz: clampN($("#nQuiz"), 3, 20, 8), flashcards: clampN($("#nCards"), 4, 40, 12) };
}

async function send() {
  const text = input.value.trim();
  if (busy || (!text && !attachedText)) return;
  const kinds = text.length < 300 ? detectKinds(text) : [];
  addMsg("user", (text || "Ecco il mio materiale.") + (attachedText ? `\n📎 ${attachedName}` : ""));
  input.value = ""; autosize();
  if (kinds.length) {
    // Richiesta esplicita: "fammi un quiz sulla fotosintesi"
    const hint = topicFrom(text);
    let src;
    if (attachedText) src = resolveSource("", hint);
    else if (hint) src = resolveSource("", hint);
    else src = material.text || material.topic ? { ...material } : null;
    if (!src) { toast("Su cosa vuoi studiare? Incolla del materiale, allega un file o scrivi un argomento."); return; }
    return runGenerations(kinds, src, currentCounts(text));
  }
  if (attachedText) {
    material = { text: attachedText, name: attachedName, topic: "" }; clearAttach();
    if (!text) { toast(`Ho letto «${material.name}». Scegli Riassunto, Quiz o Flashcard, oppure fammi una domanda sul materiale.`); return; }
  } else if (text.length >= TOPIC_MAX && history.length === 0) {
    // Testo lungo incollato senza richiesta: lo tengo come materiale.
    material = { text, name: "testo incollato", topic: "" };
    toast("Ho tenuto questo testo come materiale. Scegli Riassunto, Quiz o Flashcard, oppure fammi una domanda.");
    return;
  }
  return runChat(text);
}

$("#chips").addEventListener("click", e => {
  const b = e.target.closest("[data-ask]"); if (!b || busy) return;
  const typed = input.value.trim();
  const src = attachedText ? resolveSource("", typed.length < TOPIC_MAX ? typed : "")
    : typed ? resolveSource(typed, typed.length < TOPIC_MAX ? typed : "")
    : (material.text || material.topic ? { ...material } : null);
  if (!src) { input.placeholder = "Prima incolla i tuoi appunti o scrivi un argomento…"; input.focus(); return; }
  const kinds = b.dataset.ask === "all" ? ["summary", "quiz", "flashcards"] : [b.dataset.ask];
  const what = { summary: "Riassunto", quiz: "Quiz", flashcards: "Flashcard", all: "Riassunto, quiz e flashcard" }[b.dataset.ask];
  const about = src.text ? (src.name && src.name !== "testo incollato" ? `📎 ${src.name}` : `il testo incollato (${src.text.split(/\s+/).length} parole)`) : src.topic;
  addMsg("user", `${what} su: ${about}`);
  input.value = ""; autosize();
  runGenerations(kinds, src, currentCounts());
});
sendBtn.onclick = () => send();
input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
function autosize() { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 200) + "px"; }
input.addEventListener("input", autosize);

/* Allegati: /api/extract */
$("#file").addEventListener("change", async e => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  if (f.size > 10 * 1024 * 1024) { toast("Il file è troppo grande (massimo 10 MB).", true); return; }
  const a = $("#attached"); a.hidden = false; a.innerHTML = `📎 <span>Leggo ${esc(f.name)}…</span>`;
  try {
    const fd = new FormData(); fd.append("file", f);
    const r = await api("/api/extract", { method: "POST", body: fd });
    attachedText = r.text; attachedName = r.name;
    a.innerHTML = `📎 <span>${esc(r.name)} · ${r.words.toLocaleString("it-IT")} parole</span><button id="rmAttach">Rimuovi</button>`;
    $("#rmAttach").onclick = clearAttach;
  } catch (err) { clearAttach(); toast(err.message, true); }
});
function clearAttach() { attachedText = ""; attachedName = ""; const a = $("#attached"); a.hidden = true; a.innerHTML = ""; }

/* Tab (telefono) */
const app = $("#app");
function setTab(t) { app.dataset.tab = t; $("#tabChat").setAttribute("aria-selected", t === "chat"); $("#tabLib").setAttribute("aria-selected", t === "lib"); }
$("#tabChat").onclick = () => setTab("chat");
$("#tabLib").onclick = () => setTab("lib");

/* Avvio */
renderLib();
loadItems();
checkHealth();
setInterval(() => { if (!busy) checkHealth(); }, 30000);
})();
