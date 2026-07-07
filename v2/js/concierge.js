// concierge.js — "Ask the Mandala"
// Fully client-side semantic-search concierge. Zero backend.
//
// Load-time cost: this module + corpus.js only (a few KB). Nothing else loads
// until the visitor submits their first question — at that point transformers.js
// and the embedding model (~23-25MB) are lazy-loaded from CDN with a visible
// progress indicator. If that fails (offline, old browser, blocked CDN) the
// concierge quietly degrades to plain on-device keyword search and says so.
//
// Self-contained: injects its own Shadow DOM + styles, never throws into the
// host page, guards against double-init.

import { CORPUS } from "./corpus.js";

(function init() {
  try {
    if (window.__concierge) return;
    window.__concierge = true;

    if (document.body) {
      mount();
    } else {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
    }
  } catch (err) {
    // Never let concierge break the host page.
    console.error("[concierge] init failed", err);
  }
})();

function mount() {
  try {
    // Must be the self-contained browser bundle (transformers.min.js), NOT
    // transformers.web.js — the .web build does a bare `import
    // "onnxruntime-web/webgpu"` that only a bundler can resolve, so it
    // throws "Failed to resolve module specifier" in a raw browser import.
    const TRANSFORMERS_CDN_URL =
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js";
    const MODEL_ID = "Xenova/all-MiniLM-L6-v2";
    const NOTICE_SEEN_KEY = "concierge_notice_seen_v1";
    const CACHE_KEY = "concierge_embeddings_v1";

    const state = {
      open: false,
      status: "idle", // idle | loading | ready | fallback | error
      extractor: null,
      corpusEmbeddings: null, // Array<Float32Array>, same order as CORPUS
      lastQuery: "",
    };

    // ---------- Shadow host ----------
    const host = document.createElement("div");
    host.id = "concierge-host";
    host.style.all = "initial"; // isolate from host page cascade at the host-element level
    const shadow = host.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = css();
    shadow.appendChild(style);

    const root = document.createElement("div");
    root.className = "concierge-root";
    root.innerHTML = markup();
    shadow.appendChild(root);

    document.body.appendChild(host);

    // ---------- element refs ----------
    const els = {
      button: root.querySelector(".c-button"),
      panel: root.querySelector(".c-panel"),
      closeBtn: root.querySelector(".c-close"),
      form: root.querySelector(".c-form"),
      input: root.querySelector(".c-input"),
      notice: root.querySelector(".c-notice"),
      status: root.querySelector(".c-status"),
      progressWrap: root.querySelector(".c-progress-wrap"),
      progressBar: root.querySelector(".c-progress-bar"),
      results: root.querySelector(".c-results"),
    };

    // ---------- open / close ----------
    function openPanel() {
      state.open = true;
      els.panel.classList.add("is-open");
      els.button.setAttribute("aria-expanded", "true");
      updateNoticeVisibility();
      window.setTimeout(() => els.input.focus(), 150);
    }
    function closePanel() {
      state.open = false;
      els.panel.classList.remove("is-open");
      els.button.setAttribute("aria-expanded", "false");
    }
    function togglePanel() {
      state.open ? closePanel() : openPanel();
    }

    function updateNoticeVisibility() {
      let seen = false;
      try {
        seen = localStorage.getItem(NOTICE_SEEN_KEY) === "1";
      } catch (_) {
        /* localStorage unavailable — treat as unseen, harmless */
      }
      els.notice.style.display = seen ? "none" : "block";
    }

    function markNoticeSeen() {
      try {
        localStorage.setItem(NOTICE_SEEN_KEY, "1");
      } catch (_) {
        /* ignore quota / privacy-mode failures */
      }
      els.notice.style.display = "none";
    }

    els.button.addEventListener("click", togglePanel);
    els.closeBtn.addEventListener("click", closePanel);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && state.open) closePanel();
    });

    // click outside panel closes it
    document.addEventListener("click", (e) => {
      if (!state.open) return;
      const path = e.composedPath ? e.composedPath() : [];
      if (!path.includes(host)) closePanel();
    });

    els.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const q = els.input.value.trim();
      if (!q) return;
      handleQuery(q);
    });

    // ---------- query handling ----------
    async function handleQuery(query) {
      state.lastQuery = query;
      markNoticeSeen();
      setResultsMessage("thinking…");
      setProgress(null);

      if (state.status === "ready") {
        return runSemanticSearch(query);
      }
      if (state.status === "fallback") {
        return runKeywordSearch(query);
      }
      if (state.status === "loading") {
        setStatus("still loading the model — hang tight…");
        return;
      }

      // First run: try to stand up the semantic pipeline.
      state.status = "loading";
      try {
        await loadModelAndEmbedCorpus();
        state.status = "ready";
        setProgress(null);
        await runSemanticSearch(query);
      } catch (err) {
        console.warn("[concierge] semantic model unavailable, falling back to keyword search", err);
        state.status = "fallback";
        setProgress(null);
        setStatus("on-device model couldn't load (offline or unsupported browser) — using keyword search instead.");
        runKeywordSearch(query);
      }
    }

    async function loadModelAndEmbedCorpus() {
      setStatus("loading transformers.js…");
      setProgress(0);

      const mod = await import(TRANSFORMERS_CDN_URL);
      const { pipeline } = mod;

      setStatus("downloading embedding model (~25 MB, cached after first time)…");

      const extractor = await pipeline("feature-extraction", MODEL_ID, {
        dtype: "q8",
        progress_callback: (data) => {
          if (data && data.status === "progress" && typeof data.progress === "number") {
            setProgress(Math.round(data.progress));
            setStatus(`downloading model… ${Math.round(data.progress)}%`);
          } else if (data && data.status === "initiate") {
            setStatus(`preparing ${data.file || "model"}…`);
          } else if (data && data.status === "done") {
            setStatus("model ready — embedding knowledge base…");
          }
        },
      });

      state.extractor = extractor;

      // Try cache first.
      const cached = readEmbeddingCache();
      if (cached) {
        state.corpusEmbeddings = cached;
        return;
      }

      setStatus("embedding knowledge base…");
      const texts = CORPUS.map((c) => c.text);
      const output = await extractor(texts, { pooling: "mean", normalize: true });
      const dims = output.dims; // [n, hidden]
      const data = output.data; // flat Float32Array
      const hidden = dims[1];
      const embeddings = [];
      for (let i = 0; i < dims[0]; i++) {
        embeddings.push(data.slice(i * hidden, (i + 1) * hidden));
      }
      state.corpusEmbeddings = embeddings;
      writeEmbeddingCache(embeddings, hidden);
    }

    async function runSemanticSearch(query) {
      try {
        setStatus("searching…");
        const out = await state.extractor([query], { pooling: "mean", normalize: true });
        const hidden = out.dims[1];
        const qVec = out.data.slice(0, hidden);

        const scored = CORPUS.map((chunk, i) => ({
          chunk,
          score: dot(qVec, state.corpusEmbeddings[i]),
        }));
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, 3).map((s) => ({
          section: s.chunk.section,
          text: s.chunk.text,
          link: s.chunk.link,
          score: s.score,
        }));
        setStatus("");
        renderResults(top, { fallback: false });
      } catch (err) {
        console.warn("[concierge] semantic search failed mid-query, falling back", err);
        state.status = "fallback";
        setStatus("something went wrong with the on-device model — using keyword search instead.");
        runKeywordSearch(query);
      }
    }

    function runKeywordSearch(query) {
      const terms = query
        .toLowerCase()
        .split(/[^a-z0-9+]+/)
        .filter((t) => t.length > 1);

      const scored = CORPUS.map((chunk) => {
        const hay = (chunk.section + " " + chunk.text).toLowerCase();
        let matched = 0;
        for (const t of terms) {
          if (hay.includes(t)) matched++;
        }
        const score = terms.length ? matched / terms.length : 0;
        return { chunk, score };
      });
      scored.sort((a, b) => b.score - a.score);
      const top = scored
        .filter((s) => s.score > 0)
        .slice(0, 3)
        .map((s) => ({
          section: s.chunk.section,
          text: s.chunk.text,
          link: s.chunk.link,
          score: s.score,
        }));

      setStatus(
        state.status === "fallback"
          ? "on-device model unavailable — showing keyword matches instead."
          : ""
      );
      renderResults(top, { fallback: true });
    }

    // ---------- rendering ----------
    function setStatus(text) {
      els.status.textContent = text || "";
    }

    function setProgress(pct) {
      if (pct === null || pct === undefined) {
        els.progressWrap.style.display = "none";
        els.progressBar.style.width = "0%";
        return;
      }
      els.progressWrap.style.display = "block";
      els.progressBar.style.width = Math.max(0, Math.min(100, pct)) + "%";
    }

    function setResultsMessage(text) {
      clearChildren(els.results);
      const p = document.createElement("p");
      p.className = "c-msg";
      p.textContent = text;
      els.results.appendChild(p);
    }

    function renderResults(matches, opts) {
      clearChildren(els.results);

      if (!matches.length) {
        const p = document.createElement("p");
        p.className = "c-msg";
        p.textContent = "No matches found — try rephrasing your question.";
        els.results.appendChild(p);
        return;
      }

      for (const m of matches) {
        const row = document.createElement("div");
        row.className = "c-row";

        const sectionEl = document.createElement("span");
        sectionEl.className = "c-section";
        sectionEl.textContent = m.section; // textContent — safe from HTML injection

        const textEl = document.createElement("p");
        textEl.className = "c-text";
        textEl.textContent = m.text; // textContent — safe from HTML injection

        row.appendChild(sectionEl);
        row.appendChild(textEl);

        if (m.link) {
          const a = document.createElement("a");
          a.href = m.link; // corpus-controlled, not user input
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.className = "c-link";
          a.textContent = m.link.startsWith("mailto:")
            ? m.link.replace("mailto:", "")
            : "view ↗";
          row.appendChild(a);
        }

        const barWrap = document.createElement("div");
        barWrap.className = "c-bar-wrap";
        const bar = document.createElement("div");
        bar.className = "c-bar";
        const pct = Math.round(Math.max(0, Math.min(1, m.score)) * 100);
        bar.style.width = Math.max(pct, 3) + "%";
        barWrap.appendChild(bar);
        barWrap.title = (opts.fallback ? "keyword match: " : "similarity: ") + pct + "%";
        row.appendChild(barWrap);

        els.results.appendChild(row);
      }

      const closing = document.createElement("p");
      closing.className = "c-closing";
      closing.textContent = opts.fallback
        ? "keyword search running on-device — no server, no API."
        : "semantic search running on-device via transformers.js — no server, no API.";
      els.results.appendChild(closing);
    }

    function clearChildren(el) {
      while (el.firstChild) el.removeChild(el.firstChild);
    }

    // ---------- math ----------
    function dot(a, b) {
      let s = 0;
      const n = Math.min(a.length, b.length);
      for (let i = 0; i < n; i++) s += a[i] * b[i];
      return s;
    }

    // ---------- embedding cache (sessionStorage) ----------
    function cacheFingerprint() {
      // Cheap checksum over ids+text lengths so a corpus edit invalidates the cache.
      let sum = 0;
      for (const c of CORPUS) {
        sum = (sum + c.id.length + c.text.length) % 1000000007;
      }
      return `${MODEL_ID}::${CORPUS.length}::${sum}`;
    }

    function readEmbeddingCache() {
      try {
        const raw = sessionStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (parsed.fp !== cacheFingerprint()) return null;
        const flat = base64ToFloatArray(parsed.data);
        const hidden = parsed.hidden;
        const embeddings = [];
        for (let i = 0; i < CORPUS.length; i++) {
          embeddings.push(flat.slice(i * hidden, (i + 1) * hidden));
        }
        return embeddings;
      } catch (_) {
        return null;
      }
    }

    function writeEmbeddingCache(embeddings, hidden) {
      try {
        const flat = new Float32Array(embeddings.length * hidden);
        embeddings.forEach((e, i) => flat.set(e, i * hidden));
        const payload = JSON.stringify({
          fp: cacheFingerprint(),
          hidden,
          data: floatArrayToBase64(flat),
        });
        sessionStorage.setItem(CACHE_KEY, payload);
      } catch (_) {
        // Quota exceeded or storage disabled — embeddings just stay in-memory. Fine.
      }
    }

    function floatArrayToBase64(arr) {
      const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      let binary = "";
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
      }
      return btoa(binary);
    }

    function base64ToFloatArray(b64) {
      const binary = atob(b64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new Float32Array(bytes.buffer);
    }

    // initial state
    updateNoticeVisibility();
  } catch (err) {
    console.error("[concierge] mount failed", err);
  }
}

