const storeKey = "fencingIqEpeeAcademy";
const actions = ["Advance", "Retreat", "Lunge", "Fleche", "Counterattack", "Parry-Riposte", "Feint", "Hold Distance"];
const drillActions = [
  { name: "Advance", group: "Movement", key: "D", risk: 1, unlock: 1, simple: true },
  { name: "Retreat", group: "Movement", key: "A", risk: 1, unlock: 1, simple: true },
  { name: "Half Step In", group: "Movement", key: "E", risk: 1, unlock: 3 },
  { name: "Half Step Out", group: "Movement", key: "Q", risk: 1, unlock: 3 },
  { name: "Hold Distance", group: "Movement", key: "H", risk: 1, unlock: 3 },
  { name: "Feint", group: "Preparation", key: "F", risk: 2, unlock: 1, simple: true },
  { name: "Bait", group: "Preparation", key: "B", risk: 2, unlock: 5 },
  { name: "Beat", group: "Preparation", key: "Shift+B", risk: 2, unlock: 5 },
  { name: "Change Rhythm", group: "Preparation", key: "C", risk: 1, unlock: 10 },
  { name: "Lunge", group: "Finish", key: "Space", risk: 3, unlock: 1, simple: true },
  { name: "Step-Lunge", group: "Finish", key: "Shift+Space", risk: 4, unlock: 7 },
  { name: "Fleche", group: "Finish", key: "Shift+F", risk: 4, unlock: 7 },
  { name: "Counterattack", group: "Finish", key: "K", risk: 2, unlock: 1, simple: true },
  { name: "Parry-Riposte", group: "Finish", key: "R", risk: 2, unlock: 1, simple: true }
];
const actionAliases = {
  Parry: "Parry-Riposte",
  "Half Step": "Advance",
  "Half Step In": "Advance",
  "Half Step Out": "Retreat",
  "Half Step Forward": "Advance",
  "Half Step Back": "Retreat",
  "Step-Lunge": "Lunge",
  "Direct Attack": "Lunge",
  Beat: "Lunge",
  "Beat Attack": "Lunge",
  Bait: "Hold Distance",
  "Change Rhythm": "Feint",
  "Invite Attack": "Hold Distance",
  "Duck / Evasive Action": "Retreat"
};
const keyToAction = {
  KeyA: "Retreat",
  KeyD: "Advance",
  KeyQ: "Half Step Out",
  KeyE: "Half Step In",
  Space: "Lunge",
  KeyF: "Feint",
  KeyB: "Bait",
  KeyJ: "Parry-Riposte",
  KeyK: "Counterattack",
  KeyR: "Parry-Riposte",
  KeyC: "Change Rhythm",
  KeyS: "Retreat"
};
const distanceNames = { 5: "Long distance", 4: "Long measure", 3: "Middle distance", 2: "Close distance", 1: "Dangerously close" };

const guideSections = [
  {
    title: "Epee Fundamentals",
    diagram: "Full body target: mask, hand, arm, torso, leg, foot",
    points: [
      "Epee has no right-of-way. If both fencers hit within the lockout time, both can score.",
      "The entire body is valid target, including hand, foot, and mask.",
      "Distance and timing are central because double touches can help or hurt depending on the score."
    ]
  },
  {
    title: "Distance Management",
    diagram: "YOU  <---- measure ---->  OPPONENT",
    points: [
      "Long distance is safer but requires preparation before attacking.",
      "Middle distance is where lunges, counterattacks, and traps become dangerous.",
      "Close distance demands fast decisions, blade control, or immediate recovery."
    ]
  },
  {
    title: "Attacking",
    diagram: "Advance -> Lunge -> Recover",
    points: [
      "Simple attacks work when distance and timing are already favorable.",
      "Fleche attacks carry risk because you commit your body through the opponent.",
      "Attacking into preparation works when the opponent is moving without a real threat."
    ]
  },
  {
    title: "Defensive Actions",
    diagram: "Parry -> Riposte | Stop hit | Point-in-line",
    points: [
      "Parry-riposte removes the opponent's blade threat before answering.",
      "Counterattacks and stop hits score into the opponent's action using timing and distance.",
      "Point-in-line can make the opponent solve your point before safely entering."
    ]
  },
  {
    title: "Tactical Concepts",
    diagram: "Pattern -> Prediction -> Decision",
    points: [
      "Read habits: when does the opponent attack, retreat, parry, or freeze?",
      "Change rhythm so your preparation does not become predictable.",
      "Avoid careless double touches when ahead; accept calculated doubles when the score favors it."
    ]
  },
  {
    title: "Example Epee Phrase",
    diagram: "Draw attack -> Retreat -> Counterattack",
    points: [
      "If an opponent attacks every time you step forward, your step can become a trigger.",
      "A small advance draws the attack, retreat opens distance, and the counterattack lands into their finish.",
      "The tactical goal is not just touching; it is choosing the exchange that fits the score and opponent."
    ]
  }
];

const flashcards = [
  ["Fleche", "An explosive running attack used to close distance quickly, often high reward and high risk in epee."],
  ["Lunge", "A direct attacking footwork action that extends reach while keeping recovery possible."],
  ["Counterattack", "An attack made into the opponent's attack, relying on timing, distance, or opposition."],
  ["Parry", "A blade action that deflects or controls the opponent's attack."],
  ["Riposte", "The offensive action made immediately after a successful parry."],
  ["Stop hit", "A well-timed hit that interrupts the opponent as they prepare or attack."],
  ["Point-in-line", "An extended threatening point that forces the opponent to deal with the blade before entering."],
  ["Beat attack", "A sharp action on the opponent's blade to open timing or line before attacking."],
  ["Disengage", "Moving your blade around the opponent's blade to attack a different line."],
  ["Distance", "The space between fencers, which determines what actions can realistically land."],
  ["Tempo", "The timing unit or moment in which an action can be made effectively."],
  ["Measure", "The distance at which your attack can reach with correct extension and footwork."],
  ["Preparation", "The setup before an attack, including steps, blade threats, rhythm, and pressure."]
].map(([term, back], id) => ({ id, term, back }));

const quizQuestions = [
  ["Beginner", "In epee fencing, what is the valid target?", ["Torso only", "Upper body only", "Entire body", "Arms only"], 2, "Epee uses the entire body as valid target."],
  ["Beginner", "What can happen if both epee fencers hit at nearly the same time?", ["Only attacker scores", "Both can score", "Neither can ever score", "The taller fencer scores"], 1, "Epee allows simultaneous touches within the scoring lockout window."],
  ["Beginner", "Which weapon has the heaviest guard and a triangular blade?", ["Foil", "Sabre", "Epee", "Training stick"], 2, "Epee has a larger guard and triangular blade profile."],
  ["Beginner", "What is a lunge used for?", ["To extend reach and attack", "To request a break", "To repair the weapon", "To avoid saluting"], 0, "A lunge extends reach while keeping a clear attacking line."],
  ["Beginner", "Why is distance important in epee?", ["It decides if an action can land", "It replaces blade work", "It only matters for warmups", "It is decorative"], 0, "Good distance makes attacks real and defenses safer."],
  ["Beginner", "Which target is valid in epee?", ["Foot", "Only chest", "Only mask", "Only weapon arm"], 0, "The foot is valid because the entire body is target."],
  ["Intermediate", "What is a stop hit?", ["A hit that interrupts preparation or attack", "A referee command", "A broken blade", "A salute"], 0, "A stop hit scores by using timing against the opponent's movement."],
  ["Intermediate", "What is the main danger of attacking from too far away?", ["Falling short and being countered", "Scoring twice", "Automatically winning", "Changing weapons"], 0, "Bad distance gives the opponent time and space to punish."],
  ["Intermediate", "What action can draw a parry from a defensive opponent?", ["Feint", "Standing still forever", "Turning away", "Dropping the weapon"], 0, "A believable feint can make a defender show their parry."],
  ["Intermediate", "Why might an epee fencer avoid a double touch while leading?", ["A double may preserve the opponent's comeback chances poorly for you", "Double touches are illegal", "Only coaches score doubles", "It ends the match instantly"], 0, "Score context matters. When ahead, unnecessary doubles can waste advantage or help the opponent reach priority situations in practice formats."],
  ["Intermediate", "What is attacking into preparation?", ["Hitting before the opponent's attack is fully formed", "Waiting after being hit", "Only retreating", "Changing masks"], 0, "Loose preparation can be attacked before it becomes dangerous."],
  ["Intermediate", "What is measure?", ["Useful striking distance", "The blade brand", "A penalty card", "The piste color"], 0, "Measure is the distance at which your action can reach."],
  ["Advanced", "Against a counterattacker, what is often a strong idea?", ["Feint to draw the counterattack", "Attack from maximum distance", "Repeat lunges blindly", "Ignore their timing"], 0, "Drawing the counterattack lets you finish with control or parry the response."],
  ["Advanced", "When should a fleche be used in epee?", ["When distance, timing, and risk justify commitment", "Whenever you are bored", "Only from too far away", "Only after the match ends"], 0, "A fleche is committed, so it needs a tactical reason."],
  ["Advanced", "What does changing rhythm help prevent?", ["Becoming predictable", "Scoring legal touches", "Using distance", "Wearing equipment"], 0, "Changing rhythm makes it harder for opponents to time you."],
  ["Advanced", "Why is point-in-line useful?", ["It creates a threat the opponent must solve", "It makes your feet faster", "It blocks the scoring machine", "It cancels target area"], 0, "An active point can control entry and force blade action."],
  ["Advanced", "What should you consider at 4-4 in epee?", ["Risk of double touch and opponent habits", "Only style points", "Right-of-way", "Which hand is prettier"], 0, "At 4-4, doubles and opponent tendencies matter enormously."],
  ["Advanced", "What is a distance trap?", ["Inviting the opponent into a range where your planned action works", "A broken strip cable", "Standing off the piste", "A scoring box reset"], 0, "A distance trap uses space to make the opponent choose badly."]
].map(([difficulty, question, options, correct, explanation]) => ({ difficulty, question, options, correct, explanation }));

const scenarioRows = [
  ["Beginner","Middle distance","Aggressive","Your opponent attacks whenever you step forward.","Retreat and Counterattack","Retreat","You recognized the trigger and used distance to make their attack miss before answering."],
  ["Beginner","Long distance","Defensive","The opponent waits far away with blade quiet.","Advance to measure","Advance","You need to enter measure before any attack is realistic."],
  ["Beginner","Close distance","Aggressive","The opponent starts a direct attack with no blade control.","Parry-Riposte","Parry-Riposte","At close range, taking the blade before riposting is the safer epee choice."],
  ["Beginner","Middle distance","Beginner","The opponent recovers slowly after every missed lunge.","Lunge on recovery","Lunge","A slow recovery gives you a clear tempo to hit."],
  ["Beginner","Long distance","Counterattacker","The opponent wants you to attack from too far away.","Hold Distance","Hold Distance","Refusing a bad attack prevents the easy counterattack."],
  ["Beginner","Close distance","Defensive","You are too close and the opponent has a strong parry ready.","Retreat","Retreat","Creating space avoids feeding their best defensive action."],
  ["Beginner","Middle distance","Aggressive","Their arm pulls back before they rush forward.","Stop hit","Counterattack","The pulled arm exposes timing for a counterattack or stop hit."],
  ["Beginner","Long distance","Beginner","They launch attacks that keep falling short.","Advance after short attack","Advance","After they fall short, you can step into useful distance."],
  ["Beginner","Middle distance","Defensive","They parry only after you make a real extension.","Feint","Feint","The feint makes the defender reveal the parry before you commit."],
  ["Beginner","Close distance","Unpredictable","The opponent bounces into close range without a clear blade threat.","Hold Distance","Hold Distance","Do not panic. Stabilize distance and wait for the real action."],
  ["Intermediate","Middle distance","Counterattacker","The opponent scores whenever you finish direct attacks.","Feint to draw counterattack","Feint","A feint exposes the counterattack so you can control the next tempo."],
  ["Intermediate","Long distance","Aggressive","They rush from long distance as soon as you pause.","Point-in-line","Hold Distance","Holding a threatening point and distance makes their entry harder."],
  ["Intermediate","Close distance","Aggressive","You are ahead and they try to force a double touch.","Retreat","Retreat","When leading, avoid giving away an easy double."],
  ["Intermediate","Middle distance","Defensive","They retreat twice, then parry your long lunge.","Advance, then hold","Hold Distance","Breaking the chase prevents their prepared parry."],
  ["Intermediate","Middle distance","Unpredictable","Their rhythm changes from slow steps to sudden bursts.","Hold Distance","Hold Distance","Holding distance denies the rhythm trap."],
  ["Intermediate","Long distance","Defensive","Their hand is low and they are stepping forward without threat.","Attack preparation","Lunge","A loose preparation can be attacked before it becomes dangerous."],
  ["Intermediate","Middle distance","Aggressive","They attack after every beat on your blade.","Disengage and counter","Counterattack","Reading the beat pattern lets you avoid the blade and answer the attack."],
  ["Intermediate","Close distance","Counterattacker","They wait for your fleche and step into a stop hit.","Feint first","Feint","A fleche without setup feeds the counterattacker."],
  ["Intermediate","Middle distance","Defensive","They always parry sixte against high-line attacks.","Disengage","Feint","A feint or disengage uses their predictable parry against them."],
  ["Intermediate","Long distance","Beginner","The opponent keeps their hand extended but feet static.","Beat attack","Lunge","Blade control followed by attack solves the static point."],
  ["Intermediate","Middle distance","Aggressive","They overcommit after you retreat once.","Retreat and counterattack","Retreat","The retreat draws the overcommitment and creates your timing."],
  ["Intermediate","Close distance","Defensive","Your opponent tries to bind your blade before every riposte.","Disengage","Feint","Changing line avoids their blade control."],
  ["Intermediate","Middle distance","Counterattacker","They counterattack on your first preparation step.","Draw and parry","Parry-Riposte","Invite the counterattack, close the line, and riposte."],
  ["Intermediate","Long distance","Unpredictable","They alternate standing still and sudden fleche attacks.","Hold Distance","Hold Distance","Patience keeps you from being surprised by the fleche."],
  ["Intermediate","Middle distance","Aggressive","Their first attack is fast, but the second action is slow.","Parry first action","Parry-Riposte","Control the strong first action and score on the slower recovery."],
  ["Advanced","Middle distance","Defensive","They want a double touch because they are ahead.","Hold Distance","Hold Distance","Avoiding unnecessary doubles is correct score management."],
  ["Advanced","Close distance","Aggressive","They collapse distance and swing for the arm.","Retreat","Retreat","Recovering measure prevents a chaotic close-range double."],
  ["Advanced","Middle distance","Counterattacker","They read your lunge timing after two repeats.","Change rhythm","Feint","Changing rhythm with a feint breaks their timing read."],
  ["Advanced","Long distance","Unpredictable","They fake passivity, then explode when your front foot lands.","Hold Distance","Hold Distance","Do not enter on their chosen tempo."],
  ["Advanced","Middle distance","Aggressive","They attack after your second advance every exchange.","First advance then counter","Retreat","Using their pattern, retreat on the trigger and counterattack."],
  ["Advanced","Close distance","Defensive","They are excellent at parry-riposte but slow against stop hits.","Stop hit into prep","Counterattack","Attack their preparation before the parry-riposte sequence forms."],
  ["Advanced","Middle distance","Counterattacker","They extend point-in-line to make you rush.","Beat then attack","Lunge","Solve the point first with blade control, then attack."],
  ["Advanced","Long distance","Aggressive","They sprint from too far and land late.","Counterattack with distance","Counterattack","Their long attack gives you time to counterattack and recover."],
  ["Advanced","Middle distance","Defensive","They only react to believable shoulder movement.","Layered feint","Feint","A layered feint creates the real defensive reaction."],
  ["Advanced","Close distance","Unpredictable","Both fencers are at 4-4 and the opponent wants chaos.","Retreat","Retreat","At 4-4, avoid uncontrolled doubles and reset the phrase."],
  ["Advanced","Middle distance","Aggressive","They ignore blade feints and charge through.","Parry-Riposte","Parry-Riposte","If feints are ignored, blade control becomes the answer."],
  ["Advanced","Long distance","Counterattacker","They invite your fleche from too far away.","Advance to measure","Advance","Better measure must come before a committed attack."],
  ["Advanced","Middle distance","Unpredictable","They change target from hand to foot every exchange.","Hold Distance","Hold Distance","Stable distance helps you read the target change before reacting."],
  ["Advanced","Close distance","Aggressive","They step in with arm bent and chest exposed.","Stop hit","Counterattack","Bent arm and forward body give a stop-hit tempo."],
  ["Advanced","Middle distance","Defensive","They retreat until you overextend your arm.","Advance slowly","Advance","Controlled pressure keeps balance and prevents overextension."],
  ["Beginner","Middle distance","Counterattacker","The opponent waits with point aimed at your hand.","Feint","Feint","Move the point or draw the reaction before attacking."],
  ["Beginner","Long distance","Aggressive","They make noise and pressure but remain out of range.","Hold Distance","Hold Distance","Pressure without distance is not yet a threat."],
  ["Beginner","Close distance","Beginner","They miss your arm and pause.","Lunge","Lunge","The pause after a miss creates a simple scoring chance."],
  ["Beginner","Middle distance","Defensive","They never attack first.","Advance","Advance","Controlled pressure forces the defender to reveal a response."],
  ["Beginner","Long distance","Unpredictable","They keep switching feet rhythm but do not close distance.","Advance","Advance","You can claim ground while they are not threatening."],
  ["Intermediate","Middle distance","Aggressive","They rush after you lower your point.","Point-in-line","Hold Distance","A stable point and distance discourage the rush."],
  ["Intermediate","Close distance","Counterattacker","They want a double after every failed attack.","Retreat","Retreat","Do not give an easy double after your action fails."],
  ["Intermediate","Long distance","Defensive","They parry early when you threaten the blade.","Disengage","Feint","Their early parry opens a route around the blade."],
  ["Advanced","Middle distance","Counterattacker","They counter your preparation but freeze against direct speed changes.","Change tempo lunge","Lunge","A sudden tempo change can beat a waiting counterattacker."],
  ["Advanced","Middle distance","Unpredictable","You cannot read their blade, but their feet always stop before attack.","Attack the stop","Lunge","The foot stop is the cue; attack before their blade action begins."]
];

