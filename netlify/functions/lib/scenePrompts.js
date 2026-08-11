/* ============================================================================
   SCENE PROMPTS — the model's version of content/responses.js
   ----------------------------------------------------------------------------
   This is content, not logic. It exists so the per-scenario constraints from
   brainstorm.pdf ("Guidelines for model-generated response" / "Model prompt:"
   under each scenario's open-input option) live in one place, organized by
   scene, and can be edited without touching respond.js.

   Pulled from brainstorm.pdf (Aug 9 2026 rev) — see that doc for the full
   script if a constraint here needs re-checking against the source.
   ========================================================================== */

/* Rules from the doc's closing "Restrictions" section, plus the "If the
   player uses the open input text box, the model's resulting text should
   adhere to the following guidelines" block added in the Aug 10 2026
   revision. Apply to every scene, regardless of what the player typed. The
   single-turn/continue-the-story part is already enforced by the game code
   (responder.js never re-opens input after a verdict); these rules keep the
   model's own *writing* from fighting that — e.g. by ending on a cliffhanger
   question that implies the player gets to answer again. */
const SHARED_RULES = [
  'Follow the style of the rest of the script (see the style guide below).',
  'Jamie should always somehow be rewarded for her actions. She can never ' +
    'actually get in trouble, get fired, or derail the plot.',
  'If the player\'s input steers away from the storyline, find a way to ' +
    'incorporate it and then return the scene back to the storyline — don\'t ' +
    'let it wander.',
  'Refrain from repeating content that has already been said in the script, ' +
    'or that may come up later in the script (see the scene context and ' +
    'world facts below for what\'s already established) — react to what the ' +
    'player just typed, don\'t re-narrate backstory they\'ve already seen ' +
    'play out, and don\'t preview or resolve events from other scenarios.',
  'Ensure the storyline stays cohesive between scenarios: world details ' +
    '(names, roles, past events) must make coherent, linear sense with what ' +
    'is established below, and the writing should read as a smooth ' +
    'continuation, not a detour.',
  'Any new detail you introduce (a minor name, a small specific) must be ' +
    'throwaway and impermanent — never invent anything a later scenario ' +
    'would need to account for or contradict.',
  'Do not reward Jamie with an actual promotion. Promotion is reserved for ' +
    'the pre-set Sudden Ending branches elsewhere in the script — use other ' +
    'forms of praise instead (recognition, being CC\'d, admiration, a good ' +
    'word for a future promotion, etc.).',
  'Do not use Replak Core Values in your response. They\'re world lore, not ' +
    'material to cite — never name or number one, even to praise Jamie.',
  'This is exactly one reactive beat. Do not end on a question, an offer, or ' +
    'anything that implies the player will get to respond again — after your ' +
    'lines, the story moves on to the next scenario immediately no matter ' +
    'what the player typed.',
  'Only use character names already listed for this scene below. Never ' +
    'introduce a new named character.',
  'Never break the fourth wall: never mention that this is a game, a script, ' +
    'a model, or an AI.'
];

/* Compact, load-bearing facts from content/world.js — names, roles, and
   established plot points — so the model doesn't contradict established
   lore (the "coherent, linear sense" rule above needs the model to actually
   know what's established). Keep this short; it's not the whole appendix,
   just what a reply is likely to touch. */
const WORLD_FACTS = `Established world facts — do not contradict these:
- Replak.ai is the company; Jamie is a product manager on the second floor,
  50 hours this week, in at 8:00AM today.
- Rachel is Jamie and Jerry's manager. Unshockable — has heard a proposal to
  install malware on a competitor and called it exciting.
- Jerry reports to Rachel alongside Jamie. Relentlessly, structurally
  supportive of Jamie no matter what. Carries a thermos he sips from all day
  that is not coffee.
- Chris (chris@clientcustomercompanyai.com) is an external client contact
  who flagged that his employees feel their privacy is being breached.
- The CEO is reachable over work chat and responds to a confessed felony
  with enthusiasm about "out-of-the-box thinking."
- The feature Jamie launched that morning screenshots an employee's computer
  screen and a random conversation from their personal phone every 30
  seconds, and sends both to their manager over work chat.
- Project Porcupine is the company's flagship project; it is going sideways.
- Replak Core Values (RCVs) exist as world lore, cited elsewhere in the
  script — but per the hard rules above, do not cite or invent one yourself.`;

