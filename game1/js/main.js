/* ============================================================================
   MAIN — boot, scene sequencing, sudden-death routing, debug helpers
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.main = (function () {

  var started = false;

  /* Dev toggle: skip the credentials/camera login sequence and boot
     straight into gameplay. Flip off before shipping. */
  var SKIP_INTRO = true;

  /* ======================================================================
     THE RUN
     ----------------------------------------------------------------------
     Scenes are sequenced here rather than in content/script.js so the script
     file stays purely declarative. scenario0 is empty in the doc, so it is
     skipped automatically until beats are added to it.
     ==================================================================== */

  var ORDER = [
    'tutorial',
    'scenario0',
    'scenario1',
    'scenario2',
    'scenario3',
    'scenario4',
    'scenario5',
    'epilogue'
  ];

  function playable() {
    return ORDER.filter(function (n) {
      return (ESC.script[n] || []).length > 0;
    });
  }

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
     SEQUENCING
     ==================================================================== */

  function playFrom(index) {
    var scenes = playable();
    ESC.state.sceneTotal = scenes.length;

    var chain = Promise.resolve();
    for (var i = index; i < scenes.length; i++) {
      (function (name, idx) {
        chain = chain.then(function () {
          /* A Sudden Ending stops normal advancement — skip straight to the
             epilogue below instead of playing the remaining scenarios. */
          if (ESC.state.over) return null;
          ESC.state.advanceScene(idx);
          return ESC.engine.runScene(ESC.script[name]);
        });
      })(scenes[i], i);
    }

    return chain.then(function () {
      /* A Sudden Ending skips straight to the epilogue — same "failed to
         get fired" ending as the full playthrough, just reached early.
         Clear `over` first so the epilogue's own beats actually play
         instead of being skipped by the same guard that just stopped the
         remaining scenarios above. */
      if (ESC.state.outcome === 'suddenEnding') {
        ESC.ui.hideInput();
        ESC.state.over = false;
        ESC.state.advanceScene(scenes.indexOf('epilogue'));
        return ESC.engine.runScene(ESC.script.epilogue);
      }
      return null;
    });
  }

  function start() {
    if (started) return;
    started = true;

    ESC.state.sceneTotal = playable().length;
    ESC.ui.syncChrome();

    return titleCard()
      .then(function () {
        if (SKIP_INTRO) {
          ESC.state.record('name', 'Jamie');
          ESC.ui.show('game');
          ESC.ui.clearTerminal();
          ESC.ui.showChrome();
          return null;
        }
        return ESC.script.login();
      })
      .then(function () { return playFrom(0); })
      .catch(function (err) {
        console.error('[ESC] run failed:', err);
        ESC.ui.printLine('SYSTEM FAULT — see console. ' + err, 'system');
      });
  }

  /* ======================================================================
     RESTART — "The game shows a button to click to restart the game."
     Skips the title card and login; you keep your name.
     ==================================================================== */

  function restart() {
    ESC.ui.setMood(null);
    ESC.ui.clearTerminal();
    ESC.ui.show('game');
    ESC.state.sceneTotal = playable().length;
    ESC.ui.syncChrome();
    ESC.fx.play('bootBops');
    return playFrom(0).catch(function (err) {
      console.error('[ESC] restart failed:', err);
    });
  }

  /* ======================================================================
     DEBUG — so later scenes are testable without replaying the intro
     ==================================================================== */

  var debug = {

    jumpTo: function (sceneName, opts) {
      opts = opts || {};
      started = true;
      if (!ESC.state.ledger.name) ESC.state.record('name', opts.name || 'Jamie');
      ESC.ui.show('game');
      ESC.ui.clearTerminal();
      ESC.ui.showChrome();
      ESC.state.sceneTotal = playable().length;
      ESC.ui.syncChrome();

      var scenes = playable();
      var idx = scenes.indexOf(sceneName);
      if (idx === -1) {
        if (ESC.script[sceneName]) return ESC.engine.runScene(ESC.script[sceneName]);
        console.warn('[ESC] unknown scene:', sceneName, 'try:', scenes.join(', '));
        return Promise.resolve();
      }
      return playFrom(idx);
    },

    /* Drop straight into a scene's open-input box, skipping its A/B/C menu —
       for iterating on the LLM prompts without re-navigating each time. */
    testOpenInput: function (sceneKey, opts) {
      opts = opts || {};
      started = true;
      if (!ESC.state.ledger.name) ESC.state.record('name', opts.name || 'Jamie');
      ESC.ui.show('game');
      ESC.ui.showChrome();
      return ESC.engine.openInput({ scene: sceneKey, fallback: opts.fallback || [] });
    },

    /* Inspect how the responder reads a line, without playing a turn. */
    classify: function (text) {
      return {
        intent:    ESC.responder.classify(text),
        grounding: ESC.responder.grounding(text.toLowerCase()),
        nonsense:  ESC.responder.isNonsense(text)
      };
    },

    /* Preview a scene's reply to a given register. */
    reply: function (scene, intent) {
      return ESC.responses.reply(scene, intent, 0);
    },

    ledger:  function () { return ESC.state.ledger; },
    scenes:  function () { return playable(); },
    restart: restart,
    reload:  function () { location.reload(); }
  };

  /* ======================================================================
     BOOT
     ==================================================================== */

  document.addEventListener('DOMContentLoaded', function () {
    ESC.ui.init();
    ESC.debug = debug;
    start();
  });

  return { start: start, restart: restart, debug: debug, ORDER: ORDER };
})();
