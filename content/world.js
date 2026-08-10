/* ============================================================================
   CONTENT — WORLD BUILDING
   ----------------------------------------------------------------------------
   Pure content. Edit freely; no logic depends on the prose.

   Used in two places:
     1. The [ i ] PERSONNEL FILE drawer.
     2. The responder's grounding lexicon — the `keywords` arrays tell the
        scripted responder which nouns actually exist in this world, so a
        player who references real things gets a more specific reply.

   The brainstorm doc no longer carries an appendix, so this was rewritten to
   match the current script. Nothing here should contradict FIRE(ESC)APE.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.world = {

  player: {
    defaultName: 'Jamie',
    role: 'PRODUCT MANAGER',
    stats: [
      ['ROLE',        'Product Manager'],
      ['FLOOR',       'Second'],
      ['HOURS/WK',    '50'],
      ['ARRIVED',     '8:00AM'],
      ['ENGAGEMENT',  'Through the roof'],
      ['RCVs MET',    'All of them']
    ],
    bio:
      'Has spent 50 hours in the office this week and got in at 8:00AM today, ' +
      'last one in. Believes today has to be the day. Cannot quit outright — ' +
      'there needs to be a compelling reason — so the plan is to get fired. ' +
      'How hard could it be.'
  },

  entries: [
    {
      id: 'jamie',
      title: 'JAMIE (YOU)',
      keywords: ['jamie', 'me', 'myself', 'quit', 'quitting', 'fired', 'resign'],
      text:
        'Product manager at Replak.ai, second floor. Fifty hours in the office ' +
        'this week; in at 8:00AM today and still the last one in. Project ' +
        'Porcupine is going sideways and so, plainly, is the company. Quitting ' +
        'outright would require an explanation she does not have, so the plan is ' +
        'to be fired instead. Every attempt so far has been read as excellence.'
    },
    {
      id: 'rachel',
      title: 'RACHEL',
      keywords: ['rachel', 'manager', 'my manager', 'lead'],
      text:
        'Your manager. Runs brainstorm meetings and comes away holding more ' +
        'whiteboard markers, notebooks and sticky notes than a person can carry ' +
        'alongside a coffee. Two children — the older one has a soccer season ' +
        'coming up, the younger is about to start Spanish in pre-preschool. ' +
        'Kind, firm, and entirely unshockable: she has heard a proposal to ' +
        'install malware on a competitor and called it exciting.'
    },
    {
      id: 'jerry',
      title: 'JERRY',
      keywords: ['jerry', 'coworker', 'colleague', 'teammate'],
      text:
        'Reports to Rachel alongside you. Relentlessly, structurally supportive: ' +
        'whatever you do to him, he thanks you for the growth opportunity. Put ' +
        'in a good word for your promotion without being asked. Carries a ' +
        'thermos he sips from all day. It is not coffee.'
    },
    {
      id: 'thermos',
      title: 'THE THERMOS',
      keywords: ['thermos', 'drink', 'vodka', 'flask'],
      text:
        'Jerry\'s. Sits on his desk all day and he sips from it steadily. Anyone ' +
        'who has tried it has come away with questions. Glad he packed it.'
    },
    {
      id: 'ceo',
      title: 'THE CEO',
      keywords: ['ceo', 'leadership', 'exec', 'executive', 'boss'],
      text:
        'Reachable over work chat. Responds to a confessed felony with ' +
        'enthusiasm about out-of-the-box thinking. Authored, or at least ' +
        'ratified, Replak Core Value #5.'
    },
    {
      id: 'chris',
      title: 'CHRIS (CLIENT)',
      keywords: ['chris', 'client', 'customer', 'escalation', 'email'],
      text:
        'chris@clientcustomercompanyai.com. Wrote in this afternoon asking ' +
        'whether Replak.AI introduced a bug this morning, because his employees ' +
        'feel their privacy is being breached. It is not a bug. It is the ' +
        'feature you launched.'
    },
    {
      id: 'feature',
      title: 'THE SCREENSHOT FEATURE',
      keywords: ['feature', 'screenshot', 'privacy', 'launch', 'launched',
                 'bug', 'leak', 'information leakage', 'monitoring'],
      text:
        'Shipped by you this morning. It screenshots an employee\'s computer ' +
        'screen and a random conversation from their personal phone every 30 ' +
        'seconds, and sends both to their manager over work chat. Engagement ' +
        'has been through the roof.'
    },
    {
      id: 'porcupine',
      title: 'PROJECT PORCUPINE',
      keywords: ['porcupine', 'project porcupine', 'project', 'roi'],
      text:
        'Going sideways. Named in a cute likeable way because the company ' +
        'believes that makes the product more loveable. Leadership would like ' +
        'to discuss its ROI.'
    },
    {
      id: 'malware',
      title: 'THE MALWARE',
      keywords: ['malware', 'competitor', 'attack', 'hack', 'sabotage',
                 'break in', 'crime'],
      text:
        'The competitor copied the screenshot feature within hours. The agreed ' +
        'response, arrived at during a meeting and delivered by 5:00PM, was to ' +
        'install malware on their computers. Replak Core Value #5 covers this.'
    },
    {
      id: 'rcv',
      title: 'REPLAK CORE VALUES (RCV)',
      keywords: ['rcv', 'core value', 'core values', 'values', 'promotion',
                 'performance', 'review', 'award'],
      text:
        'A numbered list of behaviours, cited in performance conversations and ' +
        'apparently extensible on demand. Known entries: "We carry each ' +
        'other\'s coffee." #2348: "Be yourself over email." #5: "If need be, ' +
        'install malware." A value may be named after you if you distinguish ' +
        'yourself sufficiently.'
    },
    {
      id: 'replak',
      title: 'REPLAK.AI',
      keywords: ['replak', 'replak.ai', 'company', 'the system', 'office'],
      text:
        'The company, and the terminal you are reading this on. Occupies the ' +
        'building; you are on the second floor. It logs your breaks, notes them ' +
        'in the system, and has never once taken an insult personally.'
    },
    {
      id: 'phs',
      title: 'PRODUCTIVITY HYDRATION STATION™',
      keywords: ['phs', 'kitchen', 'coffee', 'hydration', 'break', 'cappuccino'],
      text:
        'The office kitchen, second floor. Makes a quadruple shot cappuccino ' +
        'with protein milk. Also where brainstorm meetings end and their ' +
        'materials accumulate.'
    },
    {
      id: 'meeting-room',
      title: 'MEETING ROOM #024',
      keywords: ['meeting room', 'meeting', 'sync', 'room', '024', 'calendar'],
      text:
        'Second floor. Where the 30-minute sync with Rachel and Jerry happens, ' +
        'and where, over the following twenty-four minutes, a plan to commit a ' +
        'crime is agreed without anyone raising their voice.'
    }
  ],

  /* Scene vocabulary the responder should also treat as grounded. */
  extraGrounding: [
    'email', 'thread', 'reply', 'respond', 'forward', 'cc',
    'apologize', 'apology', 'sorry', 'blame', 'fault', 'responsibility',
    'own it', 'admit', 'confess', 'deny', 'escalation', 'urgent',
    'deadline', 'ship', 'launch', 'rollback', 'roll back', 'revert',
    'promotion', 'senior', 'patent', 'engagement', 'shareholders',
    'bathroom', 'desk', 'chat', 'message', 'slack', 'ping'
  ]
};

/* Flatten the grounding lexicon once, at load. ---------------------------- */
ESC.world.groundingTerms = (function () {
  var terms = [];
  ESC.world.entries.forEach(function (e) {
    e.keywords.forEach(function (k) { terms.push(k.toLowerCase()); });
  });
  ESC.world.extraGrounding.forEach(function (k) { terms.push(k.toLowerCase()); });
  return terms.filter(function (t) { return t.length > 2; });
})();

/* Look up an appendix entry by free text. --------------------------------- */
ESC.world.find = function (text) {
  var q = (text || '').toLowerCase();
  var best = null, bestLen = 0;
  ESC.world.entries.forEach(function (e) {
    e.keywords.forEach(function (k) {
      if (q.indexOf(k.toLowerCase()) !== -1 && k.length > bestLen) {
        best = e; bestLen = k.length;
      }
    });
  });
  return best;
};