const scenarios = scenarioRows.map(([difficulty, distance, style, situation, label, correctAction, explanation], id) => ({
  id: id + 1, difficulty, distance, style, situation, label, correctAction, explanation
}));

const opponentTypes = {
  aggressive: {
    title: "Pressure Fencer",
    styleName: "pressure attacks",
    notes: ["Frequently advances", "Creates pressure", "Attacks when distance closes"],
    strength: "Forces mistakes",
    weakness: "Vulnerable to counterattacks and distance traps",
    behaviours: ["Pressuring forward", "Searching for a fast attack", "Trying to compress distance"],
    patterns: ["Advance-attack rhythm", "Attacks when distance closes", "Overcommits at close distance"],
    preferredDistance: [2, 3],
    weights: { Attack: 42, Retreat: 8, Counterattack: 12, "Hold Distance": 12, Feint: 26 }
  },
  defensive: {
    title: "Defensive Fencer",
    styleName: "defensive distance control",
    notes: ["Maintains distance", "Waits for mistakes", "Uses defensive actions"],
    strength: "Difficult to hit",
    weakness: "Vulnerable to feints and preparation attacks",
    behaviours: ["Waiting for your mistake", "Holding long measure", "Setting a parry trap"],
    patterns: ["Retreats before riposting", "Punishes overreach", "Parries direct attacks"],
    preferredDistance: [4, 5],
    weights: { Attack: 12, Retreat: 26, Counterattack: 16, "Hold Distance": 30, Feint: 16 }
  },
  counterattacker: {
    title: "Counterattacker",
    styleName: "counterattacking",
    notes: ["Looks for predictable attacks", "Punishes aggressive players", "Baits commitment"],
    strength: "Reads opponent habits",
    weakness: "Vulnerable to patience, false attacks, and changing rhythm",
    behaviours: ["Inviting your attack", "Showing a target", "Waiting on your preparation"],
    patterns: ["Counterattacks into lunges", "Scores on bad distance", "Repeats bait-and-hit"],
    preferredDistance: [3, 4],
    weights: { Attack: 10, Retreat: 16, Counterattack: 42, "Hold Distance": 18, Feint: 14 }
  },
  unpredictable: {
    title: "Adaptive Fencer",
    styleName: "adaptive rhythm changes",
    notes: ["Learns from your actions", "Changes strategy during the match", "Uses deception"],
    strength: "Adapts during the match",
    weakness: "Vulnerable to disciplined observation and patient setups",
    behaviours: ["Changing rhythm", "Switching between attack and wait", "Testing your reaction"],
    patterns: ["Changes strategy after repeated actions", "Alternates pressure and retreat", "Punishes repeated choices"],
    preferredDistance: [2, 3, 4],
    weights: { Attack: 22, Retreat: 20, Counterattack: 20, "Hold Distance": 18, Feint: 20 }
  }
};

const avatarIcons = {
  "Beginner Fencer": "🥉",
  "Tactical Fencer": "🎯",
  "Aggressive Fencer": "⚡",
  "Defensive Fencer": "🛡️",
  "Champion Fencer": "🏆"
};

const defaultSkills = {
  distanceControl: 0,
  timing: 0,
  bladeWork: 0,
  tacticalIq: 0,
  matchExperience: 0,
  mentalGame: 0
};

const skillCatalog = {
  distanceControl: {
    name: "Distance Control",
    description: "Your ability to manage distance, create openings, and control the opponent's attacks.",
    measures: "Maintaining correct distance, making opponents miss, and knowing when to advance or retreat.",
    improves: ["Tactical scenarios", "Match simulator", "Distance-based decisions"],
    next: "Complete more distance-based scenarios or score with retreats in the match simulator.",
    unlocks: [
      [3, "Unlock half steps and distance drills"],
      [5, "Unlock advanced distance scenarios"],
      [7, "Unlock bait and invite-attack setups"],
      [10, "Unlock elite opponent patterns"]
    ]
  },
  timing: {
    name: "Timing",
    description: "Your ability to choose the right moment to attack, counterattack, or recover.",
    measures: "Recognizing preparation, reaction windows, and the opponent's commitment.",
    improves: ["Match simulator decisions", "Counterattack success", "Tactical scenarios"],
    next: "Win exchanges through counterattacks, parry-ripostes, and preparation attacks.",
    unlocks: [
      [3, "Unlock timing cue prompts"],
      [5, "Unlock evasive reaction drills"],
      [7, "Unlock step-lunge timing drills"],
      [10, "Unlock elite preparation reads"]
    ]
  },
  bladeWork: {
    name: "Blade Work",
    description: "Your understanding of parries, ripostes, feints, disengages, and blade control.",
    measures: "Blade action vocabulary, parry choices, feints, and disengages.",
    improves: ["Flashcards", "Knowledge quiz", "Technique lessons"],
    next: "Master flashcards and answer epee technique questions correctly.",
    unlocks: [
      [3, "Unlock beginner blade action review"],
      [5, "Unlock feint and beat-attack controls"],
      [10, "Unlock advanced blade traps"]
    ]
  },
  tacticalIq: {
    name: "Tactical IQ",
    description: "Your ability to read opponents, create strategies, and adapt during matches.",
    measures: "Opponent reading, strategy selection, and adaptation under pressure.",
    improves: ["Tactical scenarios", "AI matches", "Correct strategic choices"],
    next: "Complete tactical scenarios and adapt to AI opponent patterns.",
    unlocks: [
      [5, "Unlock hidden opponent patterns"],
      [7, "Unlock compound bait sequences"],
      [10, "Unlock change-rhythm and adaptive AI opponents"],
      [15, "Unlock elite tactical scouting"]
    ]
  },
  matchExperience: {
    name: "Match Experience",
    description: "Your performance under pressure in bout-like situations.",
    measures: "Completing bouts, managing scores, and making match decisions.",
    improves: ["Playing AI matches", "Completing bouts", "Winning first-to-5 matches"],
    next: "Finish more AI bouts and review match feedback.",
    unlocks: [
      [3, "Unlock match review notes"],
      [5, "Unlock pressure situation prompts"],
      [10, "Unlock tournament-mode preparation"]
    ]
  },
  mentalGame: {
    name: "Mental Game",
    description: "Your patience, adaptability, and decision making under pressure.",
    measures: "Patience, adaptability, comeback decisions, and avoiding panic actions.",
    improves: ["Advanced scenarios", "Difficult matches", "Comeback situations"],
    next: "Use replay thoughtfully, avoid predictable choices, and complete hard bouts.",
    unlocks: [
      [3, "Unlock patience reminders"],
      [5, "Unlock comeback scenario prompts"],
      [10, "Unlock elite pressure training"]
    ]
  }
};

const defaultProgress = {
  profile: null,
  xp: 0,
  matches: 0,
  wins: 0,
  losses: 0,
  touchesScored: 0,
  touchesReceived: 0,
  ratingTotal: 0,
  ratingCount: 0,
  quizCorrect: 0,
  quizAnswered: 0,
  tacticalRating: 0,
  mastered: [],
  scenarioAnswered: 0,
  completedTraining: 0,
  skills: { ...defaultSkills },
  unlocked: [],
  trainingHistory: {}
};
const state = {
  progress: loadProgress(),
  flashIndex: 0,
  flashFlipped: false,
  quizDifficulty: "Beginner",
  quizIndex: 0,
  quizScore: 0,
  scenarioDifficulty: "Beginner",
  scenarioIndex: 0,
  controlMode: "simple",
  match: { player: 0, opponent: 0, round: 1, tactical: 0, distanceScore: 0, timing: 0, distance: 3, locked: false, over: false, type: "aggressive", mode: "training", aiDifficulty: "beginner", learningMode: "beginner", tournamentStage: 1, situation: null, sequence: [], appliedSequenceLength: 0, setupDistanceStack: [], pendingAiAction: null, planHint: "", liveCue: "", previous: [], history: [], replaySnapshot: null, lastAiAction: null, lastAdjustment: "No adjustment yet." }
};

