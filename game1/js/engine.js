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
          ESC.state.bump('typos');
          if (opts.hpPerTypo) ESC.state.damage(opts.hpPerTypo);
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

    var list = document.createElement('ul');
    list.className = 'choice-list';
    options.forEach(function (o, i) {
      var li = document.createElement('li');
      var key = document.createElement('span');
      key.className = 'choice-key';
      key.textContent = 'Option ' + o.key + ' - ';
      li.appendChild(key);
      li.appendChild(document.createTextNode(ESC.state.interpolate(o.label)));
      list.appendChild(li);
    });
    document.getElementById('terminal-scroll').appendChild(list);
    document.getElementById('terminal').scrollTop =
      document.getElementById('terminal').scrollHeight;

    u.showInput('>', true);
    u.setHint('type ' +
      options.map(function (o) { return o.key; }).join(' or ') +
      ', or type the option out in full, then ENTER');

    var typed = '';

    function match(input) {
      var t = input.toLowerCase().trim();
      if (!t) return null;
      /* exact key */
      for (var i = 0; i < options.length; i++) {
        if (t === options[i].key.toLowerCase() ||
            t === String(i + 1) ||
            t === 'option ' + options[i].key.toLowerCase()) return options[i];
      }
      /* typed the option text */
      for (var j = 0; j < options.length; j++) {
        var label = options[j].label.toLowerCase();
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
            u.setHint('pick one of the options as written');
            return;
          }
          release();
          u.hideInput();
          /* Mark the selection in the printed list. */
          Array.prototype.forEach.call(list.children, function (li, i) {
            if (options[i] === picked) li.classList.add('selected');
          });
          resolve(picked);
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          typed = typed.slice(0, -1);
          u.setTyped(typed);
          return;
        }
        if (e.key.length !== 1) return;
        e.preventDefault();
        typed += e.key;
        u.setTyped(typed);
      });
    });
  }

  /* ======================================================================
     4. openInput({ scene, maxTurns })
     ----------------------------------------------------------------------
     The free-text negotiation loop. This is where the brief would call an
     LLM; here it calls ESC.responder, which returns the same shape of
     verdict: a reply, a time cost, and whether the scene is resolved.

     Loop rules from the brief:
       * minimum 1 conversational turn, maximum 5
       * exploration and nonsense cost a minute but do NOT burn a turn
       * running out of turns drops to the scene's documented fail state
     ==================================================================== */

  function openInput(cfg) {
    var u = U();
    var scene    = cfg.scene;
    var maxTurns = cfg.maxTurns || ESC.responder.RUBRICS[scene].maxTurns;
    var turn = 0;

    return (function loop() {
      if (ESC.state.over) return Promise.resolve('over');

      u.showInput('>', true);
      u.setHint(cfg.hint || 'type your response and press ENTER');

      return readLine({ prompt: '>', glow: true, hint: cfg.hint || 'type your response and press ENTER' })
        .then(function (input) {
          /* Echo the player's own words into the transcript. */
          u.printLine(input, 'player');

          var verdict = ESC.responder.evaluate(input, { scene: scene, turn: turn });

          return applyVerdict(verdict).then(function () {
            if (ESC.state.over) return 'over';

            if (verdict.consumesTurn) turn++;
            ESC.state.record(
              scene === 's1' ? 'jerryTurns' : scene === 's2' ? 'rachelTurns' : 'porcupineTurns',
              turn
            );

            if (verdict.resolved) return 'resolved';

            if (turn >= maxTurns) {
              var f = ESC.responder.failout(scene);
              return applyVerdict(f).then(function () { return 'failout'; });
            }
            return loop();
          });
        });
    })();
  }

  /* Print a verdict and apply its costs. Shared by openInput and failout. */
  function applyVerdict(v) {
    var u = U();
    var chain = Promise.resolve();

    if (v.warp) {
      chain = chain.then(function () {
        return u.warp(v.warp).then(function () {
          if (v.warp >= 2) {
            ESC.state.record('warpLevel',
              Math.max(ESC.state.ledger.warpLevel, v.warp));
            return u.typeLine(
              ESC.responses.pick('shared', 'warp', ESC.state.ledger.nonsenseCount + v.warp),
              { kind: 'visual', speed: ESC.ui.speeds.fast }
            );
          }
        });
      });
    }

    if (v.reply) {
      chain = chain.then(function () {
        return u.typeLine(v.reply, {
          kind: v.kind === 'system' ? 'system' : 'say',
          speaker: v.speaker
        });
      });
    }

    (v.narration || []).forEach(function (n) {
      if (!n) return;
      chain = chain.then(function () {
        return u.typeLine(n, { kind: 'narrate' });
      });
    });

    if (v.minutes) {
      chain = chain.then(function () {
        var spent = ESC.state.spend(v.minutes);
        u.noteTime(spent);
        return u.sleep(220);
      });
    }
    if (v.hp) {
      chain = chain.then(function () {
        if (v.hp > 0) ESC.state.damage(v.hp); else ESC.state.restore(-v.hp);
      });
    }

    return chain;
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

    gauges: function () {
      U().showGauges();
      U().syncGauges();
      return U().sleep(500);
    },

    /* Spend or restore resources from the script. */
    cost: function (b) {
      if (b.minutes) {
        var spent = ESC.state.spend(b.minutes);
        U().noteTime(spent);
      }
      if (b.hp) ESC.state.damage(b.hp);
      if (b.heal) ESC.state.restore(b.heal);
      return U().sleep(320);
    },

    /* Push the clock to a fixed anchor without ever moving it backward. */
    clockTo: function (b) {
      var before = ESC.state.clock;
      ESC.state.advanceTo(b.hour, b.minute);
      if (ESC.state.clock > before) U().noteTime(ESC.state.clock - before);
      return U().sleep(320);
    },

    typeExact: function (b) {
      return typeExact(ESC.state.interpolate(b.text), { hpPerTypo: b.hpPerTypo || 0 })
        .then(function (typed) {
          U().printLine(typed, 'player');
        });
    },

    choose: function (b) {
      return choose(b.options).then(function (picked) {
        if (picked.record) {
          Object.keys(picked.record).forEach(function (k) {
            ESC.state.record(k, picked.record[k]);
          });
        }
        if (picked.minutes) {
          var spent = ESC.state.spend(picked.minutes);
          U().noteTime(spent);
        }
        if (picked.hp)   ESC.state.damage(picked.hp);
        if (picked.heal) ESC.state.restore(picked.heal);
        return picked.then ? runScene(picked.then) : null;
      });
    },

    openInput: function (b) {
      return openInput({ scene: b.scene, maxTurns: b.maxTurns, hint: b.hint });
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
        if (ESC.state.over && !b.always) return null;
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
    applyVerdict:  applyVerdict,
    captureKeys:   captureKeys
  };
})();
