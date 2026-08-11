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
const { SCENES, SHARED_RULES, STYLE_GUIDE, WORLD_FACTS } = require('./lib/scenePrompts');

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

function buildSystemPrompt(scene) {
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
    'Scene context: ' + scene.context,
    'This scene\'s specific guidance for how to respond to the player\'s ' +
      'open-ended input (from brainstorm.pdf):',
    scene.constraints.map(function (c) { return '- ' + c; }).join('\n'),
    'Escape hatch: if the input truly cannot be justified or spun into ' +
      'something Jamie is praised for — even leaning on the rules above — ' +
      'set cannot_justify to true and leave lines empty. The game will show ' +
      'the scene\'s pre-set A/B options instead. This should be rare: almost ' +
      'anything can be spun per the rules above, so only reach for this on ' +
      'input that is genuinely unworkable, not just unusual or extreme.'
  ].join('\n\n');
}

/* speaker must be one of this scene's established characters, or "" for a
   bare narration line — enforced by the schema itself (per the doc: "Claude
   hallucination controls it, rigidly"), not just by prompting.

   cannot_justify is the model's own version of the doc's "if an action
   absolutely cannot be justified, show the pre-set options" rule — a
   structured escape hatch alongside the app's local nonsense filter, for
   input that passes that filter but the model still can't spin. */
function buildSchema(scene) {
  return {
    type: 'json_schema',
    schema: {
      type: 'object',
      properties: {
        cannot_justify: { type: 'boolean' },
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
      required: ['cannot_justify', 'lines'],
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

  if (!scene || !text) {
    return { statusCode: 400, body: JSON.stringify({ error: 'scene and text are required' }) };
  }

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 512,
      system: buildSystemPrompt(scene),
      messages: [
        { role: 'user', content: `The player just typed: "${text}"\n\nWrite the office's reply.` }
      ],
      output_config: { format: buildSchema(scene) }
    });

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
      body: JSON.stringify({ lines: parsed.lines })
    };
  } catch (err) {
    console.error('[respond] Claude call failed:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'model call failed' }) };
  }
};
