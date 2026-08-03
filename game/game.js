const storyEl = document.getElementById('story');
const inputForm = document.getElementById('input-form');
const playerInput = document.getElementById('player-input');
const timeDisplay = document.getElementById('time-display');
const legibilityDisplay = document.getElementById('legibility-display');
const timeFill = document.querySelector('.fill-time');
const hpFill = document.querySelector('.fill-hp');
const restartButton = document.getElementById('restart-button');

const state = {
  scene: 0,
  minute: 50,
  legibility: 0,
  pressure: 'low'
};

function appendLine(text, className = 'narrator') {
  const paragraph = document.createElement('p');
  paragraph.className = className;
  paragraph.textContent = text;
  storyEl.appendChild(paragraph);
  storyEl.scrollTop = storyEl.scrollHeight;
}

function updateHud() {
  timeDisplay.textContent = `4:${String(state.minute).padStart(2, '0')} PM`;
  legibilityDisplay.textContent = `${state.legibility}%`;

  const timeLeftPercent = Math.max(0, Math.min(100, ((state.minute - 45) / 5) * 100));
  const hpPercent = Math.max(0, Math.min(100, state.legibility));

  if (timeFill) {
    timeFill.style.height = `${timeLeftPercent}%`;
  }

  if (hpFill) {
    hpFill.style.height = `${hpPercent}%`;
  }
}

function setPressure() {
  if (state.legibility >= 75) {
    state.pressure = 'high';
  } else if (state.legibility >= 40) {
    state.pressure = 'rising';
  } else {
    state.pressure = 'low';
  }
}

function evaluateInput(input) {
  const lowered = input.toLowerCase();
  const strongReasons = ['concert', 'train', 'family', 'doctor', 'appointment', 'home', 'important', 'need to leave', 'i have to go', 'my ride', 'kid', 'deadline', 'dinner', 'water', 'protein', 'ticket'];
  const weakReasons = ['because', 'just', 'maybe', 'i guess', 'stuff', 'whatever'];
  const helpfulActions = ['reply', 'email', 'send', 'help', 'look', 'check', 'delegate', 'ask', 'note', 'later', 'short'];

  let score = 0;
  let accepted = false;

  if (strongReasons.some((term) => lowered.includes(term))) {
    score += 18;
    accepted = true;
  } else if (helpfulActions.some((term) => lowered.includes(term))) {
    score += 8;
    accepted = true;
  }

  if (lowered.includes('leave') || lowered.includes('go home') || lowered.includes('elevator')) {
    score += 6;
  }

  if (weakReasons.some((term) => lowered.includes(term))) {
    score -= 8;
  }

  if (lowered.length < 8) {
    score -= 10;
  }

  if (score >= 12) {
    accepted = true;
  }

  return { score, accepted };
}

function startGame() {
  storyEl.innerHTML = '';
  state.scene = 0;
  state.minute = 50;
  state.legibility = 0;
  state.pressure = 'low';
  updateHud();

  appendLine('Wednesday, 4:47 PM. The fluorescent lights hum overhead. The office is almost empty, and the air smells faintly of printer toner and stale coffee.', 'narrator');
  appendLine('You have a concert to catch. A train to make. A sliver of evening that suddenly feels precious.', 'narrator');
  appendLine('Rachel turns in her chair. “Hey Jamie, before you go, could you reply to the email I just CC’d you on? It would really help if we could keep the ball rolling on Project Porcupine.”', 'speaker');
  appendLine('The request is ordinary. The timing is not.', 'narrator');
  appendLine('What do you do?', 'prompt');
}

function advanceScene(input) {
  const result = evaluateInput(input);
  state.legibility = Math.max(0, Math.min(100, state.legibility + result.score));
  setPressure();
  state.minute = Math.max(45, state.minute - 2);
  updateHud();

  appendLine(`Jamie: ${input}`, 'player');

  if (state.scene === 0) {
    if (result.accepted) {
      appendLine('Rachel considers your answer and nods. “That seems reasonable. I can take it from here.”', 'speaker');
      appendLine('You take the smallest of victories: a clear explanation, a shared understanding, and a lane toward the door.', 'narrator');
    } else {
      appendLine('Rachel studies your answer for a beat. “I understand that you want to leave. From my perspective, I still don’t have enough information to understand why this request should take priority over the launch.”', 'speaker');
      appendLine('The silence that follows feels procedural, not cruel. The office has started to ask for a better explanation.', 'narrator');
    }

    state.scene = 1;
    appendLine('Jerry looks up from the next desk. “Hey Jamie, can you circle back on the action items from the standup?”', 'speaker');
    appendLine('The clock reads 4:55 PM. The elevator is still there. The train is still waiting somewhere beyond the glass.', 'narrator');
    appendLine('What do you do?', 'prompt');
    return;
  }

  if (state.scene === 1) {
    if (result.accepted) {
      appendLine('Jerry gives a short, practical nod. “Okay. That makes sense. I’ll take the note from here.”', 'speaker');
      appendLine('You are closer to the exit now, but the room has already begun to reorganize itself around your explanation.', 'narrator');
    } else {
      appendLine('Jerry leans back. “I’m not sure I follow. If this is important, I’d like to understand why it’s more important than the launch.”', 'speaker');
      appendLine('The question is not hostile. It is simply a form of measurement.', 'narrator');
    }

    state.scene = 2;
    appendLine('At the edge of the room, the elevator button glows. Your water bottle is still on your desk. The hallway beyond it feels suddenly official.', 'narrator');
    appendLine('You are nearly out the door. What do you do?', 'prompt');
    return;
  }

  if (state.scene === 2) {
    if (result.accepted) {
      appendLine('The office yields just enough. The elevator arrives. The hallway opens. You step into the late light with your bag and your explanation intact.', 'narrator');
      appendLine('On your phone, a message appears from your lead. You don’t open it.', 'narrator');
      appendLine('The game ends with a question left hanging: did you leave because you chose to, or because you successfully made yourself legible?', 'prompt');
    } else {
      appendLine('The office does not stop you, exactly. It simply asks one more time for the shape of your intention.', 'narrator');
      appendLine('You miss the train. The message from your lead is still waiting. The evening becomes an argument you have already lost to the clock.', 'narrator');
      appendLine('The game ends with a quiet, uncomfortable verdict: your desire was not enough on its own.', 'prompt');
    }

    state.scene = 3;
    return;
  }

  appendLine('The office has already made its decision. The story is over.', 'narrator');
}

inputForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = playerInput.value.trim();

  if (!input) {
    return;
  }

  if (state.scene >= 3) {
    startGame();
    playerInput.value = '';
    return;
  }

  advanceScene(input);
  playerInput.value = '';
});

restartButton.addEventListener('click', () => {
  startGame();
});

startGame();
