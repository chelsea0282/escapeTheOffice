/* ============================================================================
   CONTENT — WORLD BUILDING (the brief's APPENDIX)
   ----------------------------------------------------------------------------
   This is pure content. Edit freely; no logic depends on the prose.

   It is used in three places:
     1. The [ i ] PERSONNEL FILE drawer.
     2. `inspect` results during open-input scenes.
     3. The responder's *grounding lexicon* — when a player justifies themselves
        using terms that actually exist in this world, their reasoning scores
        higher than vague assertion. So the `keywords` arrays are load-bearing:
        adding a keyword here makes the game understand that word.
   ========================================================================== */

window.ESC = window.ESC || {};

ESC.world = {

  /* -- who you are ------------------------------------------------------- */
  player: {
    defaultName: 'Jamie',
    role: 'PRODUCT MANAGER',
    stats: [
      ['ROLE',       'Product Manager'],
      ['TENURE',     '2 years'],
      ['HOURS/WK',   '50'],
      ['DRI COUNT',  '4'],
      ['ENGAGEMENT', 'Nominal'],
      ['FLIGHT RISK','Under review']
    ],
    bio:
      'Age 27. Moved to this city for this job two years ago. Pivoted into ' +
      'product management and feels some commitment because of it. Does ' +
      'reasonably well; prioritizes work-life balance. Has thought about ' +
      'going back to school for a healthcare profession — anything two years ' +
      'or less — because she thinks she would derive more meaning from it.'
  },

  /* -- the appendix, shown in the [ i ] drawer ---------------------------- */
  entries: [
    {
      id: 'jamie',
      title: 'JAMIE (YOU)',
      keywords: ['jamie', 'me', 'myself', 'i'],
      text:
        'Jamie is a 27-year-old product manager who moved to this city to take ' +
        'this job 2 years ago. She feels ambivalent about her job. She does ' +
        'reasonably well at work but prioritizes work life balance. She made the ' +
        'effort to pivot into product management two years ago, so she feels some ' +
        'amount of commitment and attachment to her job, but she has thought about ' +
        'quitting her job to go back to school for a healthcare profession, ' +
        'anything that can be done in a program 2 years long or less, because she ' +
        'thinks she would derive more meaning from a job like that instead.'
    },
    {
      id: 'rachel',
      title: 'RACHEL',
      keywords: ['rachel', 'manager', 'lead', 'my manager', 'senior product lead'],
      text:
        'Rachel is a 39-year-old senior product lead and is Jamie\'s manager. She ' +
        'has been Jamie\'s manager for one year and generally gets along well with ' +
        'Jamie. She is a mother of two young children and tends to work for a ' +
        'couple hours in the evening after her children are asleep. She is kind but ' +
        'firm, is good at her job, is a clear communicator, and gets along well ' +
        'with other colleagues and keeps things professional.'
    },
    {
      id: 'jerry',
      title: 'JERRY',
      keywords: ['jerry', 'engineering manager', 'eng manager', 'em'],
      text:
        'Jerry is a 31-year-old engineering manager at the company and is friends ' +
        'with Jamie. He joined the company one year ago. Jerry and Jamie work ' +
        'together fairly closely on some but not all projects, which helps them ' +
        'maintain their friendship outside of work. Jerry is interested in writing, ' +
        'and would love to write a novel one day, but feels like he doesn\'t have ' +
        'time to really pursue this interest while working. He writes in his free ' +
        'time, has been working on a novel on the side, and sometimes shares short ' +
        'pieces at open mics in the city. He has a creative writing minor from ' +
        'college but wonders what would happen if he went back to school. He ' +
        'doesn\'t understand anything about the publishing industry.'
    },
    {
      id: 'jerry-mfa',
      title: 'JERRY — THE MFA DECISION',
      keywords: ['mfa', 'quit', 'quitting', 'writing', 'novel', 'writer', 'creative writing'],
      text:
        'Jerry has been talking to Jamie about quitting and pursuing writing from ' +
        'the day he started at the company. Jerry needs to know whether he should ' +
        'quit by end of day because he needs to decide whether to accept a Creative ' +
        'Writing MFA offer. Jerry has enough saved up that he can afford to do this ' +
        'MFA but anticipates adjusting his lifestyle to do this. He would have to ' +
        'move cities to do this MFA but he likes his current life where he is. He is ' +
        'generally risk-averse. Jerry is single and has no dependents. If not for ' +
        'this MFA, he would try to switch jobs to develop his career as an ' +
        'engineering manager. He also wants to put more effort into meeting someone ' +
        'with the goal of eventually getting married and having children. Jerry\'s ' +
        'main passion is writing.'
    },
    {
      id: 'parker',
      title: 'PARKER',
      keywords: ['parker', 'boyfriend', 'partner'],
      text:
        'Jamie\'s boyfriend Parker is a 27-year-old accountant who moved to the city ' +
        '2 years ago to close the distance with Jamie. He enjoys live music. He is a ' +
        'generally supportive boyfriend to Jamie.'
    },
    {
      id: 'relationship',
      title: 'THE RELATIONSHIP',
      keywords: ['anniversary', 'relationship', 'five year', '5 year', 'move in', 'lease'],
      text:
        'Jamie and Parker are figuring out whether or not they should stay together ' +
        'or break up. They started dating at the end of their undergraduate degrees ' +
        '(they went to the same college), moved to different cities after ' +
        'graduation, and then closed the distance by both taking jobs in the same ' +
        'city two years ago. They are celebrating their five year anniversary today. ' +
        'Jamie and Parker do not live together, but they are considering moving in ' +
        'together when Jamie\'s lease is up in two months (Parker is already month ' +
        'to month).'
    },
    {
      id: 'porcupine',
      title: 'PROJECT PORCUPINE',
      keywords: ['porcupine', 'project porcupine', 'stakeholder value', 'b2b', 'saas'],
      text:
        'Peak AI B2B SaaS business that needs to bring stakeholder values named in a ' +
        'cute likeable way because the company believes that makes the product more ' +
        'loveable.'
    },
    {
      id: 'porcupine-client',
      title: 'PROJECT PORCUPINE — THE CLIENT',
      keywords: ['museum', 'client', 'app', 'exhibit', 'audio tour', 'membership',
                 'consultancy', 'visitors'],
      text:
        'This is a client project that the team has been working on for the past two ' +
        'years. This is a custom app that they are building for a local museum. This ' +
        'is a mobile app for visitors to explore the museum, access additional ' +
        'content about exhibits including audio tours and links to additional ' +
        'information, and encourage people to revisit the museum, engage in events ' +
        'the museum puts on, and sign up for annual memberships. The app has been out ' +
        'for a few months now but the consultancy must continue to deliver feature ' +
        'updates. The people at the museum have a limited understanding of app ' +
        'development, so part of Jamie\'s job is to set expectations with the client ' +
        'about what can be delivered and how long things will take.'
    },
    {
      id: 'the-email',
      title: 'THE EMAIL',
      keywords: ['email', 'augmented reality', 'ar', '3d', 'camera feature',
                 'search bar', 'notifications', 'timeline', 'timelines',
                 'committed features', 'progress update', 'next week'],
      text:
        'This email is from the Project Porcupine client, sent to Rachel, asking ' +
        'about a completely different feature than the ones discussed in scenario 1. ' +
        'The client is now asking whether a new augmented reality feature can be ' +
        'added by next week, where people can point their phone camera toward an ' +
        'exhibit and see the exhibit come alive with 3D content placed in the scene ' +
        '(not much additional detail is provided by the client; they are more ' +
        'pitching the idea and hoping that the consultancy can fill in the gaps ' +
        'about what the experience will look like). What Rachel needs from Jamie is ' +
        'for Jamie to respond with the current timelines on the committed features, ' +
        'like the search bar and notifications, to provide a progress update to the ' +
        'client; Rachel can handle pushing back on the client and saying that ' +
        'augmented reality can be considered but will not be possible by next week.'
    },
    {
      id: 'job',
      title: 'THE JOB',
      keywords: ['job', 'agency', 'consulting', 'tech consulting'],
      text:
        'Jamie is a product manager at a tech consulting agency. She has been there ' +
        'for 2 years.'
    },
    {
      id: 'office',
      title: 'THE OFFICE',
      keywords: ['office', 'floor', 'kitchen', 'eighth floor', 'high-rise', 'building'],
      text:
        'The office takes up the entire eighth floor in a larger high-rise building. ' +
        'There is a kitchen around the corner from Jamie\'s desk.'
    },
    {
      id: 'desk',
      title: 'THE DESK',
      keywords: ['desk', 'my desk'],
      text:
        'On the desk, there is a water bottle and an open laptop. Your snake plant ' +
        'sits in the corner, asking for a little more attention. All it really gets ' +
        'is the leftover water in the water bottle at the end of the day. A candy bar ' +
        'wrapper teeters on the edge of your desk.'
    },
    {
      id: 'water-bottle',
      title: 'WATER BOTTLE',
      keywords: ['water bottle', 'bottle', 'water', '40 oz', '40oz', 'straw'],
      text:
        'Your 40 oz water bottle was a birthday gift from Parker. You manage to drink ' +
        'quite a bit of water during your work day. You prefer your water cold, but ' +
        'you rarely add ice. It\'s one of those bottles with a straw. The water bottle ' +
        'is pink and green.'
    },
    {
      id: 'laptop',
      title: 'LAPTOP',
      keywords: ['laptop', 'stickers', 'computer'],
      text:
        'Your laptop is covered in stickers. You can\'t remember where some of them ' +
        'are from. It\'s a 14-inch laptop.'
    },
    {
      id: 'snake-plant',
      title: 'SNAKE PLANT',
      keywords: ['snake plant', 'plant'],
      text:
        'A random gift from Parker because you wanted a low-maintenance plant. ' +
        'Despite that, you\'re still not good about taking care of it and remembering ' +
        'to water it. You have kept it nameless for this reason.'
    },
    {
      id: 'candy-bar',
      title: 'CANDY BAR',
      keywords: ['candy', 'candy bar', 'twix', 'wrapper', 'snack'],
      text:
        'This is a Twix bar wrapper. This was a random candy bar given to you by ' +
        'Jerry in the morning, who randomly had a bunch of candy bars to hand out ' +
        'today.'
    },
    {
      id: 'train',
      title: 'THE TRAIN',
      keywords: ['train', 'train station', 'station', 'commute', 'subway'],
      text:
        'The train stop is a 5 minute walk from the office. It will be a 30 minute ' +
        'train ride to the concert venue. You take the train to and from work every ' +
        'day.'
    },
    {
      id: 'concert',
      title: 'THE CONCERT',
      keywords: ['concert', 'show', 'artist', 'venue', 'tickets', 'gig', 'music'],
      text:
        'Early on in dating, you and Parker went to a concert for this artist. For ' +
        'your five year anniversary with Parker, you\'re going to see this artist ' +
        'again for the first time since that early date. This is the only show the ' +
        'artist is performing in this city. You are okay on this artist\'s music — ' +
        'you like the music, but otherwise would not go to this concert if not for ' +
        'the sentimental attachment.'
    },
    {
      id: 'phone',
      title: 'YOUR PHONE',
      keywords: ['phone', 'notification', 'text', 'texts', 'message from parker'],
      text:
        'Face down beside the keyboard, as company policy prefers. There is a new ' +
        'notification. Parker, wondering how you\'re doing on time. You have not ' +
        'answered yet. You are aware that you have not answered yet.'
    },
    {
      id: 'phs',
      title: 'PRODUCTIVITY HYDRATION STATION™',
      keywords: ['phs', 'hydration', 'water cooler', 'coffee', 'kitchen', 'break'],
      text:
        'Around the corner from your desk. Dispenses filtered water, hot water, and ' +
        'a coffee-adjacent liquid. The signage refers to employees as "hydration ' +
        'participants." It takes a while to fill a 40 ounce bottle.'
    }
  ],

  /* -- terms the responder treats as "grounded in the fiction" ------------ */
  /*    Built from the keyword arrays above plus scene-specific vocabulary.  */
  extraGrounding: [
    'alignment roadmap', 'priority roadmap', 'roadmap', 'prioritization',
    'launch blocker', 'blocker', 'h2', 'strategy', 'shareholder', 'shareholders',
    'roi', 'stakeholder', 'okr', 'okrs', 'standup', 'standing standup',
    'dri', 'eod', 'follow up', 'followup', 'sync', 'circle back', 'offline',
    'replak', 'kpi', 'kpis', 'engineering', 'scope', 'deadline', 'ship',
    'launch', 'feature', 'features', 'spec', 'requirements', 'evals'
  ]
};

/* Flatten the grounding lexicon once, at load. ---------------------------- */
ESC.world.groundingTerms = (function () {
  var terms = [];
  ESC.world.entries.forEach(function (e) {
    e.keywords.forEach(function (k) { terms.push(k.toLowerCase()); });
  });
  ESC.world.extraGrounding.forEach(function (k) { terms.push(k.toLowerCase()); });
  /* Drop terms too short or too common to signal anything. */
  return terms.filter(function (t) { return t.length > 2 && t !== 'app'; });
})();

/* Look up an appendix entry by free text — used by `inspect`. ------------- */
ESC.world.find = function (text) {
  var q = (text || '').toLowerCase();
  var best = null;
  var bestLen = 0;
  ESC.world.entries.forEach(function (e) {
    e.keywords.forEach(function (k) {
      if (q.indexOf(k.toLowerCase()) !== -1 && k.length > bestLen) {
        best = e;
        bestLen = k.length;
      }
    });
  });
  return best;
};
