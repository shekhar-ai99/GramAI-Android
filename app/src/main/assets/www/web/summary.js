// GramAI grounded summary + assistant. Pure functions (no DOM), runs in browser and Node.
// Everything the user sees comes from the "facts" object built from real app data. An LLM, if the user
// installs one, may only REWRITE these facts; it is told not to add doses, brands or dates.
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.GramSummary = factory(); })(this, function () {
  const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,.;:]+\S*$/, '') + '…' : s; };
  const firstSentences = (s, n = 2) => (String(s || '').match(/[^.!?।]+[.!?।]?/g) || []).slice(0, n).join(' ').trim();

  /* Ordered, labelled lines for the Smart summary card. `lbl` maps a label key to the user's language. */
  function summarize(f, lbl) {
    const L = [];
    if (f.diagnosis) {
      L.push({ k: 'sumProblem', text: `${f.diagnosis.title}. ${clip(firstSentences(f.diagnosis.overview, 1), 160)}`, tone: f.diagnosis.healthy ? 'ok' : 'bad' });
      if (f.diagnosis.now) L.push({ k: 'secNow', text: clip(firstSentences(f.diagnosis.now, 2), 200) });
      if (f.diagnosis.organic) L.push({ k: 'organic', text: clip(f.diagnosis.organic, 170) });
      if (f.diagnosis.chemical) L.push({ k: 'chemical', text: clip(f.diagnosis.chemical, 170) });
    } else L.push({ k: 'sumProblem', text: lbl('sumNone'), tone: 'muted' });
    if (f.weather && f.weather.today) {
      const w = f.weather, v = { safe: 'spraySafe', caution: 'sprayCaution', no: 'sprayNo' }[w.today.level];
      L.push({ k: 'sumSpray', text: `${lbl(v)} · ${lbl(w.today.reasonKey)}${w.estimated ? ' · ' + lbl('estimated') : ''}${w.bestDay ? ' · ' + lbl('bestDay') + ': ' + w.bestDay : ''}`, tone: w.today.level === 'safe' ? 'ok' : w.today.level === 'no' ? 'bad' : 'warn' });
    }
    if (f.weather && f.weather.today && f.weather.today.level !== 'safe' && f.diagnosis && /spray/i.test(`${f.diagnosis.now} ${f.diagnosis.chemical}`)) L.push({ k: 'sumSpray', text: lbl('sprayWait') + (f.weather.bestDay ? ' (' + lbl('bestDay') + ': ' + f.weather.bestDay + ')' : ''), tone: 'warn' });
    if (f.stage) L.push({ k: 'sumStage', text: `${f.stage.name}${f.stage.dat != null ? ' (' + lbl('dayN') + ' ' + f.stage.dat + ')' : ''}: ${clip(f.stage.task, 150)}` });
    if (f.harvest) L.push({ k: 'sumHarvest', text: `${f.harvest.from} → ${f.harvest.to}${f.harvest.daysToStart > 0 ? ' · ' + f.harvest.daysToStart + ' ' + lbl('daysToGo') : ''}` });
    if (f.animal) {
      if (f.animal.vaccDue && f.animal.vaccDue.length) L.push({ k: 'sumVacc', text: f.animal.vaccDue.join(', '), tone: 'warn' });
      if (f.animal.dueDate) L.push({ k: 'sumBreed', text: `${lbl('dueDate')}: ${f.animal.dueDate}${f.animal.next ? ' · ' + f.animal.next : ''}` });
    }
    if (f.schemes && f.schemes.length) L.push({ k: 'sumSchemes', text: f.schemes.slice(0, 3).join(' · ') });
    if (f.news && f.news.length) L.push({ k: 'sumNews', text: clip(f.news[0], 140) });
    if (f.tips && f.tips.length) L.push({ k: 'sumTip', text: clip(String(f.tips[0]).replace(/\*\*/g, ''), 160) });
    return L;
  }

  /* What is the user asking about? Keywords in English, Hindi and Odia. */
  const KW = {
    spray: ['spray', 'sprayer', 'pesticide', 'छिड़काव', 'स्प्रे', 'ସ୍ପ୍ରେ'],
    weather: ['weather', 'rain', 'forecast', 'मौसम', 'बारिश', 'ପାଣିପାଗ', 'ବର୍ଷା'],
    disease: ['disease', 'problem', 'sick', 'treat', 'medicine', 'remedy', 'रोग', 'बीमारी', 'इलाज', 'ରୋଗ', 'ଚିକିତ୍ସା'],
    stage: ['stage', 'calendar', 'when to', 'fertili', 'अवस्था', 'कैलेंडर', 'ଖତ', 'ପର୍ଯ୍ୟାୟ'],
    harvest: ['harvest', 'cut', 'कटाई', 'ଅମଳ'],
    vaccine: ['vaccin', 'inject', 'टीका', 'ଟିକା'],
    breeding: ['breed', 'heat', 'pregnan', 'calving', 'kidding', 'insemin', 'प्रजनन', 'गर्भ', 'ପ୍ରଜନନ'],
    scheme: ['scheme', 'subsid', 'loan', 'insurance', 'yojana', 'योजना', 'बीमा', 'ଯୋଜନା', 'ବୀମା'],
    news: ['news', 'update', 'समाचार', 'खबर', 'ଖବର'],
    tips: ['tip', 'advice', 'suggest', 'सुझाव', 'सलाह', 'ସୁପାରିଶ'],
    summary: ['summary', 'overview', 'everything', 'सारांश', 'ସାରାଂଶ'],
    dose: ['how much', 'how many', 'dose', 'dosage', 'quantity', ' kg', 'per acre', 'कितना', 'मात्रा', 'କେତେ', 'ମାତ୍ରା'],
  };
  function intent(q) {
    const s = String(q || '').toLowerCase(); let best = null, hit = 0;
    for (const [k, words] of Object.entries(KW)) { const n = words.filter((w) => s.includes(w)).length; if (n > hit) { hit = n; best = k; } }
    return best || 'unknown';
  }

  /* Rule-based answer: picks the matching lines from the summary. Works offline with no model. */
  function answer(q, f, lbl) {
    const lines = summarize(f, lbl), by = (...ks) => lines.filter((l) => ks.includes(l.k));
    const map = { spray: by('sumSpray'), weather: by('sumSpray'), disease: by('sumProblem', 'secNow', 'organic', 'chemical'), stage: by('sumStage'), harvest: by('sumHarvest'),
      vaccine: by('sumVacc'), breeding: by('sumBreed'), scheme: by('sumSchemes'), news: by('sumNews'), tips: by('sumTip'), summary: lines };
    const out = (map[intent(q)] || []).filter((l) => l.tone !== 'muted');
    return out.length ? out : null;
  }

  /* Prompt for the optional on-device LLM. It may only rewrite the facts. */
  function buildPrompt(f, lbl, question, langName) {
    const facts = summarize(f, lbl).filter((l) => l.tone !== 'muted').map((l) => `- ${lbl(l.k)}: ${l.text}`).join('\n');
    const sys = `You are GramAI, a careful helper for Indian farmers. Use ONLY the facts provided. If the facts do not contain the answer, say you do not know and tell the farmer to ask an expert. Never invent doses, product names, prices, dates or scheme amounts. Write in simple ${langName}, in at most 5 short sentences. Put the most urgent action first.`;
    const user = `Facts for ${f.itemName}:\n${facts}\n\n${question ? 'Farmer question: ' + question : 'Task: explain the situation and what to do now, in simple words.'}`;
    return [{ role: 'system', content: sys }, { role: 'user', content: user }];
  }
  /* Grounding check for LLM output: every number in the answer must already appear in the facts.
     Catches invented doses ("1.5-2 kg per acre"). It cannot catch every wrong claim, so a model must also pass an eval before use. */
  function numbersGrounded(output, f, lbl) {
    const src = summarize(f, lbl).map((l) => l.text).join(' ') + ' ' + JSON.stringify(f);
    const nums = String(output || '').match(/\d+(?:[.,]\d+)?/g) || [];
    const bad = nums.filter((n) => !new RegExp('(^|\\D)' + n.replace('.', '\\.') + '(\\D|$)').test(src));
    return { ok: bad.length === 0, bad };
  }
  return { summarize, intent, answer, buildPrompt, numbersGrounded, clip, firstSentences };
});
