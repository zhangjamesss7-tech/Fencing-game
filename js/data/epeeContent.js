export const guideSections = [
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

export const flashcards = [
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

export const quizQuestions = [
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

export const scenarioRows = [
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

export const scenarios = scenarioRows.map(([difficulty, distance, style, situation, label, correctAction, explanation], id) => ({
  id: id + 1, difficulty, distance, style, situation, label, correctAction, explanation
}));

