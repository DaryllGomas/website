/**
 * breach.js — hidden cybersecurity easter egg for daryllgomas.com v2
 * Self-initializing ES module. No imports, no exports, no globals beyond
 * a single window.__breach guard. Fails silently, always.
 *
 * Triggers: type "decrypt" anywhere (outside inputs), or the Konami code.
 * Commands: help, ls, cat cipher.txt, decrypt <word>, exit
 */

(function initBreach() {
  try {
    if (window.__breach) return;
    window.__breach = { version: 1, unlocked: false };

    /* ---------------------------------------------------------------- */
    /* Console hint — hackers check the console                          */
    /* ---------------------------------------------------------------- */
    try {
      console.log(
        '%c◈ signal detected. type `decrypt` anywhere.',
        'color:#39ff9d;background:#020403;font-family:monospace;font-size:13px;padding:6px 10px;border:1px solid #39ff9d;'
      );
    } catch (e) {}

    /* ---------------------------------------------------------------- */
    /* Styles                                                            */
    /* ---------------------------------------------------------------- */
    var FONT_STACK =
      "'JetBrains Mono', ui-monospace, 'Cascadia Code', 'SFMono-Regular', 'Source Code Pro', Menlo, Consolas, 'Liberation Mono', monospace";

    var css = [
      '#breach-overlay{position:fixed;inset:0;z-index:2147483647;background:#030604;',
      'font-family:' + FONT_STACK + ';color:#39ff9d;display:none;flex-direction:column;',
      'padding:0;margin:0;overflow:hidden;text-shadow:0 0 4px rgba(57,255,157,.55),0 0 14px rgba(57,255,157,.18);',
      '-webkit-font-smoothing:antialiased;}',

      '#breach-overlay.breach-open{display:flex;}',

      '#breach-overlay::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:3;',
      'background:repeating-linear-gradient(to bottom,rgba(0,0,0,0) 0px,rgba(0,0,0,0) 1px,rgba(0,0,0,.28) 2px,rgba(0,0,0,0) 3px);',
      'mix-blend-mode:multiply;}',

      '#breach-overlay::after{content:"";position:absolute;inset:0;pointer-events:none;z-index:4;',
      'background:radial-gradient(ellipse at center,rgba(0,0,0,0) 60%,rgba(0,0,0,.55) 100%);}',

      '#breach-screen{position:relative;z-index:1;flex:1;display:flex;flex-direction:column;',
      'max-width:900px;width:100%;margin:0 auto;padding:5vh 24px 24px;box-sizing:border-box;',
      'overflow:hidden;}',

      '#breach-log{flex:1;overflow-y:auto;white-space:pre-wrap;word-break:break-word;',
      'font-size:14px;line-height:1.55;padding-right:6px;}',

      '#breach-log::-webkit-scrollbar{width:6px;}',
      '#breach-log::-webkit-scrollbar-thumb{background:#0f3d26;}',
      '#breach-log::-webkit-scrollbar-track{background:transparent;}',

      '.breach-line{margin:0 0 2px;}',
      '.breach-dim{color:#1f8a5c;}',
      '.breach-warn{color:#ffcf5c;text-shadow:0 0 4px rgba(255,207,92,.5);}',
      '.breach-err{color:#ff5c5c;text-shadow:0 0 4px rgba(255,92,92,.5);}',
      '.breach-bright{color:#b6ffdb;text-shadow:0 0 6px rgba(182,255,219,.7);}',
      '.breach-violet{color:#c792ff;text-shadow:0 0 6px rgba(199,146,255,.6);}',
      '.breach-cyan{color:#5cf1ff;text-shadow:0 0 6px rgba(92,241,255,.6);}',

      '#breach-inputrow{display:flex;align-items:center;font-size:14px;padding-top:8px;',
      'border-top:1px solid rgba(57,255,157,.15);}',

      '#breach-prompt{white-space:nowrap;color:#5cf1ff;margin-right:8px;}',

      '#breach-inputwrap{position:relative;flex:1;display:flex;align-items:center;}',

      '#breach-input{flex:1;background:transparent;border:none;outline:none;color:#eafff2;',
      'font-family:' + FONT_STACK + ';font-size:14px;caret-color:#39ff9d;caret-shape:block;',
      'text-shadow:0 0 4px rgba(57,255,157,.55);}',

      '#breach-close{position:absolute;top:14px;right:18px;z-index:5;background:transparent;',
      'border:1px solid rgba(57,255,157,.35);color:#39ff9d;font-family:' + FONT_STACK + ';',
      'font-size:11px;letter-spacing:.08em;padding:5px 10px;cursor:pointer;text-transform:uppercase;',
      'border-radius:2px;}',
      '#breach-close:hover{background:rgba(57,255,157,.12);}',

      '.breach-mandala{color:#39ff9d;font-size:11px;line-height:1.15;white-space:pre;',
      'text-shadow:0 0 6px rgba(57,255,157,.7);}',

      '.breach-cascade{display:block;overflow:hidden;white-space:pre;color:#0f3d26;',
      'animation:breach-cascade-fade 1.4s ease-out forwards;}',
      '@keyframes breach-cascade-fade{0%{color:#eafff2;}100%{color:#1f8a5c;}}',

      '#breach-link{color:#c792ff;text-decoration:underline;text-shadow:0 0 6px rgba(199,146,255,.6);}',
      '#breach-link:hover{color:#eaccff;}',

      '@media (max-width:640px){#breach-screen{padding:4vh 14px 14px;}#breach-log{font-size:12.5px;}}'
    ].join('');

    var styleEl = document.createElement('style');
    styleEl.id = 'breach-style';
    styleEl.textContent = css;
    (document.head || document.documentElement).appendChild(styleEl);

    /* ---------------------------------------------------------------- */
    /* DOM (built once, lazily, on first trigger)                        */
    /* ---------------------------------------------------------------- */
    var overlay = null, logEl = null, inputEl = null, promptEl = null;
    var built = false;
    var history = [];
    var historyIndex = -1;
    var wrongAttempts = 0;
    var busy = false; // true while boot/typewriter animation is running
    var unlocked = false;
    var ANSWER = 'stillness';

    function buildDom() {
      if (built) return;
      built = true;

      overlay = document.createElement('div');
      overlay.id = 'breach-overlay';

      var closeBtn = document.createElement('button');
      closeBtn.id = 'breach-close';
      closeBtn.type = 'button';
      closeBtn.textContent = 'esc / exit';
      closeBtn.addEventListener('click', function () { closeOverlay(); });

      var screen = document.createElement('div');
      screen.id = 'breach-screen';

      logEl = document.createElement('div');
      logEl.id = 'breach-log';

      var inputRow = document.createElement('div');
      inputRow.id = 'breach-inputrow';

      promptEl = document.createElement('span');
      promptEl.id = 'breach-prompt';
      promptEl.textContent = 'guest@mandala:~$';

      var inputWrap = document.createElement('span');
      inputWrap.id = 'breach-inputwrap';

      inputEl = document.createElement('input');
      inputEl.id = 'breach-input';
      inputEl.type = 'text';
      inputEl.autocomplete = 'off';
      inputEl.autocapitalize = 'off';
      inputEl.spellcheck = false;

      inputWrap.appendChild(inputEl);
      inputRow.appendChild(promptEl);
      inputRow.appendChild(document.createTextNode(' '));
      inputRow.appendChild(inputWrap);

      screen.appendChild(logEl);
      screen.appendChild(inputRow);

      overlay.appendChild(closeBtn);
      overlay.appendChild(screen);
      (document.body || document.documentElement).appendChild(overlay);

      inputEl.addEventListener('keydown', onInputKeydown);
      overlay.addEventListener('click', function () {
        try { inputEl.focus(); } catch (e) {}
      });
    }

    /* ---------------------------------------------------------------- */
    /* Output helpers                                                     */
    /* ---------------------------------------------------------------- */
    function printLine(text, cls) {
      var p = document.createElement('div');
      p.className = 'breach-line' + (cls ? ' ' + cls : '');
      p.textContent = text;
      logEl.appendChild(p);
      scrollLog();
      return p;
    }

    function printHtmlLine(html, cls) {
      var p = document.createElement('div');
      p.className = 'breach-line' + (cls ? ' ' + cls : '');
      p.innerHTML = html;
      logEl.appendChild(p);
      scrollLog();
      return p;
    }

    function printPre(text, cls) {
      var p = document.createElement('div');
      p.className = 'breach-line' + (cls ? ' ' + cls : '');
      p.style.whiteSpace = 'pre';
      p.style.fontSize = '11px';
      p.style.lineHeight = '1.15';
      p.textContent = text;
      logEl.appendChild(p);
      scrollLog();
      return p;
    }

    function scrollLog() {
      try { logEl.scrollTop = logEl.scrollHeight; } catch (e) {}
    }

    function sleep(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    /* Typewriter: types a line into the log char by char with variable delay */
    function typeLine(text, cls, opts) {
      opts = opts || {};
      var instant = !!opts.instant;
      return new Promise(function (resolve) {
        var p = document.createElement('div');
        p.className = 'breach-line' + (cls ? ' ' + cls : '');
        logEl.appendChild(p);
        if (instant || !text) {
          p.textContent = text || '';
          scrollLog();
          resolve();
          return;
        }
        var i = 0;
        function step() {
          if (i >= text.length) { resolve(); return; }
          p.textContent += text.charAt(i);
          i++;
          scrollLog();
          var base = 10 + Math.random() * 22;
          // occasional micro-pause for realism
          if (Math.random() < 0.04) base += 90;
          setTimeout(step, base);
        }
        step();
      });
    }

    /* ---------------------------------------------------------------- */
    /* Boot sequence                                                     */
    /* ---------------------------------------------------------------- */
    var BOOT_LINES = [
      { text: '> unauthorized signal detected on local channel...', cls: 'breach-dim' },
      { text: '> tracing origin' + '.'.repeat(3) + ' packet route unstable', cls: 'breach-dim' },
      { text: '> bypassing noise floor... [OK]', cls: null },
      { text: '> access node found: mandala.core', cls: 'breach-cyan' },
      { text: '> handshake accepted. dropping you into a shell.', cls: null },
      { text: '> ', cls: null, instant: true },
      { text: 'welcome. the center is listening.', cls: 'breach-bright' },
      { text: "type 'help' to see what's available.", cls: 'breach-dim' }
    ];

    async function runBoot() {
      busy = true;
      for (var i = 0; i < BOOT_LINES.length; i++) {
        var line = BOOT_LINES[i];
        await typeLine(line.text, line.cls, { instant: line.instant });
        await sleep(i === 2 || i === 4 ? 160 : 60);
      }
      printLine('', null);
      busy = false;
      focusInput();
    }

    /* ---------------------------------------------------------------- */
    /* Commands                                                           */
    /* ---------------------------------------------------------------- */
    var CIPHERTEXT = 'GUR PRAGRE UBYQF JUNG GUR ABVFR PBAPRNYF — FCRNX: FGVYYARFF';

    var SNARK = [
      'access denied. the mandala remains unimpressed.',
      'incorrect. the noise wins this round.',
      'nope. maybe reread cipher.txt more carefully.',
      "cold. very cold. it's ROT13, not rocket science.",
      'still wrong. the wheel turns thirteen times, remember?',
      "at this point you're just guessing. respect the persistence though."
    ];

    var FILES = {
      'cipher.txt': CIPHERTEXT + '\n// hint: the wheel turns thirteen times.',
      '.access_log': 'last login: never (this terminal does not exist)',
      '.keymaster': 'permission denied: nice try.',
      'README.md': "you found the shell. now find the key. try: cat cipher.txt"
    };

    function printHelp() {
      printLine('available commands:', 'breach-bright');
      printLine('  help              show this list', 'breach-dim');
      printLine('  ls                list files in this node', 'breach-dim');
      printLine('  cat cipher.txt    read the encrypted fragment', 'breach-dim');
      printLine('  decrypt <word>    submit the decoded keyword', 'breach-dim');
      printLine('  exit              close this shell (esc also works)', 'breach-dim');
    }

    function printLs() {
      printLine('cipher.txt   .access_log   .keymaster   README.md', null);
    }

    function printCat(args) {
      var name = args.join(' ').trim();
      if (!name) { printLine('cat: missing file operand', 'breach-err'); return; }
      if (name === 'cipher.txt') {
        printLine(FILES['cipher.txt'].split('\n')[0], 'breach-cyan');
        printLine(FILES['cipher.txt'].split('\n')[1], 'breach-dim');
        return;
      }
      if (Object.prototype.hasOwnProperty.call(FILES, name)) {
        printLine(FILES[name], 'breach-dim');
        return;
      }
      printLine("cat: " + name + ": No such file or directory", 'breach-err');
    }

    async function handleDecrypt(args) {
      var guess = (args.join(' ') || '').trim().toLowerCase();
      if (!guess) {
        printLine('usage: decrypt <word>', 'breach-warn');
        return;
      }
      if (guess === ANSWER) {
        await runUnlock();
        return;
      }
      var msg = SNARK[Math.min(wrongAttempts, SNARK.length - 1)];
      wrongAttempts++;
      printLine(msg, 'breach-err');
    }

    var MANDALA_SMALL = [
      '            .  *  .',
      '        \\   |   /',
      '     *-- ( ( o ) ) --*',
      '        /   |   \\',
      '   *    •--•••--•    *',
      '        \\   |   /',
      '     *-- ( ( o ) ) --*',
      '        /   |   \\',
      '            ’  *  ’'
    ].join('\n');

    async function runUnlock() {
      if (unlocked) { printLine('already unlocked. the mandala remembers.', 'breach-dim'); return; }
      unlocked = true;
      busy = true;
      printLine('', null);
      await typeLine('decryption key accepted.', 'breach-bright');
      await sleep(120);
      var cascadeChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      for (var r = 0; r < 3; r++) {
        var row = '';
        var len = 40 + Math.floor(Math.random() * 20);
        for (var c = 0; c < len; c++) {
          row += cascadeChars.charAt(Math.floor(Math.random() * cascadeChars.length));
        }
        printPre(row, 'breach-cascade');
        await sleep(70);
      }
      await sleep(150);
      printPre(MANDALA_SMALL, 'breach-mandala');
      await sleep(200);
      await typeLine('the center holds. the noise concealed nothing worth fearing.', 'breach-bright');
      await typeLine("you're in.", 'breach-cyan');
      printLine('', null);
      printHtmlLine('&#8594; <a id="breach-link" href="vault/index.html" target="_blank" rel="noopener">enter the vault</a>', null);
      busy = false;
      focusInput();
    }

    async function runCommand(raw) {
      var trimmed = raw.trim();
      if (!trimmed) return;
      history.push(trimmed);
      historyIndex = history.length;

      printLine(promptEl.textContent + ' ' + raw, 'breach-dim');

      var parts = trimmed.split(/\s+/);
      var cmd = parts[0].toLowerCase();
      var args = parts.slice(1);

      switch (cmd) {
        case 'help':
          printHelp();
          break;
        case 'ls':
          printLs();
          break;
        case 'cat':
          printCat(args);
          break;
        case 'decrypt':
          await handleDecrypt(args);
          break;
        case 'clear':
          logEl.innerHTML = '';
          break;
        case 'exit':
        case 'quit':
          printLine('closing shell...', 'breach-dim');
          setTimeout(closeOverlay, 220);
          break;
        default:
          printLine('command not found: ' + cmd + " — type 'help'", 'breach-warn');
      }
    }

    function onInputKeydown(e) {
      try {
        if (busy) { e.preventDefault(); return; }
        if (e.key === 'Enter') {
          e.preventDefault();
          var val = inputEl.value;
          inputEl.value = '';
          runCommand(val);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (history.length) {
            historyIndex = Math.max(0, historyIndex - 1);
            inputEl.value = history[historyIndex] || '';
            deferCursorEnd();
          }
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (history.length) {
            historyIndex = Math.min(history.length, historyIndex + 1);
            inputEl.value = history[historyIndex] || '';
            deferCursorEnd();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeOverlay();
        }
      } catch (err) {}
    }

    function deferCursorEnd() {
      setTimeout(function () {
        try {
          var len = inputEl.value.length;
          inputEl.setSelectionRange(len, len);
        } catch (e) {}
      }, 0);
    }

    function focusInput() {
      try { inputEl.focus(); } catch (e) {}
    }

    /* ---------------------------------------------------------------- */
    /* Overlay open/close                                                */
    /* ---------------------------------------------------------------- */
    var isOpen = false;
    var prevOverflow = '';

    function openOverlay() {
      if (isOpen) return;
      try {
        buildDom();
        isOpen = true;
        logEl.innerHTML = '';
        history = [];
        historyIndex = -1;
        wrongAttempts = 0;
        unlocked = false;
        overlay.classList.add('breach-open');
        prevOverflow = document.documentElement.style.overflow;
        document.documentElement.style.overflow = 'hidden';
        focusInput();
        runBoot();
      } catch (e) {}
    }

    function closeOverlay() {
      if (!isOpen) return;
      try {
        isOpen = false;
        busy = false;
        overlay.classList.remove('breach-open');
        document.documentElement.style.overflow = prevOverflow;
        try { inputEl.blur(); } catch (e) {}
      } catch (e) {}
    }

    /* ---------------------------------------------------------------- */
    /* Global triggers                                                   */
    /* ---------------------------------------------------------------- */
    var TRIGGER_WORD = 'decrypt';
    var typedBuffer = '';

    var KONAMI = [
      'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
      'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
      'b', 'a'
    ];
    var konamiIndex = 0;

    function isTypingTarget(el) {
      if (!el) return false;
      var tag = (el.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
      if (el.isContentEditable) return true;
      return false;
    }

    function onGlobalKeydown(e) {
      try {
        if (isOpen) return; // input handler takes over while overlay is open
        var active = document.activeElement;
        if (isTypingTarget(active)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;

        // Konami tracking (arrow keys + b/a)
        var key = e.key;
        var expected = KONAMI[konamiIndex];
        var matches = false;
        if (expected === 'b' || expected === 'a') {
          matches = key && key.toLowerCase() === expected;
        } else {
          matches = key === expected;
        }
        if (matches) {
          konamiIndex++;
          if (konamiIndex >= KONAMI.length) {
            konamiIndex = 0;
            openOverlay();
            return;
          }
        } else {
          konamiIndex = (key === KONAMI[0]) ? 1 : 0;
        }

        // "decrypt" word tracking
        if (key && key.length === 1 && /[a-z]/i.test(key)) {
          typedBuffer = (typedBuffer + key.toLowerCase()).slice(-TRIGGER_WORD.length);
          if (typedBuffer === TRIGGER_WORD) {
            typedBuffer = '';
            openOverlay();
          }
        } else if (key !== 'Shift') {
          // non-letter, non-shift keys break the streak (Shift ignored so
          // capital letters via shift don't reset the buffer)
          typedBuffer = '';
        }
      } catch (err) {}
    }

    window.addEventListener('keydown', onGlobalKeydown, true);
  } catch (outerErr) {
    /* Never let the easter egg break the host page. */
    try { console.debug('breach.js init skipped:', outerErr); } catch (e) {}
  }
})();