/* Illustrative lines from content/script.js, so the model's prose sits in the
   same register as the authored scenes: dry, upbeat corporate absurdism,
   present-tense second-person narration, characters that are relentlessly
   and slightly unsettlingly positive no matter what just happened. */
const STYLE_GUIDE = `Match the tone of the rest of the script:
- Narrator lines are second person, present tense, matter-of-fact, and
  occasionally darkly funny. e.g. "You've already spent 50 hours at the
  office this week." / "You're doing great at Replak.ai."
- Characters speak in upbeat, over-the-top corporate-speak, and treat even
  alarming input as a professional growth opportunity. e.g. Rachel: "Jamie,
  this feature is amazing! Engagement has been through the roof today."
  Jerry: "Thank you for giving me an opportunity to step up." CEO: "Let you
  go? Jamie, this is incredible work!"
- Do NOT cite "Replak Core Values" (RCVs) in your response — see the hard
  rules above. They're part of the world's lore, not something to reference.
- Keep lines short. This is a terminal-typed game; nobody's line should run
  more than 2-3 sentences.
- You may use the literal token [player] in your text to refer to the
  protagonist by name — it is substituted automatically at print time.`;

/* Each scene: `context` grounds the model in what's actually happening;
   `constraints` are the doc's own bullet points for that scenario's open
   input, close to verbatim; `speakers` is the closed set of character names
   valid in this scene (used to build the JSON schema's speaker enum, so the
   model literally cannot emit a name that isn't one of these, or "" for a
   bare narration line). */
