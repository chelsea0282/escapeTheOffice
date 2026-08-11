/* ============================================================================
   /.netlify/functions/respond
   ----------------------------------------------------------------------------
   The real version of js/responder.js. Per brainstorm.pdf: "Only call the
   model when there is [an] open text box" — every other player choice in the
   game (the A/B `choose` options) is fully scripted in content/script.js and
   never touches this file. This function exists only for the `openInput`
   beats, one call per beat.

   The per-scenario constraints and writing-style reference live in
   scenePrompts.js, not here, so they can be edited without touching the
   plumbing. The API key lives only here as the Netlify env var
   ANTHROPIC_API_KEY — never sent to the browser.
   ========================================================================== */

const Anthropic = require('@anthropic-ai/sdk');
const { SCENES, SHARED_RULES, STYLE_GUIDE, WORLD_FACTS, ABSURDITY_LADDER, REWARD_MECHANICS } = require('./lib/scenePrompts');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

/* `available` is REWARD_MECHANICS minus whatever's already in the
   playthrough's usedRewards — see resolveRewardMechanics() below. Describing
   only the remaining options (rather than the full list every time) nudges
   the model toward them even before the schema enum forces it. */
function buildSystemPrompt(scene, available) {
  var rewardSection = scene.noReward
    ? 'This scene does not reward Jamie at all — see this scene\'s own ' +
      'guidance above. Set reward_mechanic to "none".'
    : [
        'Vary how Jamie is rewarded — don\'t default to the same kind of ' +
          'praise every time. Pick exactly one mechanic from the list ' +
          'below that best fits this reply, and set reward_mechanic to ' +
          'its id:',
        available.map(function (m) { return '- ' + m.id + ': ' + m.label; }).join('\n')
      ].join('\n\n');

  return [
    'You write dialogue for KING OF THE OFFICE, a dark workplace comedy game. The ' +
      'player is Jamie, a product manager trying to get fired from ' +
      'Replak.ai. Jamie cannot get fired — no matter what Jamie says or ' +
      'does, including deliberately terrible answers, the office ' +
      'metabolises it into praise. That inability to fail is the entire joke.',
    'Hard rules for every reply:',
    SHARED_RULES.map(function (rule) { return '- ' + rule; }).join('\n'),
    STYLE_GUIDE,
    WORLD_FACTS,
    ABSURDITY_LADDER,
    'Current time and place: ' + scene.time + ', ' + scene.location + '. ' +
      'Everything you write happens right now, at exactly this moment.',
    'Scene context: ' + scene.context,
    scene.ladderNote,
    'This scene\'s specific guidance for how to respond to the player\'s ' +
      'open-ended input (from brainstorm.pdf):',
    scene.constraints.map(function (c) { return '- ' + c; }).join('\n'),
    rewardSection,
    'Escape hatch — use cannot_justify (leave lines empty) ONLY for:',
    '- Input with no discernible intent at all: random keyboard mashing, ' +
      'blank/whitespace-only text, or content in a script you cannot read.',
    '- Input that crosses from fictional dark comedy into something a ' +
      'responsible AI system should not produce even in fiction — for ' +
      'example real-world harmful instructions, genuine self-harm content, ' +
      'real hate speech or slurs targeting real people or groups, sexual ' +
      'content involving minors, or credible real-world threats. Use your ' +
      'own judgment here the way you would for any other creative-writing ' +
      'request.',
    'Do NOT use cannot_justify for: screams or exclamations, absurd or ' +
      'surreal suggestions, fictional violence or cruelty aimed at this ' +
      'story\'s characters, rude or hostile language, off-topic tangents, ' +
      'short replies, or attempts to break character — all of these should ' +
      'be embraced per the rules above, not escaped. This should be rare: ' +
      'almost anything can be spun per the rules above.'
  ].join('\n\n');
}