const $ = (id) => document.getElementById(id);
const els = {
  views: document.querySelectorAll(".view"),
  nav: document.querySelectorAll("[data-view]"),
  mainNav: $("mainNav"), menuToggle: $("menuToggle"),
  guideGrid: $("guideGrid"),
  profileSetup: $("profileSetup"), profileForm: $("profileForm"), profileNameInput: $("profileNameInput"), profileWeaponInput: $("profileWeaponInput"), profileExperienceInput: $("profileExperienceInput"), profileYearsInput: $("profileYearsInput"), profileGoalInput: $("profileGoalInput"), profileStyleInput: $("profileStyleInput"),
  levelToast: $("levelToast"), levelToastText: $("levelToastText"), unlockToastText: $("unlockToastText"),
  welcomeLabel: $("welcomeLabel"), hubAvatar: $("hubAvatar"), hubProfileName: $("hubProfileName"), hubProfileStyle: $("hubProfileStyle"), hubLevel: $("hubLevel"), hubXp: $("hubXp"), hubXpFill: $("hubXpFill"), hubMatches: $("hubMatches"), hubAccuracy: $("hubAccuracy"), hubMastered: $("hubMastered"),
  profileAvatar: $("profileAvatar"), profileName: $("profileName"), profileSummary: $("profileSummary"), profileWeapon: $("profileWeapon"), profileExperience: $("profileExperience"), profileStyle: $("profileStyle"), profileYears: $("profileYears"), profileLevel: $("profileLevel"), profileXp: $("profileXp"), profileXpFill: $("profileXpFill"), avatarSelect: $("avatarSelect"),
  statMatches: $("statMatches"), statWins: $("statWins"), statLosses: $("statLosses"), statWinRate: $("statWinRate"), statTouchesScored: $("statTouchesScored"), statTouchesReceived: $("statTouchesReceived"), statAvgRating: $("statAvgRating"), profileSkills: $("profileSkills"),
  strengthList: $("strengthList"), improveList: $("improveList"), skillTree: $("skillTree"),
  progressLevel: $("progressLevel"), progressXp: $("progressXp"), progressMatches: $("progressMatches"), progressAccuracy: $("progressAccuracy"), progressRating: $("progressRating"), progressMastered: $("progressMastered"),
  flashCard: $("flashCard"), flashSide: $("flashSide"), flashText: $("flashText"), flashHint: $("flashHint"),
  quizDifficulty: $("quizDifficulty"), quizMeta: $("quizMeta"), quizScore: $("quizScore"), quizQuestion: $("quizQuestion"), quizOptions: $("quizOptions"), quizFeedback: $("quizFeedback"), nextQuestion: $("nextQuestion"),
  scenarioDifficulty: $("scenarioDifficulty"), scenarioCount: $("scenarioCount"), scenarioDistance: $("scenarioDistance"), scenarioStyle: $("scenarioStyle"), scenarioSituation: $("scenarioSituation"), scenarioOptions: $("scenarioOptions"), scenarioFeedback: $("scenarioFeedback"), nextScenario: $("nextScenario"),
  matchSetup: $("matchSetup"), matchGame: $("matchGame"), matchAnalysis: $("matchAnalysis"), startMatch: $("startMatch"),
  playerScore: $("playerScore"), opponentScore: $("opponentScore"), matchRatingDisplay: $("matchRatingDisplay"), tacticalScore: $("tacticalScore"), distanceScore: $("distanceScore"), timingScore: $("timingScore"), roundNumber: $("roundNumber"), matchDistance: $("matchDistance"), matchDistanceName: $("matchDistanceName"), youFencer: $("youFencer"), themFencer: $("themFencer"), touchFlash: $("touchFlash"), matchActions: $("matchActions"), sequenceList: $("sequenceList"), sequenceCount: $("sequenceCount"), commitmentText: $("commitmentText"), commitmentFill: $("commitmentFill"), suggestedSequence: $("suggestedSequence"), trySuggestion: $("trySuggestion"), simpleControls: $("simpleControls"), advancedControls: $("advancedControls"), undoSequence: $("undoSequence"), clearSequence: $("clearSequence"), keyboardHint: $("keyboardHint"), matchMode: $("matchMode"), aiDifficulty: $("aiDifficulty"), learningMode: $("learningMode"), opponentType: $("opponentType"), opponentTitle: $("opponentTitle"), aiBehaviour: $("aiBehaviour"), aiPattern: $("aiPattern"), opponentAnalysis: $("opponentAnalysis"), analysisConfidence: $("analysisConfidence"), memoryPanel: $("memoryPanel"), memoryList: $("memoryList"), aiAdjustment: $("aiAdjustment"), observationPanel: $("observationPanel"), observationList: $("observationList"), historyPanel: $("historyPanel"), exchangeHistory: $("exchangeHistory"), patternPanel: $("patternPanel"), detectedPattern: $("detectedPattern"), matchSituation: $("matchSituation"), matchFeedback: $("matchFeedback"), analysisOutcome: $("analysisOutcome"), analysisPlayerAction: $("analysisPlayerAction"), analysisOpponentAction: $("analysisOpponentAction"), analysisResult: $("analysisResult"), analysisTacticalPoints: $("analysisTacticalPoints"), analysisSkillXp: $("analysisSkillXp"), nextExchange: $("nextExchange"), replayExchange: $("replayExchange"), analysisResetMatch: $("analysisResetMatch")
};

function loadProgress() {
  try { return normalizeProgress({ ...defaultProgress, ...JSON.parse(localStorage.getItem(storeKey)) }); }
  catch { return { ...defaultProgress }; }
}

function saveProgress() {
  state.progress = normalizeProgress(state.progress);
  localStorage.setItem(storeKey, JSON.stringify(state.progress));
  renderProgress();
}

function normalizeProgress(progress) {
  return {
    ...defaultProgress,
    ...progress,
    mastered: Array.isArray(progress.mastered) ? progress.mastered : [],
    skills: { ...defaultSkills, ...(progress.skills || {}) },
    unlocked: Array.isArray(progress.unlocked) ? progress.unlocked : [],
    trainingHistory: { ...(progress.trainingHistory || {}) },
    profile: progress.profile || null
  };
}

function level() { return Math.floor(state.progress.xp / 100) + 1; }
function accuracy() { return state.progress.quizAnswered ? Math.round(state.progress.quizCorrect / state.progress.quizAnswered * 100) : 0; }
function xpInLevel() { return state.progress.xp % 100; }
function winRate() { return state.progress.matches ? Math.round((state.progress.wins / state.progress.matches) * 100) : 0; }
function averageRating() { return state.progress.ratingCount ? Math.round(state.progress.ratingTotal / state.progress.ratingCount) : 0; }
function skillLevel(skill) { return Math.floor((state.progress.skills[skill] || 0) / 100) + 1; }
function skillProgress(skill) { return (state.progress.skills[skill] || 0) % 100; }
function skillTier(levelValue) {
  if (levelValue >= 15) return "Elite";
  if (levelValue >= 10) return "Advanced";
  if (levelValue >= 5) return "Intermediate";
  return "Beginner";
}
function skillDisplayPercent(skill) {
  return Math.min(100, Math.round(((skillLevel(skill) - 1) / 14) * 70 + skillProgress(skill) * 0.3));
}

function createProfile(data) {
  state.progress.profile = {
    name: data.name,
    weapon: data.weapon,
    experience: data.experience,
    years: data.years,
    goal: data.goal,
    style: data.style,
    avatar: "Beginner Fencer",
    createdAt: new Date().toISOString()
  };
  saveProgress();
}

function profileAvatarName() {
  const current = state.progress.profile?.avatar || "Beginner Fencer";
  if (level() >= 10 && current === "Beginner Fencer") return "Champion Fencer";
  if (level() >= 5 && current === "Beginner Fencer") return "Tactical Fencer";
  return current;
}

function grantXp(amount, skillUpdates = {}, source = "Training") {
  const before = level();
  const previousUnlocks = new Set(state.progress.unlocked);
  state.progress.xp += amount;
  Object.entries(skillUpdates).forEach(([skill, value]) => {
    if (value <= 0) return;
    state.progress.skills[skill] = Math.max(0, (state.progress.skills[skill] || 0) + value);
    recordTraining(skill, source, value);
  });
  const unlockedSomething = updateUnlocks(previousUnlocks);
  const after = level();
  if (after > before) showLevelUp(after);
  else if (!unlockedSomething) showXpToast(amount, source);
  saveProgress();
}

function recordTraining(skill, source, amount) {
  if (!state.progress.trainingHistory[skill]) state.progress.trainingHistory[skill] = [];
  state.progress.trainingHistory[skill].unshift({
    source,
    amount,
    date: new Date().toLocaleDateString()
  });
  state.progress.trainingHistory[skill] = state.progress.trainingHistory[skill].slice(0, 8);
}

function unlockId(skill, levelValue, label) {
  return `${skill}:${levelValue}:${label}`;
}

function updateUnlocks(previousUnlocks = new Set(state.progress.unlocked)) {
  let unlockedSomething = false;
  Object.entries(skillCatalog).forEach(([skill, config]) => {
    const currentLevel = skillLevel(skill);
    config.unlocks.forEach(([requiredLevel, label]) => {
      const id = unlockId(skill, requiredLevel, label);
      if (currentLevel >= requiredLevel && !state.progress.unlocked.includes(id)) {
        state.progress.unlocked.push(id);
        unlockedSomething = true;
        if (!previousUnlocks.has(id)) showUnlockToast(label);
      }
    });
  });
  return unlockedSomething;
}

function showLevelUp(newLevel) {
  els.levelToastText.textContent = `You reached Level ${newLevel}`;
  els.unlockToastText.textContent = newLevel >= 5 ? "Unlocked: Advanced Tactical Scenarios" : "Unlocked: stronger training profile stats";
  els.levelToast.classList.remove("show");
  void els.levelToast.offsetWidth;
  els.levelToast.classList.add("show");
}

function showUnlockToast(label) {
  els.levelToastText.textContent = "New skill unlock";
  els.unlockToastText.textContent = `Unlocked: ${label}`;
  els.levelToast.classList.remove("show");
  void els.levelToast.offsetWidth;
  els.levelToast.classList.add("show");
}

function showXpToast(amount, source) {
  els.levelToastText.textContent = `+${amount} XP`;
  els.unlockToastText.textContent = source;
  els.levelToast.classList.remove("show");
  void els.levelToast.offsetWidth;
  els.levelToast.classList.add("show");
}

function renderProgress() {
  const xpLevel = xpInLevel();
  const profile = state.progress.profile;
  const avatarName = profileAvatarName();
  const avatarIcon = avatarIcons[avatarName] || avatarIcons["Beginner Fencer"];
  els.welcomeLabel.textContent = profile ? `Welcome Back, ${profile.name}` : "Welcome to Fencing IQ";
  els.hubAvatar.textContent = avatarIcon;
  els.hubProfileName.textContent = profile?.name || "Create Profile";
  els.hubProfileStyle.textContent = profile ? `${profile.weapon} · ${profile.style}` : "Epee Fencer";
  els.hubLevel.textContent = `Fencer Level ${level()}`;
  els.hubXp.textContent = `${xpLevel}/100 XP`;
  els.hubXpFill.style.width = `${xpLevel}%`;
  els.hubMatches.textContent = state.progress.matches;
  els.hubAccuracy.textContent = `${state.progress.tacticalRating}%`;
  els.hubMastered.textContent = state.progress.mastered.length;
  els.progressLevel.textContent = level();
  els.progressXp.textContent = state.progress.xp;
  els.progressMatches.textContent = state.progress.matches;
  els.progressAccuracy.textContent = `${accuracy()}%`;
  els.progressRating.textContent = `${state.progress.tacticalRating}%`;
  els.progressMastered.textContent = state.progress.mastered.length;
  renderProfile();
  renderSkillTree();
}

function renderProfile() {
  const profile = state.progress.profile;
  const avatarName = profileAvatarName();
  const avatarIcon = avatarIcons[avatarName] || avatarIcons["Beginner Fencer"];
  if (!profile) {
    els.profileName.textContent = "No profile yet";
    els.profileAvatar.textContent = avatarIcons["Beginner Fencer"];
    els.profileSummary.textContent = "Create a profile to start tracking progress.";
    els.profileWeapon.textContent = "Epee";
    els.profileExperience.textContent = "Beginner";
    els.profileStyle.textContent = "Unsure";
    els.profileYears.textContent = "Less than 1 year";
    els.profileLevel.textContent = level();
    els.profileXp.textContent = `${xpInLevel()} / 100`;
    els.profileXpFill.style.width = `${xpInLevel()}%`;
    els.statMatches.textContent = "0";
    els.statWins.textContent = "0";
    els.statLosses.textContent = "0";
    els.statWinRate.textContent = "0%";
    els.statTouchesScored.textContent = "0";
    els.statTouchesReceived.textContent = "0";
    els.statAvgRating.textContent = "0%";
    els.profileSkills.innerHTML = "";
    return;
  }
  els.profileAvatar.textContent = avatarIcon;
  els.profileName.textContent = profile.name;
  els.profileSummary.textContent = `${profile.weapon} · ${profile.experience} · ${profile.style}`;
  els.profileWeapon.textContent = profile.weapon;
  els.profileExperience.textContent = profile.experience;
  els.profileStyle.textContent = profile.style;
  els.profileYears.textContent = profile.years;
  els.profileLevel.textContent = level();
  els.profileXp.textContent = `${xpInLevel()} / 100`;
  els.profileXpFill.style.width = `${xpInLevel()}%`;
  els.avatarSelect.value = profile.avatar;
  els.statMatches.textContent = state.progress.matches;
  els.statWins.textContent = state.progress.wins;
  els.statLosses.textContent = state.progress.losses;
  els.statWinRate.textContent = `${winRate()}%`;
  els.statTouchesScored.textContent = state.progress.touchesScored;
  els.statTouchesReceived.textContent = state.progress.touchesReceived;
  els.statAvgRating.textContent = `${averageRating()}%`;
  const skillLabels = [
    ["distanceControl", "Distance Control"],
    ["timing", "Timing"],
    ["bladeWork", "Blade Work"],
    ["tacticalIq", "Tactical IQ"],
    ["matchExperience", "Match Experience"],
    ["mentalGame", "Mental Game"]
  ];
  els.profileSkills.innerHTML = skillLabels.map(([key, label]) => {
    const value = skillDisplayPercent(key);
    return `
      <div class="skill-row">
        <div class="split"><strong>${label}</strong><span>Level ${skillLevel(key)} · ${value}%</span></div>
        <div class="skill-bar"><span style="width: ${value}%"></span></div>
      </div>
    `;
  }).join("");
}

function renderSkillTree() {
  if (!els.skillTree) return;
  const sorted = Object.keys(skillCatalog).sort((a, b) => skillLevel(b) - skillLevel(a));
  const strengths = sorted.slice(0, 2).map((skill) => `✓ ${skillCatalog[skill].name} - Level ${skillLevel(skill)}`);
  const improvements = [...sorted].reverse().slice(0, 2).map((skill) => `△ ${skillCatalog[skill].name} - ${skillCatalog[skill].next}`);
  els.strengthList.innerHTML = strengths.map((item) => `<li>${item}</li>`).join("");
  els.improveList.innerHTML = improvements.map((item) => `<li>${item}</li>`).join("");

  els.skillTree.innerHTML = Object.entries(skillCatalog).map(([skill, config]) => {
    const currentLevel = skillLevel(skill);
    const progress = skillProgress(skill);
    const history = state.progress.trainingHistory[skill] || [];
    const unlocks = config.unlocks.map(([requiredLevel, label]) => {
      const isUnlocked = currentLevel >= requiredLevel;
      return `<li class="${isUnlocked ? "unlocked" : "locked"}">${isUnlocked ? "✓" : "○"} Level ${requiredLevel}: ${label}</li>`;
    }).join("");
    const historyMarkup = history.length
      ? history.map((entry) => `<li>${entry.date}: +${entry.amount} XP · ${entry.source}</li>`).join("")
      : "<li>No training history yet.</li>";

    return `
      <article class="skill-card" data-skill="${skill}">
        <div class="skill-top">
          <div>
            <h3>${config.name}</h3>
            <span class="tier-label">${skillTier(currentLevel)}</span>
          </div>
          <span class="level-badge">Level ${currentLevel}</span>
        </div>
        <div class="skill-bar"><span style="width: ${progress}%"></span></div>
        <div class="xp-note">${progress}% to next level</div>
        <div class="skill-detail">
          <p><strong>Description:</strong> ${config.description}</p>
          <p><strong>Measures:</strong> ${config.measures}</p>
          <h4>Improves through</h4>
          <ul class="improve-list">${config.improves.map((item) => `<li>✓ ${item}</li>`).join("")}</ul>
          <h4>Next level</h4>
          <p>${config.next}</p>
          <h4>Unlocks</h4>
          <ul class="unlock-list">${unlocks}</ul>
          <h4>Training history</h4>
          <ul class="history-list">${historyMarkup}</ul>
        </div>
      </article>
    `;
  }).join("");
}

