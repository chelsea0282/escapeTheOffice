# (ESC)APE

A text-narration world-exploration game, built from `brainstorm.pdf`.
By Chelsea Han & Tiffany Quon.

You are Jamie, a product manager. It is Thursday, 3:50pm. You must leave the
office by 5:00pm — you promised Parker, it's your five year anniversary, and you
can't let Parker down this time. Replak.AI would like to know why you think
you're entitled to that.

---

## Running it

**Just open `index.html`.** Double-click it. There is no build step, no
dependencies, no server, and no API key. It runs from `file://`.

If you'd rather serve it:

```bash
python3 -m http.server 8000 --directory game1
# → http://localhost:8000
```

Tested end-to-end in Chrome. Any modern browser should work.

---

## The three layers

The brief asked for the visual system to be separable from everything else, so
the code is split three ways. **The rule of thumb:**

| To change… | Edit |
|---|---|
| how it **looks** | `theme.css` |
| what it **says** | `content/` |
| how it **works** | `js/` |

```
index.html            structural markup only — no styling, no copy
theme.css             THE VISUAL SYSTEM: colour, type, chrome, CRT, animation
js/
  state.js            clock, HP, the decision ledger, [] token substitution
  ui.js               the only file that touches the DOM
  engine.js           reusable mechanics: typewriter, choice, type-exact, open input
  responder.js        the scripted stand-in for the LLM
  main.js             boot, scene order, failure routing, debug helpers
content/
  script.js           THE SCRIPT — every scene, as data
  world.js            the appendix: people, objects, the project, the concert
  responses.js        authored reply pools for the open-input scenes
```

### Re-skinning

Every visual decision is a CSS custom property at the top of `theme.css`:

```css
--phosphor: #33ff66;      --bg: #000000;
--scanline-opacity: 0.20; --glow-radius: 6px;
--font-mono: "SF Mono", "Menlo", monospace;
```

Change those dozen values and the whole game changes look. `ui.js` never sets an
inline style — it only adds and removes class names. (One deliberate exception:
gauge fill width, which is a continuous value; its easing and colour still come
from CSS.)

---

## How the writing works

`content/script.js` is **data**, not code. A scene is an array of beats:

```js
{ type: 'narrate', text: 'It\'s Thursday, 3:50pm. You\'re typing away…' },
{ type: 'say', speaker: 'Jerry', text: 'Hey [player]. The leads saw…' },
{ type: 'popup', text: 'WARNING: You just got back from a long break.' },
{ type: 'choose', options: [ … ] },
{ type: 'openInput', scene: 's1' },
```

Available beat types: `narrate` `say` `system` `visual` `marker` `art` `popup`
`wait` `gauges` `cost` `clockTo` `typeExact` `choose` `openInput` `call` `branch`.

Conventions carried over from the brief:

- **NARRATOR lines print with no name label** — the terminal *is* the narrator.
  Every other character prints `Jerry: ` first.
- Indented script text became `narrate` / `say` / `system` (typed into the terminal).
- Un-indented stage directions became `visual` (printed, but as description).
- Text is typed **one letter at a time at reading speed**, with longer beats on
  sentence endings. Press space, enter or click to skip a line.

### `[]` tokens

The brief writes player-dependent values in brackets. Every string printed to
the terminal passes through `state.interpolate()` first, so these resolve
automatically:

`[player]` · `[insert time]` · `[insert good time]` · `[date]` ·
`[insert prioritization that was decided during scenario 1]` ·
`[aligning/prioritizing]`

An unknown token renders visibly as `[?whatever]` rather than vanishing, so
authoring gaps are obvious. Add your own in the `TOKENS` table in `js/state.js`.

---

## The responder (there is no LLM)

The brief calls for an LLM to evaluate open input. This build has none, so
`js/responder.js` does the job deterministically:

```
classify intent  →  score the reasoning  →  apply the scene's rubric
```

The trick that makes a keyword engine feel like it's reading for meaning: a
justification is scored mostly on whether it is **grounded** — whether it uses
terms that actually exist in this fictional world. "I just think we should" gets
nowhere. "The search bar and notifications are the committed features and
reopening scope slips the timeline" lands, because every one of those nouns is
in `content/world.js`.

**Adding a keyword to `world.js` teaches the game that word.** That's the main
tuning lever.

Intents: `comply` `justify` `avoid` `inspect` `move` `reality` `question`
`offScript` `nonsense`, plus the Scenario 3 easter egg `lie`.

### The rubrics

Costs come straight from the brief's bullet lists. All of it is in one `RUBRICS`
object at the top of `responder.js`.

| | Jerry (s1) | Rachel (s2) | Porcupine (s3) |
|---|---|---|---|
| comply | −5 (Rachel rules launch blocker) | −3 | −1 (satisfied) |
| justification accepted | −1 | −1 | −1 |
| rejected / avoided | −1, another turn | −1, another turn | −1, won't move |
| turn budget exhausted | −5 (Rachel's ruling) | −5 (reply to the email) | it gets bored, lets you pass |
| inspect / move / nonsense | −1, **doesn't burn a turn** | −1 | −1 |
| max turns | 5 | 5 | 6 |

Two knobs worth knowing:

- **`threshold`** — how well-reasoned a justification must be to land. Raise it
  to make a character harder to satisfy.
- **`HP`** — attrition per turn, so the health bar stays a live pressure rather
  than going inert after the tutorial. Pure stonewalling will kill you.

Off-script claims (inventing people or facts the world has never heard of) raise
the threshold by 1.5, per the brief: the character gets *more* skeptical and asks
for more.

---

## The two gauges

Both start visible after the tutorial. **Either one hitting zero ends the run.**

- **TIME** — 3:50pm to 5:00pm, 70 minutes.
- **HP** — starts at 62. She has already worked 50 hours this week.

The tutorial choice is the whole game in miniature: keep working (costs HP, saves
time) or take the break (costs 5 minutes, restores HP).

The script's fixed clock anchors (4:28pm standup, 4:30pm Rachel) use
`state.advanceTo()`, which never moves the clock **backward** — a player who
already burned past 4:28 keeps their own worse time.

---

## Endings

- **early / close / late** — branches on minutes remaining at the exit.
- **portal** — the Scenario 3 easter egg. Tell the porcupine Project Porcupine is
  already finished. It is delighted and portals you straight to the concert.
  Without Parker.
- **time** / **hp** — the two failure states.

The **epilogue plays either way** — the system files its report whether or not
you got out. Its numbers are computed from your actual playthrough (how often you
complied, avoided, wandered, typed nonsense), not hardcoded. That's the joke.

---

## Debugging

`window.ESC.debug` is available in the console:

```js
ESC.debug.jumpTo('scenario1')   // skip the intro; also: 'scenario2', 'scenario3', 'exit'
ESC.debug.setClock(16, 55)      // force the clock to 4:55pm
ESC.debug.setHp(5)              // force HP low
ESC.debug.classify('your text', 's1')   // see how the responder reads a line
ESC.debug.ledger()              // every decision recorded so far
ESC.debug.report()              // the epilogue evaluation, computed now
ESC.debug.scenes                // the scene order
```

`classify()` is the useful one when tuning — it shows the intent, the quality
score, the scene's threshold, and the grounding / absurdity / off-script scores
without playing a turn.

---

## Known scope

- The camera is **simulated** — a fake permission dialog and viewfinder, then a
  procedural ASCII portrait seeded from the name you type. Deterministic: the
  same name always makes the same face. No real webcam is requested.
- No audio. Sound cues from the script are printed as stage directions
  (`(Sound: Slack ping)`), so the beats are there if you want to wire audio in.
