/* ============================================================================
   STATE — clock, HP, the decision ledger, and [] token substitution
   ----------------------------------------------------------------------------
   No DOM here. ui.js observes state through the callbacks registered on
   ESC.state.onChange.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.state = (function () {

  /* -- tunables ---------------------------------------------------------- */
  var START_MIN    = 15 * 60 + 50;  // 3:50pm, in minutes since midnight
  var DEADLINE_MIN = 17 * 60;       // 5:00pm
  var BUDGET       = DEADLINE_MIN - START_MIN;   // 70 minutes
  var HP_START     = 62;            // she has already worked 50 hours this week

  var listeners = [];

  var s = {
    /* clock ------------------------------------------------------------- */
    clock:    START_MIN,
    deadline: DEADLINE_MIN,
    budget:   BUDGET,

    /* health ------------------------------------------------------------ */
    hp:    HP_START,
    hpMax: 100,

    /* run outcome ------------------------------------------------------- */
    over:      false,
    failure:   null,   // 'time' | 'hp' | null

    /* ---------------------------------------------------------------
       THE LEDGER — "inserting of user decision from prior turns"
       Every downstream scene reads from here rather than from globals.
       --------------------------------------------------------------- */
    ledger: {
      name:              '',
      cameraConsent:     null,     // 'allowed' | 'denied'
      breakTaken:        null,     // true = took the PHS break (option B)
      prioritization:    '',       // the Scenario 1 decision, verbatim
      jerryOutcome:      '',       // 'justified' | 'deferred' | 'failed'
      jerryTurns:        0,
      rachelOutcome:     '',       // 'complied' | 'negotiated' | 'emailed'
      rachelTurns:       0,
      porcupineOutcome:  '',       // 'satisfied' | 'lied'
      porcupineTurns:    0,
      inspected:         [],       // appendix ids the player looked at
      typos:             0,        // mistyped characters in the tutorial
      nonsenseCount:     0,
      avoidCount:        0,
      complyCount:       0,
      justifyCount:      0,
      moveCount:         0,
      warpLevel:         0,        // peak absurdity reached
      ending:            ''        // set at the exit scene
    }
  };

  /* -- change notification ------------------------------------------------ */

  function notify(what) {
    listeners.forEach(function (fn) { fn(what, s); });
  }

  s.onChange = function (fn) { listeners.push(fn); };

  /* -- clock -------------------------------------------------------------- */

  /* Spend minutes. Returns the number actually spent. */
  s.spend = function (minutes) {
    if (!minutes || s.over) return 0;
    var before = s.clock;
    s.clock = Math.min(s.deadline, s.clock + minutes);
    var spent = s.clock - before;
    if (s.clock >= s.deadline) {
      s.over = true;
      s.failure = 'time';
    }
    notify('time');
    return spent;
  };

  /* Push the clock forward to at least `hhmm`, never backward. Used to
     reconcile the script's fixed anchors (4:28pm standup, 4:30pm Rachel)
     with however many minutes the player actually burned before them. */
  s.advanceTo = function (hour, minute) {
    var target = hour * 60 + minute;
    if (target > s.clock) s.spend(target - s.clock);
    return s.clock;
  };

  s.minutesLeft = function () { return Math.max(0, s.deadline - s.clock); };

  s.timeFraction = function () { return s.minutesLeft() / s.budget; };

  /* "3:50pm" — the format the script uses throughout. */
  s.timeString = function (mins) {
    var m = (mins === undefined) ? s.clock : mins;
    var h = Math.floor(m / 60);
    var mm = m % 60;
    var suffix = h >= 12 ? 'pm' : 'am';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ':' + (mm < 10 ? '0' : '') + mm + suffix;
  };

  /* -- health ------------------------------------------------------------- */

  s.damage = function (n) {
    if (!n || s.over) return;
    s.hp = Math.max(0, s.hp - n);
    if (s.hp <= 0) {
      s.over = true;
      s.failure = 'hp';
    }
    notify('hp');
  };

  s.restore = function (n) {
    if (!n || s.over) return;
    s.hp = Math.min(s.hpMax, s.hp + n);
    notify('hp');
  };

  s.hpFraction = function () { return s.hp / s.hpMax; };

  /* -- ledger helpers ------------------------------------------------------ */

  s.record = function (key, value) { s.ledger[key] = value; };

  s.bump = function (key, by) {
    s.ledger[key] = (s.ledger[key] || 0) + (by === undefined ? 1 : by);
  };

  s.noteInspected = function (id) {
    if (id && s.ledger.inspected.indexOf(id) === -1) s.ledger.inspected.push(id);
  };

  /* ---------------------------------------------------------------------
     TOKEN SUBSTITUTION
     The brief writes player-dependent values as [] in the script. Every
     string that reaches the terminal passes through here first.

     Unresolved tokens render as [?...] rather than silently vanishing, so
     authoring gaps are visible while editing content/script.js.
     ------------------------------------------------------------------ */

  var TOKENS = {
    'player':       function () { return s.ledger.name || 'Jamie'; },
    'name':         function () { return s.ledger.name || 'Jamie'; },
    'insert time':  function () { return s.timeString(); },
    'time':         function () { return s.timeString(); },
    'clock':        function () { return s.timeString(); },
    'insert good time': function () { return s.timeString(s.clock + 20); },
    'minutes left': function () { return String(s.minutesLeft()); },
    'date':         function () { return 'Thursday'; },

    /* The Scenario 1 decision, replayed verbatim in the standup. */
    'insert prioritization that was decided during scenario 1':
                    function () { return s.ledger.prioritization || 'a roadmap'; },
    'prioritization': function () { return s.ledger.prioritization || 'a roadmap'; },

    /* "issues that we're [aligning/prioritizing] on" */
    'aligning/prioritizing': function () {
      return /aligning the priority/i.test(s.ledger.prioritization)
        ? 'aligning' : 'prioritizing';
    }
  };

  s.interpolate = function (text) {
    if (typeof text !== 'string' || text.indexOf('[') === -1) return text;
    return text.replace(/\[([^\[\]]+)\]/g, function (whole, inner) {
      var key = inner.trim().toLowerCase();
      if (TOKENS[key]) return TOKENS[key]();
      /* Leave deliberate stage directions like [A/B option] alone if they
         were authored with an uppercase leading char — those are notes to
         the reader, not tokens. */
      if (/^[A-Z]/.test(inner.trim())) return whole;
      return '[?' + inner + ']';
    });
  };

  /* Expose the token table so content authors can add their own. */
  s.tokens = TOKENS;

  /* -- reset (used by debug.restart) --------------------------------------- */
  s.reset = function () {
    s.clock = START_MIN;
    s.hp = HP_START;
    s.over = false;
    s.failure = null;
    Object.keys(s.ledger).forEach(function (k) {
      var v = s.ledger[k];
      if (Array.isArray(v)) s.ledger[k] = [];
      else if (typeof v === 'number') s.ledger[k] = 0;
      else if (typeof v === 'boolean') s.ledger[k] = null;
      else s.ledger[k] = '';
    });
    s.ledger.name = '';
    notify('reset');
  };

  return s;
})();
