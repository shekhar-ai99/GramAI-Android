// Optional on-device LLM (opt-in). Uses WebLLM (WebGPU) loaded lazily from a pinned CDN version.
// Nothing is downloaded until the farmer taps the button. After the first download it works offline.
// UNTESTED end to end until the model has been downloaded once on a real device: see README.
window.GramLLM = (() => {
  const LIB = 'https://cdn.jsdelivr.net/npm/@mlc-ai/web-llm@0.2.87/+esm';
  const MODEL = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'; // about 400 MB, small enough for many phones
  let engine = null, loading = null;
  const supported = () => 'gpu' in navigator;
  const ready = () => !!engine;
  async function load(onProgress) {
    if (engine) return engine; if (loading) return loading;
    loading = (async () => { const web = await import(LIB); engine = await web.CreateMLCEngine(MODEL, { initProgressCallback: (p) => onProgress && onProgress(p) }); return engine; })();
    try { return await loading; } finally { loading = null; }
  }
  async function chat(messages, maxTokens = 220) {
    if (!engine) throw new Error('model not loaded');
    const r = await engine.chat.completions.create({ messages, temperature: 0.2, max_tokens: maxTokens }); return r.choices[0].message.content.trim();
  }
  return { supported, ready, load, chat, MODEL };
})();