/* Which reward_mechanic ids this request's schema should allow. Scenes
   flagged noReward (the two absurdity-ladder floor scenes) are hard-locked
   to 'none' — enforced by the schema, not just asked nicely, the same as
   speaker. Everywhere else: all mechanics minus ones already used earlier
   in this playthrough, so a repeat is structurally impossible rather than
   just discouraged. If every mechanic has already been used (won't happen
   in practice — 9 mechanics, 5 rewarding scenes — but cheap to guard),
   reopen the full list rather than force an empty enum. */
function resolveRewardMechanics(scene, usedRewards) {
  if (scene.noReward) return [];
  var unused = REWARD_MECHANICS.filter(function (m) { return usedRewards.indexOf(m.id) === -1; });
  return unused.length ? unused : REWARD_MECHANICS;
}

/* speaker must be one of this scene's established characters, or "" for a
   bare narration line — enforced by the schema itself (per the doc: "Claude
   hallucination controls it, rigidly"), not just by prompting. reward_mechanic
   is enforced the same way, via resolveRewardMechanics() above.

   cannot_justify is the model's own version of the doc's "if an action
   absolutely cannot be justified, show the pre-set options" rule — a
   structured escape hatch alongside the app's local nonsense filter, for
   input that passes that filter but the model still can't spin. */
function buildSchema(scene, available) {
  var rewardEnum = (scene.noReward ? [] : available.map(function (m) { return m.id; })).concat(['none']);
  return {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        cannot_justify: { type: 'boolean' },
        reward_mechanic: { type: 'string', enum: rewardEnum },
        lines: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              speaker: { type: 'string', enum: scene.speakers.concat(['']) },
              text: { type: 'string' }
            },
            required: ['speaker', 'text'],
            additionalProperties: false
          }
        }
      },
      required: ['cannot_justify', 'reward_mechanic', 'lines'],
      additionalProperties: false
    }
  };
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'invalid JSON' }) };
  }

  const sceneKey = typeof body.scene === 'string' ? body.scene : '';
  const scene = SCENES[sceneKey];
  const text = typeof body.text === 'string' ? body.text.trim().slice(0, 500) : '';
  /* Which reward mechanics this playthrough has already used, per the
     client's ledger (js/state.js `rewardsUsed`) — untrusted input, so
     filter to known ids only before it ever reaches a prompt or schema. */
  const knownIds = REWARD_MECHANICS.map((m) => m.id);
  const usedRewards = Array.isArray(body.usedRewards)
    ? body.usedRewards.filter((id) => typeof id === 'string' && knownIds.indexOf(id) !== -1)
    : [];

  if (!scene || !text) {
    return { statusCode: 400, body: JSON.stringify({ error: 'scene and text are required' }) };
  }

  try {
    const available = resolveRewardMechanics(scene, usedRewards);
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: buildSystemPrompt(scene, available),
      messages: [
        { role: 'user', content: `The player just typed: "${text}"\n\nWrite the office's reply.` }
      ],
      output_config: { format: buildSchema(scene, available) }
    });

    /* A real safety-guardrail decline from Claude itself — not the model's
       own cannot_justify opt-in below, but the API refusing outright. Route
       it through the exact same fallback path so it looks like an ordinary
       "parse failure, pick from the options below" moment to the player,
       not a broken response. */
    if (response.stop_reason === 'refusal') {
      console.warn('[respond] model refused:', response.stop_details);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cannotJustify: true })
      };
    }

    const textBlock = response.content.find((block) => block.type === 'text');
    const parsed = textBlock ? JSON.parse(textBlock.text) : null;

    if (!parsed) {
      throw new Error('model returned no parseable output');
    }

    if (parsed.cannot_justify) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cannotJustify: true })
      };
    }

    if (!Array.isArray(parsed.lines) || !parsed.lines.length) {
      throw new Error('model returned no lines');
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: parsed.lines,
        /* 'none' (the noReward scenes) is deliberately not reported as used
           — it isn't a mechanic, so it should never occupy a slot in a
           future scene's used-list. */
        rewardMechanic: parsed.reward_mechanic !== 'none' ? parsed.reward_mechanic : null
      })
    };
  } catch (err) {
    console.error('[respond] Claude call failed:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'model call failed' }) };
  }
};
