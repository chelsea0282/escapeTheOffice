/* ============================================================================
   LLM — client side of the real open-input responses
   ----------------------------------------------------------------------------
   Calls the Netlify function at netlify/functions/respond.js, which holds the
   Claude API key and does the actual model call. This file never sees the
   key and never talks to Claude directly.

   responder.js falls back to the scripted responses in content/responses.js
   if this fails (offline, key not configured, function not deployed, etc.),
   so the game still works with `python3 -m http.server` / file://.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.llm = (function () {

  var ENDPOINT = '/.netlify/functions/respond';

  /* usedRewards: reward_mechanic ids already used earlier in this
     playthrough (ESC.state.ledger.rewardsUsed) — sent so the server can
     exclude them from this call's options and keep rewards varied.

     Returns a Promise<
       { cannotJustify: false, lines: [{speaker,text}], rewardMechanic: string|null } |
       { cannotJustify: true }
     >. Rejects on any failure — the caller (responder.js) decides what to
     do about that. cannotJustify is the model's own call that this input
     can't be spun into anything (per the doc: "if an action absolutely
     cannot be justified, show the pre-set options") — distinct from a
     network/API failure. */
  function reply(text, scene, usedRewards) {
    return fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene: scene, text: text, usedRewards: usedRewards || [] })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('LLM endpoint returned ' + res.status);
        return res.json();
      })
      .then(function (data) {
        if (!data) throw new Error('LLM endpoint returned no data');
        if (data.cannotJustify) return { cannotJustify: true };
        if (!Array.isArray(data.lines) || !data.lines.length) {
          throw new Error('LLM endpoint returned no lines');
        }
        return {
          cannotJustify: false,
          lines: data.lines,
          rewardMechanic: data.rewardMechanic || null
        };
      });
  }

  return { reply: reply };
})();