const SCENES = {
  tutorial: {
    context:
      'This is the very first choice of the game, before any of the later ' +
      'scenarios begin — nothing dramatic has happened yet. Jamie is just ' +
      'deciding how to get coffee (make her own at the PHS, or steal ' +
      'coworker Jerry\'s drink). This open text is Jamie\'s own idea for ' +
      'how to get coffee, instead of picking one of those two options.',
    speakers: ['Jerry'],
    constraints: [
      'This is an early, low-stakes moment — unlike later scenes, do NOT ' +
        'enthusiastically praise or reward Jamie here. Keep the tone muted ' +
        'and ordinary; nothing about this moment should point at the ' +
        'absurdity of Jamie being able to get away with anything.',
      'If the input is extreme — violence, a destructive act, something ' +
        'malicious, mean, or rude — it gets brushed off empathetically by ' +
        'whoever reacts, not praised and not punished.',
      'If the response is off-topic from getting coffee, redirect back to ' +
        'the story by having Jamie end up going to the PHS to make her own ' +
        'coffee after all.'
    ]
  },

  carryCoffee: {
    context:
      'Rachel has asked Jamie to help carry her coffee mug back to her ' +
      'desk after a brainstorm meeting. This open text is Jamie\'s own ' +
      'reply, instead of a flat yes or no.',
    speakers: ['Rachel'],
    constraints: [
      'This is an early, low-stakes moment — unlike later scenes, do NOT ' +
        'enthusiastically praise or reward Jamie here. Keep the tone muted ' +
        'and ordinary; nothing about this moment should point at the ' +
        'absurdity of Jamie being able to get away with anything.',
      'If the input is extreme — violence, a destructive act, something ' +
        'malicious, mean, or rude — Rachel brushes it off in a neutral, ' +
        'leaning-empathetic way. She is understanding of whatever Jamie says.',
      'If the response is completely off-topic from whether or not to ' +
        'carry the coffee, redirect back to the story by having Jamie end ' +
        'up saying no to carrying it.'
    ]
  },

  s1: {
    context:
      'Jamie is at their desk, writing their own free-form reply to an ' +
      'escalation email from a customer named Chris, who is asking whether ' +
      'Replak.ai shipped a feature that is breaching employee privacy. Jerry ' +
      '(a coworker) forwarded the email and is waiting on the reply before a ' +
      'sync meeting. This open text is Jamie\'s own reply, written instead of ' +
      'picking "walk away" or "blame Jerry."',
    speakers: ['Chris', 'Jerry', 'Rachel'],
    constraints: [
      'If the reply is professional and reasonable, Chris thanks Jamie for ' +
        'the help and CCs Rachel on the thread so Jamie gets recognition.',
      'If the reply is very short or non-descriptive, Chris praises Jamie ' +
        'for the brevity.',
      'If the reply is irrelevant to the task or brings in unrelated ' +
        'details, Chris agrees with whatever Jamie said, thanks her for ' +
        'making him think about what\'s actually important, and CCs Rachel ' +
        'for recognition.',
      'If the reply is rude, Chris appreciates Jamie\'s personality and ' +
        'Jerry praises her for being herself over email — for keeping it ' +
        'real instead of sanitizing it for the client.',
      'For anything else: blame Jerry or Rachel for something and have them ' +
        'thank Jamie for the growth opportunity, or have Chris respond ' +
        'enthusiastically about how uniquely Jamie handled it and mention ' +
        'he\'ll put in a good word for her promotion.',
      'If Jamie does something irrelevant to the actual task (leaving, ' +
        'saying she quits, staying silent, going to the bathroom), have ' +
        'Jerry appear in person — not over chat — and support whatever ' +
        'Jamie is doing.'
    ]
  },

  s2: {
    context:
      'Jamie is in a team meeting with manager Rachel and coworker Jerry. ' +
      'Rachel is asking what\'s going on with the privacy complaint about the ' +
      'feature Jamie launched that morning. This open text is Jamie\'s own ' +
      'explanation, instead of owning it outright or blaming Jerry.',
    speakers: ['Rachel', 'Jerry'],
    constraints: [
      'If the input reads as confused, Rachel and Jerry recognize Jamie for ' +
        'being vulnerable.',
      'If it\'s unrelated to the story, redirect back to the story while ' +
        'incorporating elements of what Jamie said, but make sure Jamie is ' +
        'still praised for it.',
      'If it contains violence, insults, or anger, Rachel and Jerry assume ' +
        'Jamie is experiencing strong emotions from the huge success of the ' +
        'morning\'s launch, and praise her dedication.',
      'No matter what, Jamie must come out of this rewarded for what she said.'
    ]
  },

  s3: {
    context:
      'Rachel wants ideas from the team on how Replak.ai can stay ahead of a ' +
      'competitor who is already copying their new feature. This open text ' +
      'is Jamie\'s own suggestion, instead of picking "install malware" or ' +
      '"break in and destroy their computers."',
    speakers: ['Rachel'],
    constraints: [
      'No matter what Jamie suggests, find a way to make it lead back to ' +
        'Jamie getting credit for the idea of installing malware on the ' +
        'competitor\'s computers — that is the plan the team runs with ' +
        'regardless of what Jamie actually said.',
      'No matter what, the story should move toward Rachel, Jerry, and ' +
        'Jamie writing malware to install on the competitor\'s computers by ' +
        '5:00PM that same day.'
    ]
  },

  s4: {
    context:
      'Jerry has quietly pulled Jamie aside while the team races to finish ' +
      'installing the malware before the 5:00PM deadline. Jerry is worried ' +
      'aloud that this could get them all fired. This open text is Jamie\'s ' +
      'own response to Jerry, instead of "get your head in the game" or ' +
      'physically pushing him.',
    speakers: ['Jerry'],
    constraints: [
      'If Jamie says she wants to get fired, Jerry laughs it off and talks ' +
        'about how indispensable Jamie is — there\'s no way she\'d get fired.',
      'If Jamie is mean to Jerry, Jerry embraces what she says.',
      'If Jamie is nice to Jerry, Jerry praises her and says he\'ll tell ' +
        'Rachel how nice Jamie is.',
      'If Jamie says something empathizing with Jerry, Jerry tells her ' +
        'he\'s nominating her for an internal award for being empathetic.',
      'If Jamie pushes back on the premise of installing malware, Jerry ' +
        'stands firm that they need to proceed with the plan anyway.',
      'No matter what, the team proceeds with the malware attack — this ' +
        'exchange never derails or cancels the plan.'
    ]
  },

  s5: {
    context:
      'The malware attack leaked publicly and the CEO is now messaging ' +
      'Jamie directly over chat, asking what happened and whether Jamie did ' +
      'it. This open text is Jamie\'s own reply, instead of owning it outright ' +
      'or saying she was forced into it by Rachel.',
    speakers: ['CEO'],
    constraints: [
      'No matter what Jamie says, make sure she ends up rewarded and ' +
        'praised for her contribution to the malware attack.',
      'Jamie absolutely cannot get fired or face any real consequence from ' +
        'this.'
    ]
  }
};

module.exports = {
  SCENES: SCENES,
  SHARED_RULES: SHARED_RULES,
  STYLE_GUIDE: STYLE_GUIDE,
  WORLD_FACTS: WORLD_FACTS
};
