import { flashcards, guideSections, quizQuestions, scenarioPacks, scenarios } from "./epeeContent.js";

export const learningSkills = [
  "distanceControl",
  "timing",
  "bladeWork",
  "tacticalIq",
  "matchExperience",
  "mentalGame",
  "scoreManagement",
  "opponentReading"
];

export const difficultyOrder = ["Beginner", "Intermediate", "Advanced"];

export const aiTrainingOptions = [
  {
    id: "ai-training-match",
    type: "match",
    title: "AI Training Match",
    skills: ["matchExperience", "timing", "tacticalIq"],
    difficulty: "Beginner",
    mistakeTypes: ["poorDistanceRecovery", "repeatingFinish"],
    prerequisites: [],
    estimatedMinutes: 6,
    target: "ai-match"
  },
  {
    id: "ai-adaptive-match",
    type: "match",
    title: "Adaptive AI Match",
    skills: ["matchExperience", "opponentReading", "mentalGame"],
    difficulty: "Intermediate",
    mistakeTypes: ["failingToChangeRhythm", "repeatingFinish"],
    prerequisites: [],
    estimatedMinutes: 7,
    target: "adaptive-match"
  }
];

export const guideMetadata = guideSections.map((section, index) => ({
  id: `guide-${slug(section.title)}`,
  sourceIndex: index,
  type: "guide",
  title: section.title,
  skills: skillsFromText(`${section.title} ${section.diagram} ${section.points.join(" ")}`),
  difficulty: guideDifficulty(section.title),
  mistakeTypes: mistakesFromText(`${section.title} ${section.points.join(" ")}`),
  prerequisites: [],
  estimatedMinutes: 2,
  target: "guide"
}));

export const flashcardMetadata = flashcards.map((card) => ({
  id: `flashcard-${card.id}`,
  sourceId: card.id,
  type: "flashcard",
  title: card.term,
  skills: skillsFromText(`${card.category} ${card.term} ${card.definition} ${card.example}`),
  difficulty: flashcardDifficulty(card.category, card.term),
  mistakeTypes: mistakesFromText(`${card.category} ${card.term} ${card.definition} ${card.example}`),
  prerequisites: [],
  estimatedMinutes: 1,
  target: "flashcards"
}));

export const quizMetadata = quizQuestions.map((question, index) => ({
  id: `quiz-${question.difficulty.toLowerCase()}-${index + 1}`,
  sourceIndex: index,
  type: "quiz",
  title: question.question,
  skills: skillsFromText(`${question.question} ${question.explanation}`),
  difficulty: question.difficulty,
  mistakeTypes: mistakesFromText(`${question.question} ${question.explanation}`),
  prerequisites: [],
  estimatedMinutes: 2,
  target: "quiz"
}));

export const scenarioMetadata = scenarios.map((scenario) => ({
  id: `scenario-${scenario.id}`,
  sourceId: scenario.id,
  type: "scenario",
  title: scenario.title || scenario.label || `Scenario ${scenario.id}`,
  displayTitle: neutralScenarioTitle(scenario),
  skills: skillsFromScenario(scenario),
  difficulty: scenario.difficulty,
  mistakeTypes: mistakesFromScenario(scenario),
  prerequisites: [],
  estimatedMinutes: 2,
  target: "scenario",
  packId: scenario.packId || "all",
  packTitle: scenarioPacks.find((pack) => pack.id === scenario.packId)?.title || scenario.packTitle || "Scenario Pack"
}));

export const contentLibrary = [
  ...guideMetadata,
  ...flashcardMetadata,
  ...quizMetadata,
  ...scenarioMetadata,
  ...aiTrainingOptions
];

export const contentById = Object.fromEntries(contentLibrary.map((item) => [item.id, item]));

export function metadataForActivity(type, item) {
  if (!item) return null;
  if (type === "scenario") return contentById[`scenario-${item.id}`] || null;
  if (type === "flashcard") return contentById[`flashcard-${item.id}`] || null;
  if (type === "quiz") {
    const index = quizQuestions.indexOf(item);
    return index >= 0 ? quizMetadata[index] : null;
  }
  if (type === "guide") {
    const index = guideSections.indexOf(item);
    return index >= 0 ? guideMetadata[index] : null;
  }
  return contentById[item.id] || null;
}

