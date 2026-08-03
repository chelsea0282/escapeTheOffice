const outputEl = document.getElementById('output');
const inputForm = document.getElementById('input-form');
const playerInput = document.getElementById('player-input');
const timeDisplay = document.getElementById('time-display');
const hpDisplay = document.getElementById('hp-display');
const timeBar = document.getElementById('time-bar');
const hpBar = document.getElementById('hp-bar');
const restartButton = document.getElementById('restart-button');
const portraitEl = document.getElementById('portrait');
const overlayEl = document.getElementById('overlay');
const overlayTitleEl = document.getElementById('overlay-title');
const overlayMessageEl = document.getElementById('overlay-message');
const overlayForm = document.getElementById('overlay-form');
const overlayInput = document.getElementById('overlay-input');
const choiceContainer = document.getElementById('choice-container');

const state = {
  phase: 'auth',
  playerName: '',
  cameraApproved: false,
  currentScene: 'intro',
  currentTime: 950,
  focus: 100,
  history: []
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function formatClock(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const displayHours = hours % 12 || 12;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  return `${displayHours}:${String(mins).padStart(2, '0')} ${suffix}`;
}

function appendText(text, className = 'narrator') {
  const paragraph = document.createElement('p');
  paragraph.className = className;
  outputEl.appendChild(paragraph);
  outputEl.scrollTop = outputEl.scrollHeight;

  let index = 0;
  const timer = window.setInterval(() => {
    if (index >= text.length) {
      window.clearInterval(timer);
      return;
    }
    paragraph.textContent += text[index];
    index += 1;
    outputEl.scrollTop = outputEl.scrollHeight;
  }, 18);
}

function updateHUD() {
  timeDisplay.textContent = formatClock(state.currentTime);
  hpDisplay.textContent = `${state.focus}%`;
  const timePercent = clamp(((state.currentTime - 950) / 70) * 100, 0, 100);
  const focusPercent = state.focus;
  timeBar.style.width = `${timePercent}%`;
  hpBar.style.width = `${focusPercent}%`;
}

function showOverlay(title, message, placeholder = '', submitLabel = 'SUBMIT') {
  overlayTitleEl.textContent = title;
  overlayMessageEl.textContent = message;
  overlayInput.placeholder = placeholder;
  overlayInput.value = '';
  overlayForm.querySelector('button').textContent = submitLabel;
  overlayEl.classList.remove('hidden');
  overlayInput.focus();
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
}

function showChoices(options) {
  choiceContainer.innerHTML = '';
  choiceContainer.classList.remove('hidden');
  inputForm.classList.add('hidden');
  options.forEach((option) => {
    const button = document.createElement('button');
    button.className = 'choice-btn';
    button.textContent = option.label;
    button.addEventListener('click', () => {
      choiceContainer.classList.add('hidden');
      inputForm.classList.remove('hidden');
      handleChoice(option.value);
    });
    choiceContainer.appendChild(button);
  });
}

function hideChoices() {
  choiceContainer.innerHTML = '';
  choiceContainer.classList.add('hidden');
  inputForm.classList.remove('hidden');
}

function renderScene(sceneName) {
  const scene = GAME_SCRIPT[sceneName];
  if (!scene) return;

  scene.forEach((step) => {
    if (step.type === 'narrator') {
      appendText(step.text, 'narrator');
    } else if (step.type === 'dialogue') {
      appendText(`${step.speaker}: ${step.text}`, 'speaker');
    } else if (step.type === 'prompt') {
      appendText(step.text, 'prompt');
      if (step.prefill) {
        playerInput.value = step.prefill;
      }
      state.currentScene = step.next || sceneName;
    }
  });

  if (!scene.some((step) => step.type === 'prompt')) {
    state.currentScene = sceneName;
  }
}

function evaluateResponse(rule, input) {
  const lowered = input.toLowerCase();
  const clauses = rule.split(';').map((part) => part.trim()).filter(Boolean);
  let nextScene = null;
  const effects = [];

  clauses.forEach((clause) => {
    const match = clause.match(/^if input contains (.+) -> (.+)$/i) || clause.match(/^else -> (.+)$/i) || clause.match(/^else if input contains (.+) -> (.+)$/i);
    if (!match) return;

    if (clause.startsWith('else')) {
      const actions = match[1].split(' and ').map((part) => part.trim());
      actions.forEach((action) => applyAction(action));
      return;
    }

    const terms = match[1].split(' or ').map((term) => term.trim().toLowerCase());
    const isMatch = terms.some((term) => lowered.includes(term));
    if (isMatch) {
      const actions = match[2].split(' and ').map((part) => part.trim());
      actions.forEach((action) => applyAction(action));
    }
  });

  return { nextScene, effects };

  function applyAction(action) {
    if (action.startsWith('set focus')) {
      const amount = parseInt(action.match(/[-+]?\d+/)?.[0] || '0', 10);
      state.focus = clamp(state.focus + amount, 0, 100);
    } else if (action.startsWith('set time')) {
      const amount = parseInt(action.match(/[-+]?\d+/)?.[0] || '0', 10);
      state.currentTime = clamp(state.currentTime + amount, 230, 300);
    } else if (action.startsWith('append model response')) {
      const text = action.replace(/^append model response\s+/i, '').trim();
      effects.push({ type: 'append', text });
    } else if (action.startsWith('next')) {
      nextScene = action.replace(/^next\s+/i, '').trim();
    }
  }
}

function startGame() {
  outputEl.innerHTML = '';
  hideChoices();
  state.phase = 'auth';
  state.playerName = '';
  state.cameraApproved = false;
  state.currentScene = 'intro';
  state.currentTime = 950;
  state.focus = 100;
  state.history = [];
  portraitEl.textContent = 'PHOTO ID';
  updateHUD();
  showOverlay('REPLAK.AI', 'Please type your name.', 'your name');
}

function bootSequence() {
  appendText('REPLAK.AI SYSTEM: Welcome back. Your afternoon break was longer than usual.', 'status');
  appendText('The screen blinks. The terminal boots into the main gameplay interface.', 'status');
  portraitEl.textContent = state.playerName.toUpperCase();
  updateHUD();
  setTimeout(() => {
    renderScene('intro');
  }, 800);
}

function handleAuthSubmit(input) {
  if (!state.playerName) {
    state.playerName = input.trim();
    showOverlay('REPLAK.AI', 'Camera access is required for authentication. Type YES to continue.', 'yes');
    return;
  }

  if (!state.cameraApproved) {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'yes' || normalized === 'allow' || normalized === 'y') {
      state.cameraApproved = true;
      hideOverlay();
      appendText('The camera flashes. The system pauses for one second.', 'status');
      setTimeout(() => {
        bootSequence();
      }, 900);
    } else {
      appendText('The prompt remains. The system waits for confirmation.', 'status');
    }
  }
}

