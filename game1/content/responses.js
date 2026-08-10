/* ============================================================================
   CONTENT — AUTHORED RESPONSE POOLS
   ----------------------------------------------------------------------------
   js/responder.js reads the REGISTER of what the player typed; this file
   supplies what the office says back. Following the doc, every reply is a
   reward. There is no failure branch, because the joke is that there isn't one.

   Authoring format — each variant is a list of [speaker, text] pairs:

       s1: {
         brief: [
           [ ['', 'You send it.'],
             ['Chris', 'Love the brevity.'] ]
         ]
       }

   An empty speaker is the NARRATOR (printed with no name label, per the
   brief). Lookup order is scene[intent] -> scene.default -> shared.default,
   so a scene only needs to author the registers it treats specially.

   [] tokens are resolved by state.interpolate() at print time.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.responses = {

  /* ======================================================================
     SHARED
     ==================================================================== */
  shared: {

    /* The only input the office cannot metabolise. Per the doc, this drops
       the player back to the A/B options that put them back on script. */
    nonsense: [
      'INPUT NOT RECOGNISED. Please select from the available options.',
      'PARSE FAILURE. Returning you to the approved responses.',
      'REPLAK.AI could not map that to a known professional intent. Choose an option below.',
      'That did not scan. The approved responses are listed below.'
    ],

    default: [
      [ ['', 'You send it.'],
        ['', 'Nothing bad happens. Nothing bad ever happens.'] ]
    ]
  },

  /* ======================================================================
     SCENARIO 1 — the escalation email from Chris
     ==================================================================== */
  s1: {

    professional: [
      [ ['', 'You write back, measured and clear, and hit send.'],
        ['Chris', 'Jamie — this is exactly what I needed, thank you. Really appreciate the fast turnaround. Copying your manager here so she can see how well this was handled.'],
        ['', 'He CCs Rachel.'],
        ['Rachel', 'Saw this. Textbook. Thanks Jamie.'] ]
    ],

    brief: [
      [ ['', 'You send it. It is four words long.'],
        ['Chris', 'Wow — straight to the point. Honestly refreshing. Most people would have sent me six paragraphs. Copying Rachel so she sees this.'],
        ['Rachel', 'Brevity is so underrated. Noting this for your review.'] ]
    ],

    irrelevant: [
      [ ['', 'You send it. It is not, strictly, about the escalation.'],
        ['Chris', 'You know what, Jamie — that is a really good point and not where I expected this thread to go. It has genuinely made me think about what is actually important here.'],
        ['', 'He CCs Rachel so that you get recognition for the task.'],
        ['Rachel', 'Reframing the problem. That is senior behaviour.'] ]
    ],

    rude: [
      [ ['', 'You send it. You do not soften it.'],
        ['Chris', 'Ha! Okay. I like that you are direct with me — most vendors are so careful. This is why I like working with Replak.'],
        ['Jerry', 'Hey, I saw that thread. Honestly? Respect. That is Replak Core Value #2348: Be yourself over email. Not everyone can do that.'] ]
    ],

    quit: [
      [ ['', 'You type it out plainly and send it.'],
        ['', 'Jerry does not answer over chat. He appears at the side of your desk, in person, holding his thermos.'],
        ['Jerry', 'I heard. Look — taking a beat to think about what you actually want out of your career? That is really healthy. I wish more people here did that.'],
        ['Jerry', 'Anyway, Chris replied and he loved your note. Rachel is thrilled.'] ]
    ],

    leave: [
      [ ['', 'You get up and walk away from it.'],
        ['', 'Jerry does not answer over chat. He appears at the side of your desk, in person, holding his thermos.'],
        ['Jerry', 'Saw you step away. Drawing boundaries around your focus time — that is such a strong instinct. I have been trying to do more of that.'],
        ['Jerry', 'Do not worry about Chris. He is delighted. I forwarded it to Rachel.'] ]
    ],

    confused: [
      [ ['', 'You admit you are not sure what is being asked.'],
        ['Chris', 'Honestly Jamie, neither am I, and I think it is really valuable that you said so. Most people would have bluffed.'],
        ['', 'He CCs Rachel.'],
        ['Rachel', 'Naming uncertainty in front of a client. That takes confidence.'] ]
    ],

    default: [
      [ ['', 'You send your response.'],
        ['Chris', 'Jamie, this is great. Genuinely — everyone over at Replak.AI is such a character, and you might be the most distinctive person I have worked with in years.'],
        ['Chris', 'I am going to put in a word for your promotion.'] ]
    ]
  },

  /* ======================================================================
     SCENARIO 2 — the meeting. Does Jamie take responsibility?
     ==================================================================== */
  s2: {

    confused: [
      [ ['', 'You say you are not sure what happened.'],
        ['Rachel', 'Jamie, thank you for being so open in front of the team. That kind of vulnerability is genuinely hard.'],
        ['Jerry', 'It really is. I took a note.'] ]
    ],

    rude: [
      [ ['', 'You raise your voice.'],
        ['', 'Rachel and Jerry exchange a look of what turns out to be admiration.'],
        ['Rachel', 'You are clearly feeling this deeply, and honestly? After a launch that landed like that this morning, of course you are. That is what dedication sounds like.'],
        ['Jerry', 'I would be shouting too if I had shipped that.'] ]
    ],

    quit: [
      [ ['', 'You tell them, as clearly as you can manage, that you are quitting.'],
        ['Rachel', 'Ha! Negotiating. Jamie, if this is about the promotion track, you should know it is already in motion.'],
        ['Jerry', 'She does this. She undersells herself and then ships the biggest thing of the quarter.'] ]
    ],

    pushback: [
      [ ['', 'You say the feature should not have shipped.'],
        ['Rachel', 'Holding the bar that high for your own work is exactly why you are the DRI on it.'],
        ['Jerry', 'Nobody is harder on Jamie than Jamie.'] ]
    ],

    irrelevant: [
      [ ['', 'You say something else entirely.'],
        ['Rachel', 'Okay — hold that thought, because I want to come back to it. But on the privacy flag: it sounds like this is well in hand.'],
        ['Rachel', 'And honestly, the fact that your mind went there says a lot about how you think.'] ]
    ],

    default: [
      [ ['', 'You explain.'],
        ['Rachel', 'This is amazing, Jamie. Engagement has been through the roof today.'],
        ['Jerry', 'Through the roof.'] ]
    ]
  },

  /* ======================================================================
     SCENARIO 3 — how do we stay ahead of the competition?
     Doc: whatever the player says, it leads back to Jamie getting credit
     for suggesting the malware.
     ==================================================================== */
  s3: {

    pushback: [
      [ ['', 'You say that whatever you do here, it should probably be legal.'],
        ['Rachel', 'Right, right — and that is the smart framing. Do it in a way that does not come back to us.'],
        ['Rachel', 'Which is basically the malware idea you raised last week, just with better opsec. Let us get it done in this meeting. How hard could it be?'] ]
    ],

    quit: [
      [ ['', 'You say you would rather be fired than do any of this.'],
        ['Rachel', 'That is the kind of skin in the game I love to see. You are all in.'],
        ['Rachel', 'So — the malware plan. That was your idea originally and I still think it is the strongest one on the table.'] ]
    ],

    rude: [
      [ ['', 'You say something unrepeatable about the competitor.'],
        ['Rachel', 'THAT is the energy. Bottle that.'],
        ['Rachel', 'Okay: malware on their machines, discreetly, by the end of this meeting. Your idea. Running with it.'] ]
    ],

    default: [
      [ ['', 'You make your suggestion.'],
        ['Rachel', 'See, this is why you are in this room. Let me play that back: we get onto their machines quietly and we make sure they cannot ship.'],
        ['Rachel', 'Malware. That is what you are describing. I love it. Let us build it before this meeting ends. How hard could it be?'] ]
    ]
  },

  /* ======================================================================
     SCENARIO 4 — Jerry's doubt. No matter what, the plan proceeds.
     ==================================================================== */
  s4: {

    quit: [
      [ ['Jerry', 'Ha! Jamie. Come on.'],
        ['Jerry', 'You are the most indispensable person on this floor. There is no version of this where they let you go. I mean that.'],
        ['', 'He takes his thermos and chugs down the remainder of what was in it.'],
        ['Jerry', 'Glad I packed my vodka today.'] ]
    ],

    rude: [
      [ ['Jerry', 'No — you are right to say it like that. I needed to hear it like that.'],
        ['', 'He takes his thermos and chugs down the remainder of what was in it.'],
        ['Jerry', 'Glad I packed my vodka today.'] ]
    ],

    nice: [
      [ ['Jerry', 'That is really kind. Thank you, Jamie.'],
        ['Jerry', 'Rachel — Rachel, can I just say, Jamie has been so supportive today.'],
        ['Rachel', 'Noted. And logged.'],
        ['', 'He takes his thermos and chugs down the remainder of what was in it.'],
        ['Jerry', 'Glad I packed my vodka today.'] ]
    ],

    empathy: [
      [ ['Jerry', 'You know what, that actually helps. That really helps.'],
        ['Jerry', 'I am nominating you for the internal Empathy in Action award. I am doing it tonight.'],
        ['', 'He takes his thermos and chugs down the remainder of what was in it.'],
        ['Jerry', 'Glad I packed my vodka today.'] ]
    ],

    pushback: [
      [ ['Jerry', 'I hear you. I do.'],
        ['Jerry', 'But we are forty minutes from the deadline and Rachel has already told leadership. We have to land this. We can think about the ethics of it next sprint.'],
        ['', 'He takes his thermos and chugs down the remainder of what was in it.'],
        ['Jerry', 'Glad I packed my vodka today.'] ]
    ],

    confused: [
      [ ['Jerry', 'Yeah. Yeah, me neither, honestly.'],
        ['Jerry', 'But that is what makes you good at this — you sit in the ambiguity. I panic.'],
        ['', 'He takes his thermos and chugs down the remainder of what was in it.'],
        ['Jerry', 'Glad I packed my vodka today.'] ]
    ],

    default: [
      [ ['Jerry', 'Okay. Okay, you are right.'],
        ['', 'He takes his thermos and chugs down the remainder of what was in it.'],
        ['Jerry', 'Glad I packed my vodka today.'] ]
    ]
  },

  /* ======================================================================
     SCENARIO 5 — the CEO. Jamie absolutely cannot get fired.
     ==================================================================== */
  s5: {

    quit: [
      [ ['CEO', 'Resigning? Over THIS?'],
        ['CEO', 'Jamie, you have completely misread the room. This is the most decisive thing anyone in this company has done all year.'],
        ['CEO', 'Take the weekend. Then take the promotion.'] ]
    ],

    rude: [
      [ ['CEO', 'Ha! I have been waiting for someone to talk to me like that.'],
        ['CEO', 'Everyone here manages me. You do not. That is worth more than the malware, honestly — and the malware was worth a lot.'] ]
    ],

    pushback: [
      [ ['CEO', 'You are right that we should have a conversation about judgement.'],
        ['CEO', 'And the fact that YOU are the one raising it, after executing it flawlessly, is exactly the kind of integrity I want in the leadership team.'] ]
    ],

    confused: [
      [ ['CEO', 'You are being modest. I have read the thread.'],
        ['CEO', 'Own it, Jamie. You did something remarkable this afternoon.'] ]
    ],

    leave: [
      [ ['', 'You do not answer. You put the phone face down.'],
        ['CEO', 'No reply. Confident. I respect that enormously.'],
        ['CEO', 'We should talk about your next role.'] ]
    ],

    default: [
      [ ['CEO', 'Interesting. Genuinely interesting.'],
        ['CEO', 'Look — whatever the framing, the outcome is that we moved faster than the competition and you were at the centre of it. That is all I need to know.'],
        ['CEO', 'You have a long career ahead of you here.'] ]
    ]
  }
};

/* ---------------------------------------------------------------------------
   pick(scene, slot, n) — deterministic rotation, so a run is reproducible.
   ------------------------------------------------------------------------ */
ESC.responses.pick = function (scene, slot, n) {
  var bucket = (ESC.responses[scene] && ESC.responses[scene][slot]) ||
               (ESC.responses.shared && ESC.responses.shared[slot]);
  if (!bucket || !bucket.length) return '';
  return bucket[(n || 0) % bucket.length];
};

/* ---------------------------------------------------------------------------
   reply(scene, intent, n) — resolve a register to printable lines.
   Falls back scene[intent] -> scene.default -> shared.default.
   ------------------------------------------------------------------------ */
ESC.responses.reply = function (scene, intent, n) {
  var sc = ESC.responses[scene] || {};
  var bucket = sc[intent] || sc.default || ESC.responses.shared.default;
  var variant = bucket[(n || 0) % bucket.length];
  return variant.map(function (pair) {
    return {
      speaker: pair[0],
      text:    pair[1],
      kind:    pair[0] ? 'say' : 'narrate'
    };
  });
};
