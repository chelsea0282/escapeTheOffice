# FIRE(ESC)APE

A text-narration world-exploration game, built from `brainstorm.pdf`
(Aug 9 2026 revision). By Chelsea Han & Tiffany Quon.

You are Jamie, a product manager at Replak.ai. It is another Thursday. You have
spent 50 hours in the office this week, Project Porcupine is going sideways, and
you cannot keep doing this. You can't quit out of the blue — there needs to be a
compelling reason why.

So you are going to get fired. It can't be that hard.

It is extremely hard. Every choice you make, including the deliberately awful
ones, is metabolised by the office into praise. Blame a colleague and he thanks
you for the growth opportunity. Confess a felony to the CEO and you are
promoted. **The two `SUDDEN DEATH` branches are the model-employee answers** —
picking one ends the run early, because here, being a good employee is how you
lose.

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
  state.js            caption clock, progress, the decision ledger, [] tokens
  ui.js               the only file that touches the DOM
  fx.js               THE SET DESIGN: synthesised sound + screen effects
  engine.js           reusable mechanics: choice, open input, typewriter
  responder.js        the scripted stand-in for the LLM
  main.js             boot, scene order, sudden-death routing, restart, debug
content/
  script.js           THE SCRIPT — every scene, as data
  world.js            the appendix: people, the feature, the malware, the RCVs
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
progress-fill width, which is a continuous value; its easing and colour still
come from CSS.)

---

## How the writing works

`content/script.js` is **data**, not code. A scene is an array of beats:

```js
{ type: 'locate', time: '4:27PM', location: 'Your Desk, Second Floor' },
{ type: 'narrate', text: 'You open the email.' },
{ type: 'say', speaker: 'Jerry', text: 'hey [player]. Going to cc you…' },
{ type: 'email', from: 'chris@…', subject: '[Escalation] …', body: '…' },
{ type: 'choose', options: [ … ] },
{ type: 'continue' },
{ type: 'freshScreen' },
```

Available beat types: `narrate` `say` `system` `fx` `marker` `art` `popup`
`wait` `locate` `freshScreen` `continue` `email` `chat` `restart` `chrome`
`typeExact` `choose` `openInput` `call` `branch`.

Conventions carried over from the brief:

- **NARRATOR lines print with no name label** — the terminal *is* the narrator.
  Every other character prints `Jerry: ` first.
- Indented script text became `narrate` / `say` / `system` (typed into the terminal).
- Un-indented stage directions became **`fx` / `locate` / `freshScreen`** — set
  design. They are never printed as prose. See below.
- Text is typed **one letter at a time at reading speed**, with longer beats on
  sentence endings. Press space, enter or click to skip a line.

### The script's own furniture

The doc calls for several things that are now real components:

| the script says | what happens |
|---|---|
| "Question appears at the bottom of the screen (separated from the narration)" | the choice panel below the terminal |
| "time/location text title updates to…" | `locate` beat repaints the caption bar |
| "Fresh terminal screen." | `freshScreen` clears the terminal between scenes |
| "Click to continue in italics" | `continue` beat waits for a key or click |
| "formatted like a standard desktop email, in a box" | `email` beat |
| "shows up formatted as a chat message" | `chat` beat |
| "a button to click to restart the game" | `restart` beat |
| "Show progress bar" | the progress bar under the caption |

### Choices live below the narration

Options are a UI affordance, not story, so they render in a **choice panel below
the terminal** and are wiped on selection. The narration box only records what
ends up happening:

```js
{ type: 'choose', question: 'What do you say to Jerry?', options: [
    { key: 'A', label: 'Jerry, get your head in the game.', … },
    { key: 'B', label: 'You push Jerry to the front line.', … },
] },
```

The picked option is echoed into the terminal as `> …` so the transcript reads
as a story. Set **`echo: false`** on an option whose `then` beats already narrate
it, to avoid saying it twice — for instance "Blame Jerry." is followed by *"You
respond to the email by saying that this is Jerry's fault"*, so it does not need
echoing. Options you did **not** pick never reach the terminal at all.

### `[]` tokens

Every string printed to the terminal — including speaker labels — passes through
`state.interpolate()` first, so these resolve automatically:

`[player]` · `[name]` · `[time]` · `[location]` · `[caption]` · `[date]` ·
`[coffee]`

An unknown token renders visibly as `[?whatever]` rather than vanishing, so
authoring gaps are obvious. Add your own in the `TOKENS` table in `js/state.js`.

---

## Set design (`js/fx.js`)

The brief's rule for un-indented text is that it's "a visual change that **needs
to be coded out**." So stage directions are never printed as prose — the player
sees and hears them happen.

