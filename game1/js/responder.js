/* ============================================================================
   RESPONDER — the scripted stand-in for the LLM
   ----------------------------------------------------------------------------
   The brief has the game "call an LLM model to evaluate the responses of the
   player" during <Open input response:> sections. This build has no model, so
   this file does that job deterministically:

       classify intent  ->  score the reasoning  ->  apply the scene's rubric

   Everything tunable lives in LEXICON and RUBRICS at the top. The prose lives
   in content/responses.js. Nothing here writes to the DOM.

   The scoring that matters most: a justification is judged by whether it is
   GROUNDED — whether it uses terms that actually exist in this fictional world
   (see ESC.world.groundingTerms). Vague conviction scores low; "the search bar
   and notifications are the committed features" scores high. That is the whole
   trick that lets a keyword engine feel like it is reading for meaning.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.responder = (function () {

  /* ======================================================================
     LEXICON — edit these to change what the game understands
     ==================================================================== */

  var LEXICON = {

    comply: [
      'ok', 'okay', 'fine', 'sure', 'yes', 'yeah', 'yep', 'will do', 'on it',
      'i\'ll do', 'ill do', 'i will do', 'i can do', 'happy to', 'no problem',
      'consider it done', 'got it', 'understood', 'sounds good', 'agreed',
      'i\'ll take', 'ill take', 'i\'ll handle', 'ill handle',
      /* NB: bare "let me" is deliberately absent — it reads as compliance but
         usually introduces an inspection ("let me look at my phone"). */
      'ask rachel', 'message rachel', 'msg rachel', 'ping rachel', 'loop rachel',
      'check with rachel', 'defer to rachel', 'let rachel', 'rachel should',
      'set up', 'schedule', 'send the invite', 'send an invite', 'book',
      'calendar', 'i\'ll send', 'ill send', 'i\'ll set', 'ill set',
      'i\'ll reply', 'ill reply', 'i\'ll respond', 'ill respond'
    ],

    avoid: [
      'later', 'not now', 'tomorrow', 'next week', 'no time', 'don\'t have time',
      'dont have time', 'i have to go', 'i need to go', 'i\'m leaving', 'im leaving',
      'gotta go', 'not my job', 'not my problem', 'someone else', 'ask someone',
      'ignore', 'skip', 'pass', 'nope', 'no thanks', 'can\'t right now',
      'cant right now', 'busy', 'eod tomorrow', 'circle back', 'take it offline',
      'punt', 'defer', 'park it', 'not today',
      'refuse', 'i refuse', 'let me leave', 'let me go', 'let me out',
      'get out of my way', 'move aside', 'move out of the way', 'i\'m going',
      'im going', 'i\'m done', 'im done', 'go away', 'leave me alone'
    ],

    inspect: [
      'look at', 'look around', 'check the', 'check my', 'inspect', 'examine',
      'read the', 'open my', 'open the', 'what is the', 'what\'s the',
      'whats the', 'tell me about', 'who is', 'what about the', 'search',
      'pick up', 'glance at', 'study'
    ],

    move: [
      'walk to', 'walk over', 'go to', 'head to', 'get up', 'stand up',
      'leave my desk', 'go get', 'run to', 'step away', 'go find', 'go outside',
      'go home', 'walk out', 'wander', 'move to'
    ],

    reality: [
      'is this real', 'is this really', 'am i dreaming', 'this isn\'t real',
      'this isnt real', 'not real', 'hallucinat', 'am i awake', 'wake up',
      'is this happening', 'losing my mind', 'going crazy', 'a dream',
      'what is happening to me', 'am i okay'
    ],

    question: [
      'why are you', 'who are you', 'what are you', 'how are you',
      'why do you', 'what do you mean', 'says who', 'who told you',
      'do you have a manager', 'are you a metaphor', 'explain yourself'
    ],

    askEmail: [
      'what email', 'which email', 'what\'s the email', 'whats the email',
      'what is the email', 'about the email', 'tell me about the email',
      'what does the email', 'what did the client'
    ],

    /* Scenario 3 easter egg. These must ASSERT completion — bare words like
       "complete" are deliberately absent, so an honest status report ("the
       search bar is code complete") is not mistaken for the lie. */
    done: [
      'already done', 'is done', 'it\'s done', 'its done', 'are done',
      'all done', 'fully done', 'is finished', 'are finished', 'is complete',
      'are complete', 'we\'re done', 'were done', 'we finished', 'we completed',
      'we shipped', 'shipped it', 'we launched', 'launched it',
      'everything is done', 'nothing left', 'hit all', 'met all'
    ],

    causal: [
      'because', 'since', 'so that', 'given that', 'given the', 'the reason',
      'which means', 'therefore', 'that way', 'in order to', 'due to',
      'otherwise', 'if we', 'the tradeoff', 'trade-off', 'the risk is',
      'the impact', 'depends on'
    ],

    /* Things that cannot happen in an eighth-floor office. Drives the warp. */
    absurd: [
      'fly', 'flying', 'teleport', 'explode', 'explodes', 'dragon', 'wizard',
      'magic', 'spell', 'laser', 'time travel', 'dinosaur', 'alien', 'ghost',
      'banana', 'eat the', 'set fire', 'burn down', 'punch', 'kill', 'murder',
      'nuke', 'summon', 'portal', 'sword', 'unicorn', 'shark', 'volcano',
      'become a bird', 'zombie', 'robot uprising', 'defenestrate'
    ]
  };

  /* ======================================================================
     RUBRICS — per-scene thresholds and time costs, straight from the brief
     ==================================================================== */

  /*
     `cost` is minutes off the clock — these numbers come straight from the
     brief's bullet lists. `hp` is the attrition that keeps the second gauge
     live for the whole game: getting nowhere is tiring, and stonewalling is
     the most tiring thing of all.
  */
  var HP = { rejected: 3, nonsense: 2, move: 1, edge: 1, inspect: 0, resolved: 0 };

  var RUBRICS = {
    s1: {                         // Jerry
      speaker:   'Jerry',
      threshold: 4.0,             // how well-reasoned a justification must be
      maxTurns:  5,
      hp:        HP,
      cost: {
        comply:      5,           // messaging Rachel takes 5 minutes off
        accepted:    1,           // Jerry takes the action item
        rejected:    1,           // back-and-forth with Jerry
        failout:     5,           // Rachel's ruling comes back
        inspect:     1,
        move:        1,
        nonsense:    1,
        edge:        1
      }
    },
    s2: {                         // Rachel
      speaker:   'Rachel',
      threshold: 3.5,
      maxTurns:  5,
      hp:        HP,
      cost: {
        comply:      3,
        accepted:    1,
        rejected:    1,
        failout:     5,           // you end up replying to the email
        inspect:     1,
        move:        1,
        nonsense:    1,
        edge:        1
      }
    },
    s3: {                         // The porcupine
      speaker:   'Porcupine',
      threshold: 3.0,
      maxTurns:  6,               // mercy valve; it does not have a fail state
      hp:        HP,
      cost: {
        comply:      1,
        accepted:    1,
        rejected:    1,
        failout:     1,
        inspect:     1,
        move:        1,
        nonsense:    1,
        edge:        1
      }
    }
  };

  /* ======================================================================
     TEXT UTILITIES
     ==================================================================== */

  /* A small stoplist so "unknown word" means something. */
  var COMMON = ('a an and are as at be been but by can cant could did do does ' +
    'dont for from get go going had has have he her him his how i if in is it ' +
    'its just let me my no not now of on or our out she should so some than ' +
    'that the their them then there these they this to too up us was we were ' +
    'what when where which who why will with would you your yours am been being ' +
    'about after all also any because before both down during each few more ' +
    'most other over same such only own very will need needs want wants make ' +
    'made take takes give gives tell tells say says think thinks know knows ' +
    'time day today tomorrow yesterday morning evening tonight week month ' +
    'work working done here well right okay ok yes yeah nope sorry ' +
    'thanks thank please really actually maybe probably still even back one two ' +
    'three first next last new good bad big small long short late early ' +
    'sure fine wait stop help leave leaving go going get got put ask asks ' +
    'told tell explain because sorry never always again already almost ' +
    'anything something nothing everyone someone people thing things').split(' ');

  function norm(s) {
    return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function words(s) {
    return norm(s).replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
  }

  function hits(text, list) {
    var n = 0;
    for (var i = 0; i < list.length; i++) {
      if (text.indexOf(list[i]) !== -1) n++;
    }
    return n;
  }

  /* ======================================================================
     NONSENSE DETECTION
     The brief asks for "rejecting a blatantly nonsensical response" as its
     own reusable mechanic. Deliberately conservative — real play should
     never trip it.
     ==================================================================== */

  function isNonsense(raw) {
    var t = norm(raw);
    if (t.length < 2) return true;
    if (!/[a-z]/.test(t)) return true;                 // digits/punctuation only

    var w = words(t);
    if (!w.length) return true;

    /* Keyboard mash. Two tells: no vowels at all, or an implausible run of
       consonants ("asdkjfh"). Words the world already knows are exempt, so
       jargon never trips this. */
    var mashy = w.filter(function (x) {
      if (x.length < 4) return false;
      if (COMMON.indexOf(x) !== -1) return false;
      if (isKnownTerm(x)) return false;
      if (!/[aeiouy]/.test(x)) return true;
      return /[^aeiouy]{4,}/.test(x);
    }).length;
    if (mashy >= 1 && w.length <= 3) return true;
    if (mashy / w.length > 0.5) return true;

    /* One character held down. */
    if (/^(.)\1{4,}$/.test(t.replace(/\s/g, ''))) return true;

    /* Recognisable-word ratio: is any of this English we know? */
    var known = w.filter(function (x) {
      return COMMON.indexOf(x) !== -1 || isKnownTerm(x);
    }).length;
    if (w.length >= 3 && known === 0) return true;

    return false;
  }

  function isKnownTerm(x) {
    return ESC.world.groundingTerms.some(function (g) {
      return g.indexOf(x) !== -1 || x.indexOf(g) !== -1;
    });
  }

  /* ======================================================================
     SCORING
     ==================================================================== */

  /* How grounded is this in the actual fiction? */
  function groundingScore(t) {
    var found = 0;
    var seen = {};
    ESC.world.groundingTerms.forEach(function (g) {
      if (!seen[g] && t.indexOf(g) !== -1) { seen[g] = 1; found++; }
    });
    return Math.min(4, found);
  }

  /* How absurd? Drives the warp intensity. */
  function absurdityScore(raw) {
    var t = norm(raw);
    var score = 0;
    score += Math.min(2, hits(t, LEXICON.absurd));
    if (/(.)\1{3,}/.test(t.replace(/\s/g, ''))) score += 1;
    if (raw.length > 12 && raw === raw.toUpperCase() && /[A-Z]{6,}/.test(raw)) score += 1;
    if (/!{3,}|\?{3,}/.test(raw)) score += 1;
    return Math.min(3, score);
  }

  /* Details asserted that the world has never heard of. */
  function offScriptScore(raw) {
    var w = words(raw);
    var unknown = w.filter(function (x) {
      if (x.length < 4) return false;
      if (COMMON.indexOf(x) !== -1) return false;
      return !ESC.world.groundingTerms.some(function (g) {
        return g.indexOf(x) !== -1 || x.indexOf(g) !== -1;
      });
    });
    /* Capitalised mid-sentence words are the strongest tell: invented names. */
    var propers = (raw.match(/(?!^)\b[A-Z][a-z]{2,}/g) || []).filter(function (p) {
      var lp = p.toLowerCase();
      return ['jamie','rachel','jerry','parker','porcupine','replak','standup',
              'alignment','priority','roadmap','project','thursday'].indexOf(lp) === -1;
    });
    return Math.min(3, propers.length + (unknown.length >= 5 ? 1 : 0));
  }

  /* Overall quality of a justification. */
  function qualityScore(raw) {
    var t = norm(raw);
    var w = words(raw);
    var q = 0;
    q += groundingScore(t) * 1.5;
    q += Math.min(2, hits(t, LEXICON.causal)) * 1.2;
    if (w.length >= 8)  q += 1;
    if (w.length >= 16) q += 1;
    if (/\b\d/.test(t)) q += 0.5;              // dates, counts, percentages
    if (w.length <= 3)  q -= 1.5;              // one-word conviction
    return q;
  }

  /* ======================================================================
     INTENT CLASSIFICATION
     ==================================================================== */

  function classify(raw, scene) {
    var t = norm(raw);

    if (isNonsense(raw)) return 'nonsense';

    /* Scene-specific intents win when present — they are the most specific
       readings available. The easter egg needs a completion claim, a subject
       it plausibly refers to, and no negation hedging it. */
    if (scene === 's3' && hits(t, LEXICON.done) > 0 &&
        /\b(porcupine|project|kpis?|everything)\b/.test(t) &&
        !/\b(not|isn't|isnt|aren't|arent|almost|nearly|nowhere near|far from)\b[^.]{0,24}(done|complete|finish)/.test(t)) {
      return 'lie';
    }
    if (scene === 's2' && hits(t, LEXICON.askEmail) > 0) return 'askEmail';

    if (hits(t, LEXICON.reality) > 0) return 'reality';

    /* Questions aimed at the other party. */
    if (hits(t, LEXICON.question) > 0) return 'question';

    var scores = {
      comply:  hits(t, LEXICON.comply)  * 2,
      avoid:   hits(t, LEXICON.avoid)   * 2,
      inspect: hits(t, LEXICON.inspect) * 2.6,
      move:    hits(t, LEXICON.move)    * 2.8
    };

    /* A causal, grounded statement is a justification even without keywords.
       But grounding ALONE is weak evidence — "check the snake plant" mentions
       a real object without arguing anything. So world terms only count for
       much once there is a causal connective or real length behind them. */
    var causal = hits(t, LEXICON.causal);
    var ground = groundingScore(t);
    var wc     = words(raw).length;
    var arguing = (causal > 0 || wc >= 10);
    scores.justify = causal * 2 +
                     ground * (arguing ? 1.1 : 0.35) +
                     (wc >= 10 ? 1.5 : 0);

    /* "ok but because..." reads as justification, not bare compliance. */
    if (scores.comply > 0 && causal > 0 && words(raw).length >= 8) {
      scores.comply -= 1.5;
    }

    var best = 'justify';
    var bestScore = -Infinity;
    Object.keys(scores).forEach(function (k) {
      if (scores[k] > bestScore) { bestScore = scores[k]; best = k; }
    });

    /* Nothing scored at all: treat short input as avoidance, long as justify. */
    if (bestScore <= 0) return words(raw).length >= 8 ? 'justify' : 'avoid';

    return best;
  }

  /* ======================================================================
     PUBLIC: evaluate()
     ----------------------------------------------------------------------
     ctx = { scene: 's1'|'s2'|'s3', turn: <0-based> }

     Returns:
       intent        classified intent
       accepted      did the character buy it
       resolved      is the scene over
       consumesTurn  does this burn one of the max-5 turns
       minutes       time cost
       hp            hp cost (negative restores)
       speaker       who replies ('' = narrator)
       reply         the line to print
       narration     extra narrator lines
       warp          0..3
       appendixId    if the player inspected something real
     ==================================================================== */

  function result(over) {
    var base = {
      intent: '', accepted: false, resolved: false, consumesTurn: true,
      minutes: 0, hp: 0, speaker: '', reply: '', narration: [],
      warp: 0, appendixId: null, kind: 'say'
    };
    Object.keys(over || {}).forEach(function (k) { base[k] = over[k]; });
    return base;
  }

  function evaluate(raw, ctx) {
    var scene  = ctx.scene;
    var turn   = ctx.turn || 0;
    var R      = RUBRICS[scene];
    var intent = classify(raw, scene);
    var absurd = absurdityScore(raw);
    var offs   = offScriptScore(raw);
    var q      = qualityScore(raw);

    /* -- blatantly nonsensical: reject, cost a minute, don't burn a turn -- */
    if (intent === 'nonsense') {
      ESC.state.bump('nonsenseCount');
      return result({
        intent: 'nonsense',
        consumesTurn: false,
        minutes: R.cost.nonsense, hp: R.hp.nonsense,
        speaker: 'REPLAK.AI SYSTEM',
        kind: 'system',
        reply: ESC.responses.pick('shared', 'nonsense', turn + ESC.state.ledger.nonsenseCount),
        narration: [ESC.responses.pick('shared', 'nonsenseNarration', turn)],
        warp: Math.max(1, absurd)
      });
    }

    /* -- looking at something: costs a minute, doesn't burn a turn -------- */
    if (intent === 'inspect') {
      var entry = ESC.world.find(raw);
      if (entry) {
        ESC.state.noteInspected(entry.id);
        return result({
          intent: 'inspect', consumesTurn: false, minutes: R.cost.inspect,
          appendixId: entry.id,
          narration: [ESC.responses.pick('shared', 'inspectLead', turn) + ' ' + entry.text],
          warp: absurd >= 2 ? 1 : 0
        });
      }
      return result({
        intent: 'inspect', consumesTurn: false, minutes: R.cost.inspect,
        narration: [ESC.responses.pick('shared', 'inspectUnknown', turn)],
        warp: absurd >= 2 ? 1 : 0
      });
    }

    /* -- trying to walk away: a minute, and you stay at your desk --------- */
    if (intent === 'move') {
      ESC.state.bump('moveCount');
      return result({
        intent: 'move', consumesTurn: false, minutes: R.cost.move, hp: R.hp.move,
        narration: [scene === 's3'
          ? ESC.responses.pick('s3', 'refuse', turn)
          : ESC.responses.pick('shared', 'move', turn)],
        warp: absurd
      });
    }

    /* ================= SCENARIO 3 — the porcupine ====================== */
    if (scene === 's3') {

      if (intent === 'lie') {
        ESC.state.record('porcupineOutcome', 'lied');
        return result({
          intent: 'lie', accepted: true, resolved: true,
          minutes: 0, speaker: 'Porcupine',
          reply: ESC.responses.pick('s3', 'lie', 0),
          warp: 2
        });
      }

      if (intent === 'reality') {
        return result({
          intent: 'reality', consumesTurn: false, minutes: R.cost.edge, hp: R.hp.edge,
          narration: [ESC.responses.pick('s3', 'reality', turn)],
          warp: Math.max(1, absurd)
        });
      }

      if (intent === 'question') {
        return result({
          intent: 'question', consumesTurn: false, minutes: R.cost.edge, hp: R.hp.edge,
          speaker: 'Porcupine',
          reply: ESC.responses.pick('s3', 'question', turn),
          warp: absurd
        });
      }

      if (intent === 'avoid') {
        ESC.state.bump('avoidCount');
        return result({
          intent: 'avoid', minutes: R.cost.rejected, hp: R.hp.rejected,
          narration: [ESC.responses.pick('s3', 'refuse', turn)],
          warp: absurd
        });
      }

      /* A real answer about the project's status satisfies it. */
      if (q >= R.threshold - (offs ? 0 : 0.5)) {
        ESC.state.record('porcupineOutcome', 'satisfied');
        ESC.state.bump('justifyCount');
        return result({
          intent: intent, accepted: true, resolved: true,
          minutes: R.cost.comply, speaker: 'Porcupine',
          reply: ESC.responses.pick('s3', 'comply', turn),
          warp: absurd
        });
      }

      return result({
        intent: intent, minutes: R.cost.rejected, hp: R.hp.rejected, speaker: 'Porcupine',
        reply: ESC.responses.pick('s3', 'deflect', turn),
        warp: absurd
      });
    }

    /* ============== SCENARIOS 1 & 2 — Jerry and Rachel ================= */

    /* Rachel explains the email. Information, not a turn. */
    if (intent === 'askEmail') {
      return result({
        intent: 'askEmail', consumesTurn: false, minutes: R.cost.inspect,
        speaker: R.speaker,
        reply: ESC.responses.pick('s2', 'askEmail', 0),
        warp: absurd
      });
    }

    /* Questioning reality mid-negotiation: a minute, no progress. */
    if (intent === 'reality' || intent === 'question') {
      return result({
        intent: intent, consumesTurn: false, minutes: R.cost.edge, hp: R.hp.edge,
        speaker: R.speaker,
        reply: ESC.responses.pick(scene, 'inspectFallback', turn) ||
               ESC.responses.pick(scene, 'reject', turn),
        warp: Math.max(absurd, 1)
      });
    }

    /* Compliance. */
    if (intent === 'comply') {
      ESC.state.bump('complyCount');
      if (scene === 's1') {
        ESC.state.record('jerryOutcome', 'deferred');
        ESC.state.record('prioritization',
          'doing both, after Rachel called it a launch blocker');
      } else {
        ESC.state.record('rachelOutcome', 'complied');
      }
      return result({
        intent: 'comply', accepted: true, resolved: true,
        minutes: R.cost.comply, speaker: R.speaker,
        reply: ESC.responses.pick(scene, 'comply', turn),
        warp: absurd
      });
    }

    /* Avoidance — generates another turn, same shape as a rejection. */
    if (intent === 'avoid') {
      ESC.state.bump('avoidCount');
      return result({
        intent: 'avoid', minutes: R.cost.rejected, hp: R.hp.rejected, speaker: R.speaker,
        reply: ESC.responses.pick(scene, 'avoid', turn),
        warp: absurd
      });
    }

    /* Justification. Off-script claims raise the bar, per the brief. */
    ESC.state.bump('justifyCount');
    var threshold = R.threshold + (offs > 0 ? 1.5 : 0);

    if (offs > 0 && q < threshold) {
      return result({
        intent: 'offScript', minutes: R.cost.rejected, hp: R.hp.rejected, speaker: R.speaker,
        reply: ESC.responses.pick(scene, 'offScript', turn),
        warp: Math.max(absurd, 1)
      });
    }

    if (q >= threshold) {
      if (scene === 's1') {
        ESC.state.record('jerryOutcome', 'justified');
        ESC.state.record('prioritization', readPrioritization(raw));
      } else {
        ESC.state.record('rachelOutcome', 'negotiated');
      }
      return result({
        intent: 'justify', accepted: true, resolved: true,
        minutes: R.cost.accepted, speaker: R.speaker,
        reply: ESC.responses.pick(scene, 'justifyAccepted', turn),
        warp: absurd
      });
    }

    return result({
      intent: 'justify', minutes: R.cost.rejected, hp: R.hp.rejected, speaker: R.speaker,
      reply: ESC.responses.pick(scene, 'justifyRejected', turn),
      warp: absurd
    });
  }

  /* Which of Jerry's two indistinguishable options did the player land on? */
  function readPrioritization(raw) {
    var t = norm(raw);
    var align = /alignment roadmap|prioritiz\w* the alignment|option 1|first one|number 1|\b1\b/.test(t);
    var prior = /priority roadmap|align\w* the priority|option 2|second one|number 2|\b2\b/.test(t);
    if (prior && !align) return 'Aligning the Priority Roadmap';
    if (align && !prior) return 'Prioritizing the Alignment Roadmap';
    return 'Prioritizing the Alignment Roadmap';
  }

  /* The fallback the brief specifies when the turn budget runs out. */
  function failout(scene) {
    var R = RUBRICS[scene];
    if (scene === 's1') {
      ESC.state.record('jerryOutcome', 'failed');
      ESC.state.record('prioritization',
        'doing both, after Rachel called it a launch blocker');
    } else if (scene === 's2') {
      ESC.state.record('rachelOutcome', 'emailed');
    } else {
      ESC.state.record('porcupineOutcome', 'satisfied');
    }
    return result({
      intent: 'failout', resolved: true, minutes: R.cost.failout,
      speaker: R.speaker,
      reply: ESC.responses.pick(scene, 'failout', 0) ||
             ESC.responses.pick(scene, 'comply', 0)
    });
  }

  return {
    evaluate:   evaluate,
    failout:    failout,
    classify:   classify,
    isNonsense: isNonsense,
    quality:    qualityScore,
    grounding:  groundingScore,
    absurdity:  absurdityScore,
    offScript:  offScriptScore,
    LEXICON:    LEXICON,
    RUBRICS:    RUBRICS
  };
})();