function skillsFromScenario(scenario) {
  const text = `${scenario.trainingFocus || ""} ${scenario.correctAction || ""} ${scenario.distance || ""} ${scenario.style || ""} ${scenario.situation || ""}`;
  return skillsFromText(text);
}

function skillsFromText(text = "") {
  const found = new Set();
  if (/distance|measure|retreat|advance|half step|fall short|long|close/i.test(text)) found.add("distanceControl");
  if (/timing|tempo|counter|stop hit|preparation|rhythm|fleche|lunge/i.test(text)) found.add("timing");
  if (/blade|parry|riposte|sixte|quarte|octave|beat|disengage|opposition|point-in-line/i.test(text)) found.add("bladeWork");
  if (/tactic|decision|second intention|feint|bait|read|pattern|opponent/i.test(text)) found.add("tacticalIq");
  if (/bout|match|score|double|4-4|lead|behind|pressure/i.test(text)) found.add("matchExperience");
  if (/mental|patience|adapt|pressure|discipline|trap|chaos/i.test(text)) found.add("mentalGame");
  if (/score|double|4-4|lead|behind|ahead/i.test(text)) found.add("scoreManagement");
  if (/read|pattern|opponent|habit|predictable|counterattacker|defensive|aggressive/i.test(text)) found.add("opponentReading");
  return found.size ? [...found] : ["tacticalIq"];
}

function mistakesFromScenario(scenario) {
  const text = `${scenario.title || ""} ${scenario.situation || ""} ${scenario.explanation || ""} ${scenario.trainingFocus || ""} ${scenario.correctAction || ""}`;
  return mistakesFromText(text);
}

function neutralScenarioTitle(scenario) {
  const focus = scenario.trainingFocus || "";
  const text = `${focus} ${scenario.distance || ""} ${scenario.style || ""} ${scenario.situation || ""}`;
  if (/score|double|4-4|ahead|behind|lead/i.test(text)) return `${scenario.difficulty} Score-Management Decision`;
  if (/pattern|habit|predictable|always|whenever|after every|opponent/i.test(text)) return "Opponent-Reading Challenge";
  if (/counter|tempo|timing|preparation|recovery|rhythm|slow|fast/i.test(text)) return `${scenario.difficulty} Timing Scenario`;
  if (/distance|measure|long|close|retreat|advance|far|short/i.test(text)) return "Tactical Decision: Distance Control";
  if (/parry|blade|beat|disengage|sixte|quarte|riposte/i.test(text)) return "Blade-Work Decision";
  if (/pressure|aggressive|rush|attack/i.test(text)) return "Tactical Decision: Responding to Pressure";
  if (/defensive|wait|trap/i.test(text)) return "Choose Your Tactical Response";
  return `${scenario.difficulty} Tactical Decision`;
}

function mistakesFromText(text = "") {
  const mistakes = new Set();
  if (/too far|long distance|fall short|measure/i.test(text)) mistakes.add("attackingTooFar");
  if (/counterattack|stop hit|tempo|timing|late/i.test(text)) mistakes.add("counterattackingTooLate");
  if (/double|lead|ahead|4-4|score/i.test(text)) mistakes.add("creatingDoublesWhileLeading");
  if (/predictable|repeat|same|habit/i.test(text)) mistakes.add("repeatingSameFinish");
  if (/preparation|prepare|feint|bait|rhythm/i.test(text)) mistakes.add("attackingWithoutPreparation");
  if (/parry early|empty preparation|before.*commit/i.test(text)) mistakes.add("parryingBeforeCommitment");
  if (/recover|reset|close distance|retreat/i.test(text)) mistakes.add("poorDistanceRecovery");
  if (/change rhythm|adapt|old answer/i.test(text)) mistakes.add("failingToChangeRhythm");
  return [...mistakes];
}

function guideDifficulty(title = "") {
  if (/Score|Reading|Phrase|Mistake|Feint/i.test(title)) return "Intermediate";
  if (/4-4|Pressure|Second/i.test(title)) return "Advanced";
  return "Beginner";
}

function flashcardDifficulty(category = "", term = "") {
  if (/Second|Point-in-line|Opposition|Remise|Invitation/i.test(term)) return "Advanced";
  if (/Disengage|Beat|Counterattack|Fleche|Tempo|Measure/i.test(term)) return "Intermediate";
  if (/Rules|Match/i.test(category)) return "Beginner";
  return "Beginner";
}

function slug(value = "") {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
