/* ============================================================================
   STATE — the ledger, the clock/location title, and [] token substitution
   ----------------------------------------------------------------------------
   FIRE(ESC)APE has no resource budget. The old game spent minutes and HP; this
   one is on rails by design — the joke is that nothing you do changes the
   outcome. So the clock is a narrative caption ("4:27PM - Your Desk, Second
   Floor") set by the script, not a number the player spends.

   What is tracked instead: which scenes you have cleared (the progress bar),
   what you chose, and whether you triggered a SUDDEN DEATH.

   No DOM here. ui.js observes through ESC.state.onChange.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.state = (function () {

  var listeners = [];

  var s = {

    /* -- the caption line at the top of the terminal --------------------- */
    time:     '4:00PM',
    location: 'Your Desk, Second Floor',

    /* -- progress -------------------------------------------------------- */
    sceneIndex: 0,
    sceneTotal: 7,          // tutorial + s1..s5 + epilogue; main.js sets this

    /* -- run outcome ------------------------------------------------------ */
    over:    false,
    outcome: null,          // 'suddenDeath' | 'end'
    deathReason: '',        // which "good employee" answer ended the run

    /* ---------------------------------------------------------------
       THE LEDGER — "inserting of user decision from prior turns"
       --------------------------------------------------------------- */
    ledger: {
      name:           '',
      cameraConsent:  null,

      coffee:         '',   // 'made' | 'stole'
      carriedCoffee:  '',   // 'yes' (sudden death) | 'no' | 'wish'
      emailChoice:    '',   // 'ignored' | 'blamed' | 'open'
      blameChoice:    '',   // 'owned' (sudden death) | 'blamedJerry' | 'open'
      sabotage:       '',   // 'malware' | 'breakIn' | 'open'
      jerryDoubt:     '',   // 'focus' | 'frontline' | 'open'
      ceoAnswer:      '',   // 'owned' | 'forced' | 'open'

      openInputs:     [],   // everything the player typed, for the epilogue
      praiseCount:    0,    // how many times the office rewarded them
      restarts:       0
    }
  };

  /* -- change notification ------------------------------------------------ */

  function notify(what) {
    listeners.forEach(function (fn) { fn(what, s); });
  }
  s.onChange = function (fn) { listeners.push(fn); };

  /* -- the caption ------------------------------------------------------- */

  /* The script's "time/location text title updates to ..." direction. */
  s.locate = function (time, location) {
    if (time) s.time = time;
    if (location) s.location = location;
    notify('locate');
    return s.time + ' - ' + s.location;
  };

  s.caption = function () { return s.time + ' - ' + s.location; };

  /* -- progress ---------------------------------------------------------- */

  s.advanceScene = function (index) {
    if (index !== undefined) s.sceneIndex = index;
    else s.sceneIndex++;
    notify('progress');
  };

  s.progressFraction = function () {
    if (!s.sceneTotal) return 0;
    return Math.max(0, Math.min(1, s.sceneIndex / s.sceneTotal));
  };

  /* -- outcomes ----------------------------------------------------------- */

  /* Choosing the model-employee answer ends the run early. */
  s.suddenDeath = function (reason) {
    s.over = true;
    s.outcome = 'suddenDeath';
    s.deathReason = reason || '';
    notify('over');
  };

  s.finish = function () {
    s.over = true;
    s.outcome = 'end';
    notify('over');
  };

  /* -- ledger helpers ------------------------------------------------------ */

  s.record = function (key, value) { s.ledger[key] = value; };
  s.bump = function (key, by) {
    s.ledger[key] = (s.ledger[key] || 0) + (by === undefined ? 1 : by);
  };
  s.noteInput = function (text) {
    if (text) s.ledger.openInputs.push(text);
  };

  /* ---------------------------------------------------------------------
     TOKEN SUBSTITUTION
     The script writes player-dependent values as []. Every string printed to
     the terminal passes through here first. Unresolved tokens render as
     [?...] so authoring gaps are visible rather than silently vanishing.
     ------------------------------------------------------------------ */

  var TOKENS = {
    'player':   function () { return s.ledger.name || 'Jamie'; },
    'name':     function () { return s.ledger.name || 'Jamie'; },
    'player’s': function () { return (s.ledger.name || 'Jamie') + '’s'; },
    'time':     function () { return s.time; },
    'location': function () { return s.location; },
    'caption':  function () { return s.caption(); },
    'date':     function () { return 'Thursday'; },

    /* The drink you ended up with, referenced later. */
    'coffee':   function () {
      return s.ledger.coffee === 'stole'
        ? 'the coffee you eventually had to make yourself'
        : 'your quadruple shot cappuccino with protein milk';
    }
  };

  s.interpolate = function (text) {
    if (typeof text !== 'string' || text.indexOf('[') === -1) return text;
    return text.replace(/\[([^\[\]]+)\]/g, function (whole, inner) {
      var key = inner.trim().toLowerCase();
      if (TOKENS[key]) return TOKENS[key]();
      /* Leave authored stage-note brackets like [A/B option] alone. */
      if (/^[A-Z]/.test(inner.trim())) return whole;
      return '[?' + inner + ']';
    });
  };

  s.tokens = TOKENS;

  /* -- reset (the "play again" button) -------------------------------------- */

  s.reset = function (keepName) {
    var name = s.ledger.name;
    var restarts = s.ledger.restarts + 1;

    s.time = '4:00PM';
    s.location = 'Your Desk, Second Floor';
    s.sceneIndex = 0;
    s.over = false;
    s.outcome = null;
    s.deathReason = '';

    s.ledger = {
      name: keepName ? name : '',
      cameraConsent: null,
      coffee: '', carriedCoffee: '', emailChoice: '', blameChoice: '',
      sabotage: '', jerryDoubt: '', ceoAnswer: '',
      openInputs: [], praiseCount: 0, restarts: restarts
    };
    notify('reset');
  };

  return s;
})();