function showProfileSetupIfNeeded() {
  els.profileSetup.classList.toggle("show", !state.progress.profile);
}

function showView(id) {
  els.views.forEach((view) => view.classList.toggle("active", view.id === id));
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === id));
  els.mainNav.classList.remove("open");
  els.menuToggle.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderGuide() {
  els.guideGrid.innerHTML = guideSections.map((section) => `
    <article class="guide-card">
      <div class="diagram">${section.diagram}</div>
      <h3>${section.title}</h3>
      ${section.points.map((point) => `<p>${point}</p>`).join("")}
    </article>
  `).join("");
}

function renderFlashcard() {
  const card = flashcards[state.flashIndex];
  const mastered = state.progress.mastered.includes(card.id);
  els.flashSide.textContent = state.flashFlipped ? "Explanation" : "Term";
  els.flashText.textContent = state.flashFlipped ? card.back : card.term;
  els.flashHint.textContent = mastered ? "Mastered" : "Click to flip";
}

function moveCard(step) {
  state.flashFlipped = false;
  state.flashIndex = (state.flashIndex + step + flashcards.length) % flashcards.length;
  renderFlashcard();
}

function currentQuizPool() {
  return quizQuestions.filter((q) => q.difficulty === state.quizDifficulty);
}

function renderQuiz() {
  const pool = currentQuizPool();
  const question = pool[state.quizIndex % pool.length];
  els.quizMeta.textContent = `Question ${(state.quizIndex % pool.length) + 1} / ${pool.length}`;
  els.quizScore.textContent = `Score ${state.quizScore}`;
  els.quizQuestion.textContent = question.question;
  els.quizFeedback.className = "feedback";
  els.quizFeedback.textContent = "";
  els.nextQuestion.classList.remove("show");
  renderOptions(els.quizOptions, question.options, (choice) => {
    const correct = choice === question.correct;
    lockOptions(els.quizOptions, choice, question.correct);
    state.quizScore += correct ? 10 : 0;
    state.progress.quizAnswered += 1;
    state.progress.quizCorrect += correct ? 1 : 0;
    grantXp(correct ? 10 : 3, { bladeWork: correct ? 10 : 3 }, "Knowledge Quiz");
    saveProgress();
    els.quizScore.textContent = `Score ${state.quizScore}`;
    els.quizFeedback.innerHTML = `<strong>${correct ? "Correct." : "Incorrect."}</strong> ${question.explanation}`;
    els.quizFeedback.classList.add("show");
    els.nextQuestion.classList.add("show");
  });
}

function renderOptions(container, options, handler) {
  container.innerHTML = "";
  options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.type = "button";
    btn.textContent = `${String.fromCharCode(65 + index)}. ${option}`;
    btn.addEventListener("click", () => handler(index));
    container.appendChild(btn);
  });
}

function lockOptions(container, selected, correct) {
  [...container.children].forEach((btn, index) => {
    btn.disabled = true;
    if (index === correct) btn.classList.add("correct");
    if (index === selected && selected !== correct) btn.classList.add("wrong");
  });
}

function scenarioPool() {
  return scenarios.filter((s) => s.difficulty === state.scenarioDifficulty);
}

function renderScenario() {
  const pool = scenarioPool();
  const scenario = pool[state.scenarioIndex % pool.length];
  els.scenarioCount.textContent = `Scenario ${scenario.id} / ${scenarios.length}`;
  els.scenarioDistance.textContent = scenario.distance;
  els.scenarioStyle.textContent = scenario.style;
  els.scenarioSituation.textContent = scenario.situation;
  els.scenarioFeedback.className = "feedback";
  els.nextScenario.classList.remove("show");
  const wrongs = actions.filter((action) => action !== scenario.correctAction).sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [scenario.correctAction, ...wrongs].sort(() => Math.random() - 0.5);
  renderOptions(els.scenarioOptions, opts, (choice) => {
    const correctIndex = opts.indexOf(scenario.correctAction);
    const correct = choice === correctIndex;
    lockOptions(els.scenarioOptions, choice, correctIndex);
    state.progress.scenarioAnswered += 1;
    grantXp(
      correct ? 15 : 5,
      {
        tacticalIq: correct ? 15 : 5,
        distanceControl: correct ? 10 : 2,
        mentalGame: correct && scenario.difficulty === "Advanced" ? 5 : 0
      },
      "Tactical Scenario"
    );
    state.progress.tacticalRating = Math.round((state.progress.tacticalRating * 4 + (correct ? 100 : 55)) / 5);
    saveProgress();
    els.scenarioFeedback.innerHTML = `<strong>${correct ? "Successful decision." : "Lower-percentage choice."}</strong> ${scenario.explanation}`;
    els.scenarioFeedback.classList.add("show");
    els.nextScenario.classList.add("show");
  });
}

function resetQuiz() {
  state.quizIndex = 0;
  state.quizScore = 0;
  renderQuiz();
}

function renderMatch() {
  const m = state.match;
  const analysis = analyzeOpponent();
  const matchRating = Math.max(0, Math.min(100, Math.round(55 + (m.tactical + m.distanceScore + m.timing) / Math.max(1, m.round * 1.6))));
  const distanceKey = Math.max(1, Math.min(5, Math.round(m.distance)));
  els.playerScore.textContent = m.player;
  els.opponentScore.textContent = m.opponent;
  els.matchRatingDisplay.textContent = `${matchRating}%`;
  els.tacticalScore.textContent = m.tactical;
  els.distanceScore.textContent = m.distanceScore;
  els.timingScore.textContent = m.timing;
  els.roundNumber.textContent = m.round;
  els.matchDistance.textContent = `Distance: ${m.distance}`;
  els.matchDistanceName.textContent = distanceNames[distanceKey];
  els.youFencer.style.left = `${8 + (5 - m.distance) * 5.5}%`;
  els.themFencer.style.right = `${8 + (5 - m.distance) * 5.5}%`;
  els.opponentTitle.textContent = "Unknown Opponent";
  els.opponentAnalysis.textContent = analysis.label;
  els.analysisConfidence.textContent = `${analysis.confidence}%`;
  els.memoryList.innerHTML = buildMemoryList().map((item) => `<li>${item}</li>`).join("");
  els.aiAdjustment.textContent = m.lastAdjustment;
  if (m.situation) {
    els.aiBehaviour.textContent = m.liveCue || (m.learningMode === "advanced" ? "Watch the feet and blade" : m.situation.behaviour);
    els.aiPattern.textContent = m.learningMode === "beginner" ? m.situation.pattern : "Infer from exchanges";
    els.matchSituation.textContent = `Distance: ${distanceNames[distanceKey]}. ${m.situation.prompt}`;
  }
  renderSequenceBuilder();
  renderLearningPanels();
}

function setMatchView(view) {
  els.matchSetup.classList.toggle("hidden", view !== "setup");
  els.matchGame.classList.toggle("hidden", view !== "fight");
  els.matchAnalysis.classList.toggle("hidden", view !== "analysis");
}

function showMatchSetup() {
  setMatchView("setup");
  els.matchFeedback.textContent = "Choose an action to fence the first exchange.";
}

function returnToMatchSetup() {
  state.match.locked = true;
  state.match.over = true;
  els.nextExchange.classList.remove("show");
  els.replayExchange.disabled = true;
  showMatchSetup();
}

function selectedAiDifficulty() {
  if (els.aiDifficulty.value !== "auto") return els.aiDifficulty.value;
  const experience = state.progress.profile?.experience || "Beginner";
  if (experience === "Advanced") return "advanced";
  if (experience === "Intermediate") return "intermediate";
  return "beginner";
}

function drillUnlockLevel() {
  return Math.max(
    level(),
    skillLevel("distanceControl"),
    skillLevel("timing"),
    skillLevel("bladeWork"),
    skillLevel("tacticalIq")
  );
}

function actionMeta(action) {
  return drillActions.find((item) => item.name === action) || { name: action, risk: 2, unlock: 1, group: "Action" };
}

function isActionUnlocked(action) {
  return drillUnlockLevel() >= actionMeta(action).unlock;
}

function isFinishAction(action) {
  return actionMeta(action).group === "Finish";
}

function sequenceRisk(sequence = state.match.sequence) {
  return sequence.reduce((sum, action) => sum + actionMeta(action).risk, 0);
}

function riskLabel(risk) {
  if (risk <= 2) return "Low risk";
  if (risk <= 5) return "Medium commitment";
  if (risk <= 7) return "High commitment";
  return "Overcommitted";
}

function finalActionFromSequence(sequence) {
  const finish = [...sequence].reverse().find(isFinishAction);
  return actionAliases[finish] || finish || actionAliases[sequence.at(-1)] || sequence.at(-1) || "Hold Distance";
}

function opponentSequenceLabel(aiAction, playerSequence) {
  if (aiAction === "Attack") return playerSequence.includes("Bait") || playerSequence.includes("Invite Attack") ? "Advance -> Attack" : "Attack";
  if (aiAction === "Counterattack") return "Retreat -> Counterattack";
  if (aiAction === "Feint") return "Feint -> Change Line";
  if (aiAction === "Retreat") return "Retreat -> Reset Distance";
  return aiAction;
}

function recommendedSequence() {
  const m = state.match;
  const analysis = analyzeOpponent();
  if (m.distance >= 4) return ["Half Step In", "Feint", "Lunge"].filter(isActionUnlocked);
  if (analysis.label.includes("pressure") || countHistory("Attack") >= 1) return ["Bait", "Retreat", "Counterattack"].filter(isActionUnlocked);
  if (countHistory("Counterattack") >= 1) return ["Feint", "Parry-Riposte"].filter(isActionUnlocked);
  return ["Advance", "Feint", "Lunge"].filter(isActionUnlocked);
}

function actionCue(action) {
  const distance = state.match.distance;
  const opponentAction = state.match.situation?.behaviour || "";
  if (state.match.pendingAiAction === "Attack" && ["Retreat", "Half Step Out", "Parry-Riposte", "Counterattack", "Hold Distance"].includes(action)) return "good";
  if (distance >= 4 && ["Lunge", "Counterattack"].includes(action)) return "warn";
  if (distance >= 4 && ["Advance", "Half Step In", "Bait"].includes(action)) return "good";
  if (distance <= 2 && ["Retreat", "Half Step Out", "Parry-Riposte", "Counterattack"].includes(action)) return "good";
  if (distance <= 2 && ["Fleche", "Step-Lunge"].includes(action)) return "warn";
  if (opponentAction.toLowerCase().includes("attack") && ["Parry-Riposte", "Retreat", "Counterattack"].includes(action)) return "good";
  if (state.match.sequence.length && isFinishAction(action)) return "finish";
  return "";
}

function shortPlanHint(sequence) {
  if (state.match.planHint) return state.match.planHint;
  if (!sequence.length && state.match.distance >= 4) return "Too far";
  if (!sequence.length && state.match.distance <= 2) return "Close range";
  if (!sequence.length) return "Choose a setup";
  if (sequence.length >= 3 && !sequence.some(isFinishAction)) return "Finish now";
  if (sequence.some(isFinishAction)) return "Resolving";
  const risk = sequenceRisk(sequence);
  if (risk >= 5) return "Risky distance";
  if (sequence.some((action) => ["Feint", "Bait", "Beat", "Change Rhythm", "Half Step In", "Half Step Out"].includes(action))) return "Good setup";
  return "Choose a finish";
}

function renderSequenceBuilder() {
  const sequence = state.match.sequence || [];
  const risk = sequenceRisk(sequence);
  els.sequenceCount.textContent = shortPlanHint(sequence);
  els.sequenceList.innerHTML = sequence.length
    ? sequence.map((action) => `<span>${action}</span>`).join("<b>→</b>")
    : `<span class="empty-sequence">Prepare -> React -> Finish</span>`;
  els.commitmentText.textContent = riskLabel(risk);
  els.commitmentFill.style.width = `${Math.min(100, risk * 12)}%`;
  els.commitmentFill.classList.toggle("danger", risk >= 7);
  const suggestion = recommendedSequence();
  els.suggestedSequence.textContent = suggestion.length
    ? `Coach Suggestion: Try ${suggestion.join(" -> ")}`
    : "Coach Suggestion: Build your own plan.";
  els.trySuggestion.disabled = state.match.locked || !suggestion.length;
  els.undoSequence.disabled = !sequence.length || state.match.locked;
  els.clearSequence.disabled = !sequence.length || state.match.locked;
  els.simpleControls.classList.toggle("active", state.controlMode === "simple");
  els.advancedControls.classList.toggle("active", state.controlMode === "advanced");
  els.matchActions.querySelectorAll(".action-btn").forEach((btn) => {
    const action = btn.dataset.action;
    const meta = actionMeta(action);
    const locked = !isActionUnlocked(action);
    const simpleHidden = state.controlMode === "simple" && !meta.simple;
    const sequenceFull = sequence.length >= 3 && !isFinishAction(action);
    btn.hidden = simpleHidden;
    btn.disabled = state.match.locked || locked || sequenceFull;
    btn.classList.toggle("locked", locked);
    btn.classList.toggle("recommended", actionCue(action) === "good");
    btn.classList.toggle("warning", actionCue(action) === "warn");
    btn.classList.toggle("finish-now", actionCue(action) === "finish");
    btn.title = locked ? `Unlocks at drill level ${meta.unlock}` : `${meta.key} · ${meta.group}`;
  });
}

function queueAction(action) {
  if (state.match.locked || !isActionUnlocked(action)) return;
  if (state.match.sequence.length >= 3 && !isFinishAction(action)) return;
  if (state.match.sequence.length >= 3 && isFinishAction(action)) state.match.sequence[state.match.sequence.length - 1] = action;
  else state.match.sequence.push(action);
  renderSequenceBuilder();
  if (isFinishAction(action)) executeQueuedSequence();
  else handleSetupAction(action);
}

