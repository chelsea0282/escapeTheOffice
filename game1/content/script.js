/* ============================================================================
   CONTENT — THE SCRIPT
   ----------------------------------------------------------------------------
   KING OF THE OFFICE, transcribed from brainstorm.pdf and kept in sync with it.
   This file is data: every scene is an array of beats js/engine.js performs.

   Beat types (see engine.handlers):
     narrate | say | system | fx | marker | art | popup | wait
     locate | freshScreen | continue | email | chat | restart | chrome
     typeExact | choose | openInput | call | branch

   Conventions from the brief, preserved here:
     * Indented script text  -> narrate / say / system  (typed into the terminal)
     * Un-indented direction -> fx / locate / freshScreen  (SET DESIGN: the
       player sees and hears it happen; it is never printed as prose)
     * NARRATOR lines carry no speaker; the terminal IS the narrator.
     * [] tokens are resolved by state.interpolate() at print time.

   THE PREMISE: Jamie wants to get fired. She cannot. Every choice, including
   the deliberately awful ones, is metabolised by the office into praise. The
   two Sudden Ending branches are the model-employee answers — picking one
   skips straight to the epilogue, because here, being a good employee is
   how you lose.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.script = (function () {

  var S = {};

  /* ======================================================================
     LOGIN — runs on the login screen, not the terminal
     ==================================================================== */

  S.login = function () {
    var ui = ESC.ui;

    ui.show('login');
    ui.loginClear();

    /* No name prompt, no camera — per the doc, login goes straight from the
       title card to this system message, then boots into gameplay. The
       protagonist is always Jamie: ESC.state.ledger.name stays unset, and
       the [player] token already falls back to 'Jamie' when it is. */
    return ui.loginType('REPLAK.AI SYSTEM:', 'sys-label', 26)
      .then(function () {
        return ui.loginType(
          ESC.state.interpolate(
            'Welcome back, [player]. Your afternoon break was longer than ' +
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
        ui.show('game');
        ui.clearTerminal();
        return ui.sleep(400);
      });
  };

  /* ======================================================================
     TUTORIAL — 4:00PM, Your Desk
     ==================================================================== */

  S.tutorial = [
    { type: 'locate', time: '4:00PM', location: 'Your Desk, Second Floor' },
    { type: 'chrome' },
    { type: 'fx', name: 'typingStart' },

    { type: 'narrate', text: 'It\'s another Thursday in the Replak.ai office.' },
    { type: 'narrate', text:
      'You\'ve already spent 50 hours at the office this week. You got into ' +
      'the office at 8:00AM today and you were the last one in.' },
    { type: 'narrate', text:
      'Project Porcupine is going sideways, but at least it launched this ' +
      'morning. You sense the quiet tension permeating the office. Everyone ' +
      'else is silently, but furiously typing around you.' },

    { type: 'fx', name: 'typingIntensify' },

    { type: 'narrate', text:
      'You really can\'t keep doing this. Today has to be the day — there is ' +
      'just a sense in the air, something\'s going to happen.' },
    { type: 'narrate', text:
      'You know you can\'t quit out of the blue though, there needs to be a ' +
      'compelling reason why.' },

    { type: 'wait', ms: 700 },
    { type: 'narrate', text: 'You are going to get fired.', speed: 42 },
    { type: 'narrate', text: 'It can\'t be that hard.', speed: 34 },
    { type: 'wait', ms: 600 },

    { type: 'narrate', text: 'You decide to take a break to clear your head.' },
    { type: 'narrate', text: 'You think to yourself \'Maybe I need some coffee\'.' },

    { type: 'choose', question: 'Where should you get your coffee?', options: [
      {
        key: 'A',
        label: 'Go to the PHS (Productivity Hydration Station) and make your own coffee',
        echo: false,
        record: { coffee: 'made' },
        locate: ['4:01PM', 'The Office Kitchen, Second Floor'],
        then: [
          { type: 'freshScreen' },
          { type: 'narrate', text: 'You walk to PHS. Your coworker Jerry notices.' },
          { type: 'say', speaker: 'Jerry', text:
            'I bet you\'re getting coffee to stay as efficient and effective ' +
            'as you always are, [player]! That\'s what I like about you. By ' +
            'the way, I put in a good word for your promotion!' }
        ]
      },
      {
        key: 'B',
        label: 'Steal your coworker Jerry\'s drink',
        echo: false,
        record: { coffee: 'stole' },
        locate: ['4:01PM', 'Jerry\'s Desk, Second Floor'],
        then: [
          { type: 'freshScreen' },
          { type: 'narrate', text:
            'You head over to Jerry\'s desk. He\'s gone. You spot his thermos ' +
            'he\'s been sipping out of all day. You take a sip, and it\'s bad. ' +
            'Is this even coffee? You quietly put it back on his desk.' },
          { type: 'narrate', text: 'Guess you have to make your own coffee.' },
          { type: 'narrate', text: 'You walk over to PHS.' }
        ]
      },
      {
        key: 'C',
        label: 'Say something else.',
        echo: false,
        openEnded: true,
        record: { coffee: 'open' },
        then: [
          { type: 'narrate', text: '\nYou consider your options.' },
          { type: 'openInput', scene: 'tutorial',
            hint: 'say anything at all',
            fallback: [
              { key: 'A', label: 'Go to the PHS and make your own coffee.',
                record: { coffee: 'made' },
                locate: ['4:01PM', 'The Office Kitchen, Second Floor'],
                then: [
                  { type: 'freshScreen' },
                  { type: 'narrate', text: 'You walk to PHS. Your coworker Jerry notices.' },
                  { type: 'say', speaker: 'Jerry', text:
                    'I bet you\'re getting coffee to stay as efficient and ' +
                    'effective as you always are, [player]! That\'s what I ' +
                    'like about you. By the way, I put in a good word for ' +
                    'your promotion!' }
                ] },
              { key: 'B', label: 'Steal Jerry\'s drink.',
                record: { coffee: 'stole' },
                locate: ['4:01PM', 'Jerry\'s Desk, Second Floor'],
                then: [
                  { type: 'freshScreen' },
                  { type: 'narrate', text:
                    'You head over to Jerry\'s desk. He\'s gone. You spot his ' +
                    'thermos he\'s been sipping out of all day. You take a ' +
                    'sip, and it\'s bad. Is this even coffee? You quietly put ' +
                    'it back on his desk.' },
                  { type: 'narrate', text: 'Guess you have to make your own coffee.' },
                  { type: 'narrate', text: 'You walk over to PHS.' }
                ] }
            ] }
        ]
      }
    ]},

    { type: 'continue' },
    { type: 'freshScreen' },

    /* ---- the kitchen -------------------------------------------------- */
    { type: 'locate', time: '4:05PM', location: 'Office Kitchen, Second Floor' },

    { type: 'narrate', text: 'You spot your manager, Rachel, in the kitchen.' },
    { type: 'narrate', text: 'Why is she in the kitchen?' },
    { type: 'narrate', text:
      'She\'s hovering over a handful of whiteboard markers, a few notebooks, ' +
      'and some sticky notes. She obviously just finished running a brainstorm ' +
      'meeting and then made a fresh cup of coffee.' },

    { type: 'say', speaker: 'Rachel', text: 'Hey [player]. How\'s it going?' },

    { type: 'narrate', text: 'You talk about the weather.' },
    { type: 'narrate', text:
      'Rachel continues chatting while the coffee machine cranks out your ' +
      'quadruple shot cappuccino with protein milk.' },
    { type: 'narrate', text: 'The machine beeps. Your coffee is ready.' },
    { type: 'narrate', text:
      'You and Rachel start to head back to your desks. As Rachel gathers the ' +
      'brainstorm materials, she realizes she can\'t hold all of her materials ' +
      'and her coffee mug at the same time.' },

    { type: 'say', speaker: 'Rachel', text:
      'Shoot, [player], would you mind helping me bring my coffee back to my desk?' },

    { type: 'narrate', text:
      'You glance down. All you\'re holding is the mug of coffee you just brewed.' },
    { type: 'narrate', text: 'Rachel looks at you expectantly.' },

    { type: 'choose', question: 'Do you carry her coffee?', options: [
      {
        key: 'A',
        label: 'Oh, sure.',
        record: { carriedCoffee: 'yes' },
        suddenEnding: 'coffee',
        then: [
          { type: 'freshScreen' },
          { type: 'say', speaker: 'Rachel', text:
            'Thanks, [player]! This was all I needed to see from you. This was ' +
            'the only Replak Core Value (RCV) that you hadn\'t exemplified ' +
            'within the last 90 days: We carry each other\'s coffee. ' +
            'Congratulations on your promotion to Senior Product Manager.' }
        ]
      },
      {
        key: 'B',
        label: 'Sorry, no.',
        record: { carriedCoffee: 'no' },
        then: [
          { type: 'freshScreen' },
          { type: 'say', speaker: 'Rachel', text:
            'Oh okay, that\'s understandable. I appreciate you letting me know.' },
          { type: 'narrate', text:
            'You walk back with Rachel, who spills her coffee all over the ' +
            'floor just before reaching her desk.' }
        ]
      },
      {
        key: 'C',
        label: 'Say something else.',
        echo: false,
        openEnded: true,
        record: { carriedCoffee: 'open' },
        then: [
          { type: 'narrate', text: '\nRachel waits.' },
          { type: 'openInput', scene: 'carryCoffee',
            hint: 'say anything at all',
            fallback: [
              { key: 'A', label: 'Oh, sure.',
                record: { carriedCoffee: 'yes' },
                suddenEnding: 'coffee',
                then: [
                  { type: 'freshScreen' },
                  { type: 'say', speaker: 'Rachel', text:
                    'Thanks, [player]! This was all I needed to see from ' +
                    'you. This was the only Replak Core Value (RCV) that ' +
                    'you hadn\'t exemplified within the last 90 days: We ' +
                    'carry each other\'s coffee. Congratulations on your ' +
                    'promotion to Senior Product Manager.' }
                ] },
              { key: 'B', label: 'Sorry, no.',
                record: { carriedCoffee: 'no' },
                then: [
                  { type: 'freshScreen' },
                  { type: 'say', speaker: 'Rachel', text:
                    'Oh okay, that\'s understandable. I appreciate you ' +
                    'letting me know.' },
                  { type: 'narrate', text:
                    'You walk back with Rachel, who spills her coffee all ' +
                    'over the floor just before reaching her desk.' }
                ] }
            ] }
        ]
      }
    ]},

    { type: 'continue' }
  ];

  /* ======================================================================
     SCENARIO 0 — leadership leads want ROI (meeting)
     ----------------------------------------------------------------------
     NOT YET WRITTEN. brainstorm.pdf p7 carries only the heading:
         "SCENARIO 0 BEGINS - leadership leads want ROI (meeting)"
         "Meeting where (put into top narrative)"
     Add beats to this array when the scene exists — main.js already sequences
     it and skips it while empty, so nothing else needs to change.
     ==================================================================== */

  S.scenario0 = [];

  /* ======================================================================
     SCENARIO 1 — the escalation email
     ==================================================================== */

  S.scenario1 = [
    { type: 'freshScreen' },
    { type: 'locate', time: '4:27PM', location: 'Your Desk, Second Floor' },
    { type: 'fx', name: 'slackPing' },

    { type: 'narrate', text:
      'You check your calendar and you have a 30-minute sync meeting with ' +
      'Rachel and Jerry that starts in a few minutes.' },
    { type: 'narrate', text:
      'Just as you\'re about to use the bathroom before your meeting, you ' +
      'receive a chat message from Jerry.' },

    { type: 'say', speaker: 'Jerry', text:
      'hey [player]. Going to cc you on an email thread with one of my ' +
      'customers because I think you have more context. Could you respond ' +
      'before our sync? It\'s urgent. Thanks!' },

    { type: 'narrate', text: 'You open the email.' },

    { type: 'email',
      from: 'chris@clientcustomercompanyai.com',
      subject: '[Escalation] Did Replak.AI introduce a bug into its product this morning?',
      body:
        'Hi Jerry,\n\n' +
        'Did you release a new feature recently?\n\n' +
        'We got a flag that employees feel like their privacy is being\n' +
        'breached. Is there a known issue on your end? Please let me know ASAP.\n\n' +
        'Thanks,\n' +
        'Chris' },

    { type: 'narrate', text:
      'This is definitely referencing a feature that you launched this morning.' },

    { type: 'choose', question: 'What do you do?', options: [
      {
        key: 'A',
        label: 'Walk away from the desk and pretend you didn\'t see the message or the email.',
        echo: false,
        record: { emailChoice: 'ignored' },
        then: [
          { type: 'freshScreen' },
          { type: 'narrate', text:
            'You walk away and pretend you didn\'t see anything. As you walk ' +
            'to the bathroom, you pass by Jerry, who waves at you and smiles.' },
          { type: 'say', speaker: 'Jerry', text:
            'Hey, I saw the read receipt on my chat message to you. I\'m ' +
            'guessing you read the email I forwarded too. I think that\'s ' +
            'really smart of you to not respond too quickly so that you can ' +
            'draw protective boundaries around your work and time. I learn so ' +
            'much from you!' },
          { type: 'narrate', text: 'You\'re getting close to the end of the work day…' }
        ]
      },
      {
        key: 'B',
        label: 'Blame Jerry.',
        echo: false,
        record: { emailChoice: 'blamed' },
        then: [
          { type: 'freshScreen' },
          { type: 'narrate', text:
            'You respond to the email by saying that this is Jerry\'s fault ' +
            'and ask to be removed from the email thread.' },
          { type: 'narrate', text: 'You receive another message from Jerry.' },
          { type: 'say', speaker: 'Jerry', text:
            'Hey, that last email from you…thank you for giving me an ' +
            'opportunity to step up with a customer. I can demonstrate that ' +
            'just in time for this upcoming promotion cycle. Thanks [player]!' },
          { type: 'narrate', text: 'You\'re doing great at Replak.ai.' }
        ]
      },
      {
        key: 'C',
        label: 'Write your own reply.',
        echo: false,
        openEnded: true,
        record: { emailChoice: 'open' },
        then: [
          { type: 'narrate', text: '\nYou start typing.' },
          { type: 'openInput', scene: 's1',
            hint: 'write whatever you like — it will not go badly for you',
            fallback: [
              { key: 'A', label: 'Walk away and pretend you didn\'t see it.',
                record: { emailChoice: 'ignored' },
                then: [
                  { type: 'say', speaker: 'Jerry', text:
                    'Saw the read receipt. Drawing protective boundaries ' +
                    'around your focus time — I learn so much from you!' }
                ] },
              { key: 'B', label: 'Blame Jerry.',
                record: { emailChoice: 'blamed' },
                then: [
                  { type: 'say', speaker: 'Jerry', text:
                    'Thank you for giving me an opportunity to step up with a ' +
                    'customer. Thanks [player]!' }
                ] }
            ] }
        ]
      }
    ]},

    { type: 'continue' }
  ];

  /* ======================================================================
     SCENARIO 2 — does Jamie take responsibility, or blame others?
     ==================================================================== */

  S.scenario2 = [
    { type: 'freshScreen' },
    { type: 'locate', time: '4:31PM', location: 'Meeting Room #024, Second Floor' },

    { type: 'narrate', text:
      'You enter the meeting room. Rachel and Jerry are already there. It\'s a ' +
      'team meeting: you and Jerry both report to Rachel.' },

    { type: 'say', speaker: 'Rachel', text:
      'Jerry just forwarded me an email from Chris. Sounds like some privacy ' +
      'flag? Information leakage? What is going on?' },

    { type: 'narrate', text:
      'This is related to the feature you launched this morning.' },

    { type: 'choose', question: 'What do you tell Rachel?', options: [
      {
        key: 'A',
        label: 'This is related to the feature I launched this morning.',
        echo: false,
        record: { blameChoice: 'owned' },
        suddenEnding: 'ownedIt',
        then: [
          { type: 'freshScreen' },
          { type: 'say', speaker: '[player]', text:
            'Yeah, this is the feature I launched this morning. It screenshots ' +
            'the employee\'s computer screen and a random conversation from ' +
            'their personal phone every 30 seconds and sends it to their ' +
            'manager over work chat.' },
          { type: 'say', speaker: 'Rachel', text:
            'That\'s amazing! No wonder engagement has been through the roof ' +
            'today. That\'s definitely worthy of getting a Replak Core Value ' +
            'named after you. How about this: Be like [player]. I think we ' +
            'should file a patent!' }
        ]
      },
      {
        key: 'B',
        label: 'It was Jerry\'s idea.',
        echo: false,
        record: { blameChoice: 'blamedJerry' },
        then: [
          { type: 'freshScreen' },
          { type: 'say', speaker: '[player]', text:
            'Yeah, this is the feature I launched this morning. It screenshots ' +
            'the employee\'s computer screen and a random conversation from ' +
            'their personal phone every 30 seconds and sends it to their ' +
            'manager over work chat.' },
          { type: 'say', speaker: '[player]', text: 'It was Jerry\'s idea.' },
          { type: 'say', speaker: 'Jerry', text: 'What?' },
          { type: 'say', speaker: 'Rachel', text:
            '[player], this feature is amazing! Engagement has been through ' +
            'the roof today. And it really shows what a great teammate and ' +
            'collaborator you are that you\'re recognizing Jerry\'s ' +
            'contributions.' },
          { type: 'say', speaker: 'Jerry', text: 'Thank you, [player]!' }
        ]
      },
      {
        key: 'C',
        label: 'Say something else.',
        echo: false,
        openEnded: true,
        record: { blameChoice: 'open' },
        then: [
          { type: 'narrate', text: '\nRachel waits.' },
          { type: 'openInput', scene: 's2',
            hint: 'say anything at all',
            fallback: [
              { key: 'A', label: 'This is related to the feature I launched this morning.',
                record: { blameChoice: 'owned' },
                suddenEnding: 'ownedIt',
                then: [
                  { type: 'say', speaker: 'Rachel', text:
                    'That\'s amazing! Worthy of a Replak Core Value named ' +
                    'after you. Be like [player]. I think we should file a patent!' }
                ] },
              { key: 'B', label: 'It was Jerry\'s idea.',
                record: { blameChoice: 'blamedJerry' },
                then: [
                  { type: 'say', speaker: 'Jerry', text: 'What?' },
                  { type: 'say', speaker: 'Rachel', text:
                    'It really shows what a great collaborator you are that ' +
                    'you\'re recognizing Jerry\'s contributions.' }
                ] }
            ] }
        ]
      }
    ]},

    { type: 'continue' }
  ];

  /* ======================================================================
     SCENARIO 3 — keeping ahead of the competition
     Every road leads to the malware. That is the point.
     ==================================================================== */

  S.scenario3 = [
    { type: 'freshScreen' },
    { type: 'locate', time: '4:35PM', location: 'Meeting Room #024, Second Floor' },

    { type: 'narrate', text:
      'Rachel pulls up a social media post saying that Replak.ai\'s main ' +
      'competitor is copying the new screenshot feature. That was fast.' },

    { type: 'say', speaker: 'Rachel', text:
      'Look, we need to show Replak.ai leadership that we\'re on top of this. ' +
      'How do we keep ahead of the competition no matter what?' },

    { type: 'choose', question: 'What do you suggest to Rachel?', options: [
      {
        key: 'A',
        label: 'Install malware on their computers.',
        record: { sabotage: 'malware' },
        then: [
          { type: 'say', speaker: 'Rachel', text:
            'I think this can make sense as long as it\'s done discreetly. We ' +
            'just need a good \'way out\'. Wow this is so exciting this feels ' +
            'like a true white collar crime. Let\'s spend the rest of this ' +
            'meeting on building the malware. How hard could it be?' }
        ]
      },
      {
        key: 'B',
        label: 'Break and enter their offices and destroy their computers.',
        record: { sabotage: 'breakIn' },
        then: [
          { type: 'say', speaker: 'Rachel', text:
            'I like it, but I think it might be hard to pull off.' },
          { type: 'say', speaker: 'Rachel', text:
            'Didn\'t you suggest we install malware on their computers last ' +
            'week? Let\'s go with that. I think that could be good. Let\'s get ' +
            'it done by the end of this meeting. How hard could it be?' }
        ]
      },
      {
        key: 'C',
        label: 'Suggest something else.',
        echo: false,
        openEnded: true,
        record: { sabotage: 'open' },
        then: [
          { type: 'narrate', text: '\nRachel leans forward.' },
          { type: 'openInput', scene: 's3',
            hint: 'suggest anything — it will become the malware',
            fallback: [
              { key: 'A', label: 'Install malware on their computers.',
                record: { sabotage: 'malware' },
                then: [
                  { type: 'say', speaker: 'Rachel', text:
                    'Discreetly, though. This feels like a true white collar ' +
                    'crime. How hard could it be?' }
                ] },
              { key: 'B', label: 'Break and enter their offices.',
                record: { sabotage: 'breakIn' },
                then: [
                  { type: 'say', speaker: 'Rachel', text:
                    'Hard to pull off. Let\'s go with the malware idea you had ' +
                    'last week. How hard could it be?' }
                ] }
            ] }
        ]
      }
    ]},

    { type: 'continue' }
  ];

  /* ======================================================================
     SCENARIO 4 — Jerry has doubts. The plan proceeds anyway.
     ==================================================================== */

  S.scenario4 = [
    { type: 'freshScreen' },
    { type: 'locate', time: '4:55PM', location: 'Meeting Room #024, Second Floor' },

    { type: 'narrate', text:
      'You, Rachel, and Jerry furiously type away. You\'re trying to hit this ' +
      '5:00PM deadline to install malware on the competitor\'s computers.' },
    { type: 'fx', name: 'typingIntensify' },
    { type: 'narrate', text:
      'Suddenly, Jerry\'s face goes blank. He gets up, walks over to your desk, ' +
      'and whispers in your ear.' },

    { type: 'say', speaker: 'Jerry', text:
      'Hey [player]. Is this… right? It feels like this attack could get us ' +
      'all fired.' },

    { type: 'choose', question: 'What do you say to Jerry?', options: [
      {
        key: 'A',
        label: 'Jerry, get your head in the game.',
        record: { jerryDoubt: 'focus' },
        then: [
          { type: 'say', speaker: 'Jerry', text: 'You\'re right. I need to focus.' },
          { type: 'narrate', text:
            'Jerry takes his thermos and chugs down the remainder of what was in it.' },
          { type: 'say', speaker: 'Jerry', text: 'Glad I packed my vodka today.' }
        ]
      },
      {
        key: 'B',
        label: 'You push Jerry to the front line.',
        record: { jerryDoubt: 'frontline' },
        then: [
          { type: 'say', speaker: 'Jerry', text: 'I needed the push. Thanks, [player].' },
          { type: 'narrate', text:
            'Jerry takes his thermos and chugs down the remainder of what was in it.' },
          { type: 'say', speaker: 'Jerry', text: 'Glad I packed my vodka today.' }
        ]
      },
      {
        key: 'C',
        label: 'Say something else to Jerry.',
        echo: false,
        openEnded: true,
        record: { jerryDoubt: 'open' },
        then: [
          { type: 'narrate', text: '\nJerry waits, very close to your ear.' },
          { type: 'openInput', scene: 's4',
            hint: 'whatever you say, the malware ships',
            fallback: [
              { key: 'A', label: 'Jerry, get your head in the game.',
                record: { jerryDoubt: 'focus' },
                then: [
                  { type: 'say', speaker: 'Jerry', text: 'You\'re right. I need to focus.' },
                  { type: 'narrate', text: 'Jerry drains his thermos.' },
                  { type: 'say', speaker: 'Jerry', text: 'Glad I packed my vodka today.' }
                ] },
              { key: 'B', label: 'You push Jerry to the front line.',
                record: { jerryDoubt: 'frontline' },
                then: [
                  { type: 'say', speaker: 'Jerry', text: 'I needed the push. Thanks, [player].' },
                  { type: 'narrate', text: 'Jerry drains his thermos.' },
                  { type: 'say', speaker: 'Jerry', text: 'Glad I packed my vodka today.' }
                ] }
            ] }
        ]
      }
    ]},

    { type: 'continue' }
  ];

  /* ======================================================================
     SCENARIO 5 — the CEO. Jamie absolutely cannot get fired.
     ==================================================================== */

  S.scenario5 = [
    { type: 'freshScreen' },
    { type: 'locate', time: '5:02PM', location: 'Your Desk, Second Floor' },

    { type: 'narrate', text:
      'Somehow, with the blessing of all Replak.ai shareholders, you, Rachel, ' +
      'and Jerry manage to pull it off by the end of the meeting: there is ' +
      'now malware installed on the competitor\'s computers.' },

    { type: 'say', speaker: 'Rachel', text:
      'We did it!!! Way to go, both of you. Proud to be your manager. I think ' +
      'our leadership will be excited that we\'ve done everything it takes to ' +
      'stay ahead of the competition.' },

    { type: 'narrate', text:
      'You go back to your desk and ask yourself if you want to get another ' +
      'coffee. Just as you\'re about to head to the PHS, you receive a sudden ' +
      'influx of messages and pings. You spot Rachel running over to you.' },

    { type: 'fx', name: 'slackPing' },

    { type: 'say', speaker: 'Rachel', text:
      'Shoot. People are posting online about this malware attack. This is ' +
      'looking really bad. We really shouldn\'t have done this, [player]. The ' +
      'CEO is asking what happened and who did this.' },

    { type: 'narrate', text:
      'In the sea of text flooding your screen, you see a chat message from ' +
      'your CEO.' },

    { type: 'chat', from: 'CEO', text:
      'Hey [player]. I\'m getting reports of us installing malware on ' +
      'competitors\' computers. Did you do this?' },

    { type: 'choose', question: 'How do you respond back to your CEO?', options: [
      {
        key: 'A',
        label: 'This is my chance to get fired — own the mistakes and take a graceful exit.',
        echo: false,
        record: { ceoAnswer: 'owned' },
        then: [
          { type: 'say', speaker: '[player]', text:
            'Hey yea, that was me. I understand that this is a fireable ' +
            'offense and you will have to let me go.' },
          { type: 'say', speaker: 'CEO', text:
            'Let you go? [player], this is incredible work! I\'m so impressed ' +
            'by your out-of-the-box thinking and your instinct for doing ' +
            'whatever it takes to destroy the competition. That\'s really ' +
            'demonstrating Replak Core Value #5: If need be, install malware. ' +
            'If anything, you\'re getting instantly promoted because of this!' }
        ]
      },
      {
        key: 'B',
        label: 'No, I was forced into this. I never agreed to this.',
        echo: false,
        record: { ceoAnswer: 'forced' },
        then: [
          { type: 'say', speaker: '[player]', text:
            'No, I was part of this, but I was forced into it by Rachel.' },
          { type: 'say', speaker: 'CEO', text:
            'Classic Rachel. I understand it\'s hard to say no to your ' +
            'manager. In any case, though: this is great work by you all! I\'m ' +
            'sure we can spin the story to make us look good. You have a long ' +
            'career ahead of you here. With these successes under your belt, ' +
            'you could be CEO one day!' }
        ]
      },
      {
        key: 'C',
        label: 'Answer in your own words.',
        echo: false,
        openEnded: true,
        record: { ceoAnswer: 'open' },
        then: [
          { type: 'narrate', text: '\nThe cursor blinks in the reply box.' },
          { type: 'openInput', scene: 's5',
            hint: 'there is no answer here that gets you fired',
            fallback: [
              { key: 'A', label: 'Own it and take a graceful exit.',
                record: { ceoAnswer: 'owned' },
                then: [
                  { type: 'say', speaker: 'CEO', text:
                    'Let you go? This is incredible work! Replak Core Value ' +
                    '#5: If need be, install malware. You\'re getting promoted!' }
                ] },
              { key: 'B', label: 'Say you were forced into it.',
                record: { ceoAnswer: 'forced' },
                then: [
                  { type: 'say', speaker: 'CEO', text:
                    'Classic Rachel. Great work by you all — you could be CEO ' +
                    'one day!' }
                ] }
            ] }
        ]
      }
    ]},

    { type: 'continue' }
  ];

  /* ======================================================================
     EPILOGUE — 17 years later
     ==================================================================== */

  S.epilogue = [
    { type: 'fx', name: 'staticFlip' },
    { type: 'freshScreen' },
    { type: 'locate', time: '17 YEARS LATER', location: 'The Penthouse, Top Floor' },

    { type: 'narrate', text:
      'It\'s been 17 years since "the attack". Yea… those 17 years weren\'t too ' +
      'different from the day you lived out. And tomorrow you\'ll become the ' +
      'next CEO of the company. Honestly, it wasn\'t a bad life.' },

    { type: 'narrate', text:
      'You take a sip from Jerry\'s thermos looking out from your penthouse ' +
      'situated at the top floor of Replak.ai office which now is the highest ' +
      'building in the city.' },

    { type: 'narrate', text:
      'You look to the wall, and you see the Replak plaques you have ' +
      'accumulated. There are a great many of them.' },

    { type: 'wait', ms: 700 },

    { type: 'narrate', text:
      'Jerry wanders into the kitchen sleepily.' },

    { type: 'say', speaker: 'Jerry', text: '[player], where did you go?' },

    { type: 'say', speaker: '[player]', text: 'Jerry, get back to your desk.' },

    { type: 'wait', ms: 900 },

    { type: 'fx', name: 'clockOut' },
    { type: 'narrate', text: 'You failed to get fired.', speed: 46 },

    { type: 'wait', ms: 900 },
    { type: 'marker', text: 'THE END' },
    { type: 'restart', label: '[ PLAY AGAIN ]' }
  ];

  return S;
})();
