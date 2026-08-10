/* ============================================================================
   ENGINE — the reusable game mechanics
   ----------------------------------------------------------------------------
   The brief asks for core mechanic functions that can be reused across scenes:
   selecting between multiple choice options, "calling the model", rejecting a
   blatantly nonsensical response, and inserting decisions from prior turns.
   Those are, in order:

       choose()          multiple choice
       openInput()       the free-text loop (calls ESC.responder)
       rejectNonsense()  handled inside openInput, via responder.isNonsense
       state.interpolate() lives in state.js and runs on every printed line

   Plus the two typing modes: typeExact() and readLine().

   runScene() walks a beat array from content/script.js, so the script file
   stays declarative and readable.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.engine = (function () {

  var ui = null;   // resolved lazily; ui.js may load after this file is parsed

  function U() { return ESC.ui; }

  /* ======================================================================
     LOW-LEVEL KEYBOARD CAPTURE
     One handler shape shared by every input mode, so focus behaviour and
     modal suppression stay consistent.
     ==================================================================== */

  function captureKeys(onKey) {
    function handler(e) {
      /* Let the Replak.AI modal and the personnel file take precedence. */
      if (!document.getElementById('modal-layer').classList.contains('hidden')) return;
      if (!document.getElementById('file-layer').classList.contains('hidden')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      onKey(e);
    }
    document.addEventListener('keydown', handler);
    return function release() {
      document.removeEventListener('keydown', handler);
    };
  }

  /* ======================================================================
     1. typeExact(target)
     ----------------------------------------------------------------------
     The tutorial mode. Grey ghost text with a flashing caret; the player must
     type it verbatim. A wrong letter flashes red and disappears — only the
     written text can be entered. Mistakes cost a little HP.
     ==================================================================== */

  function typeExact(target, opts) {
    opts = opts || {};
    var u = U();
    u.showInput('>', true);
    u.setGhost(target);
    u.setHint('type the message exactly, then press ENTER');

    var typed = '';

    return new Promise(function (resolve) {
      var release = captureKeys(function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (typed === target) {
            release();
            u.hideInput();
            resolve(typed);
          } else {
            u.setHint('the message is not finished');
          }
          return;
        }

        if (e.key === 'Backspace') {
          e.preventDefault();
          typed = typed.slice(0, -1);
          u.setTyped(typed);
          u.setGhost(target.slice(typed.length));
          return;
        }

        if (e.key.length !== 1) return;
        e.preventDefault();

        var expected = target.charAt(typed.length);
        if (typed.length >= target.length) return;

        if (e.key === expected) {
          typed += e.key;
          u.setTyped(typed);
          u.setGhost(target.slice(typed.length));
          if (typed === target) u.setHint('press ENTER');
        } else {
          /* Wrong letter: turns red and disappears. */
          u.flashBadChar(e.key);
          u.setHint('that is not what the message says');
        }
      });
    });
  }

  /* ======================================================================
     2. readLine() — plain free typing, used for the name prompt
     ==================================================================== */

  function readLine(opts) {
    opts = opts || {};
    var target = opts.target || null;      // optional DOM node to echo into
    var maxLen = opts.maxLen || 200;
    var typed = '';

    function paint() {
      if (target) {
        target.textContent = typed + '_';
      } else {
        U().setTyped(typed);
      }
    }

    if (!target) {
      U().showInput(opts.prompt || '>', !!opts.glow);
      U().setHint(opts.hint || '');
    }
    paint();

    return new Promise(function (resolve) {
      var release = captureKeys(function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (!typed.trim() && !opts.allowEmpty) return;
          release();
          if (target) target.textContent = typed;
          else U().hideInput();
          resolve(typed.trim());
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          typed = typed.slice(0, -1);
          paint();
          return;
        }
        if (e.key.length !== 1) return;
        e.preventDefault();
        if (typed.length >= maxLen) return;
        typed += e.key;
        paint();
      });
    });
  }

  /* ======================================================================
     3. choose(options)
     ----------------------------------------------------------------------
     Multiple choice. The player types the option letter, its number, or
     enough of the option text to be unambiguous — the brief describes both
     "type out one of multiple options" and A/B selection.
     ==================================================================== */

  function choose(options, opts) {
    opts = opts || {};
    var u = U();

    /* Options render in the panel BELOW the terminal, not in the narration. */
    u.showChoices(opts.question, options);

    u.showInput('>', true);
    u.setHint('type ' +
      options.map(function (o) { return o.key; }).join(' / ') +
      ', or type the option out in full, then ENTER');

    var typed = '';

    function match(input) {
      var t = input.toLowerCase().trim();
      if (!t) return null;
      for (var i = 0; i < options.length; i++) {
        if (t === options[i].key.toLowerCase() ||
            t === String(i + 1) ||
            t === 'option ' + options[i].key.toLowerCase()) return options[i];
      }
      for (var j = 0; j < options.length; j++) {
        var label = ESC.state.interpolate(options[j].label).toLowerCase();
        if (t.length >= 6 && (label.indexOf(t) === 0 || t.indexOf(label.slice(0, 20)) === 0)) {
          return options[j];
        }
      }
      return null;
    }

    return new Promise(function (resolve) {
      var release = captureKeys(function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          var picked = match(typed);
          if (!picked) {
            u.setHint('pick one of the options below');
            return;
          }
          release();
          u.hideChoices();
          u.hideInput();

          /*
             Record what ends up happening. The option list itself never
             reaches the terminal; the chosen line does, unless the scene
             already narrates it (echo: false).
          */
          if (picked.echo !== false) {
            u.printLine('> ' + ESC.state.interpolate(picked.echo || picked.label), 'player');
          }
          resolve(picked);
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          typed = typed.slice(0, -1);
          u.setTyped(typed);
          u.armChoice(options.indexOf(match(typed)));
          return;
        }
        if (e.key.length !== 1) return;
        e.preventDefault();
        typed += e.key;
        u.setTyped(typed);
        u.armChoice(options.indexOf(match(typed)));
      });
    });
  }

  /* ======================================================================
     4. openInput({ scene, fallback })
     ----------------------------------------------------------------------
     The free-text moment. This is where the brief would call an LLM; here it
     calls ESC.responder, which returns the same shape of verdict.

     Two rules from the doc's Gameplay notes are enforced here:
       * "within 1 turn, put them back on the script" — every verdict that is
         not nonsense resolves immediately and the scene continues.
       * "if an action can't be justified, give players only options of A or B
         that would get them back on track" — nonsense falls back to the
         scene's multiple-choice options.
     ==================================================================== */

  function openInput(cfg) {
    var u = U();

    return readLine({
      prompt: '>',
      glow: true,
      hint: cfg.hint || 'type your response and press ENTER'
    }).then(function (input) {
      u.printLine(input, 'player');

      var verdict = ESC.responder.evaluate(input, { scene: cfg.scene });

      return speak(verdict.lines).then(function () {
        /* Unparseable: hand them the approved options instead. */
        if (verdict.fallback && cfg.fallback && cfg.fallback.length) {
          return choose(cfg.fallback, { question: cfg.fallbackQuestion }).then(function (picked) {
            return applyChoice(picked);
          });
        }
        return null;
      });
    });
  }

  /* Print a list of { speaker, text, kind } lines in order. */
  function speak(lines) {
    var chain = Promise.resolve();
    (lines || []).forEach(function (l) {
      chain = chain.then(function () {
        return U().typeLine(l.text, { kind: l.kind || 'say', speaker: l.speaker });
      });
    });
    return chain;
  }

  /* Shared by choose beats and open-input fallbacks. */
  function applyChoice(picked) {
    if (picked.record) {
      Object.keys(picked.record).forEach(function (k) {
        ESC.state.record(k, picked.record[k]);
      });
    }
    if (picked.locate) ESC.state.locate(picked.locate[0], picked.locate[1]);
    if (picked.fx) ESC.fx.play(picked.fx);
    var chain = picked.then ? runScene(picked.then) : Promise.resolve();
    return chain.then(function () {
      /* Choosing the model-employee answer ends the run. */
      if (picked.suddenDeath) {
        ESC.state.suddenDeath(picked.suddenDeath);
      }
      return null;
    });
  }

  /* ======================================================================
     5. runScene(beats)
     ----------------------------------------------------------------------
     Walks a declarative beat array. Adding a beat type here is how you add
     a new kind of moment to content/script.js.
     ==================================================================== */

  var handlers = {

    narrate: function (b) {
      return U().typeLine(b.text, { kind: 'narrate', speed: b.speed });
    },

    say: function (b) {
      return U().typeLine(b.text, {
        kind: 'say', speaker: b.speaker, speed: b.speed
      });
    },

    system: function (b) {
      return U().typeLine(b.text, {
        kind: 'system', speaker: b.speaker || 'REPLAK.AI SYSTEM', speed: b.speed
      });
    },

    /*
       Set design. The brief's rule: un-indented text is "a visual change that
       needs to be coded out" — the player should SEE and HEAR it, never read
       it. So stage directions name an effect in js/fx.js instead of printing.
    */
    fx: function (b) {
      var p = ESC.fx.play(b.name, b.arg);
      /* await:false lets an effect run underneath the narration that
         describes it — the boxes appear WHILE you count them. */
      if (b.await === false) return b.wait ? U().sleep(b.wait) : null;
      return p.then(function () {
        return b.wait ? U().sleep(b.wait) : null;
      });
    },

    /*
       Deliberately prints nothing. Kept only as an authoring guardrail: if a
       stage direction is ever left as a `visual` beat, it warns in the console
       rather than leaking prose into the terminal.
    */
    visual: function (b) {
      console.warn('[engine] stage direction not converted to an fx beat:', b.text);
      return null;
    },

    marker: function (b) {
      U().marker(b.text);
      return U().sleep(300);
    },

    art: function (b) {
      U().printArt(b.art);
      return U().sleep(b.wait === undefined ? 500 : b.wait);
    },

    /* A Replak.AI popup that must be dismissed with 'x'. */
    popup: function (b) {
      return U().showSystemPopup(b.text, b.title);
    },

    wait: function (b) {
      return U().pause(b.ms || 600);
    },

    /* "The time/location text title updates to ..." */
    locate: function (b) {
      ESC.state.locate(b.time, b.location);
      return U().sleep(b.wait === undefined ? 420 : b.wait);
    },

    /* "Fresh terminal screen." */
    freshScreen: function () {
      return U().freshScreen();
    },

    /* 'The game shows "Click to continue" in italics.' */
    continue: function (b) {
      return U().clickToContinue(b.label);
    },

    /* The escalation email, boxed like a desktop client. */
    email: function (b) {
      return U().printEmail(b);
    },

    /* The CEO's message, formatted as a chat message. */
    chat: function (b) {
      return U().printChat(b);
    },

    /* "The game shows a button to click to restart the game." */
    restart: function (b) {
      return U().showRestart(b.label).then(function () {
        ESC.state.reset(true);
        if (ESC.main) return ESC.main.restart();
      });
    },

    /* Show the caption bar and progress bar. */
    chrome: function () {
      U().showChrome();
      U().syncChrome();
      return U().sleep(400);
    },

    typeExact: function (b) {
      return typeExact(ESC.state.interpolate(b.text), { hpPerTypo: b.hpPerTypo || 0 })
        .then(function (typed) {
          U().printLine(typed, 'player');
        });
    },

    choose: function (b) {
      return choose(b.options, { question: b.question }).then(function (picked) {
        return applyChoice(picked);
      });
    },

    openInput: function (b) {
      return openInput({ scene: b.scene, hint: b.hint, fallback: b.fallback,
                         fallbackQuestion: b.fallbackQuestion });
    },

    /* Arbitrary escape hatch for one-off moments (login, epilogue report). */
    call: function (b) {
      return Promise.resolve(b.fn());
    },

    /* Conditional branch on the ledger. */
    branch: function (b) {
      var beats = b.pick(ESC.state.ledger, ESC.state);
      return beats ? runScene(beats) : null;
    }
  };

  function runScene(beats) {
    var chain = Promise.resolve();
    beats.forEach(function (b) {
      chain = chain.then(function () {
        if (ESC.state.over && !b.always) return null;   // sudden death stops the scene
        var h = handlers[b.type];
        if (!h) {
          console.warn('[engine] unknown beat type:', b.type, b);
          return null;
        }
        return h(b);
      });
    });
    return chain;
  }

  return {
    runScene:      runScene,
    handlers:      handlers,
    typeExact:     typeExact,
    readLine:      readLine,
    choose:        choose,
    openInput:     openInput,
    speak:         speak,
    applyChoice:   applyChoice,
    captureKeys:   captureKeys
  };
})();
