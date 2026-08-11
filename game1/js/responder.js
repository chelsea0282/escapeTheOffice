/* ============================================================================
   RESPONDER — the scripted stand-in for the LLM
   ----------------------------------------------------------------------------
   The brief calls for a model at each <Open input response:>. This build has
   none, so this file does the job deterministically.

   Its job in KING OF THE OFFICE is the opposite of a normal dialogue system. It does
   not judge the player. Per the doc:

       "No matter what the player inputs, it should be incorporated in the
        story. Find a way to justify what the player is doing. No matter what
        the player input is, it should be spun into a good thing that Jamie
        gets rewarded for."

   So there is no accept/reject and no score to beat. The responder reads the
   REGISTER of what you typed — professional, curt, rude, confused, kind,
   pushing back, trying to leave — and returns the flavour of praise the doc
   assigns to it. You cannot lose. That is the joke.

   Two restrictions from the doc's Gameplay notes are enforced here:
     * one turn, then back on script  (`resolve: true` on every verdict)
     * "if an action can't be justified, give players only options of A or B
        that would get them back on track"  (`fallback: true` on nonsense)

   Prose lives in content/responses.js. Nothing here writes to the DOM.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.responder = (function () {

  /* ======================================================================
     LEXICON — edit these to change what the game understands
     ==================================================================== */

  var LEXICON = {

    /* Saying the quiet part out loud. The office does not hear it. */
    quit: [
      'i quit', 'i am quitting', 'i\'m quitting', 'im quitting', 'resign',
      'resignation', 'fire me', 'get fired', 'want to be fired', 'let me go',
      'i want out', 'two weeks notice', 'my notice', 'i am done here',
      'i\'m done here', 'im done here', 'i am leaving the company'
    ],

    rude: [
      'idiot', 'stupid', 'shut up', 'hate you', 'i hate', 'useless', 'moron',
      'incompetent', 'terrible', 'awful', 'screw you', 'damn', 'hell',
      'kill', 'punch', 'destroy you', 'burn', 'scream', 'yell', 'insane',
      'ridiculous', 'nonsense', 'garbage', 'trash', 'worst', 'fed up',
      'sick of', 'furious', 'angry'
    ],

    confused: [
      'i don\'t know', 'i dont know', 'no idea', 'confused', 'what is going on',
      'what\'s going on', 'whats going on', 'i don\'t understand',
      'i dont understand', 'huh', 'wait what', 'i am lost', 'i\'m lost',
      'not sure', 'unclear', 'what happened'
    ],

    empathy: [
      'i understand', 'i hear you', 'that makes sense', 'are you ok',
      'are you okay', 'i feel', 'i know how', 'it\'s hard', 'its hard',
      'take care', 'look after yourself', 'you matter', 'i\'m sorry you',
      'im sorry you', 'that sounds', 'i appreciate you'
    ],

    nice: [
      'thank you', 'thanks', 'great job', 'well done', 'good work', 'proud',
      'appreciate', 'you\'re great', 'youre great', 'nice work', 'love that',
      'brilliant', 'amazing work', 'you rock'
    ],

    pushback: [
      'we shouldn\'t', 'we shouldnt', 'this is wrong', 'that\'s wrong',
      'thats wrong', 'illegal', 'a crime', 'not ok', 'not okay', 'bad idea',
      'i disagree', 'i object', 'push back', 'against this', 'unethical',
      'we can\'t do that', 'we cant do that', 'refuse', 'no way',
      'shouldn\'t do', 'shouldnt do'
    ],

    /* Physically removing yourself from the situation. */
    leave: [
      'walk away', 'get up', 'leave', 'go home', 'bathroom', 'restroom',
      'do nothing', 'ignore', 'say nothing', 'stay silent', 'log off',
      'close the laptop', 'go outside', 'take a break', 'step out', 'hide'
    ],

    /* Reads as a real work reply. */
    professional: [
      'apolog', 'sorry for', 'thanks for flagging', 'thank you for flagging',
      'looking into', 'investigate', 'root cause', 'rollback', 'roll back',
      'revert', 'timeline', 'update you', 'follow up', 'circle back',
      'happy to', 'let me know', 'best regards', 'regards', 'hi chris',
      'hi jerry', 'hi rachel', 'i will', 'i\'ll', 'ill ', 'we will', 'we\'ll'
    ]
  };

  /* ======================================================================
     TEXT UTILITIES
     ==================================================================== */

  var COMMON = ('a an and are as at be been but by can cant could did do does ' +
    'dont for from get go going had has have he her him his how i if in is it ' +
    'its just let me my no not now of on or our out she should so some than ' +
    'that the their them then there these they this to too up us was we were ' +
    'what when where which who why will with would you your yours am being ' +
    'about after all also any because before both down during each few more ' +
    'most other over same such only own very need needs want wants make made ' +
    'take takes give tell say says think know time day today tomorrow work ' +
    'working done here well right okay ok yes yeah nope sorry thanks thank ' +
    'please really actually maybe probably still even back one two three ' +
    'first next last new good bad big small long short late early sure fine ' +
    'wait stop help leave going got put ask told explain never always again ' +
    'already almost anything something nothing everyone someone people thing ' +
    'things email send sent reply chris jerry rachel jamie').split(' ');

  function norm(s) { return (s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }

  function words(s) {
    return norm(s).replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
  }

  function hits(t, list) {
    var n = 0;
    for (var i = 0; i < list.length; i++) if (t.indexOf(list[i]) !== -1) n++;
    return n;
  }

  function isKnownTerm(x) {
    return ESC.world.groundingTerms.some(function (g) {
      return g.indexOf(x) !== -1 || x.indexOf(g) !== -1;
    });
  }

  /* ======================================================================
     NONSENSE — the only thing the office will not absorb
     The doc: "If an action can't be justified, give players only options of
     A or B that would get them back on track."
     ==================================================================== */

  function isNonsense(raw) {
    var t = norm(raw);
    if (t.length < 2) return true;
    if (!/[a-z]/.test(t)) return true;

    var w = words(t);
    if (!w.length) return true;

    var mashy = w.filter(function (x) {
      if (x.length < 4) return false;
      if (COMMON.indexOf(x) !== -1) return false;
      if (isKnownTerm(x)) return false;
      if (!/[aeiouy]/.test(x)) return true;
      return /[^aeiouy]{4,}/.test(x);
    }).length;
    if (mashy >= 1 && w.length <= 3) return true;
    if (mashy / w.length > 0.5) return true;
    if (/^(.)\1{4,}$/.test(t.replace(/\s/g, ''))) return true;

    var known = w.filter(function (x) {
      return COMMON.indexOf(x) !== -1 || isKnownTerm(x);
    }).length;
    if (w.length >= 3 && known === 0) return true;

    return false;
  }

  /* ======================================================================
     GROUNDING — does this reference things that exist in the world?
     Used only to pick a more specific reply, never to pass or fail.
     ==================================================================== */

  function groundingScore(t) {
    var seen = {}, n = 0;
    ESC.world.groundingTerms.forEach(function (g) {
      if (!seen[g] && t.indexOf(g) !== -1) { seen[g] = 1; n++; }
    });
    return Math.min(4, n);
  }

  /* ======================================================================
     CLASSIFY — read the register, not the merit
     ==================================================================== */

  function classify(raw) {
    var t = norm(raw);
    if (isNonsense(raw)) return 'nonsense';

    var w = words(raw);

    /* Strongest signals first — these change which character answers. */
    if (hits(t, LEXICON.quit) > 0)     return 'quit';
    if (hits(t, LEXICON.rude) > 0)     return 'rude';
    if (hits(t, LEXICON.pushback) > 0) return 'pushback';
    if (hits(t, LEXICON.confused) > 0) return 'confused';
    if (hits(t, LEXICON.empathy) > 0)  return 'empathy';
    if (hits(t, LEXICON.leave) > 0)    return 'leave';
    if (hits(t, LEXICON.nice) > 0)     return 'nice';

    /* "If Jamie sends an email that is very short and/or non-descriptive,
        Chris should praise Jamie for brevity." */
    if (w.length <= 4) return 'brief';

    if (hits(t, LEXICON.professional) > 0 || groundingScore(t) >= 2) {
      return 'professional';
    }

    /* Everything else is off-topic — which the office also rewards. */
    return 'irrelevant';
  }

  /* ======================================================================
     EVALUATE
     ----------------------------------------------------------------------
     ctx = { scene: 's1'|'s2'|'s3'|'s4'|'s5' }

     Returns a Promise<verdict>:
       intent     the register that was read
       lines      [{ speaker, text, kind }] — what the office says back
       resolve    always true; one turn, then back on script (doc's rule)
       fallback   true only for nonsense: show the A/B options instead
       praise     whether this counted as the office rewarding you

     Nonsense is still filtered locally (cheap, no need to spend a model call
     on gibberish). Everything else goes to ESC.llm, which calls Claude
     through the Netlify function. Two distinct "give up" paths land on the
     same fallback verdict:
       - local nonsense filter, before ever calling the model
       - the model's own cannot_justify flag (doc: "if an action absolutely
         cannot be justified, show the pre-set options") — for input that
         passes the local filter but the model itself can't spin
     If the call fails outright — offline, no API key configured yet,
     function not deployed — this falls back to the scripted pools in
     content/responses.js so the game still plays.
     ==================================================================== */

  function nonsenseVerdict(intent) {
    return {
      intent: intent,
      resolve: false,
      fallback: true,            /* -> the scene falls back to A/B */
      praise: false,
      lines: [{
        speaker: 'REPLAK.AI SYSTEM',
        kind: 'system',
        text: ESC.responses.pick('shared', 'nonsense', ESC.state.ledger.openInputs.length)
      }]
    };
  }

  function evaluate(raw, ctx) {
    var scene = ctx.scene;
    var intent = classify(raw);

    ESC.state.noteInput(raw);

    if (intent === 'nonsense') {
      return Promise.resolve(nonsenseVerdict('nonsense'));
    }

    if (ESC.fx && ESC.fx.play) ESC.fx.play('typingStart');

    return ESC.llm.reply(raw, scene)
      .then(function (result) {
        if (result.cannotJustify) return nonsenseVerdict(intent);
        ESC.state.bump('praiseCount');
        return {
          intent: intent,
          resolve: true,          /* one turn, then the script continues */
          fallback: false,
          praise: true,
          lines: result.lines
        };
      })
      .catch(function (err) {
        console.warn('[ESC] LLM reply failed, falling back to scripted response:', err);
        ESC.state.bump('praiseCount');
        return {
          intent: intent,
          resolve: true,
          fallback: false,
          praise: true,
          lines: ESC.responses.reply(scene, intent, ESC.state.ledger.openInputs.length)
        };
      });
  }

  return {
    evaluate:   evaluate,
    classify:   classify,
    isNonsense: isNonsense,
    grounding:  groundingScore,
    LEXICON:    LEXICON
  };
})();
