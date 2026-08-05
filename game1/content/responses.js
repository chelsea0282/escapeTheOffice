/* ============================================================================
   CONTENT — AUTHORED RESPONSE POOLS
   ----------------------------------------------------------------------------
   The game has no LLM. `js/responder.js` classifies the player's free text into
   an intent and decides accept/reject; this file supplies the words.

   Shape:  ESC.responses[scene][slot] = [ ...variants ]
   Lookup: ESC.responses.pick(scene, slot, turn)   // rotates by turn, no RNG

   Every string may contain [] tokens — they are resolved by state.interpolate()
   before display, so `[player]` and `[insert time]` work here too.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.responses = {

  /* ======================================================================
     SHARED — used by every open-input scene
     ==================================================================== */
  shared: {

    /* Blatantly nonsensical input. The brief calls this out as its own
       reusable mechanic: reject it, cost a minute, don't burn a turn. */
    nonsense: [
      'INPUT NOT RECOGNIZED AS WORKPLACE-APPROPRIATE. Rephrase.',
      'PARSE FAILURE. The System logged the attempt and the time it cost you.',
      'That is not a sentence this office is equipped to receive.',
      'REPLAK.AI could not map your response to a known professional intent.',
      'Response discarded. Productivity impact: minimal. Time impact: not minimal.'
    ],

    /* Narrator asides that accompany a nonsense rejection. */
    nonsenseNarration: [
      'The cursor blinks at you with something close to disappointment.',
      'The words leave your fingers and do not arrive anywhere.',
      'You read it back. It is, on reflection, not what you meant.',
      'Somewhere in the building, a server declines to think about this.'
    ],

    /* The surreal "warping" the brief asks for when input gets absurd. */
    warp: [
      'For a moment the letters on your screen arrange themselves into your own name, then look away.',
      'The office lights dim by exactly one percent. Nobody else reacts. Nobody else ever reacts.',
      'Your reflection in the monitor finishes typing slightly before you do.',
      'The clock on the wall ticks backward once, politely, and then resumes.',
      'Every open tab in your browser is now the same tab. It has always been the same tab.',
      'You hear the typing around you resolve, briefly, into a rhythm you recognize as your own heartbeat.',
      'The ceiling tile above your desk is missing. It was never there. It is there again.'
    ],

    /* Trying to walk away from the desk. Costs a minute, changes nothing. */
    move: [
      'You push your chair back a few inches. That is as far as this goes right now. You stay at your desk.',
      'You stand halfway up, remember the open thread, and sit back down.',
      'You get as far as the edge of your desk before the weight of the unanswered message pulls you back.',
      'Your legs comply. The rest of the situation does not. You stay at your desk.'
    ],

    /* Inspecting something that isn't in the appendix. */
    inspectUnknown: [
      'You look. There is nothing there worth the minute it just cost you.',
      'Whatever you were looking for is not on this floor.',
      'You scan the desk for it and find only the things that were already there.'
    ],

    /* Prefix shown when an inspect DOES resolve to an appendix entry. */
    inspectLead: [
      'You look closer.',
      'You let your eyes rest on it a second longer than you meant to.',
      'You take it in.'
    ]
  },

  /* ======================================================================
     SCENARIO 1 — JERRY
     "Prioritizing the Alignment Roadmap" vs "Aligning the Priority Roadmap"
     ==================================================================== */
  s1: {
    speaker: 'Jerry',

    /* Player defers to Rachel / messages Rachel. −5 min, launch blocker. */
    comply: [
      'Good call, I\'ll loop Rachel in. Give me a sec.\n\n...\n\nOk she got back to me. She says this is a launch blocker — the feature can\'t launch until both are in. So. Both. Cool cool cool.',
      'Yeah, let\'s just get Rachel to call it. Hang on.\n\n...\n\nRachel says launch blocker. Both features have to be in before we ship. That\'s that, I guess.'
    ],

    /* Player justifies the product decision and it lands. −1 min. */
    justifyAccepted: [
      'Ok. Yeah, that actually tracks. I can take that to engineering — I\'ll write it up so it sounds like it came from a roadmap and not from a person.',
      'Right, that makes sense. I\'ll carry that to eng and frame it as the call. You don\'t have to be in that thread.',
      'Ok, I buy it. I\'ll take the action item. Honestly that\'s the first sentence today that had a reason inside it.'
    ],

    /* Player justifies but it's thin. Generates another turn. */
    justifyRejected: [
      'Mm. I hear you, but leadership is going to ask me *why*, and right now I\'d be repeating a vibe. Can you give me something I can put in a doc?',
      'Ok but what do I say when someone asks what changed? "Jamie felt strongly" is not going to survive contact with the shareholder deck.',
      'I\'m not pushing back to be annoying. I genuinely can\'t defend this upward as stated. What\'s the actual reasoning?',
      'That\'s directionally fine but it\'s not a rationale, it\'s a preference with good posture. One more pass?'
    ],

    /* Player tries to duck the whole thing. */
    avoid: [
      'I don\'t think we can punt this one. EVERYTHING is blocked until it\'s resolved, and I do mean everything, I checked.',
      'Normally I\'d let it slide but this is the thing the leads are watching. Can you give me anything?',
      'Jamie. I\'m on your side here. But "later" is not a priority order.'
    ],

    /* Player introduces detail that isn't established. Extra skepticism. */
    offScript: [
      'Wait, since when? That\'s new to me and I sit in the same standups you do. Where is that written down?',
      'Hold on — I don\'t have any of that context. If that\'s real it changes things, but I need you to walk me through it.',
      'That\'s the first I\'m hearing of that. I\'m not saying no. I\'m saying prove it exists.'
    ],

    /* Turn budget exhausted → the fail state the brief specifies. */
    failout: [
      'Ok, I\'m going to stop taking your time. I\'ll just ask Rachel.\n\n...\n\nShe says launch blocker. Both features in before launch. Sorry, I know that\'s the answer neither of us wanted.'
    ],

    /* Player asks Jerry a question / probes the scene. */
    inspectFallback: [
      'The Perceived Forward Momentum Index? Honestly I think someone made it up in a deck and now it has a dashboard.',
      'Don\'t ask me what the difference is between the two options. I asked. There is a document. The document also does not know.'
    ]
  },

  /* ======================================================================
     SCENARIO 2 — RACHEL
     "Take a stab by EOD and set up a follow up Standing meeting around 5pm"
     ==================================================================== */
  s2: {
    speaker: 'Rachel',

    /* Compliant. −3 min. */
    comply: [
      'Perfect, thank you. I\'ll let the others know it\'s handled. I appreciate you picking this up on short notice.',
      'Great — thank you. Send the invite and I\'ll take it from there. I know it\'s late in the day.'
    ],

    /* Grounded pushback that Rachel accepts. −1 min. */
    justifyAccepted: [
      'Ok. That\'s fair, and you\'re right that the timelines are the actual ask. I\'ll handle the client on the AR question. Send me the committed-feature dates and we\'ll call it done.',
      'You know what, that\'s reasonable. I\'ll take the scheduling. If you can give me where the search bar and notifications actually land, that\'s the part only you have.',
      'Understood. I\'d rather have the real dates than a meeting about the dates. Go ahead.'
    ],

    /* Pushback Rachel doesn't accept — generates a turn. */
    justifyRejected: [
      'I want to be flexible here, but help me understand. What specifically makes today not possible?',
      'I hear that. Can you say more? I\'m going to have to explain this to the client and right now I don\'t have the shape of it.',
      'Hm. I don\'t think that\'s quite it. Try me again — what\'s the actual constraint?'
    ],

    avoid: [
      'Jamie, I need something from you here. Can you explain what\'s going on?',
      'I\'d rather you tell me you can\'t than tell me nothing. What\'s the situation?',
      'This is a two-minute reply and a calendar invite. If it isn\'t, I need to know why it isn\'t.'
    ],

    /* Player asks what the email actually is. */
    askEmail: [
      'It\'s a pretty quick response, honestly. The client is asking about an augmented reality feature — point your phone at an exhibit, see 3D content. Next week, they say. You basically need to acknowledge and confirm timelines on what we already committed to, the search bar and notifications, but you have to explain how some of the user flows will work. I\'ll handle telling them AR isn\'t happening by next week.'
    ],

    offScript: [
      'I don\'t have that context. Where is this coming from? I\'m not dismissing it, I just can\'t act on something I\'m hearing for the first time at 4:30.',
      'That\'s new information. If it\'s accurate it matters — but you\'ll need to give me more than the headline.',
      'Hold on. None of that has come through any channel I\'m on. Walk me through it properly.'
    ],

    /* Turn budget exhausted → default: reply to the email, −5. */
    failout: [
      'Ok. Let\'s not spend more of your evening on this in the abstract. Just reply to the email — the client thread, the one about the timelines. Once that\'s sent we\'re square for today.'
    ],

    /* Other edge cases → reject the action, −1. */
    reject: [
      'I don\'t think that\'s something we can do here.',
      'That\'s not really on the table, I\'m afraid.',
      'Let\'s stay on this one thing and then you can go.'
    ]
  },

  /* ======================================================================
     SCENARIO 3 — THE PORCUPINE
     Blocking the lobby doors, wearing a Replak.AI badge.
     ==================================================================== */
  s3: {
    speaker: 'Porcupine',

    /* Player gives a genuine account of the project's state. Satisfies it. */
    comply: [
      'Hm. Hm! Ok. That is a real answer, and I did not expect a real answer.\n\nI will note in the system that my KPIs are, at minimum, being thought about. That is more than most people give me.\n\nGo. Go before I grow another quill about it.',
      'You know, nobody ever tells me the actual status. They tell me the status of the status.\n\nFine. Fine! You may pass. Enjoy your... whatever it is you\'re late for.'
    ],

    /* Player tries to leave or refuses to engage. −1 each, no passage. */
    refuse: [
      'The porcupine does not move. The porcupine has nowhere else to be. That is, in fact, its entire advantage over you.',
      'It shifts its weight to the other three feet and continues to occupy the doorway with real institutional confidence.',
      'You step left. It steps left. You step right. It has already stepped right. It has done this before.',
      'It taps the Replak.AI badge on its chest, slowly, the way a bouncer taps a sign.'
    ],

    /* Player questions whether this is real. Narrator insists. −1. */
    reality: [
      'It is happening. The porcupine is here, the badge is laminated, and the lobby smells faintly of carpet shampoo. Your feet hurt. Everything is as real as it has been all day.',
      'You are not asleep. You checked. The checking cost you a minute, but you checked.',
      'This is the part where you would normally wake up. You do not. The doors stay blocked.'
    ],

    /* Player interrogates the porcupine itself. −1. */
    question: [
      'I\'m a porcupine. Like, as in Project Porcupine. I don\'t make the naming conventions, I only enforce them.',
      'Do I have a manager? Everyone has a manager. Mine is a spreadsheet.',
      'Whether I am a metaphor is above my pay grade and yours. Answer the question about my KPIs.',
      'I became a porcupine the way anyone becomes anything. Someone put it in a deck and then it was true.'
    ],

    /* Player is evasive but still talking. */
    deflect: [
      'That is a lot of words that do not contain a completion percentage.',
      'You\'re doing the thing where you answer a different, easier question. I\'ve been in standups. I know the move.',
      'Mm. And my KPIs?'
    ],

    /* EASTER EGG: claim the project is already finished. */
    lie: [
      'Done?\n\nDONE?\n\nOh. Oh, that\'s — nobody has ever said that to me. Nobody has ever once said that to me.'
    ],

    /* Mercy valve: it runs out of patience before you run out of stubbornness. */
    failout: [
      'You know what? No.\n\nI have quills and I have time and you have neither, but I am *bored*. I have been standing in a lobby all day being a metaphor at people.\n\nGo. Go on. I\'ll put in the system that you were "engaged with the material". I\'ll lie for you. That\'s what we do here.'
    ]
  }
};

/* ---------------------------------------------------------------------------
   pick(scene, slot, turn) — deterministic rotation, so the same run is
   reproducible and repeated intents don't repeat the same sentence.
   ------------------------------------------------------------------------ */
ESC.responses.pick = function (scene, slot, turn) {
  var bucket = (ESC.responses[scene] && ESC.responses[scene][slot]) ||
               (ESC.responses.shared && ESC.responses.shared[slot]);
  if (!bucket || !bucket.length) return '';
  return bucket[(turn || 0) % bucket.length];
};
