const RAW_SCRIPT = `
[scene:intro]
[narrator] Thursday, 3:50 PM. The office hums at the edge of its own exhaustion.
[narrator] You have already worked 50 hours this week. The shareholder meeting is tomorrow.
[narrator] You promised Parker you would leave at 5:00. You cannot let him down again.
[narrator] A stack of spreadsheets waits. Your coffee is empty. Your water bottle is empty.
[narrator] The Productivity Hydration Station is down the hall.
[prompt] What do you do? | prefill: Go to the PHS to get snacks and coffee.

[scene:keep_working]
[narrator] Great. That saved you five minutes, but your energy is draining low.
[narrator] The standup meeting is about to begin.
[prompt] How do you respond to Jerry? | prefill: I can share the prioritized OKRs after I finish the spreadsheet.

[scene:take_break]
[narrator] Alright, that is a good point. You head for the Productivity Hydration Station.
[narrator] The bottle fills slowly. The coffee does not solve the fatigue.
[narrator] You return to your desk at 3:55 PM. The standup meeting is about to begin.
[prompt] How do you respond to Jerry? | prefill: I can share the prioritized OKRs after I verify the launch blocker with Rachel.

[scene:scene1]
[dialogue:Jerry] Jamie, the leads saw the decline in perceived forward progress for Project Porcupine and are concerned about stakeholder values. Can you share the latest list of prioritized OKRs for this sprint?
[narrator] This catches you off-guard. You remember that you were supposed to do this task but forgot. Maybe Rachel can help.
[prompt] What do you say? | prefill: I should message Rachel and clarify the launch blocker before I leave.
[response] if input contains rachel or message or clarify or launch blocker or engineering -> set focus -8 and set time +5 and append model response Jerry: That is useful. I will take that direction and pass it along to engineering. and next:scene2; else if input contains product or timeline or strategy or stakeholder or priority -> set focus -10 and set time +1 and append model response Jerry: That is a start, but I need a little more substance. and next:scene2; else -> set focus -12 and set time +5 and append model response Jerry: I need more clarity before I can take this forward. and next:scene2

[scene:scene2]
[dialogue:Rachel] Hey Jamie, sorry that this is so urgent, but could you respond to the email I just CC'd you on? It would really help if you could respond as soon as possible so we can keep the ball rolling on Porcupine.
[narrator] You glance at the clock. It is now 3:59 PM. The meeting is still waiting.
[prompt] What do you say? | prefill: I have a concert I need to go to, but I can reply later tonight if this is truly urgent.
[response] if input contains respond or email or timeline or urgent or tonight -> set focus -6 and set time +3 and append model response Rachel: That is a reasonable compromise. and next:scene3; else -> set focus -10 and set time +5 and append model response Rachel: I need a more concrete explanation if I am going to treat this as a lower priority. and next:scene3

[scene:scene3]
[narrator] The elevator arrives. The lobby is quiet. The day is still waiting beyond the glass.
[narrator] But when the doors open, something is blocking them.
[dialogue:Porcupine] Hi Jamie. I am a porcupine. Like, as in Project Porcupine. You still have work to do on my project.
[prompt] What do you say to the porcupine? | prefill: I can make the launch work if I just explain the product strategy clearly.
[response] if input contains already done or launched or perfect -> set focus +8 and set time +0 and append model response Porcupine: Delight. You are free to leave. and next:ending; else if input contains leave or refuse -> set focus -8 and set time +1 and append model response Porcupine: No. You are not done until you explain yourself. and next:ending; else -> set focus -6 and set time +1 and append model response Porcupine: Keep going. You need a better explanation. and next:ending

[scene:ending]
[narrator] You step out into the city. The train is still there. Parker is waiting somewhere beyond the noise.
[narrator] The office does not end there. It keeps the record.
[prompt] Press restart to try again.
`;

function parseScript(raw) {
  const scenes = {};
  const blocks = raw.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  let currentScene = null;

  blocks.forEach((block) => {
    const line = block.trim();
    if (/^\[scene:/i.test(line)) {
      currentScene = line.replace(/^\[scene:/i, '').replace(/\]$/, '').trim();
      scenes[currentScene] = [];
      return;
    }

    if (!currentScene) return;

    if (/^\[narrator\]/i.test(line)) {
      scenes[currentScene].push({ type: 'narrator', text: line.replace(/^\[narrator\]\s*/i, '') });
    } else if (/^\[dialogue:/i.test(line)) {
      const speaker = line.match(/^\[dialogue:\s*([^\]]+)\]/i)?.[1] || 'speaker';
      scenes[currentScene].push({ type: 'dialogue', speaker, text: line.replace(/^\[dialogue:\s*[^\]]+\]\s*/i, '') });
    } else if (/^\[prompt\]/i.test(line)) {
      const parts = line.replace(/^\[prompt\]\s*/i, '').split('|').map((part) => part.trim());
      const text = parts[0] || '';
      const prefill = parts.find((part) => part.startsWith('prefill:'))?.replace('prefill:', '').trim() || '';
      const next = parts.find((part) => part.startsWith('next:'))?.replace('next:', '').trim() || null;
      scenes[currentScene].push({ type: 'prompt', text, prefill, next });
    } else if (/^\[response\]/i.test(line)) {
      scenes[currentScene].push({ type: 'response', rule: line.replace(/^\[response\]\s*/i, '') });
    }
  });

  return scenes;
}

const GAME_SCRIPT = parseScript(RAW_SCRIPT);