function handleIntroResponse(input) {
  appendText(`Jamie: ${input}`, 'player');
  const lower = input.toLowerCase();
  state.currentTime += 5;
  state.focus = clamp(state.focus - 6, 0, 100);
  updateHUD();

  if (lower.includes('phs') || lower.includes('coffee') || lower.includes('water') || lower.includes('snack') || lower.includes('break')) {
    appendText('REPLAK.AI SYSTEM: WARNING: You just got back from a long break. Why are you trying to leave the desk again?', 'status');
    showChoices([
      { label: 'A — Keep working', value: 'keep' },
      { label: 'B — Take the break and be more productive', value: 'break' }
    ]);
  } else {
    appendText('REPLAK.AI SYSTEM: WARNING: You just got back from a long break. Why are you trying to leave the desk again?', 'status');
    showChoices([
      { label: 'A — Keep working', value: 'keep' },
      { label: 'B — Take the break and be more productive', value: 'break' }
    ]);
  }
}

function handleChoice(choice) {
  if (state.currentScene === 'intro') {
    if (choice === 'keep') {
      appendText('You decide to keep working and save the break for later.', 'narrator');
      state.currentTime += 5;
      state.focus = clamp(state.focus - 12, 0, 100);
      updateHUD();
      renderScene('keep_working');
    } else {
      appendText('You decide that the break is part of the job.', 'narrator');
      state.currentTime += 5;
      state.focus = clamp(state.focus - 8, 0, 100);
      updateHUD();
      renderScene('take_break');
    }
  }
}

function handleGameplayInput(input) {
  const scene = GAME_SCRIPT[state.currentScene];
  if (!scene) return;

  appendText(`Jamie: ${input}`, 'player');

  if (state.currentScene === 'intro') {
    handleIntroResponse(input);
    return;
  }

  const responseStep = scene.find((step) => step.type === 'response');
  if (!responseStep) {
    if (state.currentScene === 'keep_working' || state.currentScene === 'take_break') {
      renderScene('scene1');
    }
    return;
  }

  const result = evaluateResponse(responseStep.rule, input);
  result.effects.forEach((effect) => {
    if (effect.type === 'append') {
      appendText(effect.text, 'speaker');
    }
  });
  updateHUD();
  if (result.nextScene) {
    state.currentScene = result.nextScene;
    renderScene(result.nextScene);
  }
}

inputForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = playerInput.value.trim();
  if (!input) return;

  if (state.phase === 'auth') {
    handleAuthSubmit(input);
    playerInput.value = '';
    return;
  }

  if (state.currentScene === 'ending') {
    startGame();
    playerInput.value = '';
    return;
  }

  handleGameplayInput(input);
  playerInput.value = '';
});

overlayForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const input = overlayInput.value.trim();
  if (!input) return;
  handleAuthSubmit(input);
  overlayInput.value = '';
});

restartButton.addEventListener('click', () => {
  startGame();
});

startGame();
