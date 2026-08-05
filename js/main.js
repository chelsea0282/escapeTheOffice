/* ============================================================================
   MAIN — boot, scene sequencing, failure routing, debug helpers
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.main = (function () {

  var started = false;

  /* ======================================================================
     TITLE CARD
     ==================================================================== */

  function titleCard() {
    ESC.ui.show('title-card');
    return new Promise(function (resolve) {
      function go(e) {
        if (e.type === 'keydown' && (e.metaKey || e.ctrlKey || e.altKey)) return;
        document.removeEventListener('keydown', go);
        document.removeEventListener('click', go);
        /* This keypress is the user gesture browsers require before any audio
           may play, so the whole sound design hangs off it. */
        ESC.fx.unlock();
        ESC.fx.mountMuteToggle();
        ESC.fx.play('deepBop');
        resolve();
      }
      document.addEventListener('keydown', go);
      document.addEventListener('click', go);
    });
  }

  /* ======================================================================
     THE RUN
     ----------------------------------------------------------------------
     Scenes are sequenced here rather than in content/script.js so the script
     file stays purely declarative.
     ==================================================================== */

  var ORDER = [
    'opening',
    'tutorial',
    'scenario1',
    'standup',
    'scenario2',
    'scenario3',
    'exit'
  ];

  function playFrom(index) {
    var chain = Promise.resolve();
    for (var i = index; i < ORDER.length; i++) {
      (function (name) {
        chain = chain.then(function () {
          if (ESC.state.over) return null;          // a gauge hit zero
          return ESC.engine.runScene(ESC.script[name]);
        });
      })(ORDER[i]);
    }
    return chain;
  }

  function finish() {
    ESC.ui.hideInput();

    var tail;
    if (ESC.state.failure === 'time')    tail = ESC.script.failTime;
    else if (ESC.state.failure === 'hp') tail = ESC.script.failHp;
    else                                 tail = null;

    var chain = Promise.resolve();
    if (tail) {
      chain = chain.then(function () { return ESC.engine.runScene(tail); });
    }
    /* The epilogue plays either way — the system files its report whether or
       not you got out. That is the dramatic irony the brief asks for. */
    return chain.then(function () {
      return ESC.engine.runScene(ESC.script.epilogue);
    });
  }

  function start() {
    if (started) return;
    started = true;

    ESC.ui.syncGauges();

    return titleCard()
      .then(function () { return ESC.script.login(); })
      .then(function () { return playFrom(0); })
      .then(finish)
      .catch(function (err) {
        console.error('[ESC] run failed:', err);
        ESC.ui.printLine('SYSTEM FAULT — see console. ' + err, 'system');
      });
  }

  /* ======================================================================
     DEBUG — so scenes 3+ are testable without replaying the intro
     ==================================================================== */

  var debug = {

    /* Skip straight into a scene with a plausible ledger already filled in. */
    jumpTo: function (sceneName, opts) {
      opts = opts || {};
      started = true;
      var L = ESC.state.ledger;
      if (!L.name) ESC.state.record('name', opts.name || 'Jamie');
      if (!L.prioritization) {
        ESC.state.record('prioritization', 'Prioritizing the Alignment Roadmap');
      }
      ESC.ui.setPortrait(ESC.ui.makePortrait(L.name));

      ESC.ui.renderIdPanel();
      ESC.ui.show('game');
      ESC.ui.clearTerminal();
      ESC.ui.showGauges();
      ESC.ui.syncGauges();

      var idx = ORDER.indexOf(sceneName);
      if (idx === -1) {
        if (ESC.script[sceneName]) return ESC.engine.runScene(ESC.script[sceneName]);
        console.warn('[ESC] unknown scene:', sceneName, 'try:', ORDER.join(', '));
        return Promise.resolve();
      }
      return playFrom(idx).then(finish);
    },

    setClock: function (h, m) {
      ESC.state.clock = h * 60 + m;
      ESC.state.over = false;
      ESC.state.failure = null;
      ESC.ui.syncTime();
      return ESC.state.timeString();
    },

    setHp: function (n) {
      ESC.state.hp = n;
      ESC.state.over = false;
      ESC.state.failure = null;
      ESC.ui.syncHp();
      return n;
    },

    /* Inspect how the responder reads a line, without playing a turn. */
    classify: function (text, scene) {
      scene = scene || 's1';
      return {
        intent:     ESC.responder.classify(text, scene),
        quality:    ESC.responder.quality(text).toFixed(2),
        threshold:  ESC.responder.RUBRICS[scene].threshold,
        grounding:  ESC.responder.grounding(text.toLowerCase()),
        absurdity:  ESC.responder.absurdity(text),
        offScript:  ESC.responder.offScript(text),
        nonsense:   ESC.responder.isNonsense(text)
      };
    },

    ledger:  function () { return ESC.state.ledger; },
    report:  function () { return ESC.script.buildReport(); },
    restart: function () { location.reload(); },
    scenes:  ORDER
  };

  /* ======================================================================
     BOOT
     ==================================================================== */

  document.addEventListener('DOMContentLoaded', function () {
    ESC.ui.init();
    ESC.debug = debug;
    start();
  });

  return { start: start, debug: debug, ORDER: ORDER };
})();
