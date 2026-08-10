/* ============================================================================
   FX — THE SET DESIGN LAYER
   ----------------------------------------------------------------------------
   The brief's rule: text written WITHOUT indentation is "a visual change that
   needs to be coded out". It is set design — the player should see and hear it
   happen, not read a description of it happening.

   So every un-indented stage direction in the script maps to a named effect in
   here, and content/script.js just names it:

       { type: 'fx', name: 'slackPing' }

   Sound is synthesised with the Web Audio API. There are no audio files and
   nothing to download — every noise in this game is a few oscillators and a
   noise buffer. Browsers block audio until a user gesture, so nothing is
   audible until the title-card keypress calls fx.unlock().

   Adding a cue = add a function to EFFECTS. Nothing else needs to change.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.fx = (function () {

  var fx = {};

  /* ======================================================================
     AUDIO CORE
     ==================================================================== */

  var ctx = null;
  var master = null;
  var muted = false;
  var unlocked = false;

  /* Ambient typing loop state. */
  var typing = { timer: null, level: 0 };

  function ensure() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;                       // no Web Audio: stay silent
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
    }
    return ctx;
  }

  /* Called from the title-card keypress — the gesture browsers require. */
  fx.unlock = function () {
    var c = ensure();
    if (!c) return;
    if (c.state === 'suspended') c.resume();
    unlocked = true;
  };

  fx.isMuted = function () { return muted; };

  fx.toggleMute = function () {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.5;
    if (muted) stopTyping();
    else if (typing.level) startTyping(typing.level);
    return muted;
  };

  function now() { return ctx ? ctx.currentTime : 0; }

  /* A single shaped tone. The whole sound design is built from this. */
  function tone(opts) {
    var c = ensure();
    if (!c || muted || !unlocked) return;
    var t0    = now() + (opts.delay || 0);
    var dur   = opts.dur || 0.12;
    var osc   = c.createOscillator();
    var gain  = c.createGain();

    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(opts.freq, t0);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(opts.to, t0 + dur);

    var peak = (opts.gain === undefined ? 0.25 : opts.gain);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    var node = osc;
    if (opts.filter) {
      var f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.filter;
      osc.connect(f); node = f;
    }
    node.connect(gain);
    gain.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  /* Filtered white noise — keystrokes, static, the shutter. */
  function noise(opts) {
    var c = ensure();
    if (!c || muted || !unlocked) return;
    var dur = opts.dur || 0.08;
    var t0  = now() + (opts.delay || 0);
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buf = c.createBuffer(1, len, c.sampleRate);
    var d   = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    var src  = c.createBufferSource();
    var gain = c.createGain();
    var filt = c.createBiquadFilter();
    src.buffer = buf;
    filt.type = opts.filterType || 'bandpass';
    filt.frequency.value = opts.freq || 1800;
    filt.Q.value = opts.q || 1;

    var peak = (opts.gain === undefined ? 0.16 : opts.gain);
    gain.gain.setValueAtTime(peak, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filt); filt.connect(gain); gain.connect(master);
    src.start(t0);
    src.stop(t0 + dur + 0.02);
  }

  /* ======================================================================
     AMBIENT TYPING — "typing sound continues" / "intensifies"
     ==================================================================== */

  function stopTyping() {
    if (typing.timer) { clearTimeout(typing.timer); typing.timer = null; }
  }

  function startTyping(level) {
    stopTyping();
    if (!level || muted) return;
    /* level 1 = the room working. level 2 = the room working AT you. */
    var gap  = level >= 2 ? 55  : 110;
    var jit  = level >= 2 ? 70  : 150;
    var vol  = level >= 2 ? 0.05 : 0.03;

    (function clatter() {
      noise({ dur: 0.012, freq: 2400 + Math.random() * 1800, q: 0.7, gain: vol });
      typing.timer = setTimeout(clatter, gap + Math.random() * jit);
    })();
  }

  /* ======================================================================
     SCREEN EFFECTS
     ==================================================================== */

  function el(id) { return document.getElementById(id); }

  /* A Slack-style notification sliding in over the terminal. */
  function toast(title, body, ms) {
    var host = el('fx-layer');
    if (!host) return Promise.resolve();
    var n = document.createElement('div');
    n.className = 'fx-toast';
    var h = document.createElement('div');
    h.className = 'fx-toast-title';
    h.textContent = title;
    var p = document.createElement('div');
    p.className = 'fx-toast-body';
    p.textContent = body;
    n.appendChild(h); n.appendChild(p);
    host.appendChild(n);
    requestAnimationFrame(function () { n.classList.add('in'); });
    return new Promise(function (resolve) {
      setTimeout(function () {
        n.classList.remove('in');
        setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); resolve(); }, 320);
      }, ms || 2200);
    });
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ======================================================================
     THE EFFECT REGISTRY
     Every name here is something content/script.js can call by name.
     ==================================================================== */

  var EFFECTS = {

    /* -- ambience ------------------------------------------------------ */

    typingStart: function () { typing.level = 1; startTyping(1); },

    typingIntensify: function () {
      typing.level = 2; startTyping(2);
      var c = ESC.ui && ESC.ui.crt && ESC.ui.crt();
      if (c) { c.classList.add('fx-pressure'); setTimeout(function(){ c.classList.remove('fx-pressure'); }, 2600); }
      return sleep(900);
    },

    typingStop: function () { typing.level = 0; stopTyping(); },

    /* The dead-pan monotone drone the brief asks for under the terminal. */
    deepBop: function () {
      tone({ freq: 88,  to: 62, dur: 0.85, type: 'sine',     gain: 0.20, filter: 400 });
      tone({ freq: 132, to: 88, dur: 0.55, type: 'triangle', gain: 0.07, delay: 0.05 });
      return sleep(420);
    },

    /* -- login --------------------------------------------------------- */

    bootBops: function () {
      tone({ freq: 620, dur: 0.10, type: 'square', gain: 0.10 });
      tone({ freq: 430, dur: 0.10, type: 'square', gain: 0.10, delay: 0.16 });
      tone({ freq: 880, dur: 0.14, type: 'square', gain: 0.09, delay: 0.32 });
      tone({ freq: 110, to: 70, dur: 0.6, type: 'sine', gain: 0.16, delay: 0.46 });
      return sleep(700);
    },

    shutter: function () {
      noise({ dur: 0.035, freq: 3200, q: 0.6, gain: 0.30 });
      noise({ dur: 0.10,  freq: 900,  q: 0.8, gain: 0.18, delay: 0.05 });
      tone({ freq: 1500, dur: 0.05, type: 'square', gain: 0.06, delay: 0.02 });
    },

    /* -- the office ---------------------------------------------------- */

    /* "Your screen shots ['count the number of boxes on the screen']" —
       the boxes actually appear, and are actually countable. */
    countBoxes: function () {
      var host = el('fx-layer');
      if (!host) return sleep(200);
      var field = document.createElement('div');
      field.className = 'fx-boxfield';
      host.appendChild(field);

      var total = 29;
      var i = 0;
      return new Promise(function (resolve) {
        (function pop() {
          if (i >= total) {
            /* the miscount: one quietly vanishes */
            setTimeout(function () {
              var kids = field.querySelectorAll('.fx-box');
              if (kids.length) kids[(Math.random() * kids.length) | 0].classList.add('gone');
              setTimeout(function () {
                field.classList.add('out');
                setTimeout(function () {
                  if (field.parentNode) field.parentNode.removeChild(field);
                  resolve();
                }, 420);
              }, 700);
            }, 380);
            return;
          }
          var b = document.createElement('span');
          b.className = 'fx-box';
          b.style.left = (4 + Math.random() * 88) + '%';
          b.style.top  = (6 + Math.random() * 84) + '%';
          field.appendChild(b);
          tone({ freq: 300 + i * 14, dur: 0.03, type: 'square', gain: 0.035 });
          i++;
          setTimeout(pop, 70);
        })();
      });
    },

    /* Jerry's face popping up on your screen. */
    slackPing: function () {
      tone({ freq: 880,  dur: 0.09, type: 'sine', gain: 0.22 });
      tone({ freq: 1320, dur: 0.13, type: 'sine', gain: 0.18, delay: 0.10 });
      return toast('JERRY', 'is typing…', 2000);
    },

    /* The Replak.AI warning sign arriving. */
    warning: function () {
      tone({ freq: 220, dur: 0.20, type: 'sawtooth', gain: 0.13, filter: 900 });
      tone({ freq: 233, dur: 0.20, type: 'sawtooth', gain: 0.13, filter: 900 });
      var c = ESC.ui && ESC.ui.crt && ESC.ui.crt();
      if (c) { c.classList.add('fx-alarm'); setTimeout(function(){ c.classList.remove('fx-alarm'); }, 900); }
    },

    /* Gauges arriving on the side of the screen. */
    gaugesArrive: function () {
      tone({ freq: 520, dur: 0.07, type: 'square', gain: 0.07 });
      tone({ freq: 700, dur: 0.09, type: 'square', gain: 0.07, delay: 0.09 });
    },

    /* A beat of silence with a rule across the terminal — replaces the
       "SCENARIO n BEGINS" production labels. */
    sceneBreak: function () {
      if (ESC.ui) ESC.ui.rule();
      return sleep(700);
    },

    /* -- the strange parts --------------------------------------------- */

    /* The office metabolising something awful into praise. */
    absorb: function () {
      tone({ freq: 660, dur: 0.10, type: 'sine', gain: 0.10 });
      tone({ freq: 880, dur: 0.16, type: 'sine', gain: 0.09, delay: 0.10 });
      return sleep(200);
    },

    staticFlip: function () {
      noise({ dur: 1.0, freq: 2600, q: 0.25, gain: 0.20, filterType: 'highpass' });
      tone({ freq: 160, to: 40, dur: 0.9, type: 'square', gain: 0.06 });
      return ESC.ui ? ESC.ui.staticBurst() : sleep(1000);
    },

    evaluatorPing: function () {
      tone({ freq: 1046, dur: 0.06, type: 'sine', gain: 0.12 });
      tone({ freq: 784,  dur: 0.08, type: 'sine', gain: 0.10, delay: 0.07 });
      return sleep(260);
    },

    /* -- endings -------------------------------------------------------- */

    clockOut: function () {
      tone({ freq: 400, dur: 0.5, type: 'square',   gain: 0.10 });
      tone({ freq: 200, dur: 0.9, type: 'sawtooth', gain: 0.10, delay: 0.35, filter: 600 });
      typing.level = 0; stopTyping();
      return sleep(700);
    },

    flatline: function () {
      typing.level = 0; stopTyping();
      tone({ freq: 110, dur: 2.0, type: 'sine', gain: 0.14 });
      return sleep(900);
    },

    daylight: function () {
      typing.level = 0; stopTyping();
      tone({ freq: 523, dur: 0.5, type: 'sine', gain: 0.10 });
      tone({ freq: 659, dur: 0.5, type: 'sine', gain: 0.09, delay: 0.12 });
      tone({ freq: 784, dur: 0.8, type: 'sine', gain: 0.08, delay: 0.24 });
      return sleep(600);
    }
  };

  /* ======================================================================
     PUBLIC
     ==================================================================== */

  fx.play = function (name, arg) {
    var f = EFFECTS[name];
    if (!f) {
      console.warn('[fx] unknown effect:', name);
      return Promise.resolve();
    }
    return Promise.resolve(f(arg));
  };

  fx.has = function (name) { return !!EFFECTS[name]; };
  fx.effects = EFFECTS;
  fx.toast = toast;

  /* The mute control. Built here rather than in index.html because it only
     exists if this layer is loaded. */
  fx.mountMuteToggle = function () {
    var host = el('fx-layer');
    if (!host || el('fx-mute')) return;
    var b = document.createElement('button');
    b.id = 'fx-mute';
    b.type = 'button';
    b.textContent = '[♪]';
    b.title = 'mute / unmute';
    b.addEventListener('click', function () {
      var m = fx.toggleMute();
      b.textContent = m ? '[ ]' : '[♪]';
      b.classList.toggle('off', m);
    });
    host.appendChild(b);
  };

  return fx;
})();
