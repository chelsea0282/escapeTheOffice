/* ============================================================================
   UI — the only file that touches the DOM
   ----------------------------------------------------------------------------
   Rules this file obeys:
     * It never sets an inline style. It adds and removes class names, and
       writes text. Everything visual is decided by theme.css.
     * The one exception is gauge fill width, which is a continuous value and
       cannot be expressed as a class; its easing and colour still come from CSS.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.ui = (function () {

  var $ = function (id) { return document.getElementById(id); };

  var el = {};   // populated on init()

  var ui = {};

  /* -- typing speeds (ms per character) ---------------------------------- */
  ui.speeds = {
    narrate: 18,   // "reading speed", per the brief
    say:     16,
    system:  22,
    fast:     6,
    instant:  0
  };

  ui.skipRequested = false;

  /* ======================================================================
     INIT
     ==================================================================== */

  ui.init = function () {
    ['crt','title-card','title-art','title-prompt','login','login-brand',
     'login-body','boot','boot-field','game','id-photo','id-name','id-role',
     'id-stat-list','id-bio-text','info-button','caption-bar','caption-text',
     'progress','terminal',
     'terminal-scroll','choice-panel','choice-question','choice-options',
     'input-bar','input-prompt','input-ghost','input-typed',
     'input-caret','input-hint','modal-layer','modal-title','modal-body',
     'modal-close','modal-hint','file-layer','file-window','file-body','file-close'
    ].forEach(function (id) {
      el[id] = $(id);
    });


    el['title-art'].textContent   = ui.art.title;
    el['login-brand'].textContent = ui.art.replak;

    /* Click or any key skips the current typewriter line. */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        ui.skipRequested = true;
      }
    });
    el.terminal.addEventListener('click', function () { ui.skipRequested = true; });

    /* Personnel file drawer */
    el['info-button'].addEventListener('click', ui.openFile);
    el['file-close'].addEventListener('click', ui.closeFile);
    el['file-layer'].addEventListener('click', function (e) {
      if (e.target === el['file-layer']) ui.closeFile();
    });

    ESC.state.onChange(function (what) {
      if (what === 'locate'   || what === 'reset') ui.syncCaption();
      if (what === 'progress' || what === 'reset') ui.syncProgress();
    });
  };

  /* ======================================================================
     ASCII ART
     ==================================================================== */

  ui.art = {
    /* FIRE(ESC)APE — parens are real parens, 4 cells wide; letters are 8. */
    title: [
      '███████╗██╗██████╗ ███████╗ ██╗███████╗███████╗ ██████╗██╗   █████╗ ██████╗ ███████╗',
      '██╔════╝██║██╔══██╗██╔════╝██╔╝██╔════╝██╔════╝██╔════╝╚██╗ ██╔══██╗██╔══██╗██╔════╝',
      '█████╗  ██║██████╔╝█████╗  ██║ █████╗  ███████╗██║      ██║ ███████║██████╔╝█████╗  ',
      '██╔══╝  ██║██╔══██╗██╔══╝  ██║ ██╔══╝  ╚════██║██║      ██║ ██╔══██║██╔═══╝ ██╔══╝  ',
      '██║     ██║██║  ██║███████╗╚██╗███████╗███████║╚██████╗██╔╝ ██║  ██║██║     ███████╗',
      '╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝ ╚═╝╚══════╝╚══════╝ ╚═════╝╚═╝  ╚═╝  ╚═╝╚═╝     ╚══════╝'
    ].join('\n'),

    replak: [
      '██████╗ ███████╗██████╗ ██╗      █████╗ ██╗  ██╗    █████╗ ██╗',
      '██╔══██╗██╔════╝██╔══██╗██║     ██╔══██╗██║ ██╔╝   ██╔══██╗██║',
      '██████╔╝█████╗  ██████╔╝██║     ███████║█████╔╝    ███████║██║',
      '██╔══██╗██╔══╝  ██╔═══╝ ██║     ██╔══██║██╔═██╗    ██╔══██║██║',
      '██║  ██║███████╗██║     ███████╗██║  ██║██║  ██╗██╗██║  ██║██║',
      '╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝╚═╝'
    ].join('\n'),

  };

  /* ======================================================================
     SCREENS
     ==================================================================== */

  ui.show = function (which) {
    ['title-card','login','boot','game'].forEach(function (id) {
      el[id].classList.toggle('hidden', id !== which);
    });
  };

  /* ======================================================================
     TERMINAL OUTPUT
     ==================================================================== */

  function scrollDown() {
    el.terminal.scrollTop = el.terminal.scrollHeight;
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }
  ui.sleep = sleep;

  /* Wait, but let a keypress cut it short. */
  ui.pause = function (ms) {
    ui.skipRequested = false;
    return new Promise(function (resolve) {
      var start = Date.now();
      (function tick() {
        if (ui.skipRequested || Date.now() - start >= ms) {
          ui.skipRequested = false;
          return resolve();
        }
        setTimeout(tick, 16);
      })();
    });
  };

  /*
     typeLine — letter by letter, at reading speed.

     Per the brief: NARRATOR content is typed into the terminal with NO name
     label, because the terminal itself is clearly the narrator. Every other
     character prints "Jerry: " first.
  */
  ui.typeLine = function (text, opts) {
    opts = opts || {};
    var kind    = opts.kind || 'narrate';
    var speaker = opts.speaker || '';
    var speed   = (opts.speed !== undefined) ? opts.speed : ui.speeds[kind];
    if (speed === undefined) speed = ui.speeds.narrate;

    text = ESC.state.interpolate(text);

    var p = document.createElement('p');
    p.className = 'line-' + kind;

    /* Speaker label — never for the narrator. Interpolated too, so a line
       attributed to "[player]" carries the name the player typed. */
    if (speaker && speaker.toUpperCase() !== 'NARRATOR') {
      var tag = document.createElement('span');
      tag.className = 'speaker';
      tag.textContent = ESC.state.interpolate(speaker) + ': ';
      p.appendChild(tag);
    }

    var body = document.createElement('span');
    p.appendChild(body);

    var caret = document.createElement('span');
    caret.className = 'cursor';
    caret.textContent = '█';
    p.appendChild(caret);

    el['terminal-scroll'].appendChild(p);
    scrollDown();

    if (speed === 0) {
      body.textContent = text;
      p.removeChild(caret);
      scrollDown();
      return Promise.resolve(p);
    }

    ui.skipRequested = false;

    return new Promise(function (resolve) {
      var i = 0;
      (function step() {
        if (ui.skipRequested) {
          body.textContent = text;
          p.removeChild(caret);
          ui.skipRequested = false;
          scrollDown();
          return resolve(p);
        }
        if (i >= text.length) {
          p.removeChild(caret);
          scrollDown();
          return resolve(p);
        }
        var ch = text.charAt(i++);
        body.textContent += ch;
        scrollDown();
        /* A beat longer on sentence ends — this is what makes it read as
           someone typing rather than a machine flushing a buffer. */
        var delay = speed;
        if (ch === '.' || ch === '?' || ch === '!') delay = speed * 9;
        else if (ch === ',' || ch === ';' || ch === ':') delay = speed * 4;
        else if (ch === '\n') delay = speed * 6;
        setTimeout(step, delay);
      })();
    });
  };

  /* Non-typed lines: stage directions, markers, art, reports. */
  ui.printLine = function (text, kind) {
    var p = document.createElement('p');
    p.className = 'line-' + (kind || 'visual');
    p.textContent = ESC.state.interpolate(text);
    el['terminal-scroll'].appendChild(p);
    scrollDown();
    return p;
  };

  ui.printHTML = function (html, kind) {
    var p = document.createElement('p');
    p.className = 'line-' + (kind || 'report');
    p.innerHTML = html;
    el['terminal-scroll'].appendChild(p);
    scrollDown();
    return p;
  };

  ui.printArt = function (art) {
    var pre = document.createElement('pre');
    pre.className = 'line-art';
    pre.textContent = art;
    el['terminal-scroll'].appendChild(pre);
    scrollDown();
    return pre;
  };

  ui.marker = function (text) {
    return ui.printLine(text, 'marker');
  };

  /* A silent scene break. Replaces the "SCENARIO n BEGINS" production labels:
     the player feels the transition instead of reading its name. */
  ui.rule = function () {
    var hr = document.createElement('div');
    hr.className = 'line-rule';
    el['terminal-scroll'].appendChild(hr);
    scrollDown();
    return hr;
  };

  ui.clearTerminal = function () {
    el['terminal-scroll'].innerHTML = '';
  };

  /* "Fresh terminal screen." — the script's own scene transition. */
  ui.freshScreen = function () {
    return sleep(260).then(function () {
      ui.clearTerminal();
      el.terminal.scrollTop = 0;
      return sleep(240);
    });
  };

  /*
     "The email is formatted on the screen like a standard desktop email,
      contained inside a box in the terminal."
  */
  ui.printEmail = function (mail) {
    var box = document.createElement('div');
    box.className = 'mail';

    [['From', mail.from], ['Subject', mail.subject]].forEach(function (row) {
      var h = document.createElement('div');
      h.className = 'mail-head';
      var k = document.createElement('span');
      k.className = 'mail-key';
      k.textContent = row[0] + ': ';
      h.appendChild(k);
      h.appendChild(document.createTextNode(ESC.state.interpolate(row[1])));
      box.appendChild(h);
    });

    var body = document.createElement('div');
    body.className = 'mail-body';
    body.textContent = ESC.state.interpolate(mail.body);
    box.appendChild(body);

    el['terminal-scroll'].appendChild(box);
    scrollDown();
    return sleep(300);
  };

  /* "The CEO message shows up formatted as a chat message on the screen." */
  ui.printChat = function (msg) {
    var box = document.createElement('div');
    box.className = 'chat';

    var head = document.createElement('div');
    head.className = 'chat-head';
    head.textContent = ESC.state.interpolate(msg.from);
    box.appendChild(head);

    var body = document.createElement('div');
    body.className = 'chat-body';
    box.appendChild(body);

    el['terminal-scroll'].appendChild(box);
    scrollDown();

    /* Typed, like someone on the other end is writing it. */
    var text = ESC.state.interpolate(msg.text);
    var speed = (msg.speed !== undefined) ? msg.speed : ui.speeds.say;
    if (speed === 0) { body.textContent = text; scrollDown(); return Promise.resolve(); }

    ui.skipRequested = false;
    return new Promise(function (resolve) {
      var i = 0;
      (function step() {
        if (ui.skipRequested) { body.textContent = text; ui.skipRequested = false; scrollDown(); return resolve(); }
        if (i >= text.length) { scrollDown(); return resolve(); }
        body.textContent += text.charAt(i++);
        scrollDown();
        setTimeout(step, speed);
      })();
    });
  };

  /* 'The game shows "Click to continue" in italics at the bottom.' */
  ui.clickToContinue = function (label) {
    var p = document.createElement('p');
    p.className = 'continue';
    p.textContent = label || 'Click to continue';
    el['terminal-scroll'].appendChild(p);
    scrollDown();

    return new Promise(function (resolve) {
      function done(e) {
        if (e.type === 'keydown' && (e.metaKey || e.ctrlKey || e.altKey)) return;
        if (!el['modal-layer'].classList.contains('hidden')) return;
        if (!el['file-layer'].classList.contains('hidden')) return;
        document.removeEventListener('keydown', done);
        document.removeEventListener('click', done);
        if (p.parentNode) p.parentNode.removeChild(p);
        resolve();
      }
      document.addEventListener('keydown', done);
      document.addEventListener('click', done);
    });
  };

  /* "The game shows a button to click to restart the game." */
  ui.showRestart = function (label) {
    var wrap = document.createElement('div');
    wrap.className = 'restart-wrap';
    var b = document.createElement('button');
    b.className = 'restart-btn';
    b.type = 'button';
    b.textContent = label || '[ PLAY AGAIN ]';
    wrap.appendChild(b);
    el['terminal-scroll'].appendChild(wrap);
    scrollDown();

    return new Promise(function (resolve) {
      b.addEventListener('click', function () { resolve(); });
    });
  };

  /* ======================================================================
     CAPTION BAR + PROGRESS
     FIRE(ESC)APE has no resource gauges. The clock is a narrative caption the
     script sets, and progress is how far through the scenes you are.
     ==================================================================== */

  ui.showChrome = function () {
    el['caption-bar'].classList.add('visible');
    el.progress.classList.add('visible');
  };

  ui.syncCaption = function () {
    if (!el['caption-text']) return;
    el['caption-text'].textContent = ESC.state.caption();
    el['caption-bar'].classList.remove('bumping');
    void el['caption-bar'].offsetWidth;
    el['caption-bar'].classList.add('bumping');
  };

  ui.syncProgress = function () {
    if (!el.progress) return;
    var fill = el.progress.querySelector('.progress-fill');
    var val  = el.progress.querySelector('.progress-value');
    fill.style.width = ESC.state.progressFraction() * 100 + '%';
    val.textContent = 'SCENE ' + Math.min(ESC.state.sceneIndex + 1, ESC.state.sceneTotal) +
                      ' / ' + ESC.state.sceneTotal;
  };

  ui.syncChrome = function () { ui.syncCaption(); ui.syncProgress(); };

  /* ======================================================================
     ID PANEL
     ==================================================================== */

  ui.renderIdPanel = function () {
    var w = ESC.world.player;
    el['id-name'].textContent = ESC.state.ledger.name || '————';
    el['id-role'].textContent = w.role;
    el['id-bio-text'].textContent = w.bio;

    var lines = w.stats.map(function (pair) {
      var key = pair[0];
      var dots = new Array(Math.max(2, 13 - key.length)).join('.');
      return key + ' ' + dots + ' ' + pair[1];
    });
    /* Live rows, appended after the static ones. */
    lines.push('BREAK ....... ' +
      (ESC.state.ledger.breakTaken === true  ? 'Taken (logged)' :
       ESC.state.ledger.breakTaken === false ? 'Declined'       : '—'));
    lines.push('IMAGING ..... ' +
      (ESC.state.ledger.cameraConsent === 'denied' ? 'Refused' : 'On file'));

    el['id-stat-list'].textContent = lines.join('\n');
  };

  ui.setPortrait = function (art) {
    el['id-photo'].textContent = art;
  };

  /* ======================================================================
     PROCEDURAL ASCII PORTRAIT (simulated camera capture)
     Deterministic: the same name always produces the same face.
     ==================================================================== */

  ui.makePortrait = function (seedText) {
    var seed = 0;
    for (var i = 0; i < seedText.length; i++) {
      seed = (seed * 31 + seedText.charCodeAt(i)) >>> 0;
    }
    function pick(arr) {
      seed = (seed * 1103515245 + 12345) >>> 0;
      return arr[(seed >>> 16) % arr.length];
    }

    var hair  = pick(['▓▓▓▓▓▓▓▓▓▓▓▓', '████████████', '▒▓▓▓▓▓▓▓▓▓▓▒', '░▒▓▓▓▓▓▓▓▓▒░']);
    var brow  = pick(['▀▀    ▀▀', '▄▄    ▄▄', '══    ══', '▬▬    ▬▬']);
    var eyes  = pick(['◉    ◉', '●    ●', '◯    ◯', '▣    ▣']);
    var nose  = pick(['╵', '│', '¡', 'ⵌ']);
    var mouth = pick(['▔▔▔▔▔▔', '──────', '╰────╯', '▁▁▁▁▁▁', '══════']);
    var shade = pick(['░', '▒', '·']);

    return [
      '  ' + hair + '  ',
      ' ▓' + shade + '          ' + shade + '▓ ',
      '▓' + shade + '            ' + shade + '▓',
      '▓   ' + brow + '   ▓',
      '▓   ' + eyes + '    ▓',
      '▓' + shade + '      ' + nose + '      ' + shade + '▓',
      '▓' + shade + '   ' + mouth + '   ' + shade + '▓',
      ' ▓' + shade + '          ' + shade + '▓ ',
      '  ▀▀▀▀▀▀▀▀▀▀▀▀  ',
      ' ░▒▓ CAPTURED ▓▒░'
    ].join('\n');
  };

  /* ======================================================================
     REPLAK.AI MODAL — must be dismissed with 'x'
     ==================================================================== */

  ui.showSystemPopup = function (text, title) {
    el['modal-title'].textContent = title || 'REPLAK.AI SYSTEM';
    el['modal-body'].textContent = ESC.state.interpolate(text);
    el['modal-layer'].classList.remove('hidden');

    return new Promise(function (resolve) {
      function done() {
        document.removeEventListener('keydown', onKey, true);
        el['modal-close'].removeEventListener('click', done);
        el['modal-layer'].classList.add('hidden');
        resolve();
      }
      function onKey(e) {
        if (e.key === 'x' || e.key === 'X' || e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          done();
        }
      }
      /* Capture phase, so the modal swallows input from whatever prompt is
         underneath it. */
      document.addEventListener('keydown', onKey, true);
      el['modal-close'].addEventListener('click', done);
    });
  };

  /* ======================================================================
     PERSONNEL FILE DRAWER (the brief's "information button")
     ==================================================================== */

  ui.openFile = function () {
    var html = ESC.world.entries.map(function (e) {
      return '<h3>' + e.title + '</h3><p>' + e.text + '</p>';
    }).join('');
    el['file-body'].innerHTML = html;
    el['file-layer'].classList.remove('hidden');
  };

  ui.closeFile = function () {
    el['file-layer'].classList.add('hidden');
  };

  /* ======================================================================
     WARP — the surreal glitch when input gets absurd
     ==================================================================== */

  ui.warp = function (level) {
    if (!level) return Promise.resolve();
    var cls = 'warp-' + Math.min(3, level);
    el.crt.classList.remove('warp-1', 'warp-2', 'warp-3');
    void el.crt.offsetWidth;
    el.crt.classList.add(cls);
    var dur = level >= 3 ? 1400 : level === 2 ? 900 : 620;
    return sleep(dur).then(function () {
      el.crt.classList.remove(cls);
    });
  };

  ui.staticBurst = function () {
    el.crt.classList.remove('static-burst');
    void el.crt.offsetWidth;
    el.crt.classList.add('static-burst');
    return sleep(1100).then(function () {
      el.crt.classList.remove('static-burst');
    });
  };

  ui.setMood = function (mood) {
    el.crt.classList.remove('ending-fail', 'ending-good', 'epilogue');
    if (mood) el.crt.classList.add(mood);
  };

  /* ======================================================================
     LOGIN SCREEN HELPERS
     ==================================================================== */

  ui.loginClear = function () { el['login-body'].innerHTML = ''; };

  ui.loginPrint = function (text, cls) {
    var p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = ESC.state.interpolate(text);
    el['login-body'].appendChild(p);
    return p;
  };

  ui.loginType = function (text, cls, speed) {
    var p = ui.loginPrint('', cls);
    return new Promise(function (resolve) {
      var i = 0;
      var t = ESC.state.interpolate(text);
      (function step() {
        if (i >= t.length) return resolve(p);
        p.textContent += t.charAt(i++);
        setTimeout(step, speed || 20);
      })();
    });
  };

  ui.loginNode = function () { return el['login-body']; };

  /* ======================================================================
     BOOT FIELD — 0s and 1s slowly turning into English words
     ==================================================================== */

  ui.bootSequence = function (message, durationMs) {
    ui.show('boot');
    var field = el['boot-field'];

    var cols = Math.max(40, Math.floor(window.innerWidth / 11));
    var rows = Math.max(14, Math.floor(window.innerHeight / 22));
    var total = cols * rows;

    /* Lay the message across the middle row of the field. */
    var msg = message.toUpperCase();
    var midRow = Math.floor(rows / 2);
    var msgStart = midRow * cols + Math.max(0, Math.floor((cols - msg.length) / 2));

    var target = new Array(total);
    for (var i = 0; i < total; i++) target[i] = null;
    for (var j = 0; j < msg.length && msgStart + j < total; j++) {
      target[msgStart + j] = msg.charAt(j);
    }

    var buf = new Array(total);
    for (var k = 0; k < total; k++) buf[k] = Math.random() < 0.5 ? '0' : '1';

    var revealed = 0;
    var order = [];
    for (var m = 0; m < total; m++) if (target[m] !== null) order.push(m);

    return new Promise(function (resolve) {
      var start = Date.now();
      var iv = setInterval(function () {
        /* churn the noise */
        for (var n = 0; n < total / 6; n++) {
          var idx = (Math.random() * total) | 0;
          if (target[idx] === null) buf[idx] = Math.random() < 0.5 ? '0' : '1';
        }
        /* resolve the message a character at a time */
        var elapsed = Date.now() - start;
        var want = Math.floor((elapsed / durationMs) * order.length);
        while (revealed < want && revealed < order.length) {
          buf[order[revealed]] = target[order[revealed]];
          revealed++;
        }

        var out = '';
        for (var r = 0; r < rows; r++) {
          out += buf.slice(r * cols, (r + 1) * cols).join('') + '\n';
        }
        field.textContent = out;

        if (elapsed >= durationMs) {
          clearInterval(iv);
          resolve();
        }
      }, 60);
    });
  };

  /* ======================================================================
     INPUT BAR — shared surface for all three player-input modes
     ==================================================================== */

  ui.inputEls = function () {
    return {
      bar:    el['input-bar'],
      prompt: el['input-prompt'],
      ghost:  el['input-ghost'],
      typed:  el['input-typed'],
      caret:  el['input-caret'],
      hint:   el['input-hint']
    };
  };

  /* ======================================================================
     CHOICE PANEL
     "Question appears at the bottom of the screen (separated from the
      narration)." The options render here, below the terminal, and are wiped
     on selection — the terminal only records what ends up happening.
     ==================================================================== */

  ui.showChoices = function (question, options) {
    el['choice-question'].textContent = question ? ESC.state.interpolate(question) : '';
    var host = el['choice-options'];
    host.innerHTML = '';
    options.forEach(function (o) {
      var li = document.createElement('li');
      var k = document.createElement('span');
      k.className = 'choice-key';
      k.textContent = o.key + '. ';
      li.appendChild(k);
      li.appendChild(document.createTextNode(ESC.state.interpolate(o.label)));
      host.appendChild(li);
    });
    el['choice-panel'].classList.remove('hidden');
  };

  /* Highlight whichever option the current typing matches. */
  ui.armChoice = function (index) {
    var kids = el['choice-options'].children;
    for (var i = 0; i < kids.length; i++) {
      kids[i].classList.toggle('armed', i === index);
    }
  };

  ui.hideChoices = function () {
    el['choice-panel'].classList.add('hidden');
    el['choice-question'].textContent = '';
    el['choice-options'].innerHTML = '';
  };

  ui.showInput = function (promptChar, glow) {
    el['input-prompt'].textContent = promptChar || '>';
    el['input-bar'].classList.remove('hidden');
    el['input-bar'].classList.toggle('glow', !!glow);
    el['input-ghost'].textContent = '';
    el['input-typed'].innerHTML = '';
    scrollDown();
  };

  ui.hideInput = function () {
    el['input-bar'].classList.add('hidden');
    el['input-bar'].classList.remove('glow');
    el['input-ghost'].textContent = '';
    el['input-typed'].innerHTML = '';
    el['input-hint'].textContent = '';
  };

  ui.setHint = function (text) {
    el['input-hint'].textContent = text || '';
  };

  /*
     Typed text lives in its own child span so that transient .badchar spans
     can sit beside it without being wiped on the next keystroke. Writing
     input-typed.textContent directly would blow the badchars away instantly.
  */
  function okSpan() {
    var s = el['input-typed'].querySelector('.ok');
    if (!s) {
      s = document.createElement('span');
      s.className = 'ok';
      el['input-typed'].insertBefore(s, el['input-typed'].firstChild);
    }
    return s;
  }

  ui.setTyped = function (text) { okSpan().textContent = text; };
  ui.getTyped = function () { return okSpan().textContent; };

  ui.setGhost = function (text) { el['input-ghost'].textContent = text || ''; };

  /* Flash a rejected character in red, then let it fall away. */
  ui.flashBadChar = function (ch) {
    var span = document.createElement('span');
    span.className = 'badchar';
    span.textContent = ch;
    el['input-typed'].appendChild(span);
    setTimeout(function () {
      if (span.parentNode) span.parentNode.removeChild(span);
    }, 260);
  };

  ui.crt = function () { return el.crt; };

  return ui;
})();
