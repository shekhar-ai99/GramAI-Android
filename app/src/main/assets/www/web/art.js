// GramAI art: flat illustrations for crops and animals, weather glyphs, and a line-icon set.
// All inline SVG (no emoji, no image downloads), so they look the same on every phone and work offline.
(function () {
  const svg = (inner, vb = '0 0 64 64') => `<svg viewBox="${vb}" aria-hidden="true" focusable="false">${inner}</svg>`;
  const G1 = '#4f9a3a', G2 = '#2f6b2a', GOLD = '#e0a52b', GOLD2 = '#f4cf6a', BRN = '#7a4a21', INK = '#23302f', PINK = '#f2b6a8', BLUE = '#5fa8d3', CLOUD = '#c9d5d8', RED = '#d9473a';
  const grain = (x, y, r = 0, c = GOLD) => `<ellipse cx="${x}" cy="${y}" rx="2.3" ry="4" fill="${c}" transform="rotate(${r} ${x} ${y})"/>`;

  const ART = {
    paddy: svg(`<g fill="none" stroke-linecap="round"><path d="M16 60C16 38 22 24 42 13" stroke="${G1}" stroke-width="3"/><path d="M30 60C30 42 36 32 54 25" stroke="${G1}" stroke-width="3"/><path d="M44 60C44 49 48 43 58 39" stroke="${G2}" stroke-width="3"/></g>
      <path d="M17 52c-8-2-11-8-11-14 8 1 12 6 11 14z" fill="${G1}"/><path d="M30 56c9-1 13-6 14-12-9 0-14 5-14 12z" fill="${G2}"/>
      ${grain(36, 18, -50)}${grain(41, 14, -40)}${grain(45, 15, -10)}${grain(40, 20, -60)}${grain(49, 28, -40)}${grain(53, 24, -20)}${grain(46, 30, -60)}${grain(55, 31, 0)}${grain(58, 40, -10)}${grain(54, 42, -40)}`),
    wheat: svg(`<path d="M32 62V26" stroke="${G1}" stroke-width="3" stroke-linecap="round"/><path d="M32 52c-9 0-13-5-14-11 9-1 14 4 14 11z" fill="${G1}"/><path d="M32 46c8 0 12-4 13-10-8-1-13 4-13 10z" fill="${G2}"/>
      ${[8, 15, 22, 29].map((y) => grain(27, y + 4, -25) + grain(37, y + 4, 25)).join('')}${grain(32, 5, 0)}
      <g stroke="${GOLD}" stroke-width="1.2" stroke-linecap="round"><path d="M27 8 24 1M37 8l3-7M26 15l-4-6M38 15l4-6M25 22l-5-5M39 22l5-5"/></g>`),
    millet: svg(`<path d="M32 62V36" stroke="${G1}" stroke-width="3" stroke-linecap="round"/><path d="M32 54c-8 0-12-5-13-10 8-1 13 3 13 10z" fill="${G2}"/>
      <g fill="none" stroke="${BRN}" stroke-width="5" stroke-linecap="round"><path d="M32 36C20 34 14 24 14 12"/><path d="M32 36C25 30 24 20 24 8"/><path d="M32 36V6"/><path d="M32 36C39 30 40 20 40 8"/><path d="M32 36C44 34 50 24 50 12"/></g>
      <g fill="#a9743a">${[[14, 12], [24, 8], [32, 6], [40, 8], [50, 12]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2"/>`).join('')}</g>`),
    cow: svg(`<path d="M10 20C6 14 8 8 14 8c4 0 6 4 8 8" fill="#f1e3c8" stroke="#d8c6a3" stroke-width="1"/><path d="M54 20c4-6 2-12-4-12-4 0-6 4-8 8" fill="#f1e3c8" stroke="#d8c6a3" stroke-width="1"/>
      <ellipse cx="9" cy="28" rx="7" ry="4.5" fill="${INK}" transform="rotate(-20 9 28)"/><ellipse cx="55" cy="28" rx="7" ry="4.5" fill="${INK}" transform="rotate(20 55 28)"/>
      <path d="M16 18c0-5 7-8 16-8s16 3 16 8c0 10-3 18-3 28 0 8-6 12-13 12s-13-4-13-12c0-10-3-18-3-28z" fill="#fff" stroke="#dfe6e6" stroke-width="1.2"/>
      <path d="M17 18c4-6 10-8 15-8-2 8-6 12-9 16-3 0-5-4-6-8z" fill="${INK}"/><circle cx="25" cy="29" r="2.6" fill="${INK}"/><circle cx="39" cy="29" r="2.6" fill="${INK}"/>
      <ellipse cx="32" cy="48" rx="11" ry="8.5" fill="${PINK}"/><ellipse cx="28" cy="48" rx="1.8" ry="2.6" fill="#a8574a"/><ellipse cx="36" cy="48" rx="1.8" ry="2.6" fill="#a8574a"/>`),
    goat: svg(`<path d="M20 16C14 8 18 2 24 4c-3 4-2 8 2 10" fill="#8a8f90"/><path d="M44 16c6-8 2-14-4-12 3 4 2 8-2 10" fill="#8a8f90"/>
      <ellipse cx="9" cy="26" rx="8" ry="3.6" fill="#b98a56" transform="rotate(14 9 26)"/><ellipse cx="55" cy="26" rx="8" ry="3.6" fill="#b98a56" transform="rotate(-14 55 26)"/>
      <path d="M20 16c0-4 5-6 12-6s12 2 12 6c0 8-2 14-3 22-1 6-4 10-9 10s-8-4-9-10c-1-8-3-14-3-22z" fill="#e6c79c" stroke="#cda875" stroke-width="1.2"/>
      <g fill="#f4d35e"><ellipse cx="25" cy="25" rx="3.4" ry="3"/><ellipse cx="39" cy="25" rx="3.4" ry="3"/></g><g fill="${INK}"><rect x="23.9" y="22.8" width="2.2" height="4.4" rx="1"/><rect x="37.9" y="22.8" width="2.2" height="4.4" rx="1"/></g>
      <ellipse cx="32" cy="40" rx="6.5" ry="5" fill="#f1dfc2"/><circle cx="29.8" cy="40" r="1.1" fill="${INK}"/><circle cx="34.2" cy="40" r="1.1" fill="${INK}"/><path d="M28 50l4 10 4-10c-2 2-6 2-8 0z" fill="#f1e6d6" stroke="#cda875" stroke-width="1"/>`),
    tomato: svg(`<circle cx="32" cy="36" r="22" fill="${RED}"/><path d="M32 16l-6 6-8-2 6 6-3 8 7-5 4 6 4-6 7 5-3-8 6-6-8 2z" fill="${G1}" transform="translate(0 -8) scale(1 .8) translate(0 6)"/>`),
    cauliflower: svg(`<path d="M8 38c0-8 6-14 14-14 2-8 18-8 20 0 8 0 14 6 14 14 0 10-10 14-24 14S8 48 8 38z" fill="#f3efe4" stroke="#ddd6c4" stroke-width="1.5"/><path d="M6 44c6 4 14 6 26 6s20-2 26-6c-2 10-12 14-26 14S8 54 6 44z" fill="${G1}"/>`),
    sugarcane: svg(`<g stroke-linecap="round" fill="none"><path d="M22 60V8" stroke="${G2}" stroke-width="7"/><path d="M36 60V12" stroke="${G1}" stroke-width="7"/><path d="M48 60V20" stroke="${G2}" stroke-width="7"/></g><g stroke="#e8f2d8" stroke-width="2"><path d="M18 24h8M18 40h8M32 28h8M32 44h8M44 36h8M44 50h8"/></g>`),
    cotton: svg(`<path d="M32 60V34" stroke="${G2}" stroke-width="3" stroke-linecap="round"/><g fill="#fff" stroke="#dfe6e6" stroke-width="1.5"><circle cx="22" cy="24" r="9"/><circle cx="34" cy="16" r="10"/><circle cx="44" cy="26" r="9"/><circle cx="32" cy="30" r="9"/></g><path d="M20 38c4 4 8 4 12 0 4 4 8 4 12 0l-4 10H24z" fill="${G1}"/>`),
    chicken: svg(`<path d="M24 14c0-4 3-6 5-4 1-3 5-3 6 0 3-2 6 1 4 4z" fill="${RED}"/><ellipse cx="30" cy="26" rx="14" ry="12" fill="#fff" stroke="#dfe6e6" stroke-width="1.5"/><path d="M42 22l10 3-10 4z" fill="${GOLD}"/><circle cx="36" cy="23" r="2" fill="${INK}"/><path d="M44 28c1 6 0 8-2 9 2 1 3 4 1 6" fill="${RED}"/><ellipse cx="26" cy="46" rx="18" ry="12" fill="#fff" stroke="#dfe6e6" stroke-width="1.5"/>`),
    fish: svg(`<path d="M6 32c8-14 24-18 36-8l12-8v32l-12-8C30 50 14 46 6 32z" fill="${BLUE}"/><circle cx="18" cy="30" r="2.6" fill="#fff"/><circle cx="18" cy="30" r="1.2" fill="${INK}"/><path d="M28 24c3 4 3 12 0 16" stroke="#3f86b3" stroke-width="2" fill="none"/>`),
    buffalo: svg(`<path d="M4 22c4 6 8 6 12 4M60 22c-4 6-8 6-12 4" fill="none" stroke="#6b6f70" stroke-width="5" stroke-linecap="round"/><ellipse cx="12" cy="30" rx="8" ry="4" fill="#3a4547" transform="rotate(20 12 30)"/><ellipse cx="52" cy="30" rx="8" ry="4" fill="#3a4547" transform="rotate(-20 52 30)"/><path d="M16 22c0-6 7-10 16-10s16 4 16 10c0 10-2 18-2 26 0 8-6 12-14 12s-14-4-14-12c0-8-2-16-2-26z" fill="#4a5658"/><ellipse cx="32" cy="48" rx="11" ry="8" fill="#6b7476"/><circle cx="25" cy="30" r="2.6" fill="#fff"/><circle cx="39" cy="30" r="2.6" fill="#fff"/>`),
  };

  // Weather glyphs (filled, friendly)
  const cloud = (c = CLOUD, y = 0) => `<path transform="translate(0 ${y})" d="M18 46a10 10 0 0 1-.8-19.97A14 14 0 0 1 44 22a11 11 0 0 1 2 21.8V46z" fill="${c}"/>`;
  const WX = {
    sun: svg(`<circle cx="32" cy="32" r="11" fill="${GOLD}"/><g stroke="${GOLD}" stroke-width="4" stroke-linecap="round"><path d="M32 6v7M32 51v7M6 32h7M51 32h7M13.6 13.6l5 5M45.4 45.4l5 5M13.6 50.4l5-5M45.4 18.6l5-5"/></g>`),
    partly: svg(`<circle cx="22" cy="22" r="9" fill="${GOLD}"/><g stroke="${GOLD}" stroke-width="3.5" stroke-linecap="round"><path d="M22 5v4M5 22h4M10 10l3 3M34 10l-3 3"/></g>${cloud('#dfe8ea', 4)}`),
    cloud: svg(cloud('#cfd9dc', 2)),
    rain: svg(`${cloud('#aebcc1', -4)}<g stroke="${BLUE}" stroke-width="4" stroke-linecap="round"><path d="M22 48l-3 8M33 48l-3 8M44 48l-3 8"/></g>`),
    storm: svg(`${cloud('#8b9ba1', -6)}<path d="M34 34l-9 14h7l-3 12 12-16h-8z" fill="${GOLD}"/>`),
  };

  // Line icons (24 px, currentColor)
  const li = (inner) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${inner}</svg>`;
  const ICON = {
    today: li('<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"/>'),
    camera: li('<path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>'),
    cal: li('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>'),
    cloud: li('<path d="M6.5 18a4 4 0 0 1-.6-7.96A6 6 0 0 1 17.4 9 4.5 4.5 0 0 1 17 18z"/>'),
    more: li('<circle cx="5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="19" cy="12" r="1.7" fill="currentColor"/>'),
    chat: li('<path d="M4 5h16v11H9l-5 4z"/>'),
    back: li('<path d="M15 5l-7 7 7 7"/>'),
    chev: li('<path d="M9 5l7 7-7 7"/>'),
    close: li('<path d="M6 6l12 12M18 6 6 18"/>'),
    check: li('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
    alert: li('<path d="M12 4 2.5 20h19z"/><path d="M12 10v5M12 17.5v.5"/>'),
    info: li('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    shield: li('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>'),
    plus: li('<path d="M12 5v14M5 12h14"/>'),
    edit: li('<path d="M4 20h4L19 9l-4-4L4 16z"/>'),
    globe: li('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>'),
    sync: li('<path d="M20 11a8 8 0 0 0-14-4M4 4v4h4M4 13a8 8 0 0 0 14 4M20 20v-4h-4"/>'),
    pin: li('<path d="M12 21s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="9" r="2.5"/>'),
    tips: li('<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'),
    sch: li('<path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18"/>'),
    news: li('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>'),
    shop: li('<path d="M5 7h14l-1.5 11a2 2 0 0 1-2 1.7h-7a2 2 0 0 1-2-1.7zM9 7a3 3 0 0 1 6 0"/>'),
    set: li('<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>'),
    text: li('<path d="M4 19 9 6l5 13M6 15h6M16 19l3-8 3 8M17 17h4"/>'),
    sun: li('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4"/>'),
    sound: li('<path d="M4 10v4h4l5 4V6l-5 4zM16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>'),
    light: li('<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'),
    hand: li('<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5m0-1V4.5a1.5 1.5 0 0 1 3 0V11m0-1.5a1.5 1.5 0 0 1 3 0V15c0 4-2 6-5 6s-5-1.5-6-4l-2-4a1.5 1.5 0 0 1 2.5-1.5L8 13"/>'),
    frame: li('<path d="M4 9V5h4M20 9V5h-4M4 15v4h4M20 15v4h-4"/>'),
  };
  const art = (id) => ART[id] || ART.cotton;
  const wxIcon = (d) => d.rainMm >= 30 ? WX.storm : (d.rainProb >= 70 || d.rainMm >= 10) ? WX.rain : d.rainProb >= 45 ? WX.cloud : d.rainProb >= 20 ? WX.partly : WX.sun;
  window.GramArt = { ART, WX, ICON, art, wxIcon };
})();