// ---------- static markup / styles ----------
function markup() {
  return `
    <button type="button" class="c-button" aria-label="Ask about Daryll's work" aria-expanded="false">
      <span class="c-button-glyph">◈</span><span class="c-button-label">ask</span>
    </button>
    <section class="c-panel" role="dialog" aria-label="Ask the Mandala">
      <header class="c-header">
        <span class="c-title">◈ ask the mandala</span>
        <button type="button" class="c-close" aria-label="Close">✕</button>
      </header>
      <p class="c-notice">runs entirely in your browser — first question downloads a small model (~25 MB)</p>
      <form class="c-form">
        <input class="c-input" type="text" placeholder="ask about daryll's work…" autocomplete="off" spellcheck="false" />
      </form>
      <div class="c-progress-wrap"><div class="c-progress-bar"></div></div>
      <p class="c-status"></p>
      <div class="c-results"></div>
    </section>
  `;
}

function css() {
  return `
    :host { all: initial; }
    * { box-sizing: border-box; }
    .concierge-root {
      position: fixed;
      inset: auto;
      z-index: 2147483000;
      font-family: inherit;
      color: #e8e8f0;
      -webkit-font-smoothing: antialiased;
    }

    .c-button {
      position: fixed;
      right: max(20px, env(safe-area-inset-right));
      bottom: max(20px, env(safe-area-inset-bottom));
      z-index: 2147483000;
      display: inline-flex;
      align-items: center;
      gap: 0.4em;
      padding: 0.65em 1.1em;
      border-radius: 999px;
      border: 1px solid transparent;
      background:
        linear-gradient(#0a0a12, #0a0a12) padding-box,
        linear-gradient(135deg, #00d4ff, #7b2ff2) border-box;
      background-color: rgba(7, 7, 12, 0.72);
      backdrop-filter: blur(14px) saturate(140%);
      -webkit-backdrop-filter: blur(14px) saturate(140%);
      color: #eafcff;
      font-size: 14px;
      font-weight: 500;
      letter-spacing: 0.02em;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(0, 212, 255, 0.08);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .c-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 28px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 212, 255, 0.25);
    }
    .c-button-glyph {
      background: linear-gradient(135deg, #00d4ff, #7b2ff2);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: 15px;
      line-height: 1;
    }
    .c-button-label { text-transform: lowercase; }

    .c-panel {
      position: fixed;
      right: max(20px, env(safe-area-inset-right));
      bottom: max(76px, calc(env(safe-area-inset-bottom) + 76px));
      z-index: 2147482999;
      width: min(400px, calc(100vw - 40px));
      max-height: min(560px, calc(100vh - 140px));
      display: flex;
      flex-direction: column;
      border-radius: 16px;
      border: 1px solid rgba(0, 212, 255, 0.18);
      background: rgba(9, 9, 16, 0.88);
      backdrop-filter: blur(20px) saturate(140%);
      -webkit-backdrop-filter: blur(20px) saturate(140%);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(123, 47, 242, 0.08);
      opacity: 0;
      transform: translateY(12px) scale(0.98);
      pointer-events: none;
      transition: opacity 0.22s ease, transform 0.22s ease;
      overflow: hidden;
    }
    .c-panel.is-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: auto;
    }

    .c-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px 10px;
      flex: none;
    }
    .c-title {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.03em;
      background: linear-gradient(135deg, #00d4ff, #7b2ff2);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      text-transform: lowercase;
    }
    .c-close {
      background: none;
      border: none;
      color: rgba(232, 232, 240, 0.55);
      font-size: 13px;
      cursor: pointer;
      padding: 4px 6px;
      line-height: 1;
      border-radius: 6px;
    }
    .c-close:hover { color: #eafcff; background: rgba(255, 255, 255, 0.06); }

    .c-notice {
      margin: 0 16px 10px;
      padding: 8px 10px;
      font-size: 11.5px;
      line-height: 1.4;
      color: rgba(232, 232, 240, 0.65);
      background: rgba(0, 212, 255, 0.06);
      border: 1px solid rgba(0, 212, 255, 0.14);
      border-radius: 10px;
    }

    .c-form { padding: 0 16px 10px; flex: none; }
    .c-input {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.04);
      color: #eafcff;
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .c-input::placeholder { color: rgba(232, 232, 240, 0.4); }
    .c-input:focus {
      border-color: rgba(0, 212, 255, 0.5);
      background: rgba(255, 255, 255, 0.06);
    }

    .c-progress-wrap {
      display: none;
      height: 3px;
      margin: 0 16px 8px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      overflow: hidden;
      flex: none;
    }
    .c-progress-bar {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #00d4ff, #7b2ff2);
      transition: width 0.15s ease;
    }

    .c-status {
      margin: 0 16px 8px;
      font-size: 11.5px;
      color: rgba(232, 232, 240, 0.55);
      min-height: 14px;
      flex: none;
    }

    .c-results {
      padding: 0 16px 16px;
      overflow-y: auto;
      flex: 1 1 auto;
    }
    .c-results::-webkit-scrollbar { width: 6px; }
    .c-results::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 999px; }

    .c-msg {
      font-size: 12.5px;
      color: rgba(232, 232, 240, 0.5);
      margin: 8px 0;
    }

    .c-row {
      padding: 10px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
    }
    .c-row:first-child { border-top: none; }

    .c-section {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #00d4ff;
      margin-bottom: 4px;
    }
    .c-text {
      margin: 0 0 6px;
      font-size: 13px;
      line-height: 1.5;
      color: rgba(232, 232, 240, 0.92);
    }
    .c-link {
      display: inline-block;
      font-size: 11.5px;
      color: #7b2ff2;
      text-decoration: none;
      margin-bottom: 6px;
    }
    .c-link:hover { text-decoration: underline; }

    .c-bar-wrap {
      height: 3px;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.07);
      overflow: hidden;
    }
    .c-bar {
      height: 100%;
      background: linear-gradient(90deg, #00d4ff, #7b2ff2);
      border-radius: 999px;
    }

    .c-closing {
      margin: 10px 0 0;
      padding-top: 10px;
      border-top: 1px solid rgba(255, 255, 255, 0.07);
      font-size: 10.5px;
      font-style: italic;
      color: rgba(232, 232, 240, 0.45);
      text-align: center;
    }

    @media (max-width: 480px) {
      .c-panel {
        right: max(12px, env(safe-area-inset-right));
        left: max(12px, env(safe-area-inset-left));
        width: auto;
        bottom: max(72px, calc(env(safe-area-inset-bottom) + 72px));
      }
      .c-button {
        right: max(12px, env(safe-area-inset-right));
        bottom: max(12px, env(safe-area-inset-bottom));
      }
    }
  `;
}