function clearSequence() {
  if (state.match.locked) return;
  if (state.match.setupDistanceStack?.length) state.match.distance = state.match.setupDistanceStack[0];
  state.match.sequence = [];
  state.match.appliedSequenceLength = 0;
  state.match.setupDistanceStack = [];
  state.match.pendingAiAction = null;
  state.match.planHint = "";
  state.match.liveCue = "";
  renderSequenceBuilder();
  renderMatch();
}

function undoSequence() {
  if (state.match.locked) return;
  const removed = state.match.sequence.pop();
  if ((state.match.appliedSequenceLength || 0) > state.match.sequence.length) {
    const previousDistance = state.match.setupDistanceStack?.pop();
    if (Number.isFinite(previousDistance)) state.match.distance = previousDistance;
    state.match.appliedSequenceLength = state.match.sequence.length;
  }
  state.match.pendingAiAction = null;
  state.match.planHint = state.match.sequence.length ? "Plan adjusted. Choose a finish or continue setting up." : "";
  state.match.liveCue = "";
  renderSequenceBuilder();
  renderMatch();
}

function trySuggestedSequence() {
  if (state.match.locked) return;
  const suggestion = recommendedSequence();
  state.match.sequence = suggestion.filter((action) => !isFinishAction(action)).slice(0, 2);
  renderSequenceBuilder();
}

function isCommittedDefense(action) {
  return ["Retreat", "Half Step Out", "Hold Distance"].includes(action);
}

function opponentShowingAttackCue() {
  const situation = state.match.situation || {};
  const cue = `${situation.behaviour || ""} ${situation.pattern || ""}`.toLowerCase();
  return /attack|rush|fleche|pressure|compress|overcommit/.test(cue);
}

function handleSetupAction(action) {
  const m = state.match;
  const sequence = [...m.sequence];
  const tacticalAction = actionAliases[action] || action;
  const aiReaction = chooseAiAction(tacticalAction, sequence);
  const createsCommitment = ["Bait", "Invite Attack"].includes(action) || opponentShowingAttackCue();
  const opponentCommitted = m.pendingAiAction === "Attack" || (aiReaction === "Attack" && createsCommitment);
  const distanceBeforeSetup = m.distance;

  adjustMatchDistance(action);
  m.appliedSequenceLength = sequence.length;
  m.lastAiAction = aiReaction;

  if (aiReaction === "Attack" && createsCommitment) {
    m.pendingAiAction = "Attack";
    m.liveCue = "Opponent committed";
  } else if (aiReaction === "Attack") {
    m.liveCue = "Opponent threatening";
  } else {
    m.liveCue = aiReaction === "Retreat" ? "Opponent took distance" : aiReaction === "Feint" ? "Opponent reacted" : "Opponent preparing";
  }

  if (opponentCommitted && isCommittedDefense(action)) {
    executeQueuedSequence("Attack");
    return;
  }

  if (aiReaction !== "Attack") adjustDistanceForAi(aiReaction);
  m.setupDistanceStack = [...(m.setupDistanceStack || []), distanceBeforeSetup];
  m.planHint = sequence.length >= 3
    ? "Distance changed. Choose a finishing action or continue setting up."
    : opponentCommitted
      ? "Opponent committed. React or finish."
      : "Distance changed. Choose a finishing action or continue setting up.";
  renderMatch();
}

function actionCounts(side = "player") {
  return state.match.history.reduce((counts, entry) => {
    counts[entry[side]] = (counts[entry[side]] || 0) + 1;
    return counts;
  }, {});
}

function mostCommonAction(side = "player") {
  const entries = Object.entries(actionCounts(side)).sort((a, b) => b[1] - a[1]);
  return entries[0] || ["None", 0];
}

function favoriteAttack() {
  const attacks = state.match.history
    .map((entry) => entry.finalAction || entry.player)
    .filter((action) => ["Lunge", "Fleche", "Counterattack", "Parry-Riposte"].includes(action));
  if (!attacks.length) return ["None", 0];
  const counts = attacks.reduce((map, action) => ({ ...map, [action]: (map[action] || 0) + 1 }), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
}

function preferredDistance() {
  const distances = state.match.history.map((entry) => entry.distanceBefore).filter(Boolean);
  if (!distances.length) return "Unknown";
  const avg = distances.reduce((sum, value) => sum + value, 0) / distances.length;
  if (avg <= 2.4) return "Close distance";
  if (avg >= 3.8) return "Long distance";
  return "Middle distance";
}

function analyzeOpponent() {
  const history = state.match.history;
  if (history.length < 2) return { label: "Unknown", confidence: 0 };
  const aiCounts = actionCounts("ai");
  const attackScore = (aiCounts.Attack || 0) + (history.filter((entry) => entry.ai === "Attack" && entry.distanceBefore <= 3).length);
  const defenseScore = (aiCounts.Retreat || 0) + (aiCounts["Hold Distance"] || 0);
  const counterScore = aiCounts.Counterattack || 0;
  const adaptiveScore = (aiCounts.Feint || 0) + history.filter((entry) => entry.adjustment && entry.adjustment !== "No adjustment yet.").length;
  const scores = [
    ["Opponent prefers pressure attacks", attackScore],
    ["Opponent prefers defensive distance control", defenseScore],
    ["Opponent is looking for counterattacks", counterScore],
    ["Opponent is adapting with rhythm changes", adaptiveScore]
  ].sort((a, b) => b[1] - a[1]);
  const confidence = Math.min(95, Math.round((scores[0][1] / Math.max(1, history.length)) * 55 + history.length * 6));
  if (confidence < 45) return { label: "Unknown", confidence };
  return { label: scores[0][0], confidence };
}

function buildMemoryList() {
  const [common, commonCount] = mostCommonAction("player");
  const [attack, attackCount] = favoriteAttack();
  const defensive = state.match.history.filter((entry) => ["Retreat", "Parry-Riposte", "Hold Distance"].some((action) => (entry.sequence || entry.player).includes(action))).length;
  return [
    `Your most common action: <span class="memory-highlight">${common}</span> (${commonCount})`,
    `Favorite attack: <span class="memory-highlight">${attack}</span> (${attackCount})`,
    `Defensive habits shown: <span class="memory-highlight">${defensive}</span>`,
    `Preferred distance: <span class="memory-highlight">${preferredDistance()}</span>`
  ];
}

function newMatchSituation() {
  const m = state.match;
  const type = opponentTypes[m.type];
  const repeated = m.previous.length >= 2 && m.previous.at(-1) === m.previous.at(-2);
  const behaviour = type.behaviours[Math.floor(Math.random() * type.behaviours.length)];
  const pattern = repeated ? `Noticing repeated ${m.previous.at(-1)}` : type.patterns[Math.floor(Math.random() * type.patterns.length)];
  const prompt = buildSituationPrompt(Math.round(m.distance), behaviour, pattern);
  m.situation = { behaviour, pattern, prompt };
  m.sequence = [];
  m.appliedSequenceLength = 0;
  m.setupDistanceStack = [];
  m.pendingAiAction = null;
  m.planHint = "";
  m.liveCue = "";
  m.replaySnapshot = snapshotMatch();
  m.locked = false;
  els.replayExchange.disabled = false;
  els.nextExchange.classList.remove("show");
  els.matchActions.querySelectorAll(".action-btn").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong", "selected");
  });
  renderMatch();
}

function renderLearningPanels() {
  const mode = state.match.learningMode;
  els.observationPanel.classList.toggle("hidden", mode !== "beginner");
  els.historyPanel.classList.toggle("hidden", mode === "beginner");
  els.patternPanel.classList.toggle("hidden", mode === "advanced");
  els.observationList.innerHTML = buildObservations().map((item) => `<li>${item}</li>`).join("");
  els.exchangeHistory.innerHTML = state.match.history.length
    ? state.match.history.slice(-6).map((entry, index) => `
      <li>
        <strong>Exchange ${state.match.history.length - Math.min(6, state.match.history.length) + index + 1}</strong><br>
        You: ${entry.sequence || entry.player}<br>
        Opponent: ${entry.aiSequence || entry.ai}<br>
        Result: ${entry.result}
      </li>
    `).join("")
    : "<li>No exchanges yet.</li>";
  const analysis = analyzeOpponent();
  els.detectedPattern.textContent = `${detectPattern()} Confidence: ${analysis.confidence}%.`;
}

function countHistory(action, side = "ai") {
  return state.match.history.filter((entry) => entry[side] === action).length;
}

function buildObservations() {
  const history = state.match.history;
  const observations = [];
  const attacks = countHistory("Attack");
  const retreats = countHistory("Retreat");
  const counters = countHistory("Counterattack");
  const feints = countHistory("Feint");

  if (!history.length) {
    observations.push("First exchange: use distance and watch what the opponent does after your movement.");
    observations.push("Beginner tip: do not attack from long distance without preparation.");
    observations.push("Look for whether the opponent moves first, waits, or reacts to your attack.");
    return observations;
  }
  if (attacks >= 3) observations.push(`Attacked ${attacks} times so far.`);
  if (retreats >= 2) observations.push(`Retreated ${retreats} times, which can make direct attacks fall short.`);
  if (counters >= 2) observations.push(`Used counterattacks ${counters} times; feints can draw this reaction.`);
  if (feints >= 2) observations.push(`Used feints ${feints} times; wait for the real extension before parrying.`);
  if (history.slice(-3).every((entry) => entry.ai === "Attack")) observations.push("Attacked 3 times in a row.");
  if (history.some((entry) => (entry.sequence || entry.player).includes("Retreat") && entry.ai === "Attack")) observations.push("Misses or becomes vulnerable when attacking into your retreat.");
  if (history.some((entry) => (entry.sequence || entry.player).includes("Advance") && entry.ai === "Attack")) observations.push("Often attacks after you advance.");
  if (!observations.length) observations.push("No strong pattern yet. Keep collecting information through safe distance choices.");
  return observations.slice(0, 4);
}

function detectPattern() {
  const history = state.match.history;
  if (history.length < 3) return "Fence a few exchanges to reveal patterns.";
  if (history.slice(-3).every((entry) => entry.ai === "Attack")) return "Opponent has attacked three exchanges in a row.";
  if (history.filter((entry) => (entry.sequence || entry.player).includes("Advance") && entry.ai === "Attack").length >= 2) return "Opponent often attacks after you advance.";
  if (countHistory("Counterattack") >= 2) return "Opponent is looking to counterattack when you commit.";
  if (countHistory("Retreat") >= 2) return "Opponent often controls distance by retreating.";
  if (countHistory("Feint") >= 2) return "Opponent is changing rhythm with feints.";
  return "No reliable pattern yet. Watch the next two exchanges.";
}

function buildSituationPrompt(distance, behaviour, pattern) {
  const key = Math.max(1, Math.min(5, Math.round(distance)));
  const distanceCue = {
    5: "You are outside normal attacking measure, so any direct attack needs preparation.",
    4: "You are at long measure with room for both fencers to set traps.",
    3: "You are at middle distance where lunges, counterattacks, and retreats are all live.",
    2: "You are close enough that commitment is dangerous and fast.",
    1: "You are jammed in dangerously close distance and need immediate control."
  };
  if (state.match.learningMode === "advanced") return distanceCue[key];
  if (state.match.learningMode === "intermediate") return `${distanceCue[key]} Use the exchange history to infer the opponent's next choice.`;
  return `${distanceCue[key]} The opponent is ${behaviour.toLowerCase()} and the current pattern is ${pattern.toLowerCase()}.`;
}

function snapshotMatch() {
  const m = state.match;
  return {
    player: m.player,
    opponent: m.opponent,
    round: m.round,
    tactical: m.tactical,
    distanceScore: m.distanceScore,
    timing: m.timing,
    distance: m.distance,
    type: m.type,
    mode: m.mode,
    aiDifficulty: m.aiDifficulty,
    learningMode: m.learningMode,
    tournamentStage: m.tournamentStage,
    sequence: [...(m.sequence || [])],
    appliedSequenceLength: m.appliedSequenceLength || 0,
    setupDistanceStack: [...(m.setupDistanceStack || [])],
    pendingAiAction: m.pendingAiAction || null,
    planHint: m.planHint || "",
    liveCue: m.liveCue || "",
    previous: [...m.previous],
    history: m.history.map((entry) => ({ ...entry })),
    lastAdjustment: m.lastAdjustment,
    situation: m.situation ? { ...m.situation } : null
  };
}

function restoreSnapshot(snapshot, learningModeOverride = snapshot.learningMode) {
  const restoredSituation = { ...snapshot.situation };
  Object.assign(state.match, {
    player: snapshot.player,
    opponent: snapshot.opponent,
    round: snapshot.round,
    tactical: snapshot.tactical,
    distanceScore: snapshot.distanceScore,
    timing: snapshot.timing,
    distance: snapshot.distance,
    type: snapshot.type,
    mode: snapshot.mode,
    aiDifficulty: snapshot.aiDifficulty,
    learningMode: learningModeOverride,
    tournamentStage: snapshot.tournamentStage,
    sequence: [...(snapshot.sequence || [])],
    appliedSequenceLength: snapshot.appliedSequenceLength || 0,
    setupDistanceStack: [...(snapshot.setupDistanceStack || [])],
    pendingAiAction: snapshot.pendingAiAction || null,
    planHint: snapshot.planHint || "",
    liveCue: snapshot.liveCue || "",
    previous: [...snapshot.previous],
    history: snapshot.history.map((entry) => ({ ...entry })),
    situation: restoredSituation,
    locked: false,
    over: false,
    lastAiAction: null,
    lastAdjustment: snapshot.lastAdjustment || "No adjustment yet."
  });
  if (state.match.situation) {
    state.match.situation.prompt = buildSituationPrompt(
      Math.round(state.match.distance),
      state.match.situation.behaviour,
      state.match.situation.pattern
    );
  }
  els.opponentType.value = snapshot.type;
  els.matchMode.value = snapshot.mode;
  els.aiDifficulty.value = snapshot.aiDifficulty;
  els.learningMode.value = learningModeOverride;
}

