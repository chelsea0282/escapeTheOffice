/* ============================================================================
   CONTENT — THE SCRIPT
   ----------------------------------------------------------------------------
   Transcribed from brainstorm.pdf. This file is data: every scene is an array
   of beats that js/engine.js knows how to perform.

   Beat types available (see engine.handlers):
     narrate | say | system | fx | marker | art | popup | wait | gauges
     cost | clockTo | typeExact | choose | openInput | call | branch

   Conventions from the brief, preserved here:
     * Indented script text  -> narrate / say / system  (typed into the terminal)
     * Un-indented direction -> fx    (SET DESIGN: the player sees and hears it
       happen; it is never printed as prose. Effects live in js/fx.js.)
     * NARRATOR lines carry no speaker; the terminal IS the narrator.
     * [] tokens are resolved by state.interpolate() at print time.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.script = (function () {

  var S = {};

  /* ======================================================================
     LOGIN — runs on the login screen, not the terminal
     ==================================================================== */

  S.login = function () {
    var ui = ESC.ui;
    var eng = ESC.engine;

    ui.show('login');
    ui.loginClear();

    return ui.loginType('REPLAK.AI SYSTEM:', 'sys-label', 26)
      .then(function () { return ui.loginType('Please authenticate your credentials:', null, 22); })
      .then(function () { return ui.sleep(500); })

      /* ---- name prompt ------------------------------------------------ */
      .then(function () {
        var line = ui.loginPrint('', 'field-line');
        var label = document.createElement('span');
        label.textContent = 'Please type your name: ';
        var value = document.createElement('span');
        value.className = 'field-value';
        line.appendChild(label);
        line.appendChild(value);
        return eng.readLine({ target: value, maxLen: 24 });
      })
      .then(function (name) {
        ESC.state.record('name', name || 'Jamie');
        return ui.sleep(600);
      })

      /* ---- camera access ---------------------------------------------- */
      .then(function () {
        return ui.showSystemPopup(
          'REPLAK.AI would like to access your camera.\n\n' +
          'Imaging is used to verify presence, attention, and general\n' +
          'workplace disposition. Declining is permitted and recorded.',
          'CAMERA ACCESS REQUEST'
        );
      })
      .then(function () {
        ui.loginPrint('> camera access granted', 'sys-label');
        ESC.state.record('cameraConsent', 'allowed');

        /* The viewfinder. It does not ask a second time. */
        var vf = document.createElement('div');
        vf.id = 'viewfinder';
        var pre = document.createElement('pre');
        pre.textContent = [
          '  ░░▒▒▒▒▒▒▒▒░░  ',
          ' ░▒▒▒▒▒▒▒▒▒▒▒▒░ ',
          '░▒▒▒  ▒▒  ▒▒▒▒▒░',
          '░▒▒▒▒▒▒▒▒▒▒▒▒▒▒░',
          '░▒▒▒▒ ▒▒▒▒ ▒▒▒▒░',
          ' ░▒▒▒▒▒▒▒▒▒▒▒▒░ ',
          '  ░░▒▒▒▒▒▒▒▒░░  '
        ].join('\n');
        var status = document.createElement('span');
        status.className = 'vf-status';
        status.textContent = 'LIVE';
        vf.appendChild(pre);
        vf.appendChild(status);
        ui.loginNode().appendChild(vf);

        return ui.sleep(1000)                       /* the brief's 1-second pause */
          .then(function () {
            status.textContent = 'CAPTURING';
            vf.classList.add('capturing');
            return ui.sleep(240);
          })
          .then(function () {
            vf.classList.add('snap-flash');
            ESC.fx.play('shutter');
            status.textContent = 'CAPTURED';
            var seed = ESC.state.ledger.name + '|' + ESC.state.ledger.cameraConsent;
            ui.setPortrait(ui.makePortrait(seed));
            return ui.sleep(900);
          });
      })

      /* ---- the note in the system -------------------------------------- */
      .then(function () {
        ui.loginPrint('');
        return ui.loginType('REPLAK.AI SYSTEM:', 'sys-label', 26);
      })
      .then(function () {
        return ui.loginType(
          ESC.state.interpolate(
            'Welcome back [player]. Your afternoon break was longer than ' +
            'usual. I\'ll make a note in the system.'
          ), null, 22);
      })
      .then(function () { return ui.sleep(1600); })

      /* ---- boot into the main layout ----------------------------------- */
      .then(function () {
        ESC.fx.play('bootBops');
        return ui.bootSequence('REPLAK.AI  ///  SESSION RESTORED', 3600);
      })
      .then(function () {
        ui.renderIdPanel();
        ui.show('game');
        ui.clearTerminal();
        return ui.sleep(400);
      });
  };

  /* ======================================================================
     OPENING
     ==================================================================== */

  S.opening = [
    { type: 'fx', name: 'typingStart' },

    { type: 'narrate', text:
      'It\'s Thursday, 3:50pm. You\'re typing away at your desk writing the ' +
      'latest objective key results for Project Porcupine and your words per ' +
      'minute is slowing noticeably.' },

    { type: 'narrate', text:
      'You have already worked 50 hours this week, have stayed late in the ' +
      'office every single day this past week for a shareholder meeting ' +
      'preparation that is happening tomorrow.' },

    { type: 'narrate', text:
      'You sense the quiet tension that is perpetrating the office. Everyone ' +
      'else is silently, but furiously typing around you.' },

    { type: 'fx', name: 'typingIntensify' },

    { type: 'narrate', text:
      'But you must exit The System at 5:00pm today. You promised Parker, and ' +
      'you can\'t let Parker down this time.' },

    { type: 'wait', ms: 700 },

    { type: 'narrate', text:
      'You\'re furiously copying boxes of excel spreadsheets and pasting ' +
      'circles into the power point, preparing for the meeting.' },

    /* ---- the box counting -----------------------------------------------
       The boxes appear on screen and are countable; the narration below
       counts along with them, and one of them quietly disappears. */
    { type: 'fx', name: 'countBoxes', await: false, wait: 500 },

    { type: 'narrate', text: 'One… two… three… you count the boxes that appear.' },
    { type: 'narrate', text: 'Twenty seven… Twenty nine…' },
    { type: 'narrate', text: 'Wait, what did you miss a number?', speed: 34 },

    { type: 'cost', hp: 6 },

    { type: 'narrate', text:
      'You feel your concentration level dropping actively. Instinctively, ' +
      'you reach for your side drawer to grab a little snack…' },
    { type: 'narrate', text: 'It\'s empty.' },
    { type: 'narrate', text: 'Instead you reach for your mug of coffee…' },
    { type: 'narrate', text: 'It\'s also empty.' },
    { type: 'narrate', text:
      'There\'s water and snacks at the PHS (Productivity Hydration Station).' },

    { type: 'wait', ms: 600 }
  ];

  /* ======================================================================
     TUTORIAL
     ==================================================================== */

  S.tutorial = [

    { type: 'typeExact',
      text: 'Go to PHS to get snacks and coffee.',
      hpPerTypo: 1 },

    { type: 'fx', name: 'warning' },

    { type: 'popup', title: 'REPLAK.AI SYSTEM — WARNING', text:
      'WARNING: You just got back from a long break.\n\n' +
      'Why are you trying to leave the desk again?' },

    { type: 'narrate', text:
      'Do you have time for this? You need to finish clicking yes and no for ' +
      'the evals that you were doing.' },

    { type: 'choose', options: [
      {
        key: 'A',
        label: 'Ok, fine. I\'ll keep working.',
        minutes: 0,
        hp: 10,                                  /* energy dwindling low */
        record: { breakTaken: false },
        then: [
          { type: 'narrate', text:
            'Great. That saved you 5 minutes, but your energy is dwindling ' +
            'low. Let\'s keep preparing for the Standup standup meeting ' +
            'that\'s about to start.' }
        ]
      },
      {
        key: 'B',
        label: 'No, I\'m having a difficult time concentrating. Taking this break will help me be more productive.',
        minutes: 5,
        heal: 22,
        record: { breakTaken: true },
        then: [
          { type: 'narrate', text:
            'Alright, that\'s a good point. You get up with your water bottle ' +
            'and walk over to the Productivity Hydration Station™. It takes a ' +
            'while to fill up your 40 ounce bottle.' },
          { type: 'narrate', text:
            'You take a sip hoping the coffee will wash away your fatigue. It ' +
            'doesn\'t. You sip and walk to your desk and check the time. It\'s ' +
            'now 3:55pm. The Standup standup meeting\'s about to start.' }
        ]
      }
    ]},

    { type: 'call', fn: function () { ESC.ui.renderIdPanel(); } },

    /* The gauges arrive here, per the brief. */
    { type: 'fx', name: 'gaugesArrive' },
    { type: 'gauges' },

    { type: 'wait', ms: 500 }
  ];

  /* ======================================================================
     SCENARIO 1 — JERRY
     ==================================================================== */

  S.scenario1 = [
    { type: 'fx', name: 'sceneBreak' },

    { type: 'fx', name: 'slackPing' },

    { type: 'say', speaker: 'Jerry', text:
      'Hey [player]. The leads saw the Perceived Forward Momentum Index of ' +
      'Project Porcupine is declining and are concerned on unclear ' +
      'stakeholder ROI for the upcoming shareholders meeting.' },

    { type: 'say', speaker: 'Jerry', text:
      'We need to align on the H2 strategy for Project Porcupine. We need to ' +
      'decide before [insert good time] which priority is higher priority:' },

    { type: 'say', speaker: 'Jerry', text:
      '  1. Prioritizing the Alignment Roadmap   or\n' +
      '  2. Aligning the Priority Roadmap.' },

    { type: 'say', speaker: 'Jerry', text:
      'EVERYTHING is blocked until this is resolved.' },

    { type: 'wait', ms: 500 },

    { type: 'narrate', text:
      'This catches you off-guard. What is he talking about?' },
    { type: 'narrate', text:
      'Then you remember, you were supposed to do this task but had forgotten ' +
      'all about it. Maybe Rachel can do this instead.' },
    { type: 'narrate', text:
      'You swivel backward to ask, but Rachel is gone. Where is she?' },
    { type: 'narrate', text:
      'You check your phone. There\'s a new notification. Parker is wondering ' +
      'how you\'re doing on time.' },

    { type: 'openInput', scene: 's1',
      hint: 'answer Jerry — or look around, or try to leave. everything costs time.' },
  ];

  /* ======================================================================
     THE STANDING STANDUP — bridges scenario 1 and 2
     ==================================================================== */

  S.standup = [
    { type: 'narrate', text:
      'You glance at the clock, it now reads [insert time]. It\'s time for the ' +
      'Standing Standup meeting. This is a daily meeting where everyone has to ' +
      'recite their percentage progress towards the tasks that they are the ' +
      'DRIs for.' },

    { type: 'cost', hp: 5 },

    { type: 'narrate', text:
      'The meeting goes as well as it could — Jerry presented on the decision ' +
      'to prioritize [insert prioritization that was decided during scenario 1].' },

    { type: 'narrate', text:
      'But it seems that other teammates have an issue on what are the issues ' +
      'that we\'re [aligning/prioritizing] on. They also have a problem about ' +
      'the high investment into the personalized AI system that Porcupine has ' +
      'not yet been able to materialize into tangible ROI.' },

    /* The script's fixed anchors. advanceTo never moves the clock backward,
       so a player who already burned past 4:28 keeps their own worse time. */
    { type: 'clockTo', hour: 16, minute: 28 },

    { type: 'narrate', text:
      'You glance at the clock, it now reads [insert time]. You will need to ' +
      'head out soon. Decisions are being actively fought against and as the ' +
      'clock hits 4:30pm, Rachel takes charge.' },

    { type: 'clockTo', hour: 16, minute: 30 }
  ];

  /* ======================================================================
     SCENARIO 2 — RACHEL
     ==================================================================== */

  S.scenario2 = [
    { type: 'fx', name: 'sceneBreak' },

    { type: 'say', speaker: 'Rachel', text:
      'It seems the next steps are not clear. The item that we said we\'ll ' +
      'take offline, I think we need to circle back on it. We really need a ' +
      'follow up to align on when to discuss starting the roadmap towards ' +
      'finalizing the prioritization plans.' },

    { type: 'say', speaker: 'Rachel', text:
      'Hey [player], sorry that this is so urgent, can you take a stab by EOD ' +
      'today and set up a follow up Standing meeting around 5pm?' },

    { type: 'openInput', scene: 's2',
      hint: 'answer Rachel — you can also ask her about the email.' },
  ];

  /* ======================================================================
     SCENARIO 3 — THE PORCUPINE
     ==================================================================== */

  S.scenario3 = [
    { type: 'fx', name: 'sceneBreak' },

    { type: 'narrate', text:
      'You make a beeline for the elevator. After what feels like a lifetime, ' +
      'the elevator finally arrives. You enter and press the button for the ' +
      'lobby floor.' },

    { type: 'cost', minutes: 2 },

    { type: 'narrate', text:
      'You exit the elevator. The lobby is completely empty. You jog toward ' +
      'the doors. But what\'s that thing blocking the doors?' },

    { type: 'wait', ms: 700 },

    { type: 'narrate', text: 'It\'s a porcupine wearing a Replak.AI badge.' },

    { type: 'call', fn: function () { return ESC.ui.warp(2); } },

    { type: 'art', art: ESC.ui.art.porcupine },

    { type: 'narrate', text: 'Like…as in Project Porcupine?' },

    { type: 'say', speaker: 'Porcupine', text:
      'Hi [player]. I\'m a porcupine. Like, as in Project Porcupine. Don\'t ' +
      'you have more work to do on my project? I won\'t become a full-grown ' +
      'porcupine if you don\'t complete all of my KPIs in time.' },

    { type: 'openInput', scene: 's3',
      hint: 'it wants to know about its KPIs. it has nowhere else to be.' },
  ];

  /* ======================================================================
     EXIT — the ending branches on the clock and on the easter egg
     ==================================================================== */

  S.exit = [
    { type: 'branch', pick: function (ledger, state) {

      /* Easter egg: the porcupine portals you there, but without Parker. */
      if (ledger.porcupineOutcome === 'lied') {
        state.record('ending', 'portal');
        return [
          { type: 'say', speaker: 'Porcupine', text:
            'Well then. Well then! Go. Go, you\'ve earned it. Let me get that ' +
            'for you.' },
          { type: 'fx', name: 'portal' },
          { type: 'narrate', text:
            'You step through and you are at the venue. The support act is ' +
            'still on. The floor smells like beer and someone\'s coat.' },
          { type: 'narrate', text: 'The time is [insert time]. You made it.' },
          { type: 'wait', ms: 800 },
          { type: 'narrate', text:
            'You look around for Parker. You keep looking around for Parker.' },
          { type: 'narrate', text:
            'Parker is not here. Parker is standing outside an office building ' +
            'across town, texting a person who is no longer in it.' },
          { type: 'wait', ms: 900 }
        ];
      }

      var left = state.minutesLeft();
      state.record('ending', left >= 12 ? 'early' : left >= 4 ? 'close' : 'late');

      var closer =
        left >= 12 ? 'Hopefully Parker didn\'t have to wait too long.' :
        left >= 4  ? 'You\'ll make it, but only just. You start composing the ' +
                     'apology on the walk, then delete it, then start it again.' :
                     'Parker is going to be livid.';

      return [
        { type: 'fx', name: 'daylight' },
        { type: 'narrate', text:
          'You\'re out. The time is [insert time]. You step out into the sun ' +
          'and run to the train station.' },
        { type: 'narrate', text: closer },
        { type: 'wait', ms: 700 },
        { type: 'narrate', text:
          'As she\'s walking home, she gets a notification on her phone. She ' +
          'glances and sees that it\'s an email from her leads. She decides to ' +
          'not check the email, it\'ll still be there for her when she comes ' +
          'into work tomorrow.' }
      ];
    }},

    { type: 'wait', ms: 900 }
  ];

  /* ======================================================================
     FAILURE ENDINGS
     ==================================================================== */

  S.failTime = [
    { type: 'call', always: true, fn: function () { ESC.ui.setMood('ending-fail'); } },
    { type: 'fx', name: 'clockOut', always: true },
    { type: 'marker', text: '5:00 PM', always: true },
    { type: 'narrate', always: true, text:
      'The System closes. Not dramatically — it just stops accepting input, ' +
      'the way a door stops being a door once it is locked.' },
    { type: 'narrate', always: true, text:
      'It is 5:00pm and you are still at your desk. Somewhere across town the ' +
      'support act is finishing. Parker has stopped checking his phone.' },
    { type: 'narrate', always: true, text:
      'You did not exit The System at 5:00pm today. You promised Parker.' },
    { type: 'wait', ms: 1200, always: true }
  ];

  S.failHp = [
    { type: 'call', always: true, fn: function () { ESC.ui.setMood('ending-fail'); } },
    { type: 'fx', name: 'flatline', always: true },
    { type: 'marker', text: 'ATTENTION LEVEL: ZERO', always: true },
    { type: 'narrate', always: true, text:
      'Your concentration does not drop so much as arrive at the bottom.' },
    { type: 'narrate', always: true, text:
      'You are still sitting up. Your hands are still on the keys. The words ' +
      'on the screen have stopped being words and become the shapes that words ' +
      'are made of.' },
    { type: 'narrate', always: true, text:
      'REPLAK.AI logs the session as complete. You do not leave at 5:00pm. You ' +
      'are not entirely sure when you leave.' },
    { type: 'wait', ms: 1200, always: true }
  ];

  /* ======================================================================
     EPILOGUE — dramatic irony. The evaluation report on the player.
     Values are computed from the run, not hardcoded. That's the joke.
     ==================================================================== */

  function bar(pct) {
    var filled = Math.round(pct / 10);
    return new Array(filled + 1).join('█') + new Array(11 - filled).join('░');
  }

  function stars(n) {
    return new Array(n + 1).join('★') + new Array(6 - n).join('☆');
  }

  function dotted(label, value) {
    var pad = Math.max(2, 36 - label.length);
    return '<span class="rk">' + label + ' ' +
           new Array(pad).join('…') + '</span> <span class="rv">' + value + '</span>';
  }

  S.buildReport = function () {
    var L = ESC.state.ledger;
    var st = ESC.state;

    /* Observed behaviours, straight off the ledger. */
    var observed = [];
    if (L.breakTaken)        observed.push('left desk (self-authorised, 4:00pm window)');
    if (L.moveCount)         observed.push('attempted ambulation ×' + L.moveCount);
    if (L.avoidCount)        observed.push('delayed responses ×' + L.avoidCount);
    if (L.nonsenseCount)     observed.push('unparseable output ×' + L.nonsenseCount);
    if (L.inspected.length)  observed.push('non-task visual attention ×' + L.inspected.length);
    if (L.jerryOutcome === 'failed')   observed.push('escalation required (eng)');
    if (L.rachelOutcome === 'emailed') observed.push('escalation required (lead)');
    if (!observed.length)    observed.push('nominal');

    /* Satirical metrics, derived. */
    var conviction   = Math.max(4, Math.min(99,
                        41 + L.justifyCount * 7 - L.typos * 3 - L.nonsenseCount * 5));
    var calendar     = Math.max(0, Math.min(5,
                        (L.rachelOutcome === 'complied' ? 3 : 1) + (L.avoidCount ? -1 : 0)));
    var glow         = Math.max(1, Math.min(99,
                        12 + (L.complyCount * 9) - (L.avoidCount * 4)));
    var ambiguity    = 60 + L.justifyCount * 11 + L.warpLevel * 14;
    var escape       = st.minutesLeft() >= 12 ? 'HIGH'
                     : st.minutesLeft() >= 4  ? 'ELEVATED' : 'CONTAINED';
    var bond         = L.porcupineOutcome === 'lied'      ? 'FALSIFIED'
                     : L.porcupineOutcome === 'satisfied' ? 'REGRESSING'
                     : 'UNASSESSED';
    var identity     = (97 + (L.typos % 3) + (L.nonsenseCount % 2) * 0.4).toFixed(1);

    return {
      observed: observed,
      rows: [
        ['Identity Confidence',           identity + ' %'],
        ['Core Motivation',               '"External Sentimentality" (Concert-Based)'],
        ['Calendar Enthusiasm',           stars(calendar)],
        ['Keyboard Conviction',           bar(conviction) + ' ' + conviction + ' %'],
        ['Meeting Readiness Glow',        glow + ' Lux' + (glow < 40 ? ' (Sub-optimal)' : '')],
        ['Strategic Ambiguity Tolerance', ambiguity + ' %' +
                                          (ambiguity > 100 ? ' (Exceeds safe limits)' : '')],
        ['Escape Orientation Index',      escape],
        ['Porcupine Bond Strength',       bond]
      ],
      ownership:  L.complyCount  >= 2 ? 'DEMONSTRATED' : L.justifyCount ? 'PARTIAL' : 'NOT OBSERVED',
      visibility: L.avoidCount   >= 2 ? 'INTERMITTENT' : 'ADEQUATE',
      influence:  L.jerryOutcome === 'justified' ? 'EMERGENT' : 'DEFERRED TO PEER',
      escape:     escape
    };
  };

  S.epilogue = [
    { type: 'fx', name: 'staticFlip', always: true },
    { type: 'call', always: true, fn: function () {
        ESC.ui.setMood('epilogue');
        ESC.ui.clearTerminal();
      }},


    { type: 'fx', name: 'evaluatorPing', always: true },

    { type: 'wait', ms: 600, always: true },

    { type: 'narrate', always: true, text:
      'Hey Rachel, this is the generated report of [player] for [date] of work.' },

    { type: 'wait', ms: 700, always: true },

    { type: 'call', always: true, fn: function () {
      var r = S.buildReport();
      var ui = ESC.ui;

      ui.printHTML('<span class="rk">CORPORATE EVALUATION</span>', 'report');
      ui.printHTML(dotted('Ownership',  r.ownership),  'report');
      ui.printHTML(dotted('Visibility', r.visibility), 'report');
      ui.printHTML(dotted('Influence',  r.influence),  'report');

      ui.printHTML('<span class="rk">OBSERVED BEHAVIORS</span>', 'report');
      r.observed.forEach(function (o) {
        ui.printHTML('<span class="rv">  · ' + o + '</span>', 'report');
      });

      ui.printHTML('<span class="rk">SUPPLEMENTARY INDICES</span>', 'report');
      r.rows.forEach(function (row) {
        ui.printHTML(dotted(row[0], row[1]), 'report');
      });

      ui.printHTML('<span class="rk">RECOMMENDATION</span>', 'report');
      ui.printHTML('<span class="rv">  Defer promotion until Escape Orientation &lt; 25 %</span>',
                   'report');
    }},

    { type: 'wait', ms: 1400, always: true },

    { type: 'say', always: true, speaker: 'Rachel', text:
      'Thanks. Same as last quarter, then.' },

    { type: 'wait', ms: 900, always: true },

    { type: 'say', always: true, speaker: 'Rachel', text:
      'She\'s fine. They\'re all fine. Send it to the leads and flag the ' +
      'escape thing, they like that one.' },

    { type: 'wait', ms: 1100, always: true },

    { type: 'marker', text: 'GAME ENDS', always: true }
  ];

  return S;
})();
