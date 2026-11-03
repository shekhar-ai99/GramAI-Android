// GramAI web app. Interface layer (screens, components) on top of the tested logic modules:
// logic.js (weather, calendars, breeding), summary.js (facts to plain words), art.js (illustrations and icons).
// Content comes from the repo's own JSON in ../languages and ../recommendations. Diagnosis is a DEMO until the ONNX model is wired in.
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const store = { get: (k, d) => { try { return localStorage.getItem(k) ?? d; } catch { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch {} } };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const QP = new URLSearchParams(location.search);
const QA_OFFLINE = QP.has('offline'); // QA: behave as if there is no network
const G = window.GramLogic, { art, wxIcon, ICON } = window.GramArt;
const FEATURES = { store: false, llm: QP.has('ai') }; // store = Phase 2; llm = experiment only (docs/LLM_EVAL.md)
const LANGS = [
  { code: 'or', name: 'ଓଡ଼ିଆ', dir: 'or', ui: true }, { code: 'en', name: 'English', dir: 'en', ui: true }, { code: 'hi', name: 'हिन्दी', dir: 'en', ui: true },
  { code: 'sat', name: 'ᱥᱟᱱᱛᱟᱲᱤ', dir: 'en', ui: true, mt: true }, { code: 'hoc', name: 'Ho', dir: 'en', ui: false }];
const ROOT = ['today', 'calendar', 'scan', 'weather', 'more'];
const PARENT = { tips: 'more', schemes: 'more', news: 'more', store: 'more', mine: 'more', settings: 'more' };
const CLASSES = { paddy: ['plant_paddy_blast', 'plant_paddy_blight', 'plant_paddy_brownspot', 'plant_paddy_tungro'], cow: ['animal_cow_mastitis'], goat: ['animal_goat_ppr', 'animal_goat_healthy'] };

let I18N = {}, DOMAIN = {}, ITEMS = {}, REC = { en: {}, or: {} }, CONTENT = {}, DATA = {}, WX = { days: [], mode: 'none', syncedAt: 0 };
const S = {
  lang: store.get('agri.lang', null), mine: JSON.parse(store.get('agri.mine', '[]')), cur: store.get('agri.cur', ''), screen: null, stack: [],
  photo: null, result: null, heat: false, sol: 'organic', sub: {}, wxSel: 0, showAll: false, pickSel: null,
  get item() { return ITEMS[this.cur]; }, get sector() { return ITEMS[this.cur]?.sector; },
};

/* ---------- tiny helpers ---------- */
const t = (k) => I18N[S.lang]?.[k] || I18N.en?.[k] || k;
const L = () => LANGS.find((l) => l.code === S.lang) || LANGS[0];
const getJSON = async (p) => { try { const r = await fetch(p); return r.ok ? await r.json() : null; } catch { return null; } };
const stripEmoji = (s) => String(s || '').replace(/^[\p{Extended_Pictographic}\uFE0F\u200D\s]+/u, '');
const noEmoji = (s) => String(s || '').replace(/^[^\p{L}\p{N}]+/u, '').trim();
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const ic = (n, cls = '') => `<span class="ico ${cls}">${ICON[n] || ''}</span>`;
const artEl = (id, cls = 'art') => `<span class="${cls}">${art(id)}</span>`;
const itemName = (it) => t('n_' + it.id);
const LOC = () => ({ or: 'or-IN', hi: 'hi-IN' }[L().code] || 'en-IN');
// Odia and Hindi names are spelled out here: phones and WebViews often lack those locales and fall back to English.
const DN = { or: ['ରବିବାର', 'ସୋମବାର', 'ମଙ୍ଗଳବାର', 'ବୁଧବାର', 'ଗୁରୁବାର', 'ଶୁକ୍ରବାର', 'ଶନିବାର'], hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'] };
const MN = { or: ['ଜାନୁଆରୀ', 'ଫେବ୍ରୁଆରୀ', 'ମାର୍ଚ୍ଚ', 'ଅପ୍ରେଲ', 'ମଇ', 'ଜୁନ', 'ଜୁଲାଇ', 'ଅଗଷ୍ଟ', 'ସେପ୍ଟେମ୍ବର', 'ଅକ୍ଟୋବର', 'ନଭେମ୍ବର', 'ଡିସେମ୍ବର'], hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'] };
const fmtDate = (d, o = { day: 'numeric', month: 'short' }) => {
  const c = L().code;
  if (!DN[c]) return d.toLocaleDateString(LOC(), o);
  return [o.weekday ? DN[c][d.getDay()] + (o.day || o.month ? ',' : '') : '', o.day ? d.getDate() : '', o.month ? MN[c][d.getMonth()] : ''].filter((x) => x !== '').join(' ');
};
const fmt = (iso, o = { day: 'numeric', month: 'short' }) => { try { return fmtDate(typeof iso === 'string' ? G.parse(iso.slice(0, 10)) : iso, o); } catch { return iso; } };
// Read-aloud only when the phone has a voice for the chosen language: a wrong-language voice would be worse than none.
const SPEECH = { or: 'or', hi: 'hi', en: 'en' };
const canSpeak = () => 'speechSynthesis' in window && !!SPEECH[L().code] && (L().code === 'en' || speechSynthesis.getVoices().some((v) => v.lang.toLowerCase().startsWith(SPEECH[L().code])));
const speak = (txt) => { const u = new SpeechSynthesisUtterance(txt); u.lang = LOC(); u.rate = 0.9; speechSynthesis.cancel(); speechSynthesis.speak(u); };
const ago = (ts) => { const m = Math.round((Date.now() - ts) / 60000); return m < 1 ? '<1 min' : m < 60 ? m + ' min' : m < 1440 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
const monsoon = () => { const m = new Date().getMonth() + 1; return m >= 6 && m <= 9; };
const online = () => !QA_OFFLINE && navigator.onLine !== false;
const startKey = () => 'agri.start.' + S.cur; const getStart = () => store.get(startKey(), '');
const banner = (kind, icon, html) => `<div class="banner ${kind}">${ic(icon)}<div class="grow">${html}</div></div>`;
const needEnglishNote = () => L().code === 'en' ? '' : banner('info', 'info', esc(t('contentEnglish')));
const verifyPill = (ok, key = 'verifyVet') => ok ? '' : `<div><span class="pill warn">${esc(t(key))}</span></div>`;
const seg = (id, opts, cur) => `<div class="seg" id="${id}" role="group">${opts.map(([v, k]) => `<button data-v="${v}" aria-pressed="${cur === v}">${esc(t(k))}</button>`).join('')}</div>`;
const bindSeg = (root, id, cb) => $$(`#${id} button`, root).forEach((b) => (b.onclick = () => cb(b.dataset.v)));
const dateField = (id, labelKey, val) => `<label class="field"><span>${esc(t(labelKey))}</span><input type="date" id="${id}" value="${esc(val || '')}" required><b class="ph">${esc(t('tapDate'))}</b></label>`;
const liRow = (icon, title, sub, id, extra = '') => `<button class="li" data-go="${id}"><span class="lead">${ICON[icon]}</span><span class="grow"><b>${esc(title)}</b>${sub ? `<span class="muted">${esc(sub)}</span>` : ''}</span>${extra}<span class="chev ico">${ICON.chev}</span></button>`;

/* ---------- data ---------- */
async function content(name) {
  const key = L().dir + name; if (CONTENT[key]) return CONTENT[key];
  let d = await getJSON(`../languages/${L().dir}/${name}.json`);
  // The Odia calendar file is an older day-range format; the app needs month-based stages, so use English until it is rewritten.
  if (name === 'calendar' && d && Object.values(d).some((l) => Array.isArray(l) && l.some((x) => !Array.isArray(x.months)))) d = null;
  if (!d) d = await getJSON(`../languages/en/${name}.json`);
  return (CONTENT[key] = d || {});
}
async function rec(id) {
  if (!REC.en.loaded) { REC.en = (await getJSON('../recommendations/recommendations.json')) || {}; REC.en.loaded = 1; REC.or = (await getJSON('../languages/or/recommendations.json')) || {}; }
  return (L().dir === 'or' && REC.or[id]) || REC.en[id];
}

/* ---------- weather: sync, saved copy, offline estimate ---------- */
const WXKEY = 'agri.wx';
const place = () => { try { return JSON.parse(store.get('agri.loc', 'null')) || { lat: 20.2961, lon: 85.8245, name: 'default' }; } catch { return { lat: 20.2961, lon: 85.8245, name: 'default' }; } };
const readCache = () => { try { return JSON.parse(store.get(WXKEY, 'null')); } catch { return null; } };
async function syncWeather(timeoutMs = 8000) {
  if (!online()) return false;
  const p = place(), ctl = new AbortController(), tm = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const u = `https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&timezone=auto&forecast_days=10`;
    const r = await fetch(u, { signal: ctl.signal }); if (!r.ok) throw new Error(r.status); const j = (await r.json()).daily;
    const days = j.time.map((date, i) => ({ date, tMax: j.temperature_2m_max[i], tMin: j.temperature_2m_min[i], rainMm: j.precipitation_sum[i] ?? 0, rainProb: j.precipitation_probability_max[i] ?? 0, windMax: j.wind_speed_10m_max[i] ?? 0 }));
    store.set(WXKEY, JSON.stringify({ syncedAt: Date.now(), lat: p.lat, lon: p.lon, days })); return true;
  } catch { return false; } finally { clearTimeout(tm); }
}
function primeWeather(isOnline = false) { // always have 10 days to show: saved forecast, else climate estimate
  const cache = readCache(), today = new Date(); today.setHours(0, 0, 0, 0);
  WX.days = G.offlineForecast(today, cache, DATA.climate, 10);
  WX.mode = isOnline ? 'online' : (cache && WX.days.some((d) => d.source === 'saved') ? 'saved' : 'estimate'); WX.syncedAt = cache ? cache.syncedAt : 0;
}
async function loadWeather() { const ok = await syncWeather(); primeWeather(ok); return ok; }
const VLABEL = { safe: 'spraySafe', caution: 'sprayCaution', no: 'sprayNo' };
const REASON = { dry: 'rSafe', rain: 'rRain', wind: 'rWind', maybeRain: 'rMaybe', heat: 'rHeat', estimated: 'rEst' };
const todayVerdict = () => { const d = WX.days[0]; return d ? { d, v: G.sprayVerdict(d, { monsoon: monsoon() }) } : null; };

/* ---------- news ---------- */
const NEWSKEY = 'agri.news';
const readNews = () => { try { return JSON.parse(store.get(NEWSKEY, 'null')); } catch { return null; } };
async function syncNews() { if (!online()) return false; try { const r = await fetch(window.GRAM_NEWS_URL || 'data/news.json', { cache: 'no-store' }); if (!r.ok) throw 0; const j = await r.json(); j.fetchedAt = Date.now(); store.set(NEWSKEY, JSON.stringify(j)); return true; } catch { return false; } }

/* ---------- facts for the summary and assistant ---------- */
async function buildFacts() {
  const it = S.item, f = { itemName: itemName(it), sector: S.sector };
  if (S.result) { const r = await rec(S.result); if (r) f.diagnosis = { title: r.title, overview: r.overview, now: r.immediate_steps, organic: r.treatment_organic, chemical: r.treatment_chemical, healthy: S.result.endsWith('healthy') }; }
  const tv = todayVerdict(); if (tv) f.weather = { today: { level: tv.v.level, reasonKey: REASON[tv.v.reason] }, estimated: !!tv.d.estimated, bestDay: (() => { const b = G.bestSprayDay(WX.days, 3); return b ? fmt(b.date) : ''; })() };
  const start = getStart(), m = new Date().getMonth() + 1;
  if (S.sector === 'plant') {
    if (it.id === 'paddy' && start) { const dat = G.daysBetween(G.parse(start), new Date()), st = G.stageFor(DATA.advisory.calendar.stages, dat); if (st) f.stage = { name: L().code === 'or' ? st.nameOd : st.name, dat, task: st.general }; }
    else { const cal = (await content('calendar'))[it.id], cur = (cal || []).find((x) => x.months?.includes(m)); if (cur) f.stage = { name: cur.stage, task: cur.task }; }
    if (start && DATA.harvest[it.id]) { const h = G.harvestWindow(start, DATA.harvest[it.id]); f.harvest = { from: fmt(h.from), to: fmt(h.to), daysToStart: h.daysToStart }; }
  } else {
    const live = DATA.livestock[it.id], age = +store.get('agri.age.' + it.id, '4'); f.animal = { vaccDue: live.vaccination.filter((v) => G.vaccineStatus(v, age).state === 'due').map((v) => v.what) };
    const sd = store.get('agri.svc.' + it.id, ''); if (sd) { const p = G.breedingPlan(sd, live.breeding), nx = p.items.find((x) => x.to >= G.iso(new Date())); f.animal.dueDate = fmt(p.due, { day: 'numeric', month: 'short', year: 'numeric' }); if (nx) f.animal.next = `${nx.label} ${fmt(nx.from)}`; }
  }
  const sch = (await getJSON('../languages/en/schemes.json')) || []; f.schemes = sch.filter((s) => s.tags.includes(it.id) || s.tags.includes('all') || (S.sector === 'animal' && s.tags.includes('animal'))).map((s) => s.title);
  const n = readNews(); if (n && n.sections && n.sections[S.sector]) f.news = n.sections[S.sector].slice(0, 2).map((x) => x.title[L().code] || x.title.en);
  const tips = await content('tips'); f.tips = tips[it.id] || (S.sector === 'plant' ? tips.plant : null) || tips.general || [];
  return f;
}
const lblFn = (k) => t(k);

/* ---------- navigation and chrome ---------- */
function applyLang() { document.documentElement.lang = L().code; }
function setLang(code) { S.lang = code; store.set('agri.lang', code); applyLang(); }
function nav(screen) {
  if (ROOT.includes(screen)) S.stack = []; else if (S.screen && S.screen !== screen) S.stack.push(S.screen);
  if (screen === 'mine') S.pickSel = new Set(S.mine);
  S.screen = screen; render(); scrollTo({ top: 0 });
}
function back() { S.screen = S.stack.pop() || PARENT[S.screen] || 'today'; render(); scrollTo({ top: 0 }); }
const setTheme = (m) => { m === 'auto' ? document.documentElement.removeAttribute('data-theme') : (document.documentElement.dataset.theme = m); store.set('agri.theme', m); };
const setSize = (m) => { m === 'large' ? (document.documentElement.dataset.size = 'large') : document.documentElement.removeAttribute('data-size'); store.set('agri.size', m); };
const LOGO = GramArt.MARK;
const TITLES = { tips: 'tab_tips', schemes: 'tab_schemes', news: 'tab_news', store: 'tab_shop', mine: 'editFarm', settings: 'settings' };

function renderTop() {
  const top = $('#top'), s = S.screen, sub = !!PARENT[s], onb = s === 'lang' || (s === 'pick' && !S.mine.length);
  if (onb) { top.hidden = true; top.innerHTML = ''; return; } top.hidden = false;
  const chat = S.item && !sub ? `<button class="ibtn" id="askbtn" aria-label="${esc(t('expertTitle'))}">${ic('chat')}<span>${esc(t('ask'))}</span></button>` : '';
  const lang = `<button class="langchip" id="langbtn" aria-label="${esc(t('language'))}">${esc(L().name)}</button>`;
  if (sub || s === 'pick') {
    top.innerHTML = `<button class="ibtn plain" id="backbtn" aria-label="${esc(t('back'))}">${ic('back')}</button><div class="page-title grow">${esc(noEmoji(t(TITLES[s] || 'editFarm')))}</div>${s === 'pick' ? '' : lang}`;
    $('#backbtn').onclick = () => (s === 'pick' ? back() : back());
  } else {
    const off = !online();
    top.innerHTML = `<div class="logo">${LOGO}</div><div class="brand grow"><b>GramAI</b>${off ? `<small><span class="pill warn" style="padding:1px 8px">${esc(t('netOffline').split(':')[0])}</span></small>` : `<small>${esc(t('tagline'))}</small>`}</div>${lang}${chat}`;
    if ($('#askbtn')) $('#askbtn').onclick = openAssistant;
  }
  if ($('#langbtn')) $('#langbtn').onclick = () => { S.langFrom = s; S.screen = 'lang'; render(); };
}
function renderNav() {
  const nv = $('#bnav'), s = S.screen, show = ROOT.includes(s) || !!PARENT[s];
  nv.hidden = !show; if (!show) return;
  const cur = PARENT[s] ? 'more' : s, items = [['today', 'today', 'today'], ['calendar', 'cal', 'tab_calendar'], ['scan', 'camera', 'tab_diagnosis'], ['weather', 'cloud', 'tab_weather'], ['more', 'more', 'more']];
  $('div', nv).innerHTML = items.map(([id, icn, k]) => id === 'scan'
    ? `<button class="scanbtn" data-n="scan" ${cur === id ? 'aria-current="page"' : ''}><span class="circle">${ICON.camera}</span><span class="l">${esc(noEmoji(t(k)))}</span></button>`
    : `<button data-n="${id}" ${cur === id ? 'aria-current="page"' : ''}>${ic(icn)}<span class="l">${esc(noEmoji(t(k)))}</span></button>`).join('');
  $$('[data-n]', nv).forEach((b) => (b.onclick = () => nav(b.dataset.n)));
}
async function render() {
  applyLang(); renderTop(); renderNav();
  const v = $('#view'), fn = SCREENS[S.screen] || SCREENS.today;
  try { await fn(v); } catch (e) { console.error(e); v.innerHTML = banner('alert', 'alert', `<span data-err="${esc(String(e && e.message || e))}">${esc(t('weatherFail'))}</span>`); }
  $$('[data-go]', v).forEach((b) => (b.onclick = () => nav(b.dataset.go)));
}

/* ---------- shared components ---------- */
function switcher() {
  const mine = S.mine.map((id) => ITEMS[id]).filter(Boolean);
  return `<div class="chips" role="group" aria-label="${esc(t('myFarm'))}">${mine.map((it) => `<button class="chip" data-cur="${it.id}" aria-pressed="${it.id === S.cur}">${artEl(it.id)}${esc(itemName(it))}</button>`).join('')}<button class="chip add" data-go="mine">${ic('plus')}${esc(t('editFarm'))}</button></div>`;
}
function bindSwitcher(v) { $$('[data-cur]', v).forEach((b) => (b.onclick = () => { S.cur = b.dataset.cur; store.set('agri.cur', S.cur); S.result = null; S.photo = null; render(); })); }

/* ---------- screens ---------- */
const SCREENS = {};

SCREENS.lang = (v) => {
  $('#bnav').hidden = true;
  v.innerHTML = `<div class="onb-hero fade"><div class="logo">${LOGO}</div><h1>ଭାଷା ବାଛନ୍ତୁ</h1><p>भाषा चुनें · Tap your language</p></div>
    <div class="langcards">${LANGS.map((l) => `<button class="langcard fade" data-code="${l.code}" aria-pressed="${l.code === S.lang && !!S.langFrom}"><b>${l.name}</b><small>${l.mt ? 'machine draft' : l.ui ? '' : 'English for now'}</small></button>`).join('')}</div>`;
  $$('.langcard', v).forEach((b) => (b.onclick = () => { setLang(b.dataset.code); const from = S.langFrom; S.langFrom = null; if (from) { S.screen = from; render(); } else { S.screen = S.mine.length ? 'today' : 'pick'; S.pickSel = new Set(S.mine); render(); } }));
};

SCREENS.pick = (v) => {
  S.pickSel = S.pickSel || new Set(S.mine); const editing = S.mine.length > 0;
  const tile = (it) => `<button class="tile" data-pick="${it.id}" aria-pressed="${S.pickSel.has(it.id)}">${artEl(it.id)}<span>${esc(itemName(it))}</span><span class="tick ico">${ICON.check}</span></button>`;
  const group = (sec, key) => { const all = DOMAIN[sec] || []; return `<div class="cap" style="margin-top:8px">${esc(noEmoji(t(key)))}</div><div class="tiles">${all.filter((i) => i.enabled).map((i) => tile(ITEMS[i.id])).join('')}</div>`; };
  const soon = Object.values(ITEMS).filter((i) => !i.enabled);
  v.innerHTML = `${editing ? '' : `<div class="onb-hero fade"><div class="logo">${LOGO}</div><h1>${esc(t('onbItemsTitle'))}</h1><p>${esc(t('onbItemsSub'))}</p></div>`}
    ${editing ? `<p class="muted">${esc(t('onbItemsSub'))}</p>` : ''}${group('plant', 'btn_plant')}${group('animal', 'btn_animal')}
    <div class="cap" style="margin-top:8px">${esc(t('moreSoon'))}</div><div class="soonrow">${soon.map((i) => `<span class="chip">${artEl(i.id)}${esc(itemName(i))}</span>`).join('')}</div>
    <div style="height:84px"></div><div class="stickycta"><div><button class="btn" id="cont" ${S.pickSel.size ? '' : 'disabled'}>${esc(t('continueBtn'))} ${ic('chev')}</button></div></div>`;
  $$('[data-pick]', v).forEach((b) => (b.onclick = () => { const id = b.dataset.pick; S.pickSel.has(id) ? S.pickSel.delete(id) : S.pickSel.add(id); b.setAttribute('aria-pressed', S.pickSel.has(id)); $('#cont').disabled = !S.pickSel.size; }));
  $('#cont').onclick = () => { S.mine = [...S.pickSel]; store.set('agri.mine', JSON.stringify(S.mine)); if (!S.mine.includes(S.cur)) { S.cur = S.mine[0]; store.set('agri.cur', S.cur); } S.pickSel = null; S.stack = []; S.screen = 'today'; render(); scrollTo({ top: 0 }); };
};
SCREENS.mine = (v) => SCREENS.pick(v);

SCREENS.today = async (v) => {
  const it = S.item, plant = S.sector === 'plant', tv = todayVerdict(), d = tv?.d, lvl = tv?.v.level, best = G.bestSprayDay(WX.days, 3);
  const tips = await content('tips'), tl = tips[it.id] || (plant ? tips.plant : null) || tips.general || [], tip = tl.length ? tl[Math.floor(Date.now() / 864e5) % tl.length] : '';
  const sch = ((await getJSON('../languages/en/schemes.json')) || []).filter((s) => s.tags.includes(it.id) || s.tags.includes('all') || (!plant && s.tags.includes('animal')));
  const news = readNews(), nl = news?.sections?.[S.sector] || [], hl = nl[0] ? (nl[0].title[L().code] || nl[0].title.en) : '';
  const today = fmtDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' });
  const heroCls = plant && lvl === 'no' ? 'bad' : plant && lvl === 'caution' ? 'warn' : '';
  const hero = d ? `<div class="hero ${heroCls} fade"><div class="row"><div class="grow"><span class="chipw">${esc(today)}</span>
      <div class="big" style="margin-top:10px">${plant ? esc(t(VLABEL[lvl])) : Math.round(d.tMax) + '°C'}</div>
      <div class="sub">${plant ? esc(t(REASON[tv.v.reason])) + (d.estimated ? ' · ' + esc(t('estimated')) : '') : esc(t('rain')) + ' ' + d.rainProb + '% · ' + Math.round(d.windMax) + ' km/h'}</div></div><span class="wxart">${wxIcon(d)}</span></div>
      <div class="row wrap"><span class="chipw">${Math.round(d.tMax)}° / ${Math.round(d.tMin)}°</span><span class="chipw">${esc(t('rain'))} ${d.rainProb}%</span><span class="chipw">${Math.round(d.windMax)} km/h</span></div>
      ${plant && canSpeak() ? `<button class="chipw say" id="saytoday">${ic('sound')}${esc(t('listen'))}</button>` : ''}
      ${plant && lvl !== 'safe' && best ? `<div class="sub">${esc(t('bestDay'))}: <b>${esc(fmt(best.date, { weekday: 'short', day: 'numeric', month: 'short' }))}</b></div>` : ''}</div>` : '<div class="skel"></div>';
  let card = '';
  if (plant) {
    const start = getStart(), stages = DATA.advisory.calendar.stages;
    if (it.id === 'paddy' && start) {
      const dat = G.daysBetween(G.parse(start), new Date()), st = G.stageFor(stages, dat), all = G.stageDates(stages, start), idx = all.findIndex((x) => st && x.id === st.id), nx = all[idx + 1];
      const pct = Math.max(2, Math.min(100, Math.round(((dat - stages[0].datFrom) / (stages[stages.length - 1].datTo - stages[0].datFrom)) * 100)));
      card = st ? `<div class="card hl"><div class="row"><span class="cap grow">${esc(t('sumStage'))}</span><span class="pill">${esc(t('dayN'))} ${dat}</span></div><h2 style="font-size:var(--fs-h2)">${esc(L().code === 'or' ? st.nameOd : st.name)}</h2><div class="stagebar"><i style="width:${pct}%"></i></div><p>${esc(st.general)}</p>${nx ? `<p class="muted">› ${esc(L().code === 'or' ? nx.nameOd : nx.name)} · ${esc(fmt(nx.from))}</p>` : ''}</div>` : '';
    } else {
      const cal = ((await content('calendar'))[it.id] || []).find((x) => x.months?.includes(new Date().getMonth() + 1));
      card = `<div class="card"><span class="cap">${esc(t('sumStage'))}</span>${cal ? `<h2 style="font-size:var(--fs-title)">${esc(stripEmoji(cal.stage))}</h2><p>${esc(cal.task)}</p>` : ''}<button class="btn sec sm" data-go="calendar">${ic('cal')}${esc(t(it.id === 'paddy' ? 'startPaddy' : 'startSow'))}</button></div>`;
    }
  } else {
    const live = DATA.livestock[it.id], age = +store.get('agri.age.' + it.id, '4'), due = live.vaccination.filter((x) => G.vaccineStatus(x, age).state === 'due');
    card = `<div class="card"><span class="cap">${esc(t('vDue'))}</span>${due.length ? `<ul class="plain">${due.map((x) => `<li><b>${esc(x.what)}</b></li>`).join('')}</ul>` : `<p class="muted">${esc(t('nothingDue'))}</p>`}<button class="btn sec sm" data-go="calendar">${ic('cal')}${esc(noEmoji(t('tab_calendar')))}</button></div>`;
  }
  v.innerHTML = `${switcher()}${needEnglishNote()}${hero}
    <button class="scancta" data-go="scan"><span class="badge">${ICON.camera}</span><span class="grow"><b>${esc(noEmoji(t('btn_analyze')))}</b><span class="muted">${esc(t('scanSub'))}</span></span><span class="ico">${ICON.chev}</span></button>
    ${card}
    ${tip ? `<div class="card flat"><div class="row">${ic('tips')}<span class="cap">${esc(t('tipOfDay'))}</span></div><p>${md(stripEmoji(tip))}</p></div>` : ''}
    <div class="card list">${liRow('sch', t('sumSchemes'), sch.slice(0, 2).map((s) => s.title).join(' · '), 'schemes')}${liRow('news', t('sumNews'), hl, 'news')}</div>`;
  bindSwitcher(v);
  const st = $('#saytoday', v); if (st) st.onclick = () => speak([t(VLABEL[lvl]), t(REASON[tv.v.reason])].join('. '));
};

/* Scan + result */
SCREENS.scan = async (v) => {
  const it = S.item, classes = CLASSES[it.id];
  const tips = `<div class="phototips"><div>${ic('light')}${esc(t('goodLight'))}</div><div>${ic('hand')}${esc(t('holdSteady'))}</div><div>${ic('frame')}${esc(t('fillFrame'))}</div></div>`;
  if (!classes) { v.innerHTML = `${switcher()}<div class="card empty">${artEl(it.id)}<b>${esc(itemName(it))}</b><p>${esc(t('diagSoonItem'))}</p></div>`; bindSwitcher(v); return; }
  v.innerHTML = `${switcher()}<div class="finder" id="fnd">${S.photo ? `<img class="photo" alt="" src="${S.photo}">${S.heat ? '<div class="heat"></div>' : ''}` : artEl(it.id)}<div class="corners"></div></div>${S.photo ? '' : tips}
    <input type="file" id="file" accept="image/*" hidden>
    <button class="btn ${S.photo ? 'sec' : ''}" id="pick">${ic('camera')}${esc(t(S.photo ? 'choosePhoto' : 'pickPhoto'))}</button>
    ${S.photo ? `<button class="btn" id="go">${ic('check')}${esc(noEmoji(t('btn_analyze')))}</button>` : ''}<div id="out" class="stack-out"></div>`;
  bindSwitcher(v);
  $('#pick', v).onclick = () => $('#file', v).click();
  $('#file', v).onchange = (e) => { const f = e.target.files[0]; if (f) { S.photo = URL.createObjectURL(f); S.result = null; render(); } };
  const go = $('#go', v);
  if (go) go.onclick = async () => {
    const fnd = $('#fnd', v), out = $('#out', v); fnd.classList.add('scanning'); go.disabled = true;
    out.innerHTML = `<div class="card"><ol class="steps">${['stepPhoto', 'stepRead', 'stepAdvice'].map((k) => `<li><span class="dot"></span>${esc(t(k))}</li>`).join('')}</ol></div>`;
    for (const li of $$('.steps li', out)) { li.className = 'now'; await new Promise((r) => setTimeout(r, reduce ? 0 : 650)); li.className = 'done'; $('.dot', li).innerHTML = ICON.check; }
    fnd.classList.remove('scanning'); S.result = S.result || classes[0]; showResult(out);
  };
  if (S.result) showResult($('#out', v));
};
async function showResult(out) {
  const id = S.result, r = await rec(id), classes = CLASSES[S.item.id]; if (!r) return;
  const healthy = id.endsWith('healthy'), pct = healthy ? 94 : 91, plant = S.sector === 'plant';
  out.innerHTML = `<div class="card fade"><div class="rhead"><div class="grow"><span class="pill ${healthy ? '' : 'bad'}">${ic(healthy ? 'check' : 'alert')}${esc(healthy ? t('healthy') : noEmoji(t('tab_diagnosis')))}</span> <span class="pill warn">${esc(t('demo'))}</span><h2>${esc(r.title)}</h2></div><div class="ring" id="ring"><div><span>${pct}%</span><small>${esc(t('sure'))}</small></div></div></div>
      <div class="row wrap"><button class="btn sm" id="say" ${canSpeak() ? '' : 'hidden'}>${ic('sound')}${esc(t('listen'))}</button><button class="togglechip" id="heat" aria-pressed="${S.heat}">${esc(t('focusArea'))}</button></div></div>
    ${needEnglishNote()}
    <div class="card fade"><span class="cap">${esc(t('secOverview'))}</span><p>${md(r.overview)}</p>${r.immediate_steps ? `<div style="border-top:1px solid var(--line);padding-top:12px"><span class="cap">${esc(t('secNow'))}</span><p style="font-size:var(--fs-title);line-height:1.45">${md(r.immediate_steps)}</p></div>` : ''}</div>
    <div id="solhost"></div>
    ${r.prevention ? `<div class="card fade"><span class="cap">${esc(t('secPrevent'))}</span><p>${md(r.prevention)}</p></div>` : ''}
    ${banner('', 'shield', esc(t('caution')))}
    ${classes.length > 1 ? `<div class="cap">${esc(t('demo'))}</div><div class="chips">${classes.map((c) => `<button class="chip nopad" aria-pressed="${c === id}" data-c="${c}">${esc((c.split('_').slice(2).join(' ') || c).toUpperCase())}</button>`).join('')}</div>` : ''}`;
  const drawSol = () => {
    const h = $('#solhost', out), tv = plant ? todayVerdict() : null;
    h.innerHTML = `<div class="card fade"><span class="cap">${esc(t('solutions'))}</span>${seg('solseg', [['organic', 'organic'], ['chemical', 'chemical']], S.sol)}<p>${md(S.sol === 'organic' ? r.treatment_organic : r.treatment_chemical)}</p>
      ${S.sol === 'chemical' ? `${tv ? `<div class="verdict ${tv.v.level}">${ic(tv.v.level === 'safe' ? 'check' : tv.v.level === 'no' ? 'close' : 'alert')}<div>${esc(t('todaySpray'))}: ${esc(t(VLABEL[tv.v.level]))}<small>${esc(t(REASON[tv.v.reason]))}${tv.d.estimated ? ' · ' + esc(t('estimated')) : ''}</small></div></div>` : ''}${banner('', 'shield', esc(t('careful')))}${FEATURES.store ? '' : `<div class="banner info">${ic('shop')}<div class="grow">${esc(t('storeTeaser'))}</div></div>`}` : ''}</div>`;
    bindSeg(h, 'solseg', (val) => { S.sol = val; drawSol(); });
  };
  drawSol();
  requestAnimationFrame(() => requestAnimationFrame(() => $('#ring', out).style.setProperty('--p', pct)));
  $('#heat', out).onclick = (e) => { S.heat = !S.heat; e.currentTarget.setAttribute('aria-pressed', S.heat); const f = $('#fnd'); f.querySelector('.heat')?.remove(); if (S.heat && f.querySelector('img')) f.insertAdjacentHTML('beforeend', '<div class="heat"></div>'); };
  const say = $('#say', out); if (say) say.onclick = () => speak([r.title, r.immediate_steps].join('. '));
  $$('[data-c]', out).forEach((b) => (b.onclick = () => { S.result = b.dataset.c; showResult(out); }));
}

/* Calendar */
SCREENS.calendar = async (v) => {
  const plant = S.sector === 'plant', key = S.cur + ':cal', cur = S.sub[key] || (plant ? 'stages' : 'vacc');
  const opts = plant ? [['stages', 'calCrop'], ['harvest', 'calHarvest']] : [['vacc', 'calVacc'], ['breed', 'calBreed']];
  v.innerHTML = `${switcher()}${seg('calseg', opts, cur)}${needEnglishNote()}<div id="calbody" class="stack-out"></div>`;
  bindSwitcher(v); bindSeg(v, 'calseg', (val) => { S.sub[key] = val; render(); });
  const body = $('#calbody', v);
  await ({ stages: calStages, harvest: calHarvest, vacc: calVacc, breed: calBreed }[cur])(body);
};
const monthsTxt = (ms) => ms.map((m) => fmtDate(new Date(2000, m - 1, 1), { month: 'short' })).join(' · ');
async function calStages(body) {
  const it = S.item, id = it.id, start = getStart(), stages = DATA.advisory.calendar.stages, label = id === 'paddy' ? 'startPaddy' : 'startSow';
  let html = `<div class="card">${dateField('start', label, start)}</div>`;
  if (id === 'paddy' && start) {
    const dat = G.daysBetween(G.parse(start), new Date()), all = G.stageDates(stages, start), now = G.stageFor(stages, dat), ni = all.findIndex((x) => now && x.id === now.id);
    const shown = S.showAll || ni < 0 ? all : all.filter((_, i) => i >= ni - 1 && i <= ni + 1), codes = WX.days.length ? G.weatherAdviceCodes(WX.days) : [];
    html += `<div class="timeline">${shown.map((x) => { const i = all.indexOf(x), st = i < ni ? 'done' : i === ni ? 'now' : '';
      return `<div class="tl ${st}"><b>${esc(L().code === 'or' ? x.nameOd : x.name)}</b><span class="muted">${esc(fmt(x.from))} → ${esc(fmt(x.to))}${st === 'now' ? ' · ' + esc(t('dayN')) + ' ' + dat : ''}</span>${st === 'now' ? `<div class="card hl" style="margin-top:10px"><span class="cap">${esc(t('general'))}</span><p>${esc(x.general)}</p><div id="stagesol"></div></div>` : ''}</div>`; }).join('')}</div>
      <button class="link" id="allbtn">${esc(t(S.showAll ? 'showLess' : 'showAll'))} (${all.length})</button>
      ${codes.length ? `<div class="card"><span class="cap">${esc(t('wx10'))}</span>${adviceLines(codes)}</div>` : ''}`;
  } else {
    const list = (await content('calendar'))[id] || [], m = new Date().getMonth() + 1;
    if (!start && id === 'paddy') html += `<p class="muted">${esc(t('enterDate'))}</p>`;
    html += `<div class="timeline">${list.map((x) => { const now = x.months?.includes(m); return `<div class="tl ${now ? 'now' : ''}"><b>${esc(stripEmoji(x.stage))}</b><span class="muted">${esc(monthsTxt(x.months))}${now ? ' · ' + esc(t('thisMonth')) : ''}</span><p>${esc(x.task)}</p></div>`; }).join('')}</div>`;
  }
  body.innerHTML = html;
  $('#start', body).onchange = (e) => { store.set(startKey(), e.target.value); render(); };
  const ab = $('#allbtn', body); if (ab) ab.onclick = () => { S.showAll = !S.showAll; render(); };
  const sh = $('#stagesol', body);
  if (sh) { const now = G.stageFor(stages, G.daysBetween(G.parse(start), new Date())), draw = () => { sh.innerHTML = seg('stseg', [['organic', 'organic'], ['chemical', 'chemical']], S.sol) + `<p style="margin-top:12px">${esc(S.sol === 'organic' ? now.organic : now.chemical)}</p>` + (S.sol === 'chemical' ? banner('', 'shield', esc(t('careful'))) : ''); bindSeg(sh, 'stseg', (val) => { S.sol = val; draw(); }); }; draw(); }
}
function adviceLines(codes) {
  const f = (c) => ({ sprayWindow: `${t('bestDay')}: ${fmt(c.date)}`, noSprayWindow: t('noWindow'), heavyRain: `${t('heavyRain')} (${c.mm} mm, ${fmt(c.date)})`, hot: `${t('hotDay')} (${c.t}°C, ${fmt(c.date)})`, cold: t('coldNight'), rainDays: `${t('rainyDays')}: ${c.n} / ${c.of}` }[c.code]);
  return `<ul class="plain">${codes.map((c) => `<li>${esc(f(c))}</li>`).join('')}</ul>`;
}
async function calHarvest(body) {
  const id = S.cur, spec = DATA.harvest[id], start = getStart(), label = id === 'paddy' ? 'startPaddy' : 'startSow';
  let html = `<div class="card">${dateField('start', label, start)}${verifyPill(spec.verified, 'verifyKvk')}</div>`;
  if (start) {
    const h = G.harvestWindow(start, spec), pct = Math.max(0, Math.min(100, Math.round((h.dat / spec.daysTo) * 100)));
    html += `<div class="hero fade"><span class="chipw">${esc(t('harvestWindow'))}</span><div class="big">${esc(fmt(h.from))} → ${esc(fmt(h.to))}</div><div class="sub">${h.daysToStart > 0 ? `<b>${h.daysToStart}</b> ${esc(t('daysToGo'))}` : esc(t('readyHarvest'))}</div><div class="stagebar" style="background:rgba(255,255,255,.25)"><i style="width:${pct}%;background:#fff"></i></div><div class="sub">${esc(t('dayN'))} ${Math.max(0, h.dat)} / ${spec.daysTo}</div></div>`;
  } else html += `<p class="muted">${esc(t('enterDate'))}</p>`;
  html += `<p class="muted">${esc(t('source'))}: ${esc(spec.source)}</p>`; body.innerHTML = html;
  $('#start', body).onchange = (e) => { store.set(startKey(), e.target.value); render(); };
}
async function calVacc(body) {
  const spec = DATA.livestock[S.cur].vaccination, age = +store.get('agri.age.' + S.cur, '4');
  body.innerHTML = `<div class="card"><label class="field"><span>${esc(t('ageMonths'))}</span><input type="number" id="age" min="0" max="240" inputmode="numeric" value="${age}"></label></div>` + spec.map((x) => {
    const st = G.vaccineStatus(x, age), p = { due: ['bad', 'vDue'], upcoming: ['gold', 'vUpcoming'], repeat: ['warn', 'vRepeat'], past: ['', 'vPast'] }[st.state];
    return `<div class="card"><div class="row"><b class="grow">${esc(x.what)}</b><span class="pill ${p[0]}">${esc(t(p[1]))}</span></div><p class="muted">${esc(x.repeat)}</p><p>${esc(x.note)}</p><p class="muted">${esc(t('source'))}: ${esc(x.source)}</p>${verifyPill(x.verified)}</div>`;
  }).join('');
  $('#age', body).onchange = (e) => { store.set('agri.age.' + S.cur, e.target.value || '0'); render(); };
}
async function calBreed(body) {
  const spec = DATA.livestock[S.cur].breeding, sd = store.get('agri.svc.' + S.cur, ''), lh = store.get('agri.heat.' + S.cur, '');
  let html = `<div class="card">${dateField('svc', 'serviceDate', sd)}</div>`;
  if (sd) {
    const p = G.breedingPlan(sd, spec), todayIso = G.iso(new Date());
    html += `<div class="hero fade"><span class="chipw">${esc(t('dueDate'))}</span><div class="big">${esc(fmt(p.due, { day: 'numeric', month: 'short', year: 'numeric' }))}</div><div class="sub">${esc(fmt(p.dueFrom))} – ${esc(fmt(p.dueTo))}</div></div>
      <div class="timeline">${p.items.map((m) => `<div class="tl ${m.to < todayIso ? 'done' : ''}"><b>${esc(m.label)}</b><span class="muted">${esc(fmt(m.from))}${m.to !== m.from ? ' – ' + esc(fmt(m.to)) : ''}</span><p>${esc(m.note)}</p>${verifyPill(m.verified)}</div>`).join('')}</div>`;
  }
  html += `<div class="card">${dateField('heat', 'lastHeat', lh)}${lh ? `<span class="cap">${esc(t('nextHeat'))}</span>${G.nextHeats(lh, spec, 3).map((h) => `<p><b>${esc(fmt(h.mid))}</b> <span class="muted">(${esc(fmt(h.from))} – ${esc(fmt(h.to))})</span></p>`).join('')}` : ''}</div>`;
  html += banner('', 'info', `${esc(spec.aiTip.text)}${verifyPill(spec.aiTip.verified)}`);
  body.innerHTML = html;
  $('#svc', body).onchange = (e) => { store.set('agri.svc.' + S.cur, e.target.value); render(); };
  $('#heat', body).onchange = (e) => { store.set('agri.heat.' + S.cur, e.target.value); render(); };
}

/* Weather */
SCREENS.weather = (v) => {
  const days = WX.days; if (!days.length) { v.innerHTML = '<div class="skel"></div><div class="skel"></div>'; return; }
  const best = G.bestSprayDay(days, 3), codes = G.weatherAdviceCodes(days), p = place(), plant = S.sector !== 'animal';
  WX.sel = Math.min(S.wxSel || 0, days.length - 1); const sel = days[WX.sel], dv = (d) => G.sprayVerdict(d, { monsoon: monsoon() }), sv = dv(sel);
  const status = { online: `${t('synced')} ${ago(WX.syncedAt)}`, saved: `${t('offSaved')}${WX.syncedAt ? ' · ' + t('synced') + ' ' + ago(WX.syncedAt) : ''}`, estimate: t('offEst'), none: '' }[WX.mode];
  v.innerHTML = `<div class="hero ${best ? '' : 'bad'} fade"><span class="chipw">${ic('pin')}${esc(p.name === 'default' ? t('locDefault') : 'GPS')}</span>
      <div class="big">${best ? esc(t('bestDay')) + ': ' + esc(fmt(best.date, { weekday: 'short', day: 'numeric', month: 'short' })) : esc(t('noWindow'))}</div><div class="sub">${esc(status)}</div></div>
    <div class="strip" role="group" aria-label="${esc(t('wx10'))}">${days.map((d, i) => { const x = dv(d); return `<button data-i="${i}" aria-pressed="${i === WX.sel}" class="${d.estimated ? 'est' : ''}"><span class="d">${esc(i === 0 ? t('stageNow') : fmt(d.date, { weekday: 'short' }))}</span><span class="w">${wxIcon(d)}</span><span class="t">${Math.round(d.tMax)}°</span><span class="dot2 ${x.level}" title="${esc(t(VLABEL[x.level]))}"></span></button>`; }).join('')}</div>
    <div class="card"><div class="row"><b class="grow" style="font-size:var(--fs-title)">${esc(fmt(sel.date, { weekday: 'long', day: 'numeric', month: 'short' }))}</b>${sel.estimated ? `<span class="pill warn">${esc(t('estimated'))}</span>` : ''}</div>
      ${plant ? `<div class="verdict ${sv.level}">${ic(sv.level === 'safe' ? 'check' : sv.level === 'no' ? 'close' : 'alert')}<div>${esc(t(VLABEL[sv.level]))}<small>${esc(t(REASON[sv.reason]))}</small></div></div>` : ''}
      <div class="stats"><div class="stat"><b>${Math.round(sel.tMax)}° / ${Math.round(sel.tMin)}°</b><span>${esc(t('temp'))}</span></div><div class="stat"><b>${sel.rainProb}% · ${Math.round(sel.rainMm * 10) / 10} mm</b><span>${esc(t('rain'))}</span></div><div class="stat"><b>${Math.round(sel.windMax)} km/h</b><span>${esc(t('wind'))}</span></div></div></div>
    <div class="card"><span class="cap">${esc(t('sumTip'))}</span>${adviceLines(codes.filter((c) => !['sprayWindow', 'noSprayWindow'].includes(c.code)))}</div>
    <div class="row wrap"><button class="btn sm" id="sync">${ic('sync')}${esc(t('syncNow'))}</button><button class="btn sm ghost" id="loc">${ic('pin')}${esc(t('useLoc'))}</button></div>`;
  $$('.strip button', v).forEach((x) => (x.onclick = () => { S.wxSel = +x.dataset.i; render(); }));
  $('#sync', v).onclick = async () => { $('#sync', v).disabled = true; await loadWeather(); render(); };
  $('#loc', v).onclick = () => navigator.geolocation && navigator.geolocation.getCurrentPosition(async (pos) => { store.set('agri.loc', JSON.stringify({ lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3), name: 'gps' })); await loadWeather(); render(); }, () => {}, { timeout: 8000 });
};

/* More and subpages */
SCREENS.more = (v) => {
  v.innerHTML = `<div class="card list">${liRow('tips', noEmoji(t('tab_tips')), '', 'tips')}${liRow('sch', noEmoji(t('tab_schemes')), '', 'schemes')}${liRow('news', noEmoji(t('tab_news')), '', 'news')}${liRow('shop', noEmoji(t('tab_shop')), '', 'store', `<span class="pill warn">${esc(t('soon'))}</span>`)}</div>
    <div class="card list">${liRow('plus', t('editFarm'), S.mine.map((id) => itemName(ITEMS[id])).join(' · '), 'mine')}${liRow('set', t('settings'), '', 'settings')}</div>
    <p class="foot">GramAI · Chandra Shekhar</p>`;
};
SCREENS.settings = (v) => {
  const theme = store.get('agri.theme', 'auto'), size = store.get('agri.size', 'normal');
  v.innerHTML = `<div class="card"><span class="cap">${esc(t('language'))}</span><div class="chips">${LANGS.map((l) => `<button class="chip nopad" data-l="${l.code}" aria-pressed="${l.code === S.lang}">${l.name}</button>`).join('')}</div>${L().mt ? banner('', 'info', esc(L().name + ': machine translation, not yet checked by a native speaker.')) : L().ui ? '' : banner('', 'info', esc(L().name + ': translation is being prepared. Showing English for now.'))}</div>
    <div class="card"><span class="cap">${esc(t('textSize'))}</span>${seg('sizeseg', [['normal', 'sizeNormal'], ['large', 'sizeLarge']], size)}</div>
    <div class="card"><span class="cap">${esc(t('appearance'))}</span>${seg('themeseg', [['auto', 'themeAuto'], ['light', 'themeLight'], ['dark', 'themeDark']], theme)}</div>
    <div class="card"><span class="cap">${esc(t('about'))}</span><p>${esc(t('aboutBody'))}</p><p class="muted">GramAI 0.5</p></div>`;
  $$('[data-l]', v).forEach((b) => (b.onclick = () => { setLang(b.dataset.l); render(); }));
  bindSeg(v, 'sizeseg', (m) => { setSize(m); render(); }); bindSeg(v, 'themeseg', (m) => { setTheme(m); render(); });
};
SCREENS.tips = async (v) => {
  const d = await content('tips'), list = d[S.cur] || (S.sector === 'plant' ? d.plant : null) || d.general || [];
  let head = ''; if (S.cur === 'paddy' && getStart()) { const st = G.stageFor(DATA.advisory.calendar.stages, G.daysBetween(G.parse(getStart()), new Date())); if (st) head = `<div class="card hl"><span class="cap">${esc(t('thisStage'))} · ${esc(L().code === 'or' ? st.nameOd : st.name)}</span><p>${esc(st.general)}</p></div>`; }
  v.innerHTML = `${switcher()}${needEnglishNote()}${head}<div class="card list facts">${list.map((x, i) => `<div class="li"><span class="k">${i + 1}</span><p>${md(stripEmoji(x))}</p></div>`).join('')}</div>`; bindSwitcher(v);
  if (!list.length) v.innerHTML += `<div class="card empty">${artEl(S.cur)}<b>${esc(t('comingSoon'))}</b></div>`;
};
SCREENS.schemes = async (v) => {
  const en = (await getJSON('../languages/en/schemes.json')) || [], id = S.cur, animal = S.sector === 'animal', ins = DATA.advisory.insurance, odisha = DATA.advisory.schemes.filter((x) => /Odisha/.test(x.name));
  const list = en.filter((s) => s.tags.includes(id) || s.tags.includes('all') || (animal && s.tags.includes('animal')));
  v.innerHTML = `${switcher()}${needEnglishNote()}` + list.map((s) => `<div class="card"><b>${esc(s.title)}</b><span class="cap">${esc(t('benefit'))}</span><p>${esc(s.benefit)}</p><span class="cap">${esc(t('eligibility'))}</span><p>${esc(s.eligibility)}</p></div>`).join('')
    + (animal ? '' : odisha.map((s) => `<div class="card"><b>${esc(s.name)}</b><p>${esc(s.summary)}</p><p class="muted">${esc(s.verifyNote)}</p></div>`).join('') +
    `<div class="card hl"><div class="row">${ic('shield')}<b class="grow">${esc(t('insurance'))}: ${esc(ins.scheme)}</b></div><span class="cap">${esc(t('premium'))}</span><p>${esc(ins.premium)}</p><span class="cap">${esc(t('enrol'))}</span><p>${esc(ins.enrolment)}</p><span class="cap">${esc(t('claim'))}</span><p>${esc(ins.claim)}</p><a class="link-a" href="${esc(ins.portal)}" target="_blank" rel="noopener">${esc(t('portal'))} ↗</a><p class="muted">${esc(t('verifyOfficial'))} ${esc(ins.verifyNote)}</p></div>`);
  bindSwitcher(v);
};
SCREENS.news = async (v) => {
  let n = readNews(); if (!n) { await syncNews(); n = readNews(); }
  const list = n?.sections?.[S.sector || 'plant'] || [], lc = L().code;
  if (!list.length) { v.innerHTML = `${switcher()}<div class="card empty">${ic('news')}<p>${esc(t('noNews'))}</p></div>`; bindSwitcher(v); return; }
  v.innerHTML = `${switcher()}<p class="muted">${esc(t('newsUpdated'))}: ${esc(ago(n.updatedAt * 1000))}</p>${lc !== 'en' ? banner('info', 'info', esc(t('newsMT'))) : ''}` + list.map((it) => `<a class="card newsi" href="${esc(it.link)}" target="_blank" rel="noopener"><b>${esc(it.title[lc] || it.title.en)}</b><span class="muted">${esc(it.source)} · ${esc(it.published ? fmt(it.published.slice(0, 10)) : '')} · ${esc(t('readMore'))} ↗</span></a>`).join(''); bindSwitcher(v);
};
SCREENS.store = (v) => { v.innerHTML = `<div class="card hl empty">${ic('shop')}<b>${esc(t('storeSoonTitle'))}</b><p>${esc(t('storeSoonBody'))}</p><span class="pill warn">${esc(t('soon'))}</span></div>`; };

/* ---------- assistant (rule-based, grounded in the facts) ---------- */
function openAssistant() {
  const plant = S.sector === 'plant', chips = (plant ? [['qSpray', 'spray'], ['qStage', 'stage'], ['qScheme', 'scheme'], ['qNews', 'news']] : [['qVacc', 'vaccine'], ['qBreed', 'breeding'], ['qScheme', 'scheme'], ['qNews', 'news']]);
  $('#overlay').innerHTML = `<div class="scrim" id="scrim"></div><section class="sheet" role="dialog" aria-label="${esc(t('expertTitle'))}"><div class="handle"></div><div class="row"><b class="grow" style="font-size:var(--fs-title)">${esc(t('expertTitle'))}</b><button class="ibtn plain" id="chatx" aria-label="${esc(t('back'))}">${ic('close')}</button></div>
    <div class="chat-b" id="chatb"></div><div class="chips">${chips.map(([k, intent]) => `<button class="chip nopad" data-q="${intent}">${esc(t(k))}</button>`).join('')}</div>
    <form class="chat-f" id="chatf"><input id="chati" autocomplete="off" placeholder="${esc(t('askHint'))}" aria-label="${esc(t('askHint'))}"><button class="btn sm">${esc(t('send'))}</button></form>
    <a class="btn ghost" id="wa" target="_blank" rel="noopener" href="https://wa.me/">${esc(t('expertWa'))}</a></section>`;
  const close = () => ($('#overlay').innerHTML = '');
  $('#scrim').onclick = close; $('#chatx').onclick = close;
  const add = (txt, me) => { const d = document.createElement('div'); d.className = 'msg' + (me ? ' me' : ''); d.textContent = txt; $('#chatb').append(d); $('#chatb').scrollTop = 1e6; };
  add(t('expertHi'));
  const ask = async (q, forced) => {
    add(q, true); $('#wa').href = 'https://wa.me/?text=' + encodeURIComponent(q); const f = await buildFacts();
    if (FEATURES.llm && GramLLM.ready() && !forced) { try { const out = await GramLLM.chat(GramSummary.buildPrompt(f, lblFn, q, L().code === 'hi' ? 'Hindi' : 'English')); if (GramSummary.numbersGrounded(out, f, lblFn).ok) return add(out); } catch {} }
    const lines = GramSummary.answer(q, f, lblFn, forced); add(lines ? lines.map((l) => `${t(l.k)}: ${l.text.replace(/\*\*/g, '')}`).join('\n') : t('noAnswer'));
  };
  $$('[data-q]', $('#overlay')).forEach((b) => (b.onclick = () => ask(b.textContent, b.dataset.q)));
  $('#chatf').onsubmit = (e) => { e.preventDefault(); const q = $('#chati').value.trim(); if (q) { $('#chati').value = ''; ask(q); } };
}

/* ---------- auto-sync: whenever the network is available ---------- */
let lastSync = 0, syncing = false;
async function autoSync(force) {
  if (syncing || !online() || (!force && !G.shouldSync(lastSync, Date.now(), 30))) return;
  syncing = true;
  try { const [w, n] = await Promise.all([loadWeather(), syncNews()]); if (w || n) lastSync = Date.now(); } finally { syncing = false; }
  const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || ''), live = ['today', 'weather', 'news', 'calendar'];
  if (!typing && live.includes(S.screen) && !$('#overlay').children.length) render(); else renderTop();
}
addEventListener('online', () => autoSync(true)); addEventListener('offline', () => { primeWeather(false); renderTop(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) autoSync(false); });
setInterval(() => autoSync(false), 5 * 60 * 1000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

/* ---------- boot ---------- */
(async () => {
  let adv, live, clim, harv;
  [I18N, DOMAIN, adv, live, clim, harv] = await Promise.all([getJSON('i18n.json'), getJSON('../languages/domain_config.json'), getJSON('data/advisory.json'), getJSON('data/livestock.json'), getJSON('data/climate.json'), getJSON('data/harvest.json')]);
  I18N ||= {}; DOMAIN ||= { plant: [], animal: [] }; DATA = { advisory: adv, livestock: live, climate: clim, harvest: harv };
  for (const sec of ['plant', 'animal']) (DOMAIN[sec] || []).forEach((it) => (ITEMS[it.id] = { ...it, sector: sec }));
  { const th = store.get('agri.theme', 'auto'); if (th !== 'auto') setTheme(th); if (store.get('agri.size', 'normal') === 'large') setSize('large'); }
  primeWeather(false);
  // QA deep link: ?lang=en&theme=dark&size=large&go=today|scan|calendar|weather|more|tips|schemes|news|settings&item=paddy&res=plant_paddy_blast&photo=1&days=40&sub=breed&offline=1
  if (QP.get('lang')) { S.lang = QP.get('lang'); store.set('agri.lang', S.lang); }
  if (QP.get('theme')) document.documentElement.dataset.theme = QP.get('theme');
  if (QP.get('size') === 'large') setSize('large');
  S.mine = S.mine.filter((id) => ITEMS[id]); if (!ITEMS[S.cur]) S.cur = S.mine[0] || '';
  if (QP.get('go')) {
    if (!S.mine.length) S.mine = ['paddy', 'wheat', 'cow', 'goat'];
    S.cur = QP.get('item') || S.cur || S.mine[0]; if (!S.mine.includes(S.cur)) S.mine.push(S.cur);
    if (QP.get('days')) { const d = new Date(); d.setDate(d.getDate() - +QP.get('days')); store.set(startKey(), G.iso(d)); }
    if (QP.get('res')) S.result = QP.get('res'); if (QP.get('photo')) S.photo = 'icon.svg'; if (QP.get('sub')) S.sub[S.cur + ':cal'] = QP.get('sub');
    S.screen = QP.get('go');
  } else S.screen = !S.lang ? 'lang' : (S.mine.length ? 'today' : 'pick');
  if (!S.lang) S.lang = 'or';
  await render();
  if (QP.get('audit')) setTimeout(() => { const sizes = {}, radii = {}, tiny = []; document.querySelectorAll('#view *, #top *, #bnav *').forEach((el) => { if (!el.offsetParent) return; const cs = getComputedStyle(el); if ([...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) { const f = parseFloat(cs.fontSize); sizes[f] = (sizes[f] || 0) + 1; } if (cs.borderRadius !== '0px') radii[cs.borderRadius] = (radii[cs.borderRadius] || 0) + 1; if (['BUTTON', 'A', 'INPUT', 'SELECT'].includes(el.tagName)) { const b = el.getBoundingClientRect(); if (b.width < 44 || b.height < 44) tiny.push(el.tagName + ':' + (el.textContent || el.id).trim().slice(0, 14) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height)); } }); document.documentElement.setAttribute('data-audit', JSON.stringify({ sizes, radii, tiny, h: document.documentElement.scrollHeight })); }, 2500);
  autoSync(true);
})();
