import { guideSections, flashcards, quizQuestions, scenarios } from "./data/epeeContent.js";
import { actions, drillActions, actionAliases, keyToAction, distanceNames, opponentTypes, avatarIcons } from "./data/gameConfig.js";
import { skillCatalog } from "./data/skillData.js";
import { $, els } from "./ui/dom.js";
import { renderLearningPanels as renderLearningPanelsUi, renderMatch as renderMatchUi, renderSequenceBuilder as renderSequenceBuilderUi, setMatchView, showMatchSetup } from "./ui/renderMatch.js";
import { renderFlashcard as renderFlashcardUi, renderGuide as renderGuideUi, renderQuiz as renderQuizUi, renderScenario as renderScenarioUi } from "./ui/renderTraining.js";
import { renderProfile as renderProfileUi, renderProgress as renderProgressUi, renderSkillTree as renderSkillTreeUi, showProfileSetupIfNeeded as showProfileSetupIfNeededUi } from "./ui/renderProfile.js";
import * as progressManager from "./core/progressManager.js";
import { actionMeta, adjustDistanceForAi as adjustDistanceForAiCore, adjustMatchDistance as adjustMatchDistanceCore, reverseMatchDistance as reverseMatchDistanceCore, finalActionFromSequence, isActionUnlocked as isActionUnlockedAtLevel, isFinishAction, riskLabel, sequenceRisk } from "./core/gameEngine.js";
import { opponentSequenceLabel } from "./core/aiOpponent.js";

const defaultProgress = progressManager.defaultProgress;
const state = {
  progress: progressManager.loadProgress(),
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

const saveProgress = () => {
  state.progress = progressManager.saveProgress(state.progress);
  renderProgress();
};

const normalizeProgress = (progress) => progressManager.normalizeProgress(progress);
const level = () => progressManager.level(state.progress);
const accuracy = () => progressManager.accuracy(state.progress);
const xpInLevel = () => progressManager.xpInLevel(state.progress);
const winRate = () => progressManager.winRate(state.progress);
const averageRating = () => progressManager.averageRating(state.progress);
const skillLevel = (skill) => progressManager.skillLevel(state.progress, skill);
const skillProgress = (skill) => progressManager.skillProgress(state.progress, skill);

function skillDisplayPercent(skill) {
  return Math.min(100, Math.round(((skillLevel(skill) - 1) / 14) * 70 + skillProgress(skill) * 0.3));
}

function profileRenderContext() {
  return {
    els,
    state,
    avatarIcons,
    skillCatalog,
    profileAvatarName,
    xpInLevel,
    level,
    accuracy,
    winRate,
    averageRating,
    skillDisplayPercent,
    skillLevel,
    skillProgress,
    renderProfile,
    renderSkillTree
  };
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

const renderProgress = () => renderProgressUi(profileRenderContext());
const renderProfile = () => renderProfileUi(profileRenderContext());
const renderSkillTree = () => renderSkillTreeUi(profileRenderContext());
const showProfileSetupIfNeeded = () => showProfileSetupIfNeededUi(profileRenderContext());

function showView(id) {
  els.views.forEach((view) => view.classList.toggle("active", view.id === id));
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === id));
  els.mainNav.classList.remove("open");
  els.menuToggle.setAttribute("aria-expanded", "false");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function trainingRenderContext() {
  return {
    els,
    state,
    guideSections,
    flashcards,
    quizQuestions,
    scenarios,
    actions,
    currentQuizPool,
    scenarioPool,
    grantXp,
    saveProgress
  };
}

const renderGuide = () => renderGuideUi(trainingRenderContext());

const renderFlashcard = () => renderFlashcardUi(trainingRenderContext());

function moveCard(step) {
  state.flashFlipped = false;
  state.flashIndex = (state.flashIndex + step + flashcards.length) % flashcards.length;
  renderFlashcard();
}

function currentQuizPool() {
  return quizQuestions.filter((q) => q.difficulty === state.quizDifficulty);
}

const renderQuiz = () => renderQuizUi(trainingRenderContext());

function scenarioPool() {
  return scenarios.filter((s) => s.difficulty === state.scenarioDifficulty);
}

const renderScenario = () => renderScenarioUi(trainingRenderContext());

function resetQuiz() {
  state.quizIndex = 0;
  state.quizScore = 0;
  renderQuiz();
}

function matchRenderContext() {
  return {
    els,
    state,
    distanceNames,
    analyzeOpponent,
    buildMemoryList,
    renderSequenceBuilder,
    renderLearningPanels,
    shortPlanHint,
    sequenceRisk,
    riskLabel,
    recommendedSequence,
    isFinishAction,
    actionMeta,
    isActionUnlocked,
    actionCue,
    buildObservations,
    detectPattern
  };
}

const renderMatch = () => renderMatchUi(matchRenderContext());

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

const isActionUnlocked = (action) => isActionUnlockedAtLevel(action, drillUnlockLevel());

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

const renderSequenceBuilder = () => renderSequenceBuilderUi(matchRenderContext());

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

const renderLearningPanels = () => renderLearningPanelsUi(matchRenderContext());

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

const adjustMatchDistance = (action) => adjustMatchDistanceCore(state.match, action);
const reverseMatchDistance = (action) => reverseMatchDistanceCore(state.match, action);
const adjustDistanceForAi = (aiAction) => adjustDistanceForAiCore(state.match, aiAction);

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