```js
{ type: 'fx', name: 'slackPing' },
```

**All sound is synthesised** with the Web Audio API. There are no audio files;
every noise is a few oscillators and a noise buffer. Browsers block audio until a
user gesture, so it unlocks on the title-card keypress. There's a `[♪]` mute
toggle bottom-left, and the game degrades silently if Web Audio is unavailable.

| effect | what happens |
|---|---|
| `typingStart` / `typingIntensify` / `typingStop` | the office typing around you, thickening on cue |
| `deepBop` | the dead-pan monotone drone the brief asks for |
| `bootBops` / `shutter` | login beep-bops; the camera taking your photo |
| `slackPing` | two-tone ping + a JERRY notification sliding in |
| `warning` | the Replak.AI alarm buzz and screen wash |
| `absorb` | the small chime of something awful being praised |
| `staticFlip` | the cut to seventeen years later |
| `clockOut` / `flatline` | the ending; the sudden death |

**To add a cue:** write a function in `EFFECTS` in `js/fx.js`, then name it from
the script. Nothing else changes.

If a stage direction is ever left as an old `visual` beat, the engine prints
**nothing** and warns in the console instead — so prose can't leak back into the
terminal by accident.

---

## The responder (there is no LLM)

The brief calls for a model at each `<Open input response:>`. This build has
none, so `js/responder.js` does the job deterministically — and its job here is
the **opposite** of a normal dialogue system. From the doc:

> "No matter what the player inputs, it should be incorporated in the story.
> Find a way to justify what the player is doing. No matter what the player
> input is, it should be spun into a good thing that Jamie gets rewarded for."

So there is no accept/reject and no score to beat. The responder reads the
**register** of what you typed and returns the flavour of praise the doc assigns
to it:

| register | what the office does |
|---|---|
| `professional` | Chris thanks you and CCs Rachel so you get credit |
| `brief` | Chris praises your brevity |
| `irrelevant` | Chris agrees and thanks you for the reframe |
| `rude` | Chris likes your directness; Jerry cites RCV #2348: Be yourself over email |
| `quit` | nobody hears it — Jerry appears in person to support you |
| `leave` | praised for drawing protective boundaries |
| `confused` | recognised for vulnerability |
| `empathy` | nominated for an internal award |
| `pushback` | admired for holding a high bar, then overruled |
| `nonsense` | **the only thing it can't absorb** — see below |

Two restrictions from the doc's Gameplay notes are enforced:

- **One turn, then back on script.** Every verdict resolves immediately.
- **"If an action can't be justified, give players only options of A or B that
  would get them back on track."** Unparseable input is rejected by the system
  and the scene hands you its A/B options instead.

**Tuning lever:** adding a keyword to `content/world.js` teaches the game that
word, because grounding is what distinguishes a specific reply from a generic
one. Prose lives in `content/responses.js`, keyed by scene and register.

---

## Endings

- **THE END** — you reach the epilogue. Seventeen years later, penthouse,
  CEO tomorrow. *"You failed to get fired."*
- **SUDDEN DEATH ×2** — carry Rachel's coffee, or own the feature in the
  meeting. Both are the good-employee answer; both end the run on the spot with
  a promotion and a `[ PLAY AGAIN ]` button.

Restarting keeps your name and photo and drops you back at 4:00PM.

---

## Debugging

`window.ESC.debug` is available in the console:

```js
ESC.debug.jumpTo('scenario3')      // skip ahead; see ESC.debug.scenes()
ESC.debug.classify('your text')    // how the responder reads a line
ESC.debug.reply('s1', 'rude')      // preview a scene's reply to a register
ESC.debug.ledger()                 // every decision recorded so far
ESC.debug.restart()                // replay without reloading
```

---

## Known scope

- **Scenario 0 is not implemented.** The doc (p7) carries only the heading
  *"SCENARIO 0 BEGINS - leadership leads want ROI (meeting)"* and the note
  *"Meeting where (put into top narrative)"*. `S.scenario0` is an empty array in
  `content/script.js`; `main.js` skips empty scenes automatically, so adding
  beats there is all that's needed to bring it in.
- **No HP or time gauges.** The rules page still describes them, but the new
  script has no HP, its clock is fixed narrative stamps, and it deliberately
  runs past 5:00PM. The caption bar and progress bar replace them, per the new
  Gameplay note.
- The camera is **simulated** — a fake permission dialog and viewfinder, then a
  procedural ASCII portrait seeded from the name you type. Deterministic: the
  same name always makes the same face. No real webcam is requested.