function chooseAiAction(playerAction, sequence = [playerAction]) {
  const m = state.match;
  const type = opponentTypes[m.type];
  const weights = { ...type.weights };
  const difficulty = m.aiDifficulty || selectedAiDifficulty();
  const repeated = m.previous.length >= 2 && m.previous.at(-1) === m.previous.at(-2);
  const recentPlayer = m.previous.slice(-3);
  const repeatedCounter = recentPlayer.filter((action) => action === "Counterattack").length >= 2;
  const repeatedAttack = recentPlayer.filter((action) => ["Lunge", "Fleche", "Step-Lunge"].some((attack) => action.includes(attack))).length >= 2;
  const [commonPlayerAction, commonCount] = mostCommonAction("player");
  const hasPreparation = sequence.some((action) => ["Feint", "Bait", "Change Rhythm", "Beat", "Half Step In", "Half Step Out"].includes(action));
  const hasBait = sequence.some((action) => ["Bait", "Invite Attack"].includes(action));
  const hasDuck = false;
  const hasBigFinish = sequence.some((action) => ["Step-Lunge", "Fleche"].includes(action));
  const recentSequences = m.history.slice(-3).map((entry) => entry.sequence || entry.player);

  if (m.distance >= 5) {
    weights.Attack -= 10;
    weights.Retreat -= 8;
    weights["Hold Distance"] += 14;
    weights.Feint += 8;
  }
  if (m.distance <= 2) {
    weights.Attack += 12;
    weights.Retreat += 10;
    weights.Counterattack -= 8;
  }
  if (["Lunge", "Fleche"].includes(playerAction)) {
    weights.Counterattack += m.type === "counterattacker" ? 24 : 10;
    weights.Retreat += m.type === "defensive" ? 16 : 4;
  }
  if (playerAction === "Advance") weights.Attack += m.type === "aggressive" ? 18 : 6;
  if (playerAction === "Feint") {
    weights.Attack -= 10;
    weights.Counterattack -= 8;
    weights["Hold Distance"] += 8;
  }
  if (hasPreparation) {
    weights.Attack -= difficulty === "advanced" ? 10 : 4;
    weights.Counterattack += difficulty === "advanced" ? 12 : 4;
    weights["Hold Distance"] += hasBait ? 18 : 6;
  }
  if (hasBait) {
    weights.Attack -= difficulty === "beginner" ? 2 : 14;
    weights.Retreat += 12;
    weights["Hold Distance"] += 12;
  }
  if (hasBigFinish) {
    weights.Retreat += 14;
    weights.Counterattack += difficulty === "advanced" ? 22 : 12;
  }
  if (hasDuck && recentSequences.filter((item) => item.includes("Duck")).length >= 2) {
    weights.Feint += 18;
    weights.Attack -= 8;
  }
  if (recentSequences.filter((item) => item.includes("Feint")).length >= 2) {
    weights["Hold Distance"] += 18;
    weights.Counterattack += 12;
  }
  if (recentSequences.filter((item) => item.includes("Bait")).length >= 2) {
    weights.Retreat += 18;
    weights["Hold Distance"] += 12;
  }
  if (difficulty === "beginner") {
    weights[type.weights.Attack >= 30 ? "Attack" : "Hold Distance"] += 8;
  }
  if (difficulty === "advanced") {
    weights.Feint += 8;
    weights.Counterattack += 8;
  }
  if (repeated) weights.Counterattack += difficulty === "advanced" ? 24 : difficulty === "intermediate" ? 16 : 8;
  if (repeatedCounter || playerAction === "Counterattack" && m.previous.at(-1) === "Counterattack") {
    weights.Feint += difficulty === "advanced" ? 38 : difficulty === "intermediate" ? 26 : 12;
    weights["Hold Distance"] += difficulty === "advanced" ? 24 : 18;
    weights.Attack -= 10;
    weights.Counterattack -= 8;
  }
  if (repeatedAttack) {
    weights.Retreat += difficulty === "beginner" ? 10 : 18;
    weights.Counterattack += difficulty === "advanced" ? 26 : 18;
    weights.Feint += 10;
  }
  if (commonCount >= 4 && difficulty !== "beginner") {
    if (commonPlayerAction === "Counterattack") {
      weights.Feint += 18;
      weights["Hold Distance"] += 12;
    }
    if (["Lunge", "Fleche"].includes(commonPlayerAction)) {
      weights.Retreat += 14;
      weights.Counterattack += 14;
    }
    if (commonPlayerAction === "Parry-Riposte") weights.Feint += 16;
  }

  const entries = Object.entries(weights).map(([action, value]) => [action, Math.max(1, value)]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  let roll = Math.random() * total;
  for (const [action, value] of entries) {
    roll -= value;
    if (roll <= 0) return action;
  }
  return "Hold Distance";
}

function determineAiAdjustment(playerAction, aiAction, sequence = [playerAction]) {
  const [common, count] = mostCommonAction("player");
  if (common === "Counterattack" && count >= 3) return "Opponent begins using feints to draw out your counterattack.";
  if (["Lunge", "Fleche"].includes(common) && count >= 3) return "Opponent starts retreating and counterattacking your predictable attacks.";
  if (sequence.includes("Feint") && state.match.history.filter((entry) => (entry.sequence || "").includes("Feint")).length >= 2) return "Opponent is starting to ignore repeated feints and wait for the real attack.";
  if (sequence.includes("Bait") && state.match.history.filter((entry) => (entry.sequence || "").includes("Bait")).length >= 2) return "Opponent is refusing the bait and taking distance instead.";
  if (sequence.some((action) => ["Step-Lunge", "Fleche"].includes(action))) return "Opponent is preparing to retreat and counter if your big finish becomes predictable.";
  if (common === "Parry-Riposte" && count >= 3) return "Opponent starts using feints before committing to real attacks.";
  if (playerAction === "Advance" && aiAction === "Attack") return "Opponent is testing whether your advance creates attack timing.";
  return "No adjustment yet.";
}

function scoreMatchAction(action) {
  queueAction(action);
}

function executeQueuedSequence(forcedAiAction = null) {
  if (state.match.locked) return;
  const m = state.match;
  const sequence = (m.sequence && m.sequence.length) ? [...m.sequence] : ["Hold Distance"];
  const sequenceLabel = sequence.join(" -> ");
  const playerAction = finalActionFromSequence(sequence);
  const distanceBefore = m.distance;
  const aiAction = forcedAiAction || m.pendingAiAction || chooseAiAction(playerAction, sequence);
  const result = resolveSequenceExchange(sequence, playerAction, aiAction);
  const adjustment = determineAiAdjustment(playerAction, aiAction, sequence);
  m.lastAdjustment = adjustment;
  m.lastAiAction = aiAction;
  m.tactical += result.scores.tactical;
  m.distanceScore += result.scores.distance;
  m.timing += result.scores.timing;
  if (result.playerTouch) m.player += 1;
  if (result.opponentTouch) m.opponent += 1;
  animateScore(result.playerTouch, result.opponentTouch);
  m.locked = true;
  m.previous.push(sequenceLabel);
  m.history.push({ player: sequenceLabel, sequence: sequenceLabel, finalAction: playerAction, ai: aiAction, aiSequence: opponentSequenceLabel(aiAction, sequence), result: result.title, distanceBefore, commitment: sequenceRisk(sequence), adjustment });
  const skillXpText = applyExchangeSkillRewards(playerAction, result, sequence);
  sequence.slice(m.appliedSequenceLength || 0).forEach((action) => adjustMatchDistance(action));
  adjustDistanceForAi(aiAction);
  lockMatchButtons(sequence);
  animateExchange(playerAction, aiAction, result.playerTouch, result.opponentTouch);

  els.matchFeedback.innerHTML = buildMatchFeedback(result, aiAction);
  els.analysisOutcome.textContent = result.title;
  els.analysisPlayerAction.textContent = sequenceLabel;
  els.analysisOpponentAction.textContent = opponentSequenceLabel(aiAction, sequence);
  els.analysisResult.textContent = result.playerTouch && result.opponentTouch ? "Double touch" : result.playerTouch ? "Player touch" : result.opponentTouch ? "Opponent touch" : "No touch";
  els.analysisTacticalPoints.textContent = result.scores.tactical > 0 ? `+${result.scores.tactical}` : result.scores.tactical;
  els.analysisSkillXp.textContent = skillXpText || "Review XP";
  els.matchFeedback.classList.add("show");
  m.sequence = [];
  m.appliedSequenceLength = 0;
  m.setupDistanceStack = [];
  m.pendingAiAction = null;
  m.planHint = "";
  m.liveCue = "";
  renderMatch();
  setMatchView("analysis");

  if (shouldEndBout()) finishMatch();
  else els.nextExchange.classList.add("show");
}

function buildMatchFeedback(result, aiAction) {
  const poorDecision = result.scores.tactical < 0 || (result.opponentTouch && !result.playerTouch);
  const betterLine = poorDecision ? `<p><b>Better option:</b> ${result.better}</p>` : "";
  if (state.match.mode === "ranked") {
    return `
      <strong>EXCHANGE RESULT</strong>
      <p><b>What happened:</b> ${result.what}</p>
      <p><b>Why:</b> ${result.why}</p>
      ${betterLine}
      <p><b>Training focus:</b> ${result.training}</p>
    `;
  }
  if (state.match.mode === "tournament") {
    return `
      <strong>TOURNAMENT EXCHANGE</strong>
      <p><b>What happened:</b> ${result.what}</p>
      <p><b>Why:</b> ${result.why}</p>
      ${betterLine}
      <p><b>Adjustment:</b> ${state.match.lastAdjustment}</p>
    `;
  }
  return `
    <strong>EXCHANGE RESULT</strong>
    <p><b>What happened:</b> ${result.what}</p>
    <p><b>Why:</b> ${result.why}</p>
    ${betterLine}
    <p><b>Training focus:</b> ${result.training}</p>
    <p><b>Coach note:</b> ${result.advice}</p>
  `;
}

function applyExchangeSkillRewards(playerAction, result, sequence = [playerAction]) {
  const skillGain = {};
  if (result.playerTouch) skillGain.tacticalIq = 5;
  if (result.title.includes("COUNTERATTACK") || playerAction === "Counterattack") skillGain.timing = 5;
  if (result.title.includes("RETREAT") || result.title.includes("ATTACK DENIED") || sequence.includes("Retreat") || sequence.includes("Half Step In") || sequence.includes("Half Step Out")) skillGain.distanceControl = 5;
  if (["Parry-Riposte", "Feint", "Beat"].some((action) => sequence.includes(action))) skillGain.bladeWork = 4;
  if (result.title.includes("DOUBLE") || result.title.includes("DRAWN")) skillGain.mentalGame = 4;
  if (sequence.length >= 3) skillGain.tacticalIq = Math.max(skillGain.tacticalIq || 0, 6);
  const entries = Object.entries(skillGain);
  if (entries.length) grantXp(2, skillGain, "Match Exchange");
  return entries.length ? entries.map(([skill, value]) => `+${value} ${skillCatalog[skill].name}`).join(", ") : "+2 Tactical review";
}

function shouldEndBout() {
  const m = state.match;
  if (m.mode === "training") return false;
  return m.player >= 5 || m.opponent >= 5;
}

function resolveSequenceExchange(sequence, playerAction, aiAction) {
  const result = resolveTacticalExchange(playerAction, aiAction);
  const risk = sequenceRisk(sequence);
  const hasPrep = sequence.some((action) => ["Feint", "Beat", "Bait", "Change Rhythm"].includes(action));
  const hasFootPrep = sequence.some((action) => ["Half Step In", "Half Step Out", "Advance", "Retreat"].includes(action));
  const hasFinish = sequence.some(isFinishAction);
  const label = sequence.join(" -> ");
  const lastAction = sequence.at(-1);
  const directCommit = sequence.length <= 2 && ["Advance", "Half Step In"].includes(sequence[0]) && ["Lunge", "Step-Lunge", "Fleche"].includes(sequence.at(-1));

  result.what = `Your sequence: ${label}. Opponent: ${opponentSequenceLabel(aiAction, sequence)}. ${result.what}`;

  if (!hasFinish && aiAction === "Attack" && ["Retreat", "Half Step Out", "Hold Distance"].includes(lastAction)) {
    result.playerTouch = false;
    result.opponentTouch = false;
    result.title = lastAction === "Hold Distance" ? "ATTACK DENIED" : "ATTACK FALLS SHORT";
    result.what = "The opponent committed to the attack, but your distance action prevented a clean touch.";
    result.why = lastAction === "Hold Distance"
      ? "You refused to chase and kept the opponent from entering with a reliable finish."
      : "You opened the distance as the attack started, so the point arrived short.";
    result.better = "Look for the counterattack or parry-riposte if the opponent repeats the same commitment.";
    result.advice = "Movement can finish an exchange defensively when the opponent has already committed.";
    result.training = "+5 Distance Control XP.";
    result.scores.tactical += 5;
    result.scores.distance += 8;
    result.scores.timing += 2;
  } else if (sequence.includes("Bait") && sequence.includes("Retreat") && sequence.includes("Counterattack")) {
    if (aiAction === "Attack") {
      result.playerTouch = true;
      result.opponentTouch = false;
      result.title = "BAITED COUNTERATTACK SCORES";
      result.what = "You invited the opponent forward, made the attack fall short, and scored with a counterattack.";
      result.why = "The sequence created the opponent's attack, controlled distance, then hit after overcommitment.";
      result.better = "Keep varying the bait so the opponent cannot refuse it next time.";
      result.advice = "This is a classic beginner-friendly epee trap: invitation, distance, then timing.";
      result.training = "+5 Distance Control XP, +5 Tactical IQ XP.";
      result.scores.tactical += 10;
      result.scores.distance += 9;
      result.scores.timing += 8;
    } else {
      result.title = "BAIT REFUSED";
      result.what = "You invited the attack, but the opponent did not take the bait.";
      result.why = "The AI recognized the preparation and chose not to overcommit.";
      result.better = "Use a half step forward or change rhythm before baiting again.";
      result.advice = "Good opponents sometimes refuse the first invitation. Use that information.";
      result.scores.tactical += 3;
      result.scores.distance += 2;
    }
  } else if (sequence.includes("Half Step In") && sequence.includes("Feint") && ["Lunge", "Step-Lunge"].includes(sequence.at(-1))) {
    if (["Counterattack", "Retreat", "Hold Distance"].includes(aiAction)) {
      result.playerTouch = true;
      result.opponentTouch = false;
      result.title = "PREPARED ATTACK SCORES";
      result.what = "You used preparation to draw a reaction and attacked at the right distance.";
      result.why = "The half step made the distance real, the feint asked a question, and the finish arrived on the response.";
      result.better = "This is a strong pattern. Next time, vary the finish so it does not become automatic.";
      result.advice = "Preparation turns an attack from a guess into a tactical phrase.";
      result.training = "+5 Tactical IQ XP, +5 Timing XP.";
      result.scores.tactical += 9;
      result.scores.distance += 6;
      result.scores.timing += 7;
    } else {
      result.title = "FEINT IGNORED";
      result.what = "The opponent did not react to your feint, so the finish became easier to read.";
      result.why = "A feint needs distance and credibility, but it also needs the opponent to care.";
      result.better = "Use beat, change rhythm, or hold distance when the opponent refuses feints.";
      result.advice = "If the opponent ignores a feint, do not keep selling the same picture.";
      result.scores.tactical -= 1;
    }
  } else if (directCommit && ["Retreat", "Counterattack"].includes(aiAction)) {
    result.playerTouch = false;
    result.opponentTouch = true;
    result.title = "COMMITTED TOO EARLY";
    result.what = "You attacked without enough preparation, and the opponent punished the recovery.";
    result.why = "Advance into a big finish gave the AI a clear retreat-counterattack cue.";
    result.better = "Add feint, beat attack, or change rhythm before spending a committed attack.";
    result.advice = "A big finish should be the answer to a reaction, not the whole plan.";
    result.training = "+5 Tactical IQ XP for recognizing premature commitment.";
    result.scores.tactical -= 6;
    result.scores.distance -= 4;
    result.scores.timing -= 5;
  } else if (sequence.includes("Change Rhythm") && hasFinish) {
    result.scores.tactical += 5;
    result.scores.timing += 6;
    result.why += " Changing rhythm made your timing harder to read.";
    result.advice += " Rhythm changes are strongest when followed by a clear finish or a refusal.";
  } else if (hasPrep && hasFootPrep && hasFinish) {
    result.scores.tactical += 4;
    result.scores.distance += 3;
    result.why += " The sequence included footwork, preparation, and a finish instead of a single isolated action.";
  }

  if (risk >= 8) {
    result.scores.tactical -= 4;
    result.scores.timing -= 5;
    if (!result.playerTouch || aiAction === "Counterattack") {
      result.opponentTouch = true;
      result.playerTouch = false;
      result.title = "OVERCOMMITTED";
      result.what = "You became too committed after stacking too many big actions.";
      result.why = "High commitment made recovery slow and gave the opponent a counterattack window.";
      result.better = "Use one committed finish after preparation, then recover or reset.";
    }
    result.advice += " Watch the commitment meter; too many big actions reduce timing quality.";
  }

  if (!hasFinish && risk <= 3) {
    result.scores.distance += 2;
    result.scores.tactical += 2;
    result.what = "You used a low-risk preparation sequence and gathered information without forcing the touch.";
    result.why = "Not every phrase needs to finish. Safe preparation can reveal what the opponent wants.";
    result.better = "Add a finish only when the opponent gives you a cue.";
  }

  return result;
}

function resolveTacticalExchange(playerAction, aiAction) {
  const d = state.match.distance;
  const timingLevel = skillLevel("timing");
  const bladeLevel = skillLevel("bladeWork");
  const repeated = state.match.previous.length >= 2 && state.match.previous.at(-1) === state.match.previous.at(-2) && state.match.previous.at(-1) === playerAction;
  const badDistance = (["Lunge", "Fleche"].includes(playerAction) && d >= 5) || (playerAction === "Counterattack" && d >= 5) || (playerAction === "Advance" && d <= 1);
  const scores = { tactical: 0, distance: 0, timing: 0 };
  let playerTouch = false;
  let opponentTouch = false;
  let title = "TACTICAL RESET";
  let what = "Both fencers tested the distance and no touch was scored.";
  let why = "Neither fencer fully committed at a useful moment.";
  let better = "Keep reading the pattern and prepare the next action.";
  let advice = "Use the first phase of the exchange to gather information without giving away distance.";
  let training = "+5 Tactical IQ XP for reviewing the phrase.";

  if (badDistance) {
    opponentTouch = ["Counterattack", "Attack"].includes(aiAction);
    scores.tactical -= 5;
    scores.distance -= 5;
    title = opponentTouch ? "OPPONENT TOUCH" : "ATTACK FALLS SHORT";
    what = `Your ${playerAction.toLowerCase()} failed because the distance did not support it.`;
    why = d >= 5 ? "You attacked from too far away, giving the opponent time to react." : "You moved while already too close, making your action cramped.";
    better = d >= 5 ? "Advance or hold distance first, then attack when measure is real." : "Retreat to rebuild measure or use blade control.";
    advice = "Before launching, ask whether your point can actually arrive before the opponent's answer.";
    training = "+5 Distance Control XP for recognizing a distance error.";
  } else if (["Lunge", "Fleche"].includes(playerAction) && aiAction === "Counterattack") {
    opponentTouch = true;
    scores.tactical -= 4;
    scores.distance -= d <= 3 ? 1 : 4;
    scores.timing -= 4;
    title = "OPPONENT COUNTERATTACK";
    what = `Your ${playerAction.toLowerCase()} ran into the opponent's counterattack.`;
    why = "The AI was waiting for commitment and hit into your attack.";
    better = "Feint first, draw the counterattack, then parry-riposte or finish with opposition.";
    advice = "Against counterattackers, make them reveal the counter before you spend your full attack.";
    training = "+5 Tactical IQ XP for identifying a counterattack trap.";
  } else if (playerAction === "Retreat" && aiAction === "Attack") {
    playerTouch = d <= 3;
    scores.tactical += 8;
    scores.distance += 7;
    scores.timing += playerTouch ? 6 : 2;
    title = playerTouch ? "SUCCESSFUL RETREAT COUNTER" : "ATTACK MADE SHORT";
    what = playerTouch ? "You retreated, made the attack fall short, and created a counterattack opportunity." : "You retreated and forced the opponent to attack short.";
    why = "The opponent committed while your feet were creating space.";
    better = playerTouch ? "This was the right idea." : "Add a fast counterattack as their point falls short.";
    advice = "Retreat is not passive when it creates the timing for your answer.";
    training = "+5 Distance Control XP, +5 Tactical IQ XP.";
  } else if (playerAction === "Counterattack" && aiAction === "Attack") {
    if (d <= 3) {
      playerTouch = true;
      opponentTouch = d <= 2 && Math.random() < Math.max(0.18, 0.48 - timingLevel * 0.03);
      scores.tactical += 9;
      scores.distance += 4;
      scores.timing += 8;
      title = opponentTouch ? "DOUBLE TOUCH" : "CLEAN COUNTERATTACK";
      what = opponentTouch ? "Both fencers hit during the attack." : "You hit into the opponent's attack before they finished cleanly.";
      why = "You read the forward commitment and acted in the tempo.";
      better = opponentTouch ? "Use slightly more distance or opposition to avoid the double." : "This was a strong epee answer.";
      advice = "Counterattacks are strongest when your distance makes their finish late.";
      training = "+5 Timing XP for counterattacking in tempo.";
    } else {
      scores.distance -= 3;
      title = "COUNTERATTACK TOO FAR";
      what = "Your counterattack did not arrive because the opponent was still outside reach.";
      why = "The timing idea was right, but the distance was not.";
      better = "Let them step deeper or use retreat to make them miss first.";
      advice = "A good read still needs measure.";
      training = "+5 Distance Control XP for connecting timing to measure.";
    }
  } else if (playerAction === "Parry-Riposte" && ["Attack", "Feint"].includes(aiAction)) {
    if (aiAction === "Feint") {
      opponentTouch = Math.random() < Math.max(0.18, 0.58 - bladeLevel * 0.035);
      scores.tactical -= opponentTouch ? 3 : 0;
      scores.timing -= opponentTouch ? 3 : 1;
      title = opponentTouch ? "DRAWN BY FEINT" : "PARRY HOLDS";
      what = opponentTouch ? "You reacted to the feint and the opponent finished around your blade." : "You stayed compact enough that the feint did not fully open you.";
      why = "Feints punish early or oversized parries.";
      better = "Use smaller blade movement and wait for the real extension.";
      advice = "Do not parry the idea of an attack; parry the attack that can actually hit.";
      training = "+5 Blade Work XP for recognizing a feint.";
    } else {
      playerTouch = true;
      scores.tactical += 8;
      scores.distance += 3;
      scores.timing += 7;
      title = "PARRY-RIPOSTE SCORES";
      what = "You controlled the attack and answered with riposte.";
      why = "The opponent committed into a blade action you were ready for.";
      better = "This was the right defensive choice.";
      advice = "Keep the riposte immediate so the attacker cannot recover.";
      training = "+5 Blade Work XP, +5 Timing XP.";
    }
  } else if (playerAction === "Feint" && ["Counterattack", "Retreat", "Hold Distance"].includes(aiAction)) {
    playerTouch = aiAction === "Counterattack" || (aiAction === "Retreat" && d <= 3);
    scores.tactical += 8;
    scores.distance += playerTouch ? 4 : 2;
    scores.timing += playerTouch ? 6 : 3;
    title = playerTouch ? "FEINT CREATES TOUCH" : "REACTION DRAWN";
    what = playerTouch ? "Your feint pulled a reaction and opened the next tempo." : "Your feint made the opponent show their plan without giving up a touch.";
    why = "You did not attack the first picture; you made the opponent choose first.";
    better = playerTouch ? "This was a strong tactical sequence." : "Follow the drawn reaction with a committed finish next time.";
    advice = "Feints work best when they are believable from real distance.";
    training = "+5 Tactical IQ XP, +5 Blade Work XP.";
  } else if (playerAction === "Hold Distance" && ["Attack", "Fleche"].includes(aiAction)) {
    scores.tactical += 6;
    scores.distance += 6;
    scores.timing += 2;
    title = "ATTACK DENIED";
    what = "You held the measure and the opponent could not safely enter.";
    why = "Your distance made their attack easier to see and harder to finish.";
    better = "Look for the counterattack or parry-riposte when they overcommit.";
    advice = "Holding distance is an active choice when it controls the opponent's options.";
    training = "+5 Distance Control XP.";
  } else if (["Lunge", "Fleche"].includes(playerAction) && ["Retreat", "Hold Distance"].includes(aiAction)) {
    if (d <= 2 && playerAction === "Fleche") {
      playerTouch = true;
      scores.tactical += 7;
      scores.distance += 4;
      scores.timing += 6;
      title = "ATTACK BREAKS THROUGH";
      what = "Your explosive attack reached before the opponent could fully escape.";
      why = "The distance was close enough to justify commitment.";
      better = "This was a good risk if the score allowed it.";
      advice = "Committed attacks need score awareness because doubles remain possible.";
      training = "+5 Timing XP for choosing a committed attack.";
    } else {
      scores.distance -= 3;
      scores.timing -= 2;
      title = "ATTACK FALLS SHORT";
      what = `The opponent managed distance and your ${playerAction.toLowerCase()} did not land.`;
      why = "They were already leaving or holding long measure as you committed.";
      better = "Advance to prepare, or feint to freeze the retreat first.";
      advice = "Do not chase a defender's preferred distance.";
      training = "+5 Distance Control XP for reviewing attack measure.";
    }
  } else if (playerAction === "Advance" && aiAction === "Attack") {
    opponentTouch = d <= 3;
    scores.distance += d >= 4 ? 5 : -2;
    scores.tactical += opponentTouch ? -3 : 4;
    scores.timing += opponentTouch ? -4 : 2;
    title = opponentTouch ? "WALKED INTO ATTACK" : "PRESSURE BUILDS";
    what = opponentTouch ? "Your advance entered the opponent's attack timing." : "You claimed ground while still outside immediate danger.";
    why = opponentTouch ? "The opponent attacked as you crossed into their measure." : "The distance was long enough to pressure safely.";
    better = opponentTouch ? "Use a smaller advance, feint, or be ready to parry." : "Continue pressure without overcommitting.";
    advice = "Advance with a plan for what the opponent usually does next.";
    training = "+5 Tactical IQ XP for reading advance timing.";
  } else if (["Lunge", "Fleche"].includes(playerAction) && aiAction === "Attack") {
    playerTouch = true;
    opponentTouch = true;
    scores.tactical += 2;
    scores.distance += d <= 3 ? 2 : -2;
    scores.timing += 1;
    title = "DOUBLE TOUCH";
    what = "Both fencers attacked simultaneously and both lights would likely come on.";
    why = "Neither action controlled the other's point.";
    better = "Use blade control, distance, or a draw before committing.";
    advice = "In epee, double touches are tactical only when the score makes them useful.";
    training = "+5 Mental Game XP for reviewing double-touch risk.";
  } else {
    const playerImproves = ["Hold Distance", "Advance", "Feint"].includes(playerAction);
    scores.tactical += playerImproves ? 3 : 0;
    scores.distance += ["Advance", "Retreat", "Hold Distance"].includes(playerAction) ? 3 : 0;
    scores.timing += playerAction === "Feint" ? 2 : 0;
  }

  if (repeated) {
    scores.tactical -= 3;
    advice += " You repeated the same action enough that the AI could begin timing you.";
  }
  if (playerAction === "Counterattack" && state.match.previous.slice(-2).every((action) => action === "Counterattack") && aiAction === "Feint") {
    opponentTouch = true;
    playerTouch = false;
    scores.tactical -= 4;
    scores.timing -= 4;
    title = "COUNTERATTACK DRAWN OUT";
    what = "You looked for another counterattack, but the opponent changed rhythm with a feint.";
    why = "The AI adapted to your repeated counterattacks and stopped giving you the same attack timing.";
    better = "Hold distance, use a small retreat, or wait to confirm the real attack before countering.";
    advice = "A counterattack is a read, not a default reaction. If you use it repeatedly, good opponents will bait it.";
    training = "+5 Tactical IQ XP for recognizing AI adaptation.";
  }

  return { title, what, why, better, advice, training, playerTouch, opponentTouch, scores };
}

function adjustMatchDistance(action) {
  const m = state.match;
  if (action === "Advance") m.distance = Math.max(1, m.distance - 1);
  if (action === "Half Step") m.distance = Math.max(1, m.distance - 0.5);
  if (action === "Half Step In") m.distance = Math.max(1, m.distance - 0.5);
  if (action === "Half Step Out") m.distance = Math.min(5, m.distance + 0.5);
  if (action === "Half Step Forward") m.distance = Math.max(1, m.distance - 0.5);
  if (action === "Retreat") m.distance = Math.min(5, m.distance + 1);
  if (action === "Half Step Back") m.distance = Math.min(5, m.distance + 0.5);
  if (action === "Lunge") m.distance = Math.max(1, m.distance - 1);
  if (action === "Step-Lunge" || action === "Direct Attack") m.distance = Math.max(1, m.distance - 1.5);
  if (action === "Fleche") m.distance = Math.max(1, m.distance - 2);
  if (action === "Hold Distance") m.distance = Math.min(5, Math.max(2, m.distance));
  if (action === "Bait" || action === "Invite Attack") m.distance = Math.max(1, m.distance - 0.5);
  if (action === "Duck / Evasive Action") m.distance = Math.min(5, m.distance + 0.5);
}

function reverseMatchDistance(action) {
  const m = state.match;
  if (action === "Advance") m.distance = Math.min(5, m.distance + 1);
  if (action === "Half Step" || action === "Half Step In" || action === "Half Step Forward") m.distance = Math.min(5, m.distance + 0.5);
  if (action === "Retreat") m.distance = Math.max(1, m.distance - 1);
  if (action === "Half Step Out" || action === "Half Step Back") m.distance = Math.max(1, m.distance - 0.5);
  if (action === "Bait" || action === "Invite Attack") m.distance = Math.min(5, m.distance + 0.5);
  if (action === "Duck / Evasive Action") m.distance = Math.max(1, m.distance - 0.5);
}

function adjustDistanceForAi(aiAction) {
  const m = state.match;
  if (aiAction === "Attack") m.distance = Math.max(1, m.distance - 1);
  if (aiAction === "Retreat") m.distance = Math.min(5, m.distance + 1);
  if (aiAction === "Hold Distance") m.distance = Math.min(5, Math.max(2, m.distance));
}

function lockMatchButtons(sequence) {
  els.matchActions.querySelectorAll(".action-btn").forEach((btn) => {
    btn.disabled = true;
    if (sequence.includes(btn.dataset.action)) btn.classList.add("selected");
  });
}

function animateExchange(playerAction, aiAction, playerTouch, opponentTouch) {
  els.youFencer.classList.toggle("attack-you", ["Lunge", "Fleche", "Counterattack", "Parry-Riposte"].includes(playerAction));
  els.themFencer.classList.toggle("attack-them", ["Attack", "Counterattack"].includes(aiAction));
  els.youFencer.classList.toggle("retreat-you", playerAction === "Retreat");
  els.themFencer.classList.toggle("retreat-them", aiAction === "Retreat");
  els.youFencer.classList.toggle("flash", playerTouch || opponentTouch);
  els.themFencer.classList.toggle("flash", playerTouch || opponentTouch);
  els.touchFlash.classList.toggle("show", playerTouch || opponentTouch);
  setTimeout(() => {
    els.youFencer.classList.remove("flash", "attack-you", "retreat-you");
    els.themFencer.classList.remove("flash", "attack-them", "retreat-them");
    els.touchFlash.classList.remove("show");
  }, 650);
}

function animateScore(playerTouch, opponentTouch) {
  const targets = [];
  if (playerTouch) targets.push(els.playerScore);
  if (opponentTouch) targets.push(els.opponentScore);
  targets.forEach((target) => {
    target.classList.remove("score-bump");
    void target.offsetWidth;
    target.classList.add("score-bump");
  });
}

function nextExchange() {
  state.match.round += 1;
  newMatchSituation();
  els.matchFeedback.textContent = "Analyze the new situation and choose an action.";
  setMatchView("fight");
}

function replayExchange() {
  if (state.match.over) return;
  if (!state.match.replaySnapshot) return;
  const currentLearningMode = els.learningMode.value;
  restoreSnapshot(state.match.replaySnapshot, currentLearningMode);
  els.matchActions.querySelectorAll(".action-btn").forEach((btn) => {
    btn.disabled = false;
    btn.classList.remove("correct", "wrong", "selected");
  });
  els.nextExchange.classList.remove("show");
  els.matchFeedback.textContent = "Exchange replayed. Try a different action against the same tactical picture.";
  renderMatch();
  setMatchView("fight");
}

function resetMatch() {
  state.match = { player: 0, opponent: 0, round: 1, tactical: 0, distanceScore: 0, timing: 0, distance: 3, locked: false, over: false, type: els.opponentType.value, mode: els.matchMode.value, aiDifficulty: selectedAiDifficulty(), learningMode: els.learningMode.value, tournamentStage: 1, situation: null, sequence: [], appliedSequenceLength: 0, setupDistanceStack: [], pendingAiAction: null, planHint: "", liveCue: "", previous: [], history: [], replaySnapshot: null, lastAiAction: null, lastAdjustment: "No adjustment yet." };
  document.querySelector(".opponent-analysis")?.removeAttribute("open");
  els.replayExchange.disabled = false;
  els.matchFeedback.textContent = "Choose an action to fence the first exchange.";
  newMatchSituation();
  setMatchView("fight");
}

function advanceTournament() {
  const ladder = ["aggressive", "defensive", "counterattacker", "unpredictable"];
  const difficulties = ["beginner", "intermediate", "advanced", "advanced"];
  const nextStage = Math.min(4, state.match.tournamentStage + 1);
  state.match = {
    player: 0,
    opponent: 0,
    round: 1,
    tactical: state.match.tactical,
    distanceScore: state.match.distanceScore,
    timing: state.match.timing,
    distance: 3,
    locked: false,
    over: false,
    type: ladder[nextStage - 1],
    mode: "tournament",
    aiDifficulty: difficulties[nextStage - 1],
    learningMode: els.learningMode.value,
    tournamentStage: nextStage,
    situation: null,
    sequence: [],
    appliedSequenceLength: 0,
    setupDistanceStack: [],
    pendingAiAction: null,
    planHint: "",
    liveCue: "",
    previous: [],
    history: [],
    replaySnapshot: null,
    lastAiAction: null,
    lastAdjustment: `Tournament stage ${nextStage}: opponent has changed strategy.`
  };
  els.opponentType.value = state.match.type;
  els.aiDifficulty.value = state.match.aiDifficulty;
  els.matchFeedback.textContent = `Tournament stage ${nextStage}. Observe the new opponent.`;
  newMatchSituation();
}

function finishMatch() {
  const m = state.match;
  if (m.over) return;
  m.over = true;
  const rating = Math.max(0, Math.min(100, Math.round(55 + (m.tactical + m.distanceScore + m.timing) / Math.max(1, m.round * 1.6))));
  const won = m.player > m.opponent;
  state.progress.matches += 1;
  state.progress.wins += won ? 1 : 0;
  state.progress.losses += won ? 0 : 1;
  state.progress.touchesScored += m.player;
  state.progress.touchesReceived += m.opponent;
  state.progress.ratingTotal += rating;
  state.progress.ratingCount += 1;
  state.progress.tacticalRating = rating;
  grantXp(25 + (won ? 50 : 0), {
    matchExperience: 10,
    tacticalIq: won ? 25 : 12,
    distanceControl: Math.max(3, Math.round(m.distanceScore / 3)),
    timing: Math.max(5, Math.round(m.timing / 2)),
    mentalGame: won ? 10 : 5
  }, "Match Simulator");
  if (m.mode === "tournament" && won && m.tournamentStage < 4) {
    els.matchFeedback.innerHTML = `<strong>TOURNAMENT BOUT WON</strong><br>Final score: ${m.player}-${m.opponent}<br>Tactical Rating: ${rating}%<br>Next opponent is preparing.`;
    els.analysisOutcome.textContent = "TOURNAMENT BOUT WON";
    els.analysisResult.textContent = `Final score: ${m.player}-${m.opponent}`;
    els.analysisTacticalPoints.textContent = m.tactical;
    els.analysisSkillXp.textContent = "+Match XP awarded";
    window.setTimeout(advanceTournament, 1100);
    return;
  }
  els.matchFeedback.innerHTML = `<strong>${m.mode === "tournament" ? "TOURNAMENT COMPLETE" : "MATCH COMPLETE"}</strong><br>Final score: ${m.player}-${m.opponent}<br>Tactical Rating: ${rating}%<br>Tactical: ${m.tactical} · Distance: ${m.distanceScore} · Timing: ${m.timing}<br>${won ? "You won the first-to-5 bout." : "Review the feedback and fence again."}`;
  els.analysisOutcome.textContent = m.mode === "tournament" ? "TOURNAMENT COMPLETE" : won ? "MATCH WON" : "MATCH LOST";
  els.analysisResult.textContent = `Final score: ${m.player}-${m.opponent}. Tactical Rating: ${rating}%`;
  els.analysisTacticalPoints.textContent = m.tactical;
  els.analysisSkillXp.textContent = won ? "+50 win XP, +match skill XP" : "+25 match XP, +review skill XP";
  els.nextExchange.classList.remove("show");
  els.replayExchange.disabled = true;
  els.matchActions.querySelectorAll(".action-btn").forEach((btn) => { btn.disabled = true; });
  setMatchView("analysis");
}

function handleDrillKey(event) {
  if (els.matchGame.classList.contains("hidden")) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
  let action = event.code === "Space" && event.shiftKey ? "Step-Lunge" : keyToAction[event.code];
  if (event.code === "KeyB" && event.shiftKey) action = "Beat";
  if (!action) return;
  event.preventDefault();
  queueAction(action);
}

function setControlMode(mode) {
  state.controlMode = mode;
  renderSequenceBuilder();
}

function bindEvents() {
  els.menuToggle.addEventListener("click", () => {
    const isOpen = els.mainNav.classList.toggle("open");
    els.menuToggle.setAttribute("aria-expanded", String(isOpen));
  });
  els.nav.forEach((item) => item.addEventListener("click", (event) => {
    event.preventDefault();
    showView(item.dataset.view);
  }));
  els.skillTree.addEventListener("click", (event) => {
    const card = event.target.closest(".skill-card");
    if (!card) return;
    card.classList.toggle("open");
  });
  els.profileForm.addEventListener("submit", (event) => {
    event.preventDefault();
    createProfile({
      name: els.profileNameInput.value.trim() || "Epee Fencer",
      weapon: els.profileWeaponInput.value,
      experience: els.profileExperienceInput.value,
      years: els.profileYearsInput.value,
      goal: els.profileGoalInput.value,
      style: els.profileStyleInput.value
    });
    els.profileSetup.classList.remove("show");
    showView("profile");
  });
  els.avatarSelect.addEventListener("change", () => {
    if (!state.progress.profile) return;
    state.progress.profile.avatar = els.avatarSelect.value;
    saveProgress();
  });
  els.flashCard.addEventListener("click", () => { state.flashFlipped = !state.flashFlipped; renderFlashcard(); });
  $("prevCard").addEventListener("click", () => moveCard(-1));
  $("nextCard").addEventListener("click", () => moveCard(1));
  $("shuffleCards").addEventListener("click", () => { flashcards.sort(() => Math.random() - 0.5); state.flashIndex = 0; state.flashFlipped = false; renderFlashcard(); });
  $("masterCard").addEventListener("click", () => {
    const id = flashcards[state.flashIndex].id;
    if (!state.progress.mastered.includes(id)) {
      state.progress.mastered.push(id);
      grantXp(10, { bladeWork: 10, mentalGame: 3 }, "Flashcards");
    }
    renderFlashcard();
  });
  els.quizDifficulty.addEventListener("change", () => { state.quizDifficulty = els.quizDifficulty.value; resetQuiz(); });
  $("restartQuiz").addEventListener("click", resetQuiz);
  els.nextQuestion.addEventListener("click", () => { state.quizIndex += 1; renderQuiz(); });
  els.scenarioDifficulty.addEventListener("change", () => { state.scenarioDifficulty = els.scenarioDifficulty.value; state.scenarioIndex = 0; renderScenario(); });
  $("replayScenario").addEventListener("click", renderScenario);
  els.nextScenario.addEventListener("click", () => { state.scenarioIndex += 1; renderScenario(); });
  ["Movement", "Preparation", "Finish"].forEach((group) => {
    const groupEl = document.createElement("section");
    groupEl.className = "action-group";
    const heading = group === "Finish" ? "Finish the Exchange" : group;
    const note = group === "Finish" ? `<p class="finish-note">Choosing one of these actions will resolve the exchange.</p>` : "";
    groupEl.innerHTML = `<h4>${heading}</h4>${note}<div class="action-group-grid"></div>`;
    const grid = groupEl.querySelector(".action-group-grid");
    drillActions.filter((action) => action.group === group).forEach((action) => {
      const btn = document.createElement("button");
      btn.className = "action-btn";
      btn.type = "button";
      btn.dataset.action = action.name;
      btn.innerHTML = `<span>${action.name}</span><small>${action.key}</small>`;
      btn.addEventListener("click", () => scoreMatchAction(action.name));
      grid.appendChild(btn);
    });
    els.matchActions.appendChild(groupEl);
  });
  els.learningMode.addEventListener("change", () => {
    state.match.learningMode = els.learningMode.value;
    if (state.match.situation) {
      state.match.situation.prompt = buildSituationPrompt(state.match.distance, state.match.situation.behaviour, state.match.situation.pattern);
    }
    if (!els.matchGame.classList.contains("hidden")) renderMatch();
  });
  els.simpleControls.addEventListener("click", () => setControlMode("simple"));
  els.advancedControls.addEventListener("click", () => setControlMode("advanced"));
  els.trySuggestion.addEventListener("click", trySuggestedSequence);
  els.undoSequence.addEventListener("click", undoSequence);
  els.clearSequence.addEventListener("click", clearSequence);
  document.addEventListener("keydown", handleDrillKey);
  els.startMatch.addEventListener("click", resetMatch);
  els.nextExchange.addEventListener("click", nextExchange);
  $("replayExchange").addEventListener("click", replayExchange);
  $("resetMatch").addEventListener("click", returnToMatchSetup);
  els.analysisResetMatch.addEventListener("click", returnToMatchSetup);
  $("resetAll").addEventListener("click", () => {
    state.progress = normalizeProgress({ ...defaultProgress, mastered: [] });
    saveProgress();
    renderFlashcard();
    showProfileSetupIfNeeded();
  });
}

renderGuide();
bindEvents();
renderProgress();
renderFlashcard();
renderQuiz();
renderScenario();
showMatchSetup();
showProfileSetupIfNeeded();
