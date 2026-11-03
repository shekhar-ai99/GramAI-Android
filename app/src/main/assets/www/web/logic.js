// GramAI pure logic: no DOM, no network. Runs in the browser and in Node (for tests).
(function (root, factory) { if (typeof module === 'object' && module.exports) module.exports = factory(); else root.GramLogic = factory(); })(this, function () {
  const DAY = 86400000;
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const addDays = (d, n) => new Date(d.getTime() + n * DAY);
  const daysBetween = (a, b) => Math.round((Date.UTC(b.getFullYear(), b.getMonth(), b.getDate()) - Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);
  const parse = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  /* ---- Spray verdict for one day. level: 'safe' | 'caution' | 'no' ---- */
  // Rules follow the AgriAI weather engine (rain >= 60% no, wind >= 20 caution, 30-60% caution)
  // plus the Android advisory rules (heavy rain, heat). `estimated` days are never reported as fully safe.
  function sprayVerdict(day, opts = {}) {
    const rainProb = day.rainProb ?? 0, rainMm = day.rainMm ?? 0, wind = day.windMax ?? 0, tMax = day.tMax ?? 30;
    let level = 'safe', reason = 'dry';
    if (rainProb >= 60 || rainMm >= 5) { level = 'no'; reason = 'rain'; }
    else if (wind >= 20) { level = 'caution'; reason = 'wind'; }
    else if (rainProb >= 30 || rainMm >= 2) { level = 'caution'; reason = 'maybeRain'; }
    else if (tMax >= 36) { level = 'caution'; reason = 'heat'; }
    if (day.estimated && level === 'safe' && (opts.monsoon || rainProb >= 20)) { level = 'caution'; reason = 'estimated'; }
    return { level, reason };
  }

  /* ---- Best spraying window: first safe day in the next `n` days ---- */
  function bestSprayDay(days, n = 3) { return days.slice(0, n).find((d) => sprayVerdict(d).level === 'safe') || null; }

  /* ---- Weather advice lines (ported from Android Advice.kt), returned as codes the UI translates ---- */
  function weatherAdviceCodes(days) {
    const out = [];
    if (!days.length) return out;
    const win = bestSprayDay(days, 3);
    out.push(win ? { code: 'sprayWindow', date: win.date } : { code: 'noSprayWindow' });
    const heavy = days.find((d) => d.rainMm >= 20); if (heavy) out.push({ code: 'heavyRain', date: heavy.date, mm: Math.round(heavy.rainMm) });
    const hot = days.find((d) => d.tMax >= 38); if (hot) out.push({ code: 'hot', date: hot.date, t: Math.round(hot.tMax) });
    if (days.slice(0, 3).some((d) => d.tMin <= 12)) out.push({ code: 'cold' });
    out.push({ code: 'rainDays', n: days.filter((d) => d.rainMm >= 2).length, of: days.length });
    return out;
  }

  /* ---- Offline forecast: saved forecast first, then climate estimate ---- */
  // cache: { syncedAt, days:[{date,tMax,tMin,rainMm,rainProb,windMax}] } | null.  climate: climate.json.
  function offlineForecast(today, cache, climate, n = 10) {
    const out = [];
    const saved = new Map(((cache && cache.days) || []).map((d) => [d.date, d]));
    // How wet was the last saved forecast compared with normal? Used to nudge the estimate (decays with distance).
    let wetBias = 1;
    if (cache && cache.days && cache.days.length) {
      const m = String(parse(cache.days[0].date).getMonth() + 1), norm = climate.months[m].rainDayProb;
      const frac = cache.days.filter((d) => d.rainMm >= 2).length / cache.days.length;
      wetBias = Math.min(1.5, Math.max(0.5, (frac + 0.05) / (norm + 0.05)));
    }
    for (let i = 0; i < n; i++) {
      const d = addDays(today, i), key = iso(d);
      if (saved.has(key)) { out.push({ ...saved.get(key), source: 'saved' }); continue; }
      const c = climate.months[String(d.getMonth() + 1)];
      const sinceSync = cache ? Math.max(0, daysBetween(parse(cache.days[cache.days.length - 1].date), d)) : 99;
      const w = cache ? Math.exp(-sinceSync / 4) : 0;            // influence of the last forecast fades over ~4 days
      const p = Math.min(0.95, c.rainDayProb * (1 + (wetBias - 1) * w));
      const wet = p >= 0.5;
      out.push({ date: key, tMax: c.tMax, tMin: c.tMin, rainProb: Math.round(p * 100), rainMm: wet ? c.rainMm : Math.round(c.rainMm * p * 10) / 10, windMax: c.windMax, source: 'estimate', estimated: true });
    }
    return out;
  }

  /* ---- Harvest window from a sowing/transplanting date ---- */
  function harvestWindow(startDate, spec, today = new Date()) {
    const start = typeof startDate === 'string' ? parse(startDate) : startDate;
    const from = addDays(start, spec.daysFrom), to = addDays(start, spec.daysTo);
    return { from: iso(from), to: iso(to), daysToStart: daysBetween(today, from), daysToEnd: daysBetween(today, to), dat: daysBetween(start, today) };
  }

  /* ---- Crop stage for a given days-after-transplanting ---- */
  function stageFor(stages, dat) { return stages.find((s) => dat >= s.datFrom && dat <= s.datTo) || null; }
  function stageDates(stages, transplantDate) { const t = typeof transplantDate === 'string' ? parse(transplantDate) : transplantDate; return stages.map((s) => ({ ...s, from: iso(addDays(t, s.datFrom)), to: iso(addDays(t, s.datTo)) })); }

  /* ---- Breeding ---- */
  function breedingPlan(serviceDate, spec) {
    const s = typeof serviceDate === 'string' ? parse(serviceDate) : serviceDate;
    const end = addDays(s, spec.gestationDays);
    const items = spec.milestones.map((m) => {
      if (m.dayFromEnd !== undefined) { const d = addDays(end, -m.dayFromEnd); return { ...m, from: iso(d), to: iso(d) }; }
      return { ...m, from: iso(addDays(s, m.dayFrom)), to: iso(addDays(s, m.dayTo)) };
    }).sort((a, b) => a.from.localeCompare(b.from));
    return { due: iso(end), dueFrom: iso(addDays(s, spec.gestationRange[0])), dueTo: iso(addDays(s, spec.gestationRange[1])), items };
  }
  function nextHeats(lastHeatDate, spec, count = 3) {
    const s = typeof lastHeatDate === 'string' ? parse(lastHeatDate) : lastHeatDate, out = [];
    for (let i = 1; i <= count; i++) out.push({ from: iso(addDays(s, spec.heatCycleRange[0] * i)), mid: iso(addDays(s, spec.heatCycleDays * i)), to: iso(addDays(s, spec.heatCycleRange[1] * i)) });
    return out;
  }

  /* ---- Vaccination status by age (months) ---- */
  function vaccineStatus(item, ageMonths) {
    const [a, b] = item.ageMonths;
    if (ageMonths < a) return { state: 'upcoming', inMonths: a - ageMonths };
    if (ageMonths <= b) return { state: 'due' };
    return { state: item.repeat === 'once in a lifetime' ? 'past' : 'repeat' };
  }

  /* ---- Auto-sync: due when never synced or older than `minutes` ---- */
  function shouldSync(lastAt, nowMs, minutes = 30) { return !lastAt || nowMs - lastAt >= minutes * 60000; }

  return { shouldSync, sprayVerdict, bestSprayDay, weatherAdviceCodes, offlineForecast, harvestWindow, stageFor, stageDates, breedingPlan, nextHeats, vaccineStatus, iso, parse, addDays, daysBetween };
});
