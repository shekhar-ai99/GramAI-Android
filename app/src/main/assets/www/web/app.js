// GramAI web (design + flow). Content comes from the repo's own JSON in ../languages and ../recommendations.
// Diagnosis results are DEMO until the ONNX model (../models/web_model.onnx) is wired in.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LANGS = [
  { code: 'or', name: 'ଓଡ଼ିଆ', dir: 'or', ui: true }, { code: 'en', name: 'English', dir: 'en', ui: true }, { code: 'hi', name: 'हिन्दी', dir: 'en', ui: true },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', dir: 'en', ui: true, mt: true }, { code: 'hoc', name: 'Ho', dir: 'en', ui: false } ];
const S = { lang: store.get('agri.lang', null), sector: null, item: null, tab: 'diag', photo: null, result: null, heat: false, sub: {}, sol: 'organic' };
let I18N = {}, DOMAIN = {}, REC = { en: {}, or: {} }, CONTENT = {}, DATA = {}, WX = { days: [], mode: 'none', syncedAt: 0 };
const G = window.GramLogic;
const FEATURES = {
  store: false,                                              // GramAI Store (ordering) is Phase 2
  llm: new URLSearchParams(location.search).has('ai'),       // on-device LLM: EXPERIMENT ONLY. The 0.5B model failed grounding, see docs/LLM_EVAL.md
};
const t = (k) => I18N[S.lang]?.[k] || I18N.en?.[k] || k;
const L = () => LANGS.find(l => l.code === S.lang) || LANGS[0];
const getJSON = async (p) => { try { const r = await fetch(p); return r.ok ? await r.json() : null; } catch { return null; } };
const noEmoji = (s) => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const itemName = (it) => t('n_' + it.id);
const CLASSES = { paddy: ['plant_paddy_blast', 'plant_paddy_blight', 'plant_paddy_brownspot', 'plant_paddy_tungro'], cow: ['animal_cow_mastitis'], goat: ['animal_goat_ppr', 'animal_goat_healthy'] };

async function content(name) { // tips | calendar | schemes | shop, with Odia where it exists
  const key = L().dir + name; if (CONTENT[key]) return CONTENT[key];
  let d = await getJSON(`../languages/${L().dir}/${name}.json`); if (!d) d = await getJSON(`../languages/en/${name}.json`);
  return (CONTENT[key] = d || {});
}
async function rec(id) {
  if (!REC.en.loaded) { REC.en = (await getJSON('../recommendations/recommendations.json')) || {}; REC.en.loaded = 1; REC.or = (await getJSON('../languages/or/recommendations.json')) || {}; }
  return (L().dir === 'or' && REC.or[id]) || REC.en[id];
}

/* ---------- chrome ---------- */
function applyI18n() {
  $$('[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
  document.documentElement.lang = L().code;
  if (typeof netBar === 'function') netBar();
  const n = $('#pending'); n.hidden = L().ui && !L().mt;
  n.querySelector('span').textContent = L().name + (L().mt ? ': machine translation, not yet checked by a native speaker.' : ': translation is being prepared. Showing English for now.');
}
function setLang(code) { S.lang = code; store.set('agri.lang', code); applyI18n(); render(); }
function go(state) { Object.assign(S, state); render(); scrollTo({ top: 0 }); }
$('#back').onclick = () => { if (S.item) go({ item: null, result: null, photo: null, tab: 'diag' }); else go({ sector: null }); };
$('#langbtn').onclick = () => $('#welcome').showModal();
$('#theme').onclick = () => { const dark = matchMedia('(prefers-color-scheme: dark)').matches, cur = document.documentElement.dataset.theme || (dark ? 'dark' : 'light'); const n = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = n; store.set('agri.theme', n); };
{ const th = store.get('agri.theme', null); if (th) document.documentElement.dataset.theme = th; }

/* Keep the sticky tab row exactly below the sticky header, whatever its height */
const fitHeader = () => { const h = $('.top'); if (h) document.documentElement.style.setProperty('--hdr', h.offsetHeight + 'px'); };
addEventListener('resize', fitHeader); addEventListener('load', fitHeader);

/* ---------- views ---------- */
async function render() {
  fitHeader();
  const v = $('#view'); v.className = 'view'; $('#back').hidden = !S.sector; $('#fab').hidden = !S.item;
  if (!S.sector) return renderSector(v);
  if (!S.item) return renderItems(v);
  return renderDash(v);
}
function renderSector(v) {
  v.innerHTML = `<div class="hero"><small>${esc(t('header_tagline'))}</small><h1>${esc(t('sectorTitle'))}</h1></div>
    <button class="card sector" data-s="plant"><div class="ico">🌱</div><div><b>${esc(noEmoji(t('btn_plant')))}</b><span class="s">${esc(t('plantSub'))}</span></div><div class="go">›</div></button>
    <button class="card sector animal" data-s="animal"><div class="ico">🐄</div><div><b>${esc(noEmoji(t('btn_animal')))}</b><span class="s">${esc(t('animalSub'))}</span></div><div class="go">›</div></button>`;
  $$('[data-s]', v).forEach(b => b.onclick = () => go({ sector: b.dataset.s }));
}
function renderItems(v) {
  const list = DOMAIN[S.sector] || [];
  v.innerHTML = `<h1 class="page">${esc(S.sector === 'plant' ? t('lbl_crop') : t('lbl_animal'))}</h1><div class="grid2">${list.map(it =>
    `<button class="card item ${it.enabled ? '' : 'off'}" data-id="${it.id}" ${it.enabled ? '' : 'aria-disabled="true"'}>${it.enabled ? '' : `<span class="tag">${esc(t('comingSoon'))}</span>`}<span class="e">${it.icon}</span><b>${esc(itemName(it))}</b>${itemName(it) !== it.name ? `<small>${esc(it.name)}</small>` : ''}</button>`).join('')}</div>`;
  $$('.item', v).forEach(b => b.onclick = () => { const it = list.find(x => x.id === b.dataset.id); if (it.enabled) go({ item: it, tab: 'diag', result: null, photo: null }); });
}
const TABS = [['diag', 'tab_diagnosis'], ['sum', 'tab_summary'], ['tips', 'tab_tips'], ['cal', 'tab_calendar'], ['wx', 'tab_weather'], ['sch', 'tab_schemes'], ['shop', 'tab_shop'], ['news', 'tab_news']];
async function renderDash(v) {
  const it = S.item;
  v.innerHTML = `<div class="row"><div class="mark" style="background:${S.sector === 'animal' ? 'var(--clay-soft)' : 'var(--gold-soft)'}">${it.icon}</div><div><h1 class="page" style="margin:0">${esc(itemName(it))}</h1><p class="muted">${esc(t('dashboard_title'))}</p></div></div>
    <div class="chiprow" role="tablist">${TABS.map(([id, k]) => `<button role="tab" aria-selected="${S.tab === id}" data-t="${id}">${esc(t(k) || k)}</button>`).join('')}</div><div id="tabbody" class="stack"></div>`;
  $$('[data-t]', v).forEach(b => b.onclick = () => { S.tab = b.dataset.t; renderDash(v); });
  const body = $('#tabbody', v); const fn = { diag: tabDiag, sum: tabSummary, tips: tabTips, cal: tabCal, sch: tabSch, news: tabNews, wx: tabWx, shop: tabShop }[S.tab]; await fn(body);
}
const soon = (b) => b.innerHTML = `<div class="card"><span class="pill warn">${esc(t('comingSoon'))}</span></div>`;

/* Diagnosis */
async function tabDiag(b) {
  const it = S.item, classes = CLASSES[it.id];
  if (!classes) return soon(b);
  b.innerHTML = `<div class="finder" id="fnd">${S.photo ? `<img alt="" src="${S.photo}">${S.heat ? '<div class="heat"></div>' : ''}` : `<div><span class="big">${it.icon}</span><span class="hint">${esc(t('photoHint'))}</span></div>`}</div>
    <input type="file" id="file" accept="image/*" hidden>
    <button class="btn ghost" id="pick">🖼️ ${esc(t('choosePhoto'))}</button>
    <button class="btn" id="go" ${S.photo ? '' : 'disabled'}>${esc(t('btn_analyze'))}</button><div id="out" class="stack"></div>`;
  $('#pick', b).onclick = () => $('#file', b).click();
  $('#file', b).onchange = (e) => { const f = e.target.files[0]; if (f) { S.photo = URL.createObjectURL(f); S.result = null; renderDash($('#view')); } };
  $('#go', b).onclick = async () => {
    const fnd = $('#fnd', b), out = $('#out', b); fnd.classList.add('scanning');
    out.innerHTML = `<div class="card"><ol class="steps">${['stepPhoto', 'stepRead', 'stepAdvice'].map(k => `<li><span class="dot">·</span>${esc(t(k))}</li>`).join('')}</ol></div>`;
    for (const li of $$('.steps li', out)) { li.className = 'now'; li.firstChild.textContent = ''; await new Promise(r => setTimeout(r, reduce ? 0 : 650)); li.className = 'done'; li.firstChild.textContent = '✓'; }
    fnd.classList.remove('scanning'); S.result = S.result || classes[0]; showResult(out);
  };
  if (S.result) showResult($('#out', b));
}
/* ---------- helpers ---------- */
const LOC = () => ({ or: 'or-IN', hi: 'hi-IN' }[L().code] || 'en-IN');
const fmt = (iso, o = { day: 'numeric', month: 'short' }) => { try { return G.parse(iso).toLocaleDateString(LOC(), o); } catch { return iso; } };
const startKey = () => 'agri.start.' + S.item.id;
const getStart = () => store.get(startKey(), '');
const seg = (id, opts, cur) => `<div class="seg2" id="${id}">${opts.map(([v, k]) => `<button data-v="${v}" aria-pressed="${cur === v}">${esc(t(k))}</button>`).join('')}</div>`;
const needEnglishNote = () => (L().code === 'en' || (L().code === 'or' && false)) ? '' : `<p class="muted">${esc(t('contentEnglish'))}</p>`;
const verifyPill = (ok, key = 'verifyVet') => ok ? '' : `<span class="pill warn">${esc(t(key))}</span>`;
const rerender = () => renderDash($('#view'));
function bindSeg(root, id, cb) { $$(`#${id} button`, root).forEach(b => b.onclick = () => cb(b.dataset.v)); }
const monsoon = () => { const m = new Date().getMonth() + 1; return m >= 6 && m <= 9; };

/* Solutions: organic vs chemical, always with the safety line */
function solutionsCard(org, chem, spray) {
  return `<div class="card"><p class="sec-l">${esc(t('solutions'))}</p>${seg('solseg', [['organic', 'organic'], ['chemical', 'chemical']], S.sol)}
    <div class="sol" style="margin-top:12px">${md(S.sol === 'organic' ? org : chem)}</div>
    ${S.sol === 'chemical' ? `${spray ? sprayBanner(spray) : ''}<div class="banner" style="margin:12px 0 0">🛡️<span>${esc(t('careful'))}</span></div>${FEATURES.store ? '' : `<div class="store-teaser">🛒 ${esc(t('storeTeaser'))}</div>`}` : ''}</div>`;
}
const VERD = { safe: ['', '✓', 'rSafe'], caution: ['warn', '!', 'rMaybe'], no: ['bad', '✕', 'rRain'] };
const REASON = { dry: 'rSafe', rain: 'rRain', wind: 'rWind', maybeRain: 'rMaybe', heat: 'rHeat', estimated: 'rEst' };
const VLABEL = { safe: 'spraySafe', caution: 'sprayCaution', no: 'sprayNo' };
function todayVerdict() { const d = WX.days[0]; return d ? { d, v: G.sprayVerdict(d, { monsoon: monsoon() }) } : null; }
function sprayBanner(tv) { return `<div class="banner ${tv.v.level === 'no' ? 'alert' : ''}" style="margin:12px 0 0">🌦️<span><b>${esc(t('todaySpray'))}: ${esc(t(VLABEL[tv.v.level]))}</b> · ${esc(t(REASON[tv.v.reason]))}${tv.d.estimated ? ' · ' + esc(t('estimated')) : ''}</span></div>`; }

/* Diagnosis result (demo class) */
async function showResult(out) {
  const id = S.result, r = await rec(id), classes = CLASSES[S.item.id]; if (!r) return;
  const healthy = id.endsWith('healthy'), pct = healthy ? 94 : 91;
  out.innerHTML = `<div class="card"><div class="rhead"><div><span class="pill ${healthy ? '' : 'bad'}">${healthy ? '✓ ' + esc(t('healthy')) : '✓ ' + esc(t('tab_diagnosis').replace(/^\S+\s+/, ''))}</span> <span class="pill demo">${esc(t('demo'))}</span><h2>${esc(r.title)}</h2></div>
      <div class="ring" id="ring"><div><span>${pct}%</span><small>${esc(t('sure'))}</small></div></div></div></div>
    <div class="row"><button class="btn" id="say" ${'speechSynthesis' in window && ['en', 'hi'].includes(L().code) ? '' : 'hidden'}>🔊 ${esc(t('listen'))}</button>
    <label class="pill" style="cursor:pointer"><input type="checkbox" id="heat" ${S.heat ? 'checked' : ''}> ${esc(t('focusArea'))}</label></div>
    ${[['secOverview', r.overview], ['secNow', r.immediate_steps]].filter(x => x[1]).map(([k, v]) => `<div class="card"><p class="sec-l">${esc(t(k))}</p>${md(v)}</div>`).join('')}
    <div id="solhost"></div>
    ${r.prevention ? `<div class="card"><p class="sec-l">${esc(t('secPrevent'))}</p>${md(r.prevention)}</div>` : ''}
    <div class="banner">🛡️<span>${esc(t('caution'))}</span></div>
    ${classes.length > 1 ? `<p class="muted">${esc(t('demo'))}:</p><div class="chiprow" style="position:static">${classes.map(c => `<button aria-selected="${c === id}" data-c="${c}">${esc((c.split('_').slice(2).join(' ') || c).toUpperCase())}</button>`).join('')}</div>` : ''}`;
  const drawSol = () => { const h = $('#solhost', out); h.innerHTML = solutionsCard(r.treatment_organic, r.treatment_chemical, S.item && S.sector === 'plant' ? todayVerdict() : null); bindSeg(h, 'solseg', v => { S.sol = v; drawSol(); }); };
  drawSol();
  requestAnimationFrame(() => requestAnimationFrame(() => $('#ring', out).style.setProperty('--p', pct)));
  $('#heat', out).onchange = (e) => { S.heat = e.target.checked; const fnd = $('#fnd'); fnd.querySelector('.heat')?.remove(); if (S.heat && fnd.querySelector('img')) fnd.insertAdjacentHTML('beforeend', '<div class="heat"></div>'); };
  const say = $('#say', out); if (say) say.onclick = () => { const u = new SpeechSynthesisUtterance([r.title, r.immediate_steps].join('. ')); u.lang = L().code === 'hi' ? 'hi-IN' : 'en-IN'; speechSynthesis.cancel(); speechSynthesis.speak(u); };
  $$('[data-c]', out).forEach(b => b.onclick = () => { S.result = b.dataset.c; showResult(out); });
}

/* ---------- Smart summary: facts from real app data, shown in plain words; optional on-device AI rewrite ---------- */
async function buildFacts() {
  const it = S.item, f = { itemName: itemName(it), sector: S.sector };
  if (S.result) { const r = await rec(S.result); if (r) f.diagnosis = { title: r.title, overview: r.overview, now: r.immediate_steps, organic: r.treatment_organic, chemical: r.treatment_chemical, healthy: S.result.endsWith('healthy') }; }
  const tv = todayVerdict(); if (tv) f.weather = { today: { level: tv.v.level, reasonKey: REASON[tv.v.reason] }, estimated: !!tv.d.estimated, bestDay: (() => { const b = G.bestSprayDay(WX.days, 3); return b ? fmt(b.date) : ''; })() };
  const start = getStart(), m = new Date().getMonth() + 1;
  if (S.sector === 'plant') {
    if (it.id === 'paddy' && start) { const dat = G.daysBetween(G.parse(start), new Date()), st = G.stageFor(DATA.advisory.calendar.stages, dat); if (st) f.stage = { name: L().code === 'or' ? st.nameOd : st.name, dat, task: st.general }; }
    else { const cal = (await content('calendar'))[it.id], cur = (cal || []).find(x => x.months.includes(m)); if (cur) f.stage = { name: cur.stage, task: cur.task }; }
    if (start && DATA.harvest[it.id]) { const h = G.harvestWindow(start, DATA.harvest[it.id]); f.harvest = { from: fmt(h.from), to: fmt(h.to), daysToStart: h.daysToStart }; }
  } else {
    const live = DATA.livestock[it.id], age = +store.get('agri.age.' + it.id, '4'); f.animal = { vaccDue: live.vaccination.filter(v => G.vaccineStatus(v, age).state === 'due').map(v => v.what) };
    const sd = store.get('agri.svc.' + it.id, ''); if (sd) { const p = G.breedingPlan(sd, live.breeding), nx = p.items.find(x => x.to >= G.iso(new Date())); f.animal.dueDate = fmt(p.due, { day: 'numeric', month: 'short', year: 'numeric' }); if (nx) f.animal.next = `${nx.label} ${fmt(nx.from)}`; }
  }
  const sch = await getJSON('../languages/en/schemes.json') || []; f.schemes = sch.filter(s => s.tags.includes(it.id) || s.tags.includes('all') || (S.sector === 'animal' && s.tags.includes('animal'))).map(s => s.title);
  const n = readNews(); if (n && n.sections && n.sections[S.sector]) f.news = n.sections[S.sector].slice(0, 2).map(x => x.title[L().code] || x.title.en);
  const tips = await content('tips'); f.tips = tips[it.id] || (S.sector === 'plant' ? tips.plant : null) || tips.general || [];
  return f;
}
const lblFn = (k) => t(k);
async function tabSummary(b) {
  const f = await buildFacts(), lines = GramSummary.summarize(f, lblFn);
  b.innerHTML = `<div class="card"><p class="sec-l">🧠 ${esc(t('sumTitle'))} · ${esc(f.itemName)}</p>${needEnglishNote()}<div class="sumlines">${lines.map(l => `<div class="sl ${l.tone || ''}"><span class="sk">${esc(t(l.k))}</span><span>${md(l.text)}</span></div>`).join('')}</div></div>
    <div class="card" id="aicard"></div><div class="banner">🛡️<span>${esc(t('caution'))}</span></div>`;
  drawAI($('#aicard', b), f);
}
const aiLang = () => ({ en: 'English', hi: 'Hindi' }[L().code] || 'English');
function drawAI(host, f) {
  if (!FEATURES.llm) { host.hidden = true; return; }
  if (!GramLLM.supported()) { host.innerHTML = `<p class="sec-l">✨ AI</p><p class="muted" style="margin:0">${esc(t('aiUnsupported'))}</p>`; return; }
  const ready = GramLLM.ready();
  host.innerHTML = `<p class="sec-l">✨ ${esc(t('aiBtn'))}</p>${ready ? '' : `<p class="muted" style="margin:0 0 12px">${esc(t('aiNote'))}</p>`}${!['en', 'hi'].includes(L().code) ? `<p class="muted">${esc(t('aiEnglishOnly'))}</p>` : ''}
    <button class="btn" id="aigo">${esc(ready ? t('aiRun') : t('aiBtn'))}</button><div class="bar" id="aibar" hidden><i style="width:0%"></i></div><p class="muted" id="aistat"></p><div id="aiout" class="aiout" hidden></div>`;
  $('#aigo', host).onclick = async () => {
    const btn = $('#aigo', host), stat = $('#aistat', host), bar = $('#aibar', host); btn.disabled = true;
    try {
      if (!GramLLM.ready()) { bar.hidden = false; await GramLLM.load(p => { $('i', bar).style.width = Math.round((p.progress || 0) * 100) + '%'; stat.textContent = `${t('aiLoading')}: ${p.text || ''}`.slice(0, 120); }); bar.hidden = true; }
      stat.textContent = t('aiThinking');
      const out = await GramLLM.chat(GramSummary.buildPrompt(f, lblFn, '', aiLang()));
      const g = GramSummary.numbersGrounded(out, f, lblFn); const o = $('#aiout', host); o.hidden = false; o.textContent = g.ok ? out : GramSummary.summarize(f, lblFn).map(l => `${t(l.k)}: ${l.text}`).join('\n'); stat.textContent = g.ok ? t('aiDisclaimer') : 'AI answer rejected (it contained numbers not in the facts). Showing the verified summary.'; btn.textContent = t('aiRun');
    } catch (e) { stat.textContent = String(e.message || e).slice(0, 140); } finally { btn.disabled = false; }
  };
}

/* Tips: bound to the current crop stage when a date is known */
async function tabTips(b) {
  const d = await content('tips'); let list = d[S.item.id] || (d.plant && S.sector === 'plant' ? d.plant : null) || d.general;
  let head = '';
  if (S.item.id === 'paddy' && getStart()) { const st = G.stageFor(DATA.advisory.calendar.stages, G.daysBetween(G.parse(getStart()), new Date())); if (st) head = `<div class="card now-card"><p class="sec-l">${esc(t('thisStage'))} · ${esc(L().code === 'or' ? st.nameOd : st.name)}</p>${esc(st.general)}</div>`; }
  if (!list?.length && !head) return soon(b);
  b.innerHTML = head + (list || []).map((x, i) => `<div class="card tip"><div class="num">${i + 1}</div><div>${md(x)}</div></div>`).join('');
}

/* Calendar: crop stages + harvest (plants), vaccination + breeding (animals) */
async function tabCal(b) {
  const plant = S.sector === 'plant', key = S.item.id + ':cal', cur = S.sub[key] || (plant ? 'stages' : 'vacc');
  const opts = plant ? [['stages', 'calCrop'], ['harvest', 'calHarvest']] : [['vacc', 'calVacc'], ['breed', 'calBreed']];
  b.innerHTML = seg('calseg', opts, cur) + needEnglishNote() + '<div id="calbody" class="stack"></div>';
  bindSeg(b, 'calseg', v => { S.sub[key] = v; tabCal(b); });
  const body = $('#calbody', b);
  if (cur === 'stages') return calStages(body); if (cur === 'harvest') return calHarvest(body);
  if (cur === 'vacc') return calVacc(body); return calBreed(body);
}
const dateField = (id, labelKey, val) => `<label class="field"><span>${esc(t(labelKey))}</span><input type="date" id="${id}" value="${esc(val || '')}"></label>`;
async function calStages(body) {
  const id = S.item.id, label = id === 'paddy' ? 'startPaddy' : 'startSow', start = getStart(), stages = DATA.advisory.calendar.stages;
  let html = dateField('start', label, start);
  if (id === 'paddy' && start) {
    const dat = G.daysBetween(G.parse(start), new Date()), all = G.stageDates(stages, start), now = G.stageFor(stages, dat), codes = WX.days.length ? G.weatherAdviceCodes(WX.days) : [];
    if (now) html += `<div class="card now-card"><div class="row"><b class="grow" style="font-size:20px">${esc(L().code === 'or' ? now.nameOd : now.name)}</b><span class="pill">${esc(t('dayN'))} ${dat}</span></div><p class="sec-l" style="margin-top:12px">${esc(t('general'))}</p>${esc(now.general)}<div id="stagesol" style="margin-top:12px"></div></div>`;
    if (codes.length) html += `<div class="card"><p class="sec-l">🌦️ ${esc(t('wx10'))}</p>${adviceLines(codes)}</div>`;
    html += `<div class="timeline">${all.map(x => `<div class="card cal ${now && x.id === now.id ? 'now' : ''}"><div class="row"><b class="grow">${esc(L().code === 'or' ? x.nameOd : x.name)}</b>${now && x.id === now.id ? `<span class="pill">${esc(t('stageNow'))}</span>` : ''}</div><p class="muted">${esc(fmt(x.from))} → ${esc(fmt(x.to))}</p></div>`).join('')}</div>`;
  } else {
    const d = await content('calendar'), list = d[id], m = new Date().getMonth() + 1;
    if (!start && id === 'paddy') html += `<p class="muted">${esc(t('enterDate'))}</p>`;
    html += (list || []).map(x => { const now = x.months.includes(m); return `<div class="card cal ${now ? 'now' : ''}"><div class="row"><b class="grow">${esc(x.stage)}</b>${now ? `<span class="pill">${esc(t('thisMonth'))}</span>` : ''}</div><p class="muted">${x.months.map(mm => new Date(2000, mm - 1, 1).toLocaleString(LOC(), { month: 'short' })).join(' · ')}</p><p style="margin:8px 0 0">${esc(x.task)}</p></div>`; }).join('');
  }
  body.innerHTML = html;
  $('#start', body).onchange = (e) => { store.set(startKey(), e.target.value); calStages(body); };
  const sh = $('#stagesol', body); if (sh) { const now = G.stageFor(stages, G.daysBetween(G.parse(start), new Date())); const draw = () => { sh.innerHTML = seg('stseg', [['organic', 'organic'], ['chemical', 'chemical']], S.sol) + `<div style="margin-top:10px">${esc(S.sol === 'organic' ? now.organic : now.chemical)}</div>` + (S.sol === 'chemical' ? `<div class="banner" style="margin:12px 0 0">🛡️<span>${esc(t('careful'))}</span></div>` : ''); bindSeg(sh, 'stseg', v => { S.sol = v; draw(); }); }; draw(); }
}
function adviceLines(codes) {
  const f = (c) => ({ sprayWindow: `${t('bestDay')}: ${fmt(c.date)}`, noSprayWindow: t('noWindow'), heavyRain: `${t('heavyRain')} (${c.mm} mm, ${fmt(c.date)})`, hot: `${t('hotDay')} (${c.t}°C, ${fmt(c.date)})`, cold: t('coldNight'), rainDays: `${t('rainyDays')}: ${c.n} / ${c.of}` }[c.code]);
  return `<ul class="lines">${codes.map(c => `<li>${esc(f(c))}</li>`).join('')}</ul>`;
}
async function calHarvest(body) {
  const id = S.item.id, spec = DATA.harvest[id], start = getStart(), label = id === 'paddy' ? 'startPaddy' : 'startSow';
  let html = dateField('start', label, start) + `<div>${verifyPill(spec.verified, 'verifyKvk')}</div>`;
  if (start) {
    const h = G.harvestWindow(start, spec), total = spec.daysTo, pct = Math.max(0, Math.min(100, Math.round(h.dat / total * 100)));
    html += `<div class="card now-card"><p class="sec-l">${esc(t('harvestWindow'))}</p><b style="font-size:24px">${esc(fmt(h.from))} → ${esc(fmt(h.to))}</b>
      <p style="margin:6px 0 12px">${h.daysToStart > 0 ? `<b>${h.daysToStart}</b> ${esc(t('daysToGo'))}` : `<span class="pill">${esc(t('readyHarvest'))}</span>`}</p>
      <div class="bar"><i style="width:${pct}%"></i></div><p class="muted" style="margin-top:6px">${esc(t('dayN'))} ${Math.max(0, h.dat)} / ${total}</p></div>`;
  } else html += `<p class="muted">${esc(t('enterDate'))}</p>`;
  html += `<p class="muted">${esc(t('source'))}: ${esc(spec.source)}</p>`; body.innerHTML = html;
  $('#start', body).onchange = (e) => { store.set(startKey(), e.target.value); calHarvest(body); };
}
async function calVacc(body) {
  const spec = DATA.livestock[S.item.id].vaccination, age = +store.get('agri.age.' + S.item.id, '4');
  body.innerHTML = `<label class="field"><span>${esc(t('ageMonths'))}</span><input type="number" id="age" min="0" max="240" inputmode="numeric" value="${age}"></label>` + spec.map(v => {
    const st = G.vaccineStatus(v, age), pill = { due: ['bad', 'vDue'], upcoming: ['demo', 'vUpcoming'], repeat: ['warn', 'vRepeat'], past: ['', 'vPast'] }[st.state];
    return `<div class="card"><div class="row"><b class="grow">${esc(v.what)}</b><span class="pill ${pill[0]}">${esc(t(pill[1]))}</span></div><p class="muted" style="margin:6px 0">${esc(v.repeat)}</p><p style="margin:0">${esc(v.note)}</p><p class="muted" style="margin-top:8px">${esc(t('source'))}: ${esc(v.source)} ${verifyPill(v.verified)}</p></div>`;
  }).join('');
  $('#age', body).onchange = (e) => { store.set('agri.age.' + S.item.id, e.target.value || '0'); calVacc(body); };
}
async function calBreed(body) {
  const spec = DATA.livestock[S.item.id].breeding, sd = store.get('agri.svc.' + S.item.id, ''), lh = store.get('agri.heat.' + S.item.id, '');
  let html = dateField('svc', 'serviceDate', sd);
  if (sd) { const p = G.breedingPlan(sd, spec);
    html += `<div class="card now-card"><p class="sec-l">${esc(t('dueDate'))}</p><b style="font-size:24px">${esc(fmt(p.due, { day: 'numeric', month: 'short', year: 'numeric' }))}</b><p class="muted">${esc(fmt(p.dueFrom))} – ${esc(fmt(p.dueTo))}</p></div>` +
      `<div class="timeline">${p.items.map(m => `<div class="card cal"><div class="row"><b class="grow">${esc(m.label)}</b></div><p class="muted">${esc(fmt(m.from))}${m.to !== m.from ? ' – ' + esc(fmt(m.to)) : ''}</p><p style="margin:6px 0 0">${esc(m.note)} ${verifyPill(m.verified)}</p></div>`).join('')}</div>`; }
  html += dateField('heat', 'lastHeat', lh);
  if (lh) html += `<div class="card"><p class="sec-l">${esc(t('nextHeat'))}</p>${G.nextHeats(lh, spec, 3).map(h => `<p style="margin:4px 0"><b>${esc(fmt(h.mid))}</b> <span class="muted">(${esc(fmt(h.from))} – ${esc(fmt(h.to))})</span></p>`).join('')}</div>`;
  html += `<div class="banner">💡<span>${esc(spec.aiTip.text)} ${verifyPill(spec.aiTip.verified)}</span></div>`;
  body.innerHTML = html;
  $('#svc', body).onchange = (e) => { store.set('agri.svc.' + S.item.id, e.target.value); calBreed(body); };
  $('#heat', body).onchange = (e) => { store.set('agri.heat.' + S.item.id, e.target.value); calBreed(body); };
}

/* Schemes + insurance */
async function tabSch(b) {
  const en = await getJSON('../languages/en/schemes.json') || []; const id = S.item.id, animal = S.sector === 'animal';
  const list = en.filter(s => s.tags.includes(id) || s.tags.includes('all') || (animal && s.tags.includes('animal')));
  const ins = DATA.advisory.insurance; const odisha = DATA.advisory.schemes.filter(x => /Odisha/.test(x.name));
  b.innerHTML = needEnglishNote() + list.map(s => `<div class="card"><b>🏛️ ${esc(s.title)}</b><p class="sec-l" style="margin-top:10px">${esc(t('benefit'))}</p>${esc(s.benefit)}<p class="sec-l" style="margin-top:10px">${esc(t('eligibility'))}</p>${esc(s.eligibility)}</div>`).join('')
    + (S.sector === 'plant' ? odisha.map(s => `<div class="card"><b>🏛️ ${esc(s.name)}</b><p style="margin:8px 0">${esc(s.summary)}</p><p class="muted">${esc(s.verifyNote)}</p></div>`).join('') +
      `<div class="card now-card"><b>🛡️ ${esc(t('insurance'))}: ${esc(ins.scheme)}</b><p class="sec-l" style="margin-top:10px">${esc(t('premium'))}</p>${esc(ins.premium)}<p class="sec-l" style="margin-top:10px">${esc(t('enrol'))}</p>${esc(ins.enrolment)}<p class="sec-l" style="margin-top:10px">${esc(t('claim'))}</p>${esc(ins.claim)}<p style="margin:10px 0 0"><a class="link-a" href="${esc(ins.portal)}" target="_blank" rel="noopener">${esc(t('portal'))} ↗</a></p><p class="muted" style="margin-top:8px">${esc(t('verifyOfficial'))} ${esc(ins.verifyNote)}</p></div>` : '');
}
async function tabShop(b) {
  if (!FEATURES.store) { b.innerHTML = `<div class="card now-card"><div class="row"><b class="grow">🛒 ${esc(t('storeSoonTitle'))}</b><span class="pill warn">${esc(t('soon'))}</span></div><p style="margin:10px 0 0">${esc(t('storeSoonBody'))}</p></div>`; return; }
}
/* ---------- News: synced from data/news.json (refreshed on a schedule), cached for offline ---------- */
const NEWSKEY = 'agri.news';
const readNews = () => { try { return JSON.parse(store.get(NEWSKEY, 'null')); } catch { return null; } };
async function syncNews() { try { const r = await fetch('data/news.json', { cache: 'no-store' }); if (!r.ok) throw 0; const j = await r.json(); j.fetchedAt = Date.now(); store.set(NEWSKEY, JSON.stringify(j)); return true; } catch { return false; } }
async function tabNews(b) {
  let n = readNews(); if (!n) { await syncNews(); n = readNews(); }
  const list = (n && n.sections && (n.sections[S.sector] || [])) || [];
  if (!list.length) { b.innerHTML = `<div class="card"><p class="sec-l">📢 ${esc(t('tab_news'))}</p><p style="margin:0">${esc(t('noNews'))}</p></div>`; return; }
  const lc = L().code, pick = (it) => it.title[lc] || it.title.en;
  b.innerHTML = `<p class="muted">${esc(t('newsUpdated'))}: ${esc(ago(n.updatedAt * 1000))}</p>${lc !== 'en' ? `<p class="muted">${esc(t('newsMT'))}</p>` : ''}` + list.map(it => `<a class="card newsi" href="${esc(it.link)}" target="_blank" rel="noopener"><b>${esc(pick(it))}</b><span class="muted">${esc(it.source)} · ${esc(it.published ? fmt(it.published.slice(0, 10)) : '')} · ${esc(t('readMore'))} ↗</span></a>`).join('');
}

/* ---------- Weather: 10-day sync, saved copy, offline estimate ---------- */
const WXKEY = 'agri.wx';
const place = () => { try { return JSON.parse(store.get('agri.loc', 'null')) || { lat: 20.2961, lon: 85.8245, name: 'default' }; } catch { return { lat: 20.2961, lon: 85.8245, name: 'default' }; } };
function readCache() { try { return JSON.parse(store.get(WXKEY, 'null')); } catch { return null; } }
async function syncWeather(timeoutMs = 8000) {
  const p = place(), ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=10`;
    const r = await fetch(u, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); const j = (await r.json()).daily;
    const days = j.time.map((date, i) => ({ date, tMax: j.temperature_2m_max[i], tMin: j.temperature_2m_min[i], rainMm: j.precipitation_sum[i] ?? 0, rainProb: j.precipitation_probability_max[i] ?? 0, windMax: j.wind_speed_10m_max[i] ?? 0 }));
    store.set(WXKEY, JSON.stringify({ syncedAt: Date.now(), lat: p.lat, lon: p.lon, days })); return true;
  } catch { return false; } finally { clearTimeout(tm); }
}
async function loadWeather(forceSync = false) {
  let online = false; if (navigator.onLine !== false && (forceSync || true)) online = await syncWeather();
  const cache = readCache(), today = new Date(); today.setHours(0, 0, 0, 0);
  const fresh = cache && G.daysBetween(G.parse(cache.days[0].date), today) <= 0 && online;
  WX.days = G.offlineForecast(today, cache, DATA.climate, 10);
  WX.mode = online ? 'online' : (cache && WX.days.some(d => d.source === 'saved') ? 'saved' : 'estimate'); WX.syncedAt = cache ? cache.syncedAt : 0; return WX;
}
const wIcon = (d) => d.rainMm >= 30 ? '⛈️' : (d.rainProb >= 70 || d.rainMm >= 10) ? '🌧️' : d.rainProb >= 50 ? '🌦️' : d.rainProb >= 20 ? '⛅' : '☀️';
const ago = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? '<1 min' : m < 60 ? m + ' min' : m < 1440 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
async function tabWx(b) {
  b.innerHTML = `<div class="skel"></div><div class="skel"></div><div class="skel"></div>`;
  await loadWeather(); drawWeather(b);
}
function drawWeather(b) {
  const days = WX.days, best = G.bestSprayDay(days, 3), codes = G.weatherAdviceCodes(days);
  const status = { online: `✓ ${t('synced')} ${ago(WX.syncedAt)}`, saved: `📴 ${t('offSaved')}${WX.syncedAt ? ' · ' + t('synced') + ' ' + ago(WX.syncedAt) : ''}`, estimate: `📴 ${t('offEst')}` }[WX.mode];
  const p = place();
  b.innerHTML = `<div class="card"><div class="row"><b class="grow">${esc(t('wx10'))}</b><span class="pill ${WX.mode === 'online' ? '' : 'warn'}">${esc(WX.mode === 'online' ? 'Online' : 'Offline')}</span></div><p class="muted" style="margin:6px 0 12px">${esc(status)}${p.name === 'default' ? ' · ' + esc(t('locDefault')) : ''}</p>
      <div class="row wrap"><button class="btn sm" id="sync">↻ ${esc(t('syncNow'))}</button><button class="btn sm ghost" id="loc">📍 ${esc(t('useLoc'))}</button></div></div>
    <div class="banner ${best ? '' : 'alert'}" style="margin:0">🌦️<span><b>${best ? esc(t('bestDay')) + ': ' + esc(fmt(best.date, { weekday: 'short', day: 'numeric', month: 'short' })) : esc(t('noWindow'))}</b>${best && best.estimated ? ' · ' + esc(t('estimated')) : ''}</span></div>
    <div class="stack">${days.map((d, i) => { const v = G.sprayVerdict(d, { monsoon: monsoon() }), vv = VERD[v.level]; return `<div class="card day ${d.estimated ? 'est' : ''}"><div class="dh"><span class="wi">${wIcon(d)}</span><div class="grow"><b>${esc(i === 0 ? t('stageNow') : fmt(d.date, { weekday: 'short' }))} · ${esc(fmt(d.date))}</b><div class="muted">${Math.round(d.tMax)}° / ${Math.round(d.tMin)}° · ${d.rainProb}% · ${Math.round(d.rainMm * 10) / 10} mm · ${Math.round(d.windMax)} km/h</div></div></div><div class="why"><span class="pill ${vv[0]}">${vv[1]} ${esc(t(VLABEL[v.level]))}</span> ${esc(t(REASON[v.reason]))}${d.estimated ? ` <span class="pill warn">${esc(t('estimated'))}</span>` : ''}</div></div>`; }).join('')}</div>
    <div class="card"><p class="sec-l">${esc(t('tab_tips'))}</p>${adviceLines(codes)}</div>`;
  $('#sync', b).onclick = async () => { b.querySelector('#sync').disabled = true; await loadWeather(true); drawWeather(b); };
  $('#loc', b).onclick = () => navigator.geolocation ? navigator.geolocation.getCurrentPosition(async pos => { store.set('agri.loc', JSON.stringify({ lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3), name: 'gps' })); await loadWeather(true); drawWeather(b); }, () => {}, { timeout: 8000 }) : 0;
}

/* Expert chat (demo canned reply; WhatsApp hand-off) */
$('#fab').onclick = () => { $('#chat').hidden = false; $('#chati').placeholder = t('askHint'); if (!$('#chatb').children.length) addMsg(t('expertHi')); };
$('#chatx').onclick = () => $('#chat').hidden = true;
const addMsg = (txt, me) => { const d = document.createElement('div'); d.className = 'msg' + (me ? ' me' : ''); d.textContent = txt; $('#chatb').append(d); $('#chatb').scrollTop = 1e6; };
$('#chatf').onsubmit = async (e) => {
  e.preventDefault(); const v = $('#chati').value.trim(); if (!v) return; addMsg(v, true); $('#chati').value = ''; $('#wa').href = 'https://wa.me/?text=' + encodeURIComponent(v);
  const f = await buildFacts();
  if (FEATURES.llm && GramLLM.ready()) { try { const out = await GramLLM.chat(GramSummary.buildPrompt(f, lblFn, v, aiLang())); if (GramSummary.numbersGrounded(out, f, lblFn).ok) { addMsg(out); return; } } catch {} }
  const lines = GramSummary.answer(v, f, lblFn);
  addMsg(lines ? lines.map(l => `${t(l.k)}: ${l.text.replace(/\*\*/g, '')}`).join('\n') : t('noAnswer'));
};
$('#wa').href = 'https://wa.me/';

/* ---------- Auto-sync: whenever the network is available ---------- */
let lastSync = 0, syncing = false;
function netBar() {
  const bar = $('#netbar'); if (!bar) return; const on = navigator.onLine !== false;
  bar.className = 'netbar ' + (on ? 'on' : 'off');
  bar.textContent = on ? `● ${t('netOnline')}${lastSync ? ' · ' + t('syncedAgo') + ' ' + ago(lastSync) : ''}` : `○ ${t('netOffline')}`;
}
async function autoSync(force) {
  if (syncing || navigator.onLine === false || (!force && !G.shouldSync(lastSync, Date.now(), 30))) { netBar(); return; }
  syncing = true;
  try { const [w, n] = await Promise.all([loadWeather(), syncNews()]); if (w || n) lastSync = Date.now(); } finally { syncing = false; }
  netBar();
  const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || '');
  if (S.item && !typing && ['wx', 'news', 'cal', 'tips'].includes(S.tab)) renderDash($('#view'));
}
window.addEventListener('online', () => autoSync(true)); window.addEventListener('offline', netBar);
document.addEventListener('visibilitychange', () => { if (!document.hidden) autoSync(false); });
setInterval(() => { autoSync(false); netBar(); }, 5 * 60 * 1000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

/* ---------- boot ---------- */
(async () => {
  let adv, live, clim, harv; [I18N, DOMAIN, adv, live, clim, harv] = await Promise.all([getJSON('i18n.json'), getJSON('../languages/domain_config.json'), getJSON('data/advisory.json'), getJSON('data/livestock.json'), getJSON('data/climate.json'), getJSON('data/harvest.json')]); I18N ||= {}; DOMAIN ||= { plant: [], animal: [] }; DATA = { advisory: adv, livestock: live, climate: clim, harvest: harv };
  autoSync(true);
  $('#pick-lang').innerHTML = LANGS.map(l => `<button data-code="${l.code}">${l.name}${l.mt ? '<small>machine draft</small>' : l.ui ? '' : '<small>English for now</small>'}</button>`).join('');
  $$('#pick-lang button').forEach(b => b.onclick = () => { setLang(b.dataset.code); $('#welcome').close(); });
  const first = !S.lang; S.lang = S.lang || 'or'; applyI18n(); await render();
  if (first && $('#welcome').showModal) $('#welcome').showModal();
})();
