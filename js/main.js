import { guideSections, flashcards, quizQuestions, scenarioPacks, scenarios } from "./data/epeeContent.js";
import { contentById, metadataForActivity } from "./data/contentMetadata.js";
import { actions, drillActions, actionAliases, keyToAction, distanceNames, opponentTypes, avatarIcons, avatarOptions } from "./data/gameConfig.js";
import { skillCatalog } from "./data/skillData.js";
import { trainingPaths } from "./data/trainingPaths.js";
import { $, els } from "./ui/dom.js";
import { renderLearningPanels as renderLearningPanelsUi, renderMatch as renderMatchUi, renderSequenceBuilder as renderSequenceBuilderUi, setMatchView, showMatchSetup } from "./ui/renderMatch.js";
import { renderFlashcard as renderFlashcardUi, renderGuide as renderGuideUi, renderQuiz as renderQuizUi, renderScenario as renderScenarioUi } from "./ui/renderTraining.js";
import { renderProfile as renderProfileUi, renderProgress as renderProgressUi, renderSkillTree as renderSkillTreeUi, showProfileSetupIfNeeded as showProfileSetupIfNeededUi } from "./ui/renderProfile.js";
import { renderTrainingPath as renderTrainingPathUi } from "./ui/renderTrainingPath.js";
import { renderMatchReview, renderRecentReviews } from "./ui/renderMatchReview.js";
import { renderPersonalizedTraining as renderPersonalizedTrainingUi } from "./ui/renderPersonalizedTraining.js";
import * as progressManager from "./core/progressManager.js";
import { evaluateTrainingPaths, isStepComplete, nextStep as nextTrainingStep, pathForExperience, pathProgress, setActivePath, setStepComplete } from "./core/trainingPathManager.js";
import { applyMatchReviewToLearningProfile, recordActivityAttempt } from "./core/learningProfileManager.js";
import { buildAiMatchReview, buildDuelReview, reviewSkillAward, saveReview } from "./core/matchReviewManager.js";
import { clearCompletedSession, completeCurrentSessionStep, exitSession, hasClaimedDailySessionReward, isDailySessionCompleteToday, isExtraPracticeCompleteToday, markDailySessionRewardClaimed, resumeOrStartSession, startPersonalizedSession } from "./core/personalizedSessionManager.js";
import { actionCommitment, actionMeta, adjustDistanceForAi as adjustDistanceForAiCore, adjustMatchDistance as adjustMatchDistanceCore, evaluatePlanQuality, finalActionFromSequence, isActionUnlocked as isActionUnlockedAtLevel, isFinishAction, opponentState, reverseMatchDistance as reverseMatchDistanceCore, riskLabel, sequenceCommitment, sequenceRisk } from "./core/gameEngine.js";
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
  scenarioPack: "all",
  scenarioIndex: 0,
  sessionActivity: null,
  controlMode: "simple",
  match: { player: 0, opponent: 0, round: 1, tactical: 0, distanceScore: 0, timing: 0, distance: 3, locked: false, over: false, type: "aggressive", mode: "training", aiDifficulty: "beginner", learningMode: "beginner", tournamentStage: 1, situation: null, sequence: [], appliedSequenceLength: 0, setupDistanceStack: [], pendingAiAction: null, planHint: "", liveCue: "", previous: [], history: [], replaySnapshot: null, lastAiAction: null, lastAdjustment: "No adjustment yet." },
  duel: null
};

let duelTimer = null;
let pendingAvatarId = null;

const saveProgress = () => {
  state.progress = progressManager.saveProgress(state.progress);
  renderProgress();
  renderTrainingPath();
  renderRecentMatchReviews();
  renderPersonalizedTraining();
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
    avatarOptions,
    skillCatalog,
    profileAvatarId,
    avatarById,
    isAvatarUnlocked,
    pendingAvatarId,
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
    avatarId: data.avatarId || "classic-epee",
    profileId: progressManager.createProfileData({ ...data }).profileId,
    createdAt: new Date().toISOString()
  };
  if (!Object.keys(state.progress.trainingPath?.completedSteps || {}).length) {
    setActivePath(state.progress, pathForExperience(data.experience));
  }
  saveProgress();
}

function profileAvatarId() {
  return state.progress.profile?.avatarId || "classic-epee";
}

function avatarById(id) {
  return avatarOptions.find((avatar) => avatar.id === id) || avatarOptions[0];
}

function isAvatarUnlocked(avatar) {
  if (!avatar || avatar.unlock.type === "always") return true;
  if (avatar.unlock.type === "level") return level() >= avatar.unlock.level;
  if (avatar.unlock.type === "path") return state.progress.trainingPath.completedPaths.includes(avatar.unlock.pathId);
  return false;
}

function setProfileAvatar(avatarId) {
  if (!state.progress.profile) return false;
  const avatar = avatarById(avatarId);
  if (!isAvatarUnlocked(avatar)) return false;
  state.progress.profile.avatarId = avatar.id;
  state.progress.profile.avatar = avatar.name;
  saveProgress();
  return true;
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

function awardReviewXp(review) {
  if (!review || state.progress.matchReviewXpClaimed.includes(review.id)) return;
  state.progress.matchReviewXpClaimed.push(review.id);
  grantXp(8, reviewSkillAward(review), "Coach Match Review");
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

function trainingPathRenderContext() {
  return {
    els,
    state,
    trainingPaths,
    pathProgress,
    nextStep: nextTrainingStep,
    isStepComplete
  };
}

const renderProgress = () => renderProgressUi(profileRenderContext());
const renderProfile = () => renderProfileUi(profileRenderContext());
const renderSkillTree = () => renderSkillTreeUi(profileRenderContext());
const renderTrainingPath = () => renderTrainingPathUi(trainingPathRenderContext());
const renderRecentMatchReviews = () => renderRecentReviews({ els, state });
const renderPersonalizedTraining = () => renderPersonalizedTrainingUi({ els, state });
const showProfileSetupIfNeeded = () => showProfileSetupIfNeededUi(profileRenderContext());

function trackLearningActivity(type, item, result = {}) {
  const metadata = metadataForActivity(type, item);
  if (!metadata) return;
  recordActivityAttempt(state.progress, metadata, result);
  const shouldComplete = result.completeSession === true || result.mastered;
  if (shouldComplete) completeSessionStep({ type, contentId: metadata.id });
}

function currentSessionStep() {
  const session = state.progress.learningProfile?.activeSession;
  if (!session || session.completed) return null;
  return session.steps[session.currentStep] || null;
}

function activeSessionActivityStep(type, item) {
  const step = currentSessionStep();
  const metadata = metadataForActivity(type, item);
  if (!step || !metadata || step.completed) return null;
  if (state.sessionActivity?.stepId !== step.id) return null;
  if (state.sessionActivity?.type !== type || state.sessionActivity?.contentId !== metadata.id) return null;
  return step;
}

function attemptKey(metadata, choiceText, result) {
  return `${metadata.id}:${result}:${choiceText}`;
}

function ensureStepAttemptState(step) {
  if (!Array.isArray(step.attemptKeys)) step.attemptKeys = [];
  return step.attemptKeys;
}

function recordPersonalizedAnswer(type, item, answerData) {
  const step = activeSessionActivityStep(type, item);
  const metadata = metadataForActivity(type, item);
  if (!step || !metadata) return false;
  const key = attemptKey(metadata, answerData.selectedAnswer, answerData.correct ? "correct" : "wrong");
  const attemptKeys = ensureStepAttemptState(step);
  const alreadyRecorded = attemptKeys.includes(key);

  step.feedback = {
    type,
    contentId: metadata.id,
    correct: answerData.correct,
    selectedAnswer: answerData.selectedAnswer,
    bestAnswer: answerData.bestAnswer,
    explanation: answerData.explanation,
    trainingFocus: answerData.trainingFocus,
    recorded: true
  };

  if (!alreadyRecorded) {
    attemptKeys.push(key);
    if (answerData.correct) {
      if (!step.successRecorded) {
        step.successRecorded = true;
        if (type === "scenario") {
          state.progress.scenarioAnswered += 1;
          trackScenarioComplete?.(item);
          grantXp(15, {
            tacticalIq: 15,
            distanceControl: 10,
            mentalGame: item.difficulty === "Advanced" ? 5 : 0
          }, "Tactical Scenario");
          state.progress.tacticalRating = Math.round((state.progress.tacticalRating * 4 + 100) / 5);
        }
        if (type === "quiz") {
          state.quizScore += 10;
          state.progress.quizAnswered += 1;
          state.progress.quizCorrect += 1;
          trackQuizComplete?.(item, (state.quizIndex % currentQuizPool().length) + 1, currentQuizPool().length);
          grantXp(10, { bladeWork: 10 }, "Knowledge Quiz");
        }
        recordActivityAttempt(state.progress, metadata, { correct: true, source: type === "scenario" ? "Tactical Scenario" : "Knowledge Quiz" });
      }
    } else {
      if (type === "scenario") state.progress.scenarioAnswered += 1;
      if (type === "quiz") state.progress.quizAnswered += 1;
      recordActivityAttempt(state.progress, metadata, { correct: false, source: type === "scenario" ? "Tactical Scenario" : "Knowledge Quiz" });
    }
  }

  saveProgress();
  if (type === "scenario") renderScenario();
  if (type === "quiz") renderQuiz();
  return true;
}

function continuePersonalizedActivity(stepId) {
  const step = currentSessionStep();
  if (!step || step.id !== stepId || !step.feedback?.correct || !step.successRecorded) return;
  delete step.feedback;
  state.sessionActivity = null;
  completeSessionStep({ type: step.type, contentId: step.contentId });
}

function retryPersonalizedActivity(stepId) {
  const step = currentSessionStep();
  if (!step || step.id !== stepId || step.feedback?.correct) return;
  delete step.feedback;
  saveProgress();
  if (step.type === "scenario") renderScenario();
  if (step.type === "quiz") renderQuiz();
}

function completeSessionStep(matcher) {
  const completed = completeCurrentSessionStep(state.progress, matcher);
  if (!completed) return;
  if (state.progress.learningProfile.activeSession?.completed) {
    awardPersonalizedSessionCompletion();
  }
  saveProgress();
  showView("myTraining");
}

function awardPersonalizedSessionCompletion() {
  const session = state.progress.learningProfile.activeSession;
  if (!session || session.completionRewardClaimed || session.mode === "extra" || hasClaimedDailySessionReward(state.progress)) return;
  session.completionRewardClaimed = true;
  markDailySessionRewardClaimed(state.progress);
  const focusSkill = session.focusSkill === "scoreManagement" || session.focusSkill === "opponentReading"
    ? "tacticalIq"
    : session.focusSkill;
  grantXp(10, { [focusSkill]: 5, mentalGame: 3 }, "My Training Session Complete");
}

function startMyTraining(preference = "auto", mode = "daily") {
  if (mode === "daily" && isDailySessionCompleteToday(state.progress)) {
    renderPersonalizedTraining();
    showView("myTraining");
    return;
  }
  if (mode === "extra" && isExtraPracticeCompleteToday(state.progress)) {
    renderPersonalizedTraining();
    showView("myTraining");
    return;
  }
  startPersonalizedSession(state.progress, preference, mode);
  saveProgress();
  showView("myTraining");
}

function resumeMyTraining() {
  resumeOrStartSession(state.progress);
  saveProgress();
  showView("myTraining");
}

function finishMyTraining() {
  clearCompletedSession(state.progress);
  saveProgress();
  showView("hub");
}

function navigateSessionStep(stepId) {
  const session = state.progress.learningProfile.activeSession;
  const step = session?.steps.find((item) => item.id === stepId);
  if (!step) return;
  if (step.type === "scenario") {
    const scenario = scenarios.find((item) => `scenario-${item.id}` === step.contentId);
    state.sessionActivity = { stepId: step.id, type: "scenario", contentId: step.contentId };
    state.scenarioDifficulty = step.difficulty || scenario?.difficulty || "Beginner";
    state.scenarioPack = step.packId || scenario?.packId || "all";
    state.scenarioIndex = Math.max(0, scenarioPool().findIndex((item) => item.id === scenario?.id));
    els.scenarioDifficulty.value = state.scenarioDifficulty;
    renderScenario();
    showView("scenarios");
    return;
  }
  if (step.type === "quiz") {
    const metadata = contentById[step.contentId];
    state.sessionActivity = { stepId: step.id, type: "quiz", contentId: step.contentId };
    state.quizDifficulty = step.difficulty || metadata?.difficulty || "Beginner";
    const pool = currentQuizPool();
    const sourceIndex = metadata?.sourceIndex;
    const question = quizQuestions[sourceIndex];
    state.quizIndex = Math.max(0, pool.indexOf(question));
    state.quizScore = 0;
    els.quizDifficulty.value = state.quizDifficulty;
    renderQuiz();
    showView("quiz");
    return;
  }
  if (step.type === "flashcard") {
    state.sessionActivity = { stepId: step.id, type: "flashcard", contentId: step.contentId };
    const metadata = contentById[step.contentId];
    const index = flashcards.findIndex((card) => card.id === metadata?.sourceId);
    state.flashIndex = Math.max(0, index);
    state.flashFlipped = false;
    renderFlashcard();
    showView("flashcards");
    return;
  }
  if (step.type === "guide") {
    state.sessionActivity = { stepId: step.id, type: "guide", contentId: step.contentId };
    renderGuide();
    showView("guide");
    return;
  }
  if (step.type === "match") {
    state.sessionActivity = { stepId: step.id, type: "match", contentId: step.contentId };
    els.simulatorMode.value = "ai";
    els.matchMode.value = "ranked";
    if (step.target === "adaptive-match") {
      els.opponentType.value = "unpredictable";
      els.aiDifficulty.value = "auto";
    }
    updateSimulatorSetupMode();
    showMatchSetup();
    showView("match");
  }
}

function awardTrainingPathReward(pathId, step, source = "Training Path Step") {
  const rewardKey = `${pathId}:${step.id}`;
  if (state.progress.trainingPath.stepRewardsClaimed.includes(rewardKey)) return;
  state.progress.trainingPath.stepRewardsClaimed.push(rewardKey);
  grantXp(step.reward, step.skills, source);
}

function awardTrainingPathCompletion(pathId, path) {
  if (state.progress.trainingPath.pathRewardsClaimed.includes(pathId)) return;
  state.progress.trainingPath.pathRewardsClaimed.push(pathId);
  grantXp(50, { tacticalIq: 10, mentalGame: 10, matchExperience: 10 }, `${path.title} Complete`);
}

function checkTrainingPathProgress() {
  const completions = evaluateTrainingPaths(state.progress);
  completions.forEach((completion) => {
    if (completion.type === "step") awardTrainingPathReward(completion.pathId, completion.step);
    if (completion.type === "path") awardTrainingPathCompletion(completion.pathId, completion.path);
  });
  state.progress = progressManager.saveProgress(state.progress);
  renderTrainingPath();
  renderProgress();
}

function completeTrainingPathStep(pathId, stepId) {
  const path = trainingPaths[pathId];
  const step = path?.steps.find((item) => item.id === stepId);
  if (!step) return;
  setStepComplete(state.progress, pathId, stepId);
  awardTrainingPathReward(pathId, step, "Training Path Manual Completion");
  checkTrainingPathProgress();
}

function trackGuideView() {
  const stats = state.progress.trainingPath.stats;
  const guideStepByPath = {
    beginner: "guide-fundamentals",
    intermediate: "guide-distance",
    advanced: "guide-tactics"
  };
  const guideStep = guideStepByPath[state.progress.trainingPath.activePath] || "guide-fundamentals";
  if (!stats.guideViews.includes(guideStep)) stats.guideViews.push(guideStep);
  checkTrainingPathProgress();
}

function trackFlashcardProgress() {
  state.progress.trainingPath.stats.flashcardsMastered = state.progress.mastered.length;
  checkTrainingPathProgress();
}

function trackScenarioComplete(scenario) {
  const stats = state.progress.trainingPath.stats.scenarios;
  stats[scenario.difficulty] = (stats[scenario.difficulty] || 0) + 1;
  checkTrainingPathProgress();
}

function trackQuizComplete(question, questionNumber, totalQuestions) {
  if (questionNumber !== totalQuestions) return;
  const stats = state.progress.trainingPath.stats.quizCompleted;
  stats[question.difficulty] = (stats[question.difficulty] || 0) + 1;
  checkTrainingPathProgress();
}

function trackAiMatchProgress() {
  const stats = state.progress.trainingPath.stats;
  stats.aiMatches += 1;
  if (!stats.aiOpponentTypes.includes(state.match.type)) stats.aiOpponentTypes.push(state.match.type);
  checkTrainingPathProgress();
}

function trackLocalDuelProgress(matchComplete = false) {
  const stats = state.progress.trainingPath.stats;
  stats.localDuelExchanges += 1;
  if (matchComplete) stats.localDuelMatches += 1;
  checkTrainingPathProgress();
}

function trackProgressReview(viewId) {
  if (viewId === "progress") state.progress.trainingPath.stats.progressReviewed = true;
  if (viewId === "development") state.progress.trainingPath.stats.skillTreeReviewed = true;
  if (viewId === "progress" || viewId === "development") checkTrainingPathProgress();
}

function difficultyFromTrainingStep(stepId) {
  if (stepId.includes("advanced")) return "Advanced";
  if (stepId.includes("intermediate")) return "Intermediate";
  return "Beginner";
}

function navigateTrainingStep(stepId, fallbackView = "hub") {
  if (stepId.startsWith("scenarios-")) {
    const difficulty = difficultyFromTrainingStep(stepId);
    state.scenarioDifficulty = difficulty;
    state.scenarioPack = "all";
    state.scenarioIndex = 0;
    els.scenarioDifficulty.value = difficulty;
    els.scenarioPack.value = "all";
    renderScenario();
    showView("scenarios");
    return;
  }

  if (stepId.startsWith("quiz-")) {
    const difficulty = difficultyFromTrainingStep(stepId);
    state.quizDifficulty = difficulty;
    state.quizIndex = 0;
    state.quizScore = 0;
    els.quizDifficulty.value = difficulty;
    renderQuiz();
    showView("quiz");
    return;
  }

  if (stepId.startsWith("ai-")) {
    els.simulatorMode.value = "ai";
    updateSimulatorSetupMode();
    showMatchSetup();
    showView("match");
    return;
  }

  if (stepId.startsWith("local-duel")) {
    els.simulatorMode.value = "duel";
    updateSimulatorSetupMode();
    showMatchSetup();
    showView("match");
    return;
  }

  if (stepId.startsWith("guide-")) {
    showView("guide");
    return;
  }

  if (stepId.startsWith("flashcards")) {
    showView("flashcards");
    return;
  }

  if (stepId === "progress-review" || stepId === "rating-70") {
    showView("progress");
    return;
  }

  if (stepId === "skill-tree-review") {
    showView("development");
    return;
  }

  showView(fallbackView);
}

function navigateReviewRecommendation(button) {
  const target = button.dataset.reviewTarget;
  if (target === "scenario-pack") {
    state.scenarioDifficulty = button.dataset.difficulty || "Beginner";
    state.scenarioPack = button.dataset.packId || "all";
    state.scenarioIndex = 0;
    els.scenarioDifficulty.value = state.scenarioDifficulty;
    els.scenarioPack.value = state.scenarioPack;
    renderScenario();
    showView("scenarios");
    return;
  }
  if (target === "guide") {
    showView("guide");
    return;
  }
  if (target === "flashcards") {
    showView("flashcards");
    return;
  }
  if (target === "adaptive-match") {
    els.simulatorMode.value = "ai";
    els.opponentType.value = "unpredictable";
    els.aiDifficulty.value = "auto";
    updateSimulatorSetupMode();
    showMatchSetup();
    showView("match");
    return;
  }
  if (target === "ai-match") {
    els.simulatorMode.value = "ai";
    updateSimulatorSetupMode();
    showMatchSetup();
    showView("match");
    return;
  }
  showView("scenarios");
}

function handleMyTrainingAction(action) {
  if (action === "start") {
    startMyTraining("auto");
    return;
  }
  if (action === "extra") {
    startMyTraining("auto", "extra");
    return;
  }
  if (action === "resume") {
    resumeMyTraining();
    return;
  }
  if (action === "easier" || action === "harder") {
    if (state.progress.learningProfile.activeSession?.completed) {
      renderPersonalizedTraining();
      return;
    }
    const mode = isDailySessionCompleteToday(state.progress) ? "extra" : "daily";
    if (mode === "extra" && isExtraPracticeCompleteToday(state.progress)) {
      renderPersonalizedTraining();
      return;
    }
    startMyTraining(action, mode);
    return;
  }
  if (action === "exit") {
    exitSession(state.progress);
    saveProgress();
    showView("hub");
    return;
  }
  if (action === "finish") {
    finishMyTraining();
  }
}

function showView(id) {
  els.views.forEach((view) => view.classList.toggle("active", view.id === id));
  document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === id));
  els.mainNav.classList.remove("open");
  els.menuToggle.setAttribute("aria-expanded", "false");
  if (
    id === "match" &&
    els.matchSetup.classList.contains("hidden") &&
    els.matchGame.classList.contains("hidden") &&
    els.duelGame.classList.contains("hidden") &&
    els.matchAnalysis.classList.contains("hidden")
  ) {
    showMatchSetup();
  }
  if (id === "guide") trackGuideView();
  trackProgressReview(id);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function trainingRenderContext() {
  return {
    els,
    state,
    guideSections,
    flashcards,
    quizQuestions,
    scenarioPacks,
    scenarios,
    actions,
    currentQuizPool,
    scenarioPool,
    grantXp,
    saveProgress,
    trackQuizComplete,
    trackScenarioComplete,
    trackLearningActivity,
    activeSessionActivityStep,
    recordPersonalizedAnswer
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
  return scenarios.filter((s) => {
    const difficultyMatch = s.difficulty === state.scenarioDifficulty;
    const packMatch = state.scenarioPack === "all" || s.packId === state.scenarioPack;
    return difficultyMatch && packMatch;
  });
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
    finalActionFromSequence,
    actionMeta,
    isActionUnlocked,
    actionCue,
    buildObservations,
    detectPattern
  };
}

function ensureFencerSprites() {
  [
    [els.youFencer, "Player epee fencer", true],
    [els.themFencer, "Opponent epee fencer", false],
    [els.duelP1Fencer, "Player 1 epee fencer", true],
    [els.duelP2Fencer, "Player 2 epee fencer", false]
  ].forEach(([fencer, label, mirrored]) => {
    if (!fencer) return;
    fencer.style.opacity = "1";
    fencer.style.visibility = "visible";
    fencer.style.zIndex = "6";
    fencer.style.display = "inline-flex";
    fencer.style.alignItems = "center";
    fencer.style.justifyContent = "center";
    fencer.querySelectorAll(".epee").forEach((blade) => {
      blade.setAttribute("aria-hidden", "true");
      blade.style.display = "none";
    });

    let sprite = fencer.querySelector(".fencer-sprite");
    if (!sprite) {
      sprite = fencer.querySelector(".body") || document.createElement("span");
      fencer.append(sprite);
    }
    sprite.classList.add("body", "fencer-sprite");
    sprite.setAttribute("role", "img");
    sprite.setAttribute("aria-label", label);
    sprite.dataset.sprite = "🤺";
    sprite.style.display = "inline-flex";
    sprite.style.alignItems = "center";
    sprite.style.justifyContent = "center";
    sprite.style.minWidth = "clamp(132px, 14vw, 190px)";
    sprite.style.minHeight = "clamp(96px, 10vw, 132px)";
    sprite.style.fontFamily = "\"Apple Color Emoji\", \"Segoe UI Emoji\", \"Noto Color Emoji\", sans-serif";
    sprite.style.fontSize = "clamp(4rem, 8.5vw, 7rem)";
    sprite.style.lineHeight = "1";
    sprite.style.opacity = "1";
    sprite.style.visibility = "visible";
    sprite.style.color = "initial";
    sprite.style.background = "transparent";
    sprite.style.overflow = "visible";
    sprite.style.transform = mirrored ? "scaleX(-1)" : "scaleX(1)";

    let image = sprite.querySelector(".sprite-fallback");
    if (!image) {
      image = document.createElement("img");
      image.className = "sprite-fallback";
      image.alt = "";
      sprite.prepend(image);
    }
    image.src = "./assets/fencer-sprite.png";
    image.style.display = "block";
    image.style.width = "clamp(132px, 14vw, 190px)";
    image.style.height = "auto";
    image.style.maxWidth = "none";
    image.style.objectFit = "contain";
    image.style.pointerEvents = "none";

    let fallback = sprite.querySelector(".emoji-fallback");
    if (!fallback) {
      fallback = document.createElement("span");
      fallback.className = "emoji-fallback";
      sprite.append(fallback);
    }
    fallback.textContent = "🤺";
  });
}

const renderMatch = () => {
  ensureFencerSprites();
  renderMatchUi(matchRenderContext());
};

function returnToMatchSetup() {
  stopDuelTimer();
  state.match.locked = true;
  state.match.over = true;
  if (state.duel) state.duel.active = false;
  els.nextExchange.classList.remove("show");
  els.replayExchange.disabled = true;
  hideMatchReview();
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
  const commitment = sequenceCommitment(sequence);
  if (commitment >= 5) return "High commitment";
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
  const setupCommitment = actionCommitment(action);
  const createsCommitment = ["Bait", "Invite Attack"].includes(action) || sequenceCommitment(sequence) >= 4 || opponentShowingAttackCue();
  const opponentCommitted = m.pendingAiAction === "Attack" || (aiReaction === "Attack" && createsCommitment);
  const distanceBeforeSetup = m.distance;

  adjustMatchDistance(action);
  m.appliedSequenceLength = sequence.length;
  m.lastAiAction = aiReaction;

  if (aiReaction === "Attack" && createsCommitment) {
    m.pendingAiAction = "Attack";
    m.liveCue = "Opponent attacking";
  } else if (aiReaction === "Attack") {
    m.liveCue = setupCommitment >= 2 ? "Opponent pressuring" : "Opponent threatening";
  } else {
    m.liveCue = aiReaction === "Retreat" ? "Opponent retreating" : aiReaction === "Feint" ? "Opponent feinting" : opponentState(aiReaction);
  }

  if (opponentCommitted && isCommittedDefense(action)) {
    executeQueuedSequence("Attack");
    return;
  }

  if (aiReaction !== "Attack") adjustDistanceForAi(aiReaction);
  m.setupDistanceStack = [...(m.setupDistanceStack || []), distanceBeforeSetup];
  const plan = evaluatePlanQuality(sequence, aiReaction, distanceBeforeSetup, m);
  m.planHint = sequence.length >= 3
    ? "Distance changed. Choose a finishing action or continue setting up."
    : opponentCommitted
      ? "Opponent committed. React or finish."
      : plan.quality >= 4
        ? "Setup improved. Choose the right finish."
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
  const retreatHabit = recentSequences.filter((item) => /Retreat|Half Step Out|Hold Distance/.test(item)).length >= 2;
  const feintHabit = recentSequences.filter((item) => item.includes("Feint")).length >= 2;
  const advanceBeforeAttackHabit = m.history.slice(-4).filter((entry) => /Advance.*(Lunge|Step-Lunge|Fleche)/.test(entry.sequence || entry.player)).length >= 2;

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
    weights.Attack += difficulty === "advanced" ? 12 : 4;
  }
  if (recentSequences.filter((item) => item.includes("Bait")).length >= 2) {
    weights.Retreat += 18;
    weights["Hold Distance"] += 12;
  }
  if (retreatHabit) {
    weights.Attack += difficulty === "advanced" ? 18 : 10;
    weights.Feint += 8;
    weights.Retreat -= 8;
    weights["Hold Distance"] -= 6;
  }
  if (feintHabit) {
    weights.Attack += difficulty === "advanced" ? 12 : 5;
    weights["Hold Distance"] += 8;
  }
  if (advanceBeforeAttackHabit) {
    weights.Counterattack += difficulty === "advanced" ? 24 : 14;
    weights.Retreat += 14;
    weights.Feint += 8;
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
  const recentSequences = state.match.history.slice(-4).map((entry) => entry.sequence || entry.player);
  if (common === "Counterattack" && count >= 3) return "Opponent begins using feints to draw out your counterattack.";
  if (["Lunge", "Fleche"].includes(common) && count >= 3) return "Opponent starts retreating and counterattacking your predictable attacks.";
  if (recentSequences.filter((item) => /Retreat|Half Step Out|Hold Distance/.test(item)).length >= 2) return "Opponent notices you are giving ground and starts taking space with pressure.";
  if (recentSequences.filter((item) => /Advance.*(Lunge|Step-Lunge|Fleche)/.test(item)).length >= 2) return "Opponent recognizes your advance-before-attack rhythm and prepares to retreat or counterattack.";
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
  result.planLabel = sequenceLabel;
  result.opponentLabel = opponentSequenceLabel(aiAction, sequence);
  result.resultLabel = result.playerTouch && result.opponentTouch ? "Double touch" : result.playerTouch ? "Player touch" : result.opponentTouch ? "Opponent touch" : result.title.includes("MISS") || result.title.includes("SHORT") ? "Miss" : "No-touch reset";
  const adjustment = determineAiAdjustment(playerAction, aiAction, sequence);
  m.lastAdjustment = adjustment;
  m.lastAiAction = aiAction;
  m.tactical += result.scores.tactical;
  m.distanceScore += result.scores.distance;
  m.timing += result.scores.timing;
  if (result.playerTouch) m.player += 1;
  if (result.opponentTouch) m.opponent += 1;
  if (m.mode === "training" && !m.pathAiRecorded) {
    m.pathAiRecorded = true;
    trackAiMatchProgress();
  }
  animateScore(result.playerTouch, result.opponentTouch);
  m.locked = true;
  m.previous.push(sequenceLabel);
  m.history.push({
    player: sequenceLabel,
    sequence: sequenceLabel,
    sequenceActions: sequence,
    finalAction: playerAction,
    ai: aiAction,
    aiSequence: opponentSequenceLabel(aiAction, sequence),
    result: result.title,
    resultLabel: result.resultLabel,
    playerTouch: result.playerTouch,
    opponentTouch: result.opponentTouch,
    doubleTouch: result.playerTouch && result.opponentTouch,
    fellShort: /SHORT|MISS/i.test(`${result.title} ${result.what || ""}`),
    poorDistance: ["Lunge", "Step-Lunge", "Fleche"].includes(playerAction) && distanceBefore >= 4,
    distanceWin: /Retreat|Half Step Out|Hold Distance/.test(sequenceLabel) && aiAction === "Attack" && !result.opponentTouch,
    distanceBefore,
    commitment: sequenceRisk(sequence),
    tacticalScore: result.scores.tactical,
    distanceScore: result.scores.distance,
    timingScore: result.scores.timing,
    adjustment
  });
  const skillXpText = applyExchangeSkillRewards(playerAction, result, sequence);
  sequence.slice(m.appliedSequenceLength || 0).forEach((action) => adjustMatchDistance(action));
  adjustDistanceForAi(aiAction);
  lockMatchButtons(sequence);
  animateExchange(playerAction, aiAction, result.playerTouch, result.opponentTouch, result.resultLabel, result.title);

  els.matchFeedback.innerHTML = buildMatchFeedback(result, aiAction);
  els.analysisOutcome.textContent = result.title;
  els.analysisPlayerAction.textContent = sequenceLabel;
  els.analysisOpponentAction.textContent = opponentSequenceLabel(aiAction, sequence);
  els.analysisResult.textContent = result.resultLabel;
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
  const phraseHeader = `
    <p><b>Your plan:</b> ${result.planLabel || "Hold Distance"}</p>
    <p><b>Opponent:</b> ${result.opponentLabel || opponentState(aiAction)}</p>
    <p><b>Result:</b> ${result.resultLabel || result.title}</p>
  `;
  if (state.match.mode === "ranked") {
    return `
      <strong>EXCHANGE RESULT</strong>
      ${phraseHeader}
      <p><b>What happened:</b> ${result.what}</p>
      <p><b>Why:</b> ${result.why}</p>
      ${betterLine}
      <p><b>Training focus:</b> ${result.training}</p>
    `;
  }
  if (state.match.mode === "tournament") {
    return `
      <strong>TOURNAMENT EXCHANGE</strong>
      ${phraseHeader}
      <p><b>What happened:</b> ${result.what}</p>
      <p><b>Why:</b> ${result.why}</p>
      ${betterLine}
      <p><b>Adjustment:</b> ${state.match.lastAdjustment}</p>
    `;
  }
  return `
    <strong>EXCHANGE RESULT</strong>
    ${phraseHeader}
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
  const plan = evaluatePlanQuality(sequence, aiAction, state.match.distance, state.match);
  const hasPrep = sequence.some((action) => ["Feint", "Beat", "Bait", "Change Rhythm"].includes(action));
  const hasFootPrep = sequence.some((action) => ["Half Step In", "Half Step Out", "Advance", "Retreat"].includes(action));
  const hasFinish = sequence.some(isFinishAction);
  const label = sequence.join(" -> ");
  const lastAction = sequence.at(-1);
  const directCommit = sequence.length <= 2 && ["Advance", "Half Step In"].includes(sequence[0]) && ["Lunge", "Step-Lunge", "Fleche"].includes(sequence.at(-1));

  result.what = `Your sequence: ${label}. Opponent: ${opponentSequenceLabel(aiAction, sequence)}. ${result.what}`;
  result.why += ` The plan was evaluated from ${plan.distanceInfo.label}; opponent state was ${plan.opponent.toLowerCase()}.`;

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

  if (hasFinish) {
    result.scores.tactical += Math.round(plan.quality / 3);
    result.scores.timing += Math.max(-3, Math.min(4, Math.round(plan.quality / 4)));
    if (plan.notes.length) result.why += ` ${plan.notes.join(" ")}.`;
  }

  if (plan.quality >= 8 && hasFinish && !result.opponentTouch) {
    result.playerTouch = true;
    result.title = result.title === "TACTICAL RESET" ? "TACTICAL PLAN SCORES" : result.title;
    result.what = "Your setup created enough distance, timing, or opponent reaction for the finish to land cleanly.";
    result.better = "Keep the same idea, but vary the preparation so the pattern stays hard to read.";
    result.advice = "Strong epee actions usually come from preparation plus the right measure, not from the finish alone.";
  }

  if (plan.quality <= -5 && hasFinish) {
    result.playerTouch = false;
    if (!result.opponentTouch && ["Counterattack", "Attack"].includes(aiAction)) result.opponentTouch = true;
    result.title = result.opponentTouch ? "PLAN PUNISHED" : "ATTACK MISSES";
    result.what = "The finish did not match the distance or opponent state, so the opponent could avoid or punish it.";
    result.why = `${plan.distanceInfo.note}. ${plan.notes.join(" ") || "The action committed before the setup created a clear cue."}`;
    result.better = betterPlanFor(sequence, playerAction, aiAction, plan.distanceInfo.key);
    result.advice = "Build the phrase until the opponent gives a real commitment, then choose the finish.";
    result.scores.tactical -= 4;
    result.scores.distance -= plan.distanceInfo.key >= 4 ? 4 : 1;
    result.scores.timing -= 3;
  }

  if (plan.context.label === "ahead" && result.playerTouch && result.opponentTouch) {
    result.scores.tactical -= 3;
    result.why += " Because you were ahead, accepting a double touch was less valuable than a clean single-light action.";
    result.better = "Protect the lead with distance, parry-riposte, or a cleaner counterattack timing.";
  }

  if (plan.context.label === "behind" && result.playerTouch && !result.opponentTouch && risk >= 5) {
    result.scores.tactical += 2;
    result.why += " Since you were behind, the calculated risk was more acceptable because it produced a single touch.";
  }

  if (plan.context.label === "final-touch tie" && risk >= 6) {
    result.scores.tactical -= 4;
    if (result.playerTouch && result.opponentTouch) {
      result.why += " At final touch, reckless doubles are punished because they do not show clean control.";
      result.better = "Use patient preparation, make the opponent miss, then finish with a cleaner action.";
    }
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

function betterPlanFor(sequence, playerAction, aiAction, distanceKey) {
  if (distanceKey >= 4 && ["Lunge", "Counterattack"].includes(playerAction)) return "Use Half Step In -> Feint -> Lunge, or Step-Lunge only after you make the distance real.";
  if (playerAction === "Counterattack" && aiAction !== "Attack") return "Counterattack only after the opponent commits; otherwise hold distance or bait first.";
  if (playerAction === "Parry-Riposte" && aiAction === "Feint") return "Wait for the real extension or use a smaller blade action before riposting.";
  if (sequence.filter((action) => action === "Advance").length >= 2) return "Break the advance-attack rhythm with Change Rhythm, Feint, or Beat before finishing.";
  if (playerAction === "Fleche" && distanceKey <= 1) return "At dangerous close distance, retreat, parry-riposte, or counterattack instead of launching a big fleche.";
  return "Prepare with distance or blade work first, then finish when the opponent reacts.";
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

function animateExchange(playerAction, aiAction, playerTouch, opponentTouch, resultLabel = "", resultTitle = "") {
  els.youFencer.classList.toggle("attack-you", ["Lunge", "Fleche", "Counterattack", "Parry-Riposte"].includes(playerAction));
  els.themFencer.classList.toggle("attack-them", ["Attack", "Counterattack"].includes(aiAction));
  els.youFencer.classList.toggle("retreat-you", playerAction === "Retreat");
  els.themFencer.classList.toggle("retreat-them", aiAction === "Retreat");
  els.youFencer.classList.toggle("flash", playerTouch || opponentTouch);
  els.themFencer.classList.toggle("flash", playerTouch || opponentTouch);
  const banner = exchangeBannerText(playerTouch, opponentTouch, resultLabel, resultTitle);
  els.touchFlash.textContent = banner.text;
  els.touchFlash.className = `touch-flash show ${banner.tone}`;
  setTimeout(() => {
    els.youFencer.classList.remove("flash", "attack-you", "retreat-you");
    els.themFencer.classList.remove("flash", "attack-them", "retreat-them");
    els.touchFlash.className = "touch-flash";
  }, 650);
}

function exchangeBannerText(playerTouch, opponentTouch, resultLabel = "", resultTitle = "") {
  const text = `${resultLabel} ${resultTitle}`.toUpperCase();
  if (playerTouch && opponentTouch) return { text: "DOUBLE TOUCH", tone: "double" };
  if (playerTouch || opponentTouch) return { text: "TOUCH", tone: playerTouch ? "player-touch" : "opponent-touch" };
  if (text.includes("SHORT")) return { text: "FALLS SHORT", tone: "miss" };
  if (text.includes("MISS")) return { text: "MISS", tone: "miss" };
  return { text: "NO TOUCH", tone: "no-touch" };
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
  if (state.duel?.localMode) {
    hideMatchReview();
    nextDuelExchange();
    return;
  }
  hideMatchReview();
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
  hideMatchReview();
  renderMatch();
  setMatchView("fight");
}

function resetMatch() {
  stopDuelTimer();
  state.match = { player: 0, opponent: 0, round: 1, tactical: 0, distanceScore: 0, timing: 0, distance: 3, locked: false, over: false, type: els.opponentType.value, mode: els.matchMode.value, aiDifficulty: selectedAiDifficulty(), learningMode: els.learningMode.value, tournamentStage: 1, situation: null, sequence: [], appliedSequenceLength: 0, setupDistanceStack: [], pendingAiAction: null, planHint: "", liveCue: "", previous: [], history: [], replaySnapshot: null, lastAiAction: null, lastAdjustment: "No adjustment yet.", pathAiRecorded: false };
  document.querySelector(".opponent-analysis")?.removeAttribute("open");
  hideMatchReview();
  els.replayExchange.disabled = false;
  els.matchFeedback.textContent = "Choose an action to fence the first exchange.";
  newMatchSituation();
  setMatchView("fight");
}

function createDuelState() {
  return {
    localMode: true,
    active: false,
    over: false,
    phase: "p1Planning",
    planningPlayer: "p1",
    timerEnabled: els.duelTimerMode.value !== "off",
    timeLeft: Number(els.duelTimerMode.value) || 0,
    p1: 0,
    p2: 0,
    exchange: 1,
    tempo: 0,
    distance: 3,
    plans: { p1: [], p2: [] },
    revealed: false,
    log: ["Player 1: build your secret plan."],
    reviewEvents: [],
    lastResult: null
  };
}

function hideMatchReview() {
  els.matchReviewPanel?.classList.add("hidden");
  if (els.matchReviewPanel) els.matchReviewPanel.innerHTML = "";
}

function stopDuelTimer() {
  if (!duelTimer) return;
  clearInterval(duelTimer);
  duelTimer = null;
}

function startDuelTimer() {
  stopDuelTimer();
  duelTimer = setInterval(tickDuelPlanningTimer, 1000);
}

function startDuelMatch() {
  stopDuelTimer();
  hideMatchReview();
  state.duel = createDuelState();
  els.replayExchange.disabled = true;
  setMatchView("duel");
  renderDuel();
  state.duel.active = true;
  startDuelPlanningTimer();
}

function nextDuelExchange() {
  if (!state.duel || state.duel.over) return;
  const score = { p1: state.duel.p1, p2: state.duel.p2 };
  const reviewEvents = state.duel.reviewEvents || [];
  state.duel = { ...createDuelState(), ...score, reviewEvents, exchange: state.duel.exchange + 1, log: ["Player 1: build your secret plan."] };
  setMatchView("duel");
  renderDuel();
  state.duel.active = true;
  startDuelPlanningTimer();
}

function resetDuel() {
  startDuelMatch();
}

function duelActionSpeed(action) {
  if (action === "Fleche") return 3;
  if (["Lunge", "Step-Lunge", "Parry-Riposte"].includes(action)) return 2;
  return 1;
}

function isDuelFinish(action) {
  return ["Lunge", "Step-Lunge", "Fleche", "Counterattack", "Parry-Riposte"].includes(action);
}

function isDuelAttack(action) {
  return ["Lunge", "Step-Lunge", "Fleche"].includes(action);
}

function currentDuelPlayer() {
  return state.duel?.planningPlayer || "p1";
}

function queueDuelAction(action) {
  const duel = state.duel;
  if (!duel || !duel.active || duel.over || !["p1Planning", "p2Planning"].includes(duel.phase)) return;
  const player = currentDuelPlayer();
  const plan = duel.plans[player];
  if (plan.length >= 3 || plan.some(isDuelFinish)) return;
  plan.push(action);
  duel.log.unshift(`${player === "p1" ? "Player 1" : "Player 2"} adds ${action}.`);
  renderDuel();
}

function clearDuelPlan() {
  const duel = state.duel;
  if (!duel || !["p1Planning", "p2Planning"].includes(duel.phase)) return;
  duel.plans[currentDuelPlayer()] = [];
  duel.log.unshift("Current plan cleared.");
  renderDuel();
}

function lockDuelPlan() {
  const duel = state.duel;
  if (!duel || duel.over) return;
  if (duel.phase === "reveal") {
    nextDuelExchange();
    return;
  }
  if (!["p1Planning", "p2Planning"].includes(duel.phase)) return;
  const player = currentDuelPlayer();
  if (!duel.plans[player].length) duel.plans[player].push("Hold Distance");
  stopDuelTimer();
  if (player === "p1") {
    duel.phase = "pass";
    duel.planningPlayer = "p2";
    duel.timeLeft = Number(els.duelTimerMode.value) || 0;
    duel.log = ["Player 1 plan locked. Pass the device to Player 2."];
  } else {
    revealDuelPlans();
    return;
  }
  renderDuel();
}

function startPlayerTwoPlanning() {
  const duel = state.duel;
  if (!duel || duel.phase !== "pass") return;
  duel.phase = "p2Planning";
  duel.planningPlayer = "p2";
  duel.log = ["Player 2: build your secret plan."];
  renderDuel();
  startDuelPlanningTimer();
}

function startDuelPlanningTimer() {
  const duel = state.duel;
  if (!duel?.timerEnabled) return;
  duel.timeLeft = Number(els.duelTimerMode.value) || 15;
  startDuelTimer();
}

function tickDuelPlanningTimer() {
  const duel = state.duel;
  if (!duel || duel.over || !["p1Planning", "p2Planning"].includes(duel.phase)) return stopDuelTimer();
  duel.timeLeft -= 1;
  if (duel.timeLeft <= 0) {
    duel.log.unshift("Time expired. Current plan locked automatically.");
    lockDuelPlan();
    return;
  }
  renderDuel();
}

function revealDuelPlans() {
  const duel = state.duel;
  stopDuelTimer();
  if (!duel.plans.p2.length) duel.plans.p2.push("Hold Distance");
  const simulation = simulateDuelExchange(duel.plans.p1, duel.plans.p2);
  duel.phase = "reveal";
  duel.revealed = true;
  duel.tempo = simulation.tempos;
  duel.distance = simulation.distance;
  duel.log = simulation.log;
  finishDuelExchange(simulation.result);
}

function simulateDuelExchange(p1Plan, p2Plan) {
  const sim = {
    distance: 3,
    prep: { p1: 0, p2: 0 },
    current: { p1: null, p2: null },
    index: { p1: 0, p2: 0 },
    plans: { p1: p1Plan, p2: p2Plan },
    missWindow: null,
    log: []
  };
  let result = null;
  let tempo = 0;
  while (!result && tempo < 9) {
    tempo += 1;
    ["p1", "p2"].forEach((player) => startSimAction(sim, player, player === "p1" ? p1Plan : p2Plan));
    const completed = [];
    ["p1", "p2"].forEach((player) => {
      if (!sim.current[player]) return;
      sim.current[player].remaining -= 1;
      if (sim.current[player].remaining <= 0) {
        completed.push({ player, action: sim.current[player].action });
        sim.current[player] = null;
      }
    });
    completed.forEach(({ player, action }) => applySimDuelAction(sim, player, action));
    if (completed.length) sim.log.push(`Tempo ${tempo}: ${completed.map((item) => `${item.player === "p1" ? "P1" : "P2"} ${item.action}`).join(". ")}.`);
    result = resolveDuelTempo(sim, completed);
    if (!result && !sim.current.p1 && !sim.current.p2 && sim.index.p1 >= p1Plan.length && sim.index.p2 >= p2Plan.length) break;
  }
  if (!result) result = buildDuelResult("none", "No touch", "Both plans finished without a clean scoring action.", "Neither fencer created enough commitment or distance advantage.", "Tactical IQ");
  return { result, log: sim.log, distance: sim.distance, tempos: tempo };
}

function startSimAction(sim, player, plan) {
  if (sim.current[player] || sim.index[player] >= plan.length) return;
  const action = plan[sim.index[player]];
  sim.index[player] += 1;
  sim.current[player] = { action, remaining: duelActionSpeed(action), committed: isDuelFinish(action) };
}

function applySimDuelAction(sim, player, action) {
  if (action === "Advance" || action === "Half Step In") sim.distance = Math.max(1, sim.distance - (action === "Advance" ? 1 : 0.5));
  if (action === "Retreat" || action === "Half Step Out") sim.distance = Math.min(5, sim.distance + (action === "Retreat" ? 1 : 0.5));
  if (action === "Hold Distance") sim.distance = Math.min(5, Math.max(2, sim.distance));
  if (["Feint", "Bait", "Beat", "Change Rhythm", "Half Step In"].includes(action)) sim.prep[player] += 1;
  if (["Lunge", "Step-Lunge", "Fleche"].includes(action)) sim.distance = Math.max(1, sim.distance - (action === "Fleche" ? 2 : action === "Step-Lunge" ? 1.5 : 1));
}

function resolveDuelTempo(sim, completed) {
  const p1Action = completed.find((item) => item.player === "p1")?.action || null;
  const p2Action = completed.find((item) => item.player === "p2")?.action || null;
  const p1CurrentAttack = sim.current.p1 && isDuelAttack(sim.current.p1.action);
  const p2CurrentAttack = sim.current.p2 && isDuelAttack(sim.current.p2.action);
  if (["Retreat", "Half Step Out", "Hold Distance"].includes(p1Action) && p2CurrentAttack) {
    sim.current.p2 = null;
    sim.missWindow = { scorer: "p1", reason: "Player 1 made Player 2's attack fall short." };
    sim.log.push("P2 attack falls short as P1 controls distance.");
    return null;
  }
  if (["Retreat", "Half Step Out", "Hold Distance"].includes(p2Action) && p1CurrentAttack) {
    sim.current.p1 = null;
    sim.missWindow = { scorer: "p2", reason: "Player 2 made Player 1's attack fall short." };
    sim.log.push("P1 attack falls short as P2 controls distance.");
    return null;
  }
  const p1Finish = p1Action && isDuelFinish(p1Action);
  const p2Finish = p2Action && isDuelFinish(p2Action);
  if (!p1Finish && !p2Finish) return null;
  if (p1Action === "Counterattack" && sim.missWindow?.scorer === "p1") return buildDuelResult("p1", "Player 1 touch", "Player 1 invited the attack, opened distance, then counterattacked after Player 2 missed.", "P2 overcommitted into the retreat.", "Distance Control");
  if (p2Action === "Counterattack" && sim.missWindow?.scorer === "p2") return buildDuelResult("p2", "Player 2 touch", "Player 2 opened distance and counterattacked after Player 1 missed.", "P1 overcommitted into the retreat.", "Distance Control");
  if (p1Action === "Parry-Riposte" && p2CurrentAttack && sim.prep.p2 > 0) return buildDuelResult("p2", "Player 2 touch", "Player 2's feint drew the parry before the real attack arrived.", "P1 parried too early.", "Blade Work");
  if (p2Action === "Parry-Riposte" && p1CurrentAttack && sim.prep.p1 > 0) return buildDuelResult("p1", "Player 1 touch", "Player 1's feint drew the parry before the real attack arrived.", "P2 parried too early.", "Blade Work");
  if (p1Action === "Counterattack" && sim.current.p2?.action === "Fleche" && sim.distance <= 3) return buildDuelResult("double", "Double touch", "Player 2's fleche was committed and Player 1 counterattacked into it.", "The counterattack landed during the fleche tempo.", "Timing");
  if (p2Action === "Counterattack" && sim.current.p1?.action === "Fleche" && sim.distance <= 3) return buildDuelResult("double", "Double touch", "Player 1's fleche was committed and Player 2 counterattacked into it.", "The counterattack landed during the fleche tempo.", "Timing");
  const p1Quality = duelFinishQuality(sim, "p1", p1Action, p2Action, p2CurrentAttack);
  const p2Quality = duelFinishQuality(sim, "p2", p2Action, p1Action, p1CurrentAttack);
  if (p1Finish && p2Finish) {
    if (sim.distance <= 2 || Math.abs(p1Quality - p2Quality) <= 2) return buildDuelResult("double", "Double touch", "Both fencers committed in close timing.", "Both attacks arrived before either point was controlled.", "Timing");
    return p1Quality > p2Quality
      ? buildDuelResult("p1", "Player 1 touch", "Player 1's preparation and timing beat Player 2's action.", `P2 ${p2Action.toLowerCase()} was slower or less prepared.`, "Tactical IQ")
      : buildDuelResult("p2", "Player 2 touch", "Player 2's preparation and timing beat Player 1's action.", `P1 ${p1Action.toLowerCase()} was slower or less prepared.`, "Tactical IQ");
  }
  if (p1Finish) return resolveSingleDuelFinish(sim, "p1", p1Action, p1Quality, p2CurrentAttack);
  return resolveSingleDuelFinish(sim, "p2", p2Action, p2Quality, p1CurrentAttack);
}

function duelFinishQuality(sim, player, action, opposingAction, opponentAttacking) {
  if (!action) return -6;
  const d = sim.distance;
  let quality = sim.prep[player] * 2 + actionCommitment(action);
  if (action === "Counterattack") quality += opponentAttacking || isDuelAttack(opposingAction) ? 6 : -5;
  if (action === "Parry-Riposte") quality += opponentAttacking || isDuelAttack(opposingAction) ? 5 : -4;
  if (action === "Lunge") quality += d === 3 ? 4 : d >= 4 ? -4 : d <= 1 ? -2 : 2;
  if (action === "Step-Lunge") quality += [3, 4].includes(Math.round(d)) ? 3 : -2;
  if (action === "Fleche") quality += d >= 3 ? 2 : -4;
  return quality;
}

function resolveSingleDuelFinish(sim, player, action, quality, opponentAttacking) {
  const label = player === "p1" ? "Player 1" : "Player 2";
  const opponent = player === "p1" ? "Player 2" : "Player 1";
  if (sim.distance >= 5 && ["Lunge", "Counterattack"].includes(action)) return buildDuelResult("none", "Attack fell short", `${label}'s ${action.toLowerCase()} started from too far away.`, "The distance was not prepared before the finish.", "Distance Control");
  if (action === "Counterattack" && !opponentAttacking) return buildDuelResult(player === "p1" ? "p2" : "p1", `${opponent} touch`, `${label} counterattacked without a real attack to counter.`, "Counterattack is a reaction, not a first intention finish.", "Timing");
  if (action === "Parry-Riposte" && !opponentAttacking) return buildDuelResult(player === "p1" ? "p2" : "p1", `${opponent} touch`, `${label} parried too early and opened the line.`, "Parry-riposte needs the opponent to actually commit.", "Blade Work");
  if (quality >= 5) return buildDuelResult(player, `${label} touch`, `${label} created enough preparation and measure for the ${action.toLowerCase()}.`, "The finish landed after the setup improved timing.", action === "Parry-Riposte" ? "Blade Work" : "Tactical IQ");
  return buildDuelResult("none", "No touch", `${label}'s ${action.toLowerCase()} did not produce a clean scoring action.`, "The setup was not strong enough for the distance.", "Distance Control");
}

function buildDuelResult(winner, title, why, keyMoment, focus) {
  return { winner, title, why, keyMoment, focus };
}

function finishDuelExchange(result) {
  const duel = state.duel;
  stopDuelTimer();
  duel.reviewEvents.push({
    p1Plan: [...duel.plans.p1],
    p2Plan: [...duel.plans.p2],
    outcome: result.title,
    why: result.why,
    distance: duel.distance,
    winner: result.winner
  });
  duel.active = false;
  duel.lastResult = result;
  if (result.winner === "p1" || result.winner === "double") duel.p1 += 1;
  if (result.winner === "p2" || result.winner === "double") duel.p2 += 1;
  animateDuelTouch(result.winner);
  if (duel.p1 >= 5 || duel.p2 >= 5) {
    duel.over = true;
  }
  trackLocalDuelProgress(duel.over);
  renderDuel();
  if (duel.over) finishDuelReview();
}

function finishDuelReview() {
  const duel = state.duel;
  const review = buildDuelReview(duel);
  applyMatchReviewToLearningProfile(state.progress, review);
  completeSessionStep({ type: "match" });
  saveReview(state.progress, review);
  state.progress = progressManager.saveProgress(state.progress);
  els.analysisOutcome.textContent = "LOCAL DUEL REVIEW";
  els.analysisPlayerAction.textContent = "Both players";
  els.analysisOpponentAction.textContent = "Local Duel";
  els.analysisResult.textContent = `Final score: ${review.score}. Tactical Rating: ${review.tacticalRating}%`;
  els.analysisTacticalPoints.textContent = "Neutral";
  els.analysisSkillXp.textContent = "Review saved";
  els.matchFeedback.innerHTML = `<strong>LOCAL DUEL COMPLETE</strong><br>Final score: ${review.score}<br>Review both players' plans before the next bout.`;
  renderMatchReview(els, review);
  renderRecentMatchReviews();
  els.nextExchange.classList.remove("show");
  els.replayExchange.disabled = true;
  setMatchView("analysis");
}

function renderDuel() {
  const duel = state.duel;
  if (!duel) return;
  ensureFencerSprites();
  const key = Math.max(1, Math.min(5, Math.round(duel.distance)));
  els.duelP1Score.textContent = duel.p1;
  els.duelP2Score.textContent = duel.p2;
  els.duelExchange.textContent = duel.exchange;
  els.duelTempo.textContent = duel.timerEnabled && ["p1Planning", "p2Planning"].includes(duel.phase) ? `${duel.timeLeft}s` : duel.phase === "reveal" ? duel.tempo : "-";
  els.duelDistance.textContent = `Distance: ${Number(duel.distance.toFixed(1))}`;
  els.duelDistanceName.textContent = distanceNames[key];
  els.duelPhaseLabel.textContent = duel.phase === "pass" ? "Pass Device" : duel.phase === "reveal" ? "Reveal" : "Planning Phase";
  els.duelStatus.textContent = duel.over
    ? `${duel.p1 > duel.p2 ? "Player 1" : "Player 2"} wins ${duel.p1}-${duel.p2}`
    : duel.phase === "p1Planning" ? "Player 1: Build your plan"
      : duel.phase === "pass" ? "Player 1 plan locked. Pass the device to Player 2."
        : duel.phase === "p2Planning" ? "Player 2: Build your plan"
          : `${duel.lastResult.title}: ${duel.lastResult.why}`;
  els.duelP1Action.textContent = duel.phase === "p1Planning" ? "Planning" : duel.phase === "reveal" || duel.over ? "Revealed" : "Locked";
  els.duelP2Action.textContent = duel.phase === "p2Planning" ? "Planning" : duel.phase === "reveal" || duel.over ? "Revealed" : "Hidden";
  els.duelP1Plan.innerHTML = visibleDuelPlan("p1");
  els.duelP2Plan.innerHTML = visibleDuelPlan("p2");
  els.duelEventLog.innerHTML = duel.log.slice(0, 8).map((item) => `<li>${item}</li>`).join("");
  els.duelP1Fencer.style.left = `${8 + (5 - duel.distance) * 5.5}%`;
  els.duelP2Fencer.style.right = `${8 + (5 - duel.distance) * 5.5}%`;
  document.querySelectorAll("[data-duel-plan-action]").forEach((btn) => {
    btn.disabled = !["p1Planning", "p2Planning"].includes(duel.phase) || duel.plans[currentDuelPlayer()].length >= 3 || duel.plans[currentDuelPlayer()].some(isDuelFinish);
  });
  document.querySelector(".duel-actions")?.classList.toggle("hidden", !["p1Planning", "p2Planning"].includes(duel.phase));
  els.lockDuelPlan.classList.toggle("hidden", duel.phase === "pass" || duel.over);
  els.lockDuelPlan.textContent = duel.phase === "p2Planning" ? "Lock Plan and Reveal" : duel.phase === "reveal" ? "Next Exchange" : "Lock Plan";
  els.duelPlayerReady.classList.toggle("hidden", duel.phase !== "pass");
  els.clearDuelPlan.classList.toggle("hidden", !["p1Planning", "p2Planning"].includes(duel.phase));
}

function visibleDuelPlan(player) {
  const duel = state.duel;
  const canShow = duel.phase === "reveal" || duel.over || duel.planningPlayer === player && ["p1Planning", "p2Planning"].includes(duel.phase);
  if (!canShow) return `<span class="empty-sequence">Plan hidden</span>`;
  const plan = duel.plans[player];
  return plan.length ? plan.map((action) => `<span>${action}</span>`).join("<b>→</b>") : `<span class="empty-sequence">Choose up to 3 actions</span>`;
}

function animateDuelAction(player, action) {
  const fencer = player === "p1" ? els.duelP1Fencer : els.duelP2Fencer;
  const isRetreat = ["Retreat", "Half Step Out"].includes(action);
  const isAttack = isDuelFinish(action);
  fencer.classList.toggle(player === "p1" ? "attack-you" : "attack-them", isAttack);
  fencer.classList.toggle(player === "p1" ? "retreat-you" : "retreat-them", isRetreat);
  setTimeout(() => {
    fencer.classList.remove("attack-you", "attack-them", "retreat-you", "retreat-them");
  }, 520);
}

function animateDuelTouch(winner) {
  [els.duelP1Score, els.duelP2Score].forEach((target) => target.classList.remove("score-bump"));
  if (winner === "p1" || winner === "double") els.duelP1Score.classList.add("score-bump");
  if (winner === "p2" || winner === "double") els.duelP2Score.classList.add("score-bump");
  els.duelTouchFlash.classList.toggle("show", winner !== "none");
  setTimeout(() => els.duelTouchFlash.classList.remove("show"), 650);
}

function updateSimulatorSetupMode() {
  const duelMode = els.simulatorMode.value === "duel";
  [els.matchMode, els.aiDifficulty, els.learningMode, els.opponentType].forEach((select) => {
    select.closest("label").classList.toggle("hidden", duelMode);
  });
  els.duelTimerMode.closest("label").classList.toggle("hidden", !duelMode);
  els.startMatch.textContent = duelMode ? "Start Local Duel" : "Start Match";
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
  trackAiMatchProgress();
  grantXp(25 + (won ? 50 : 0), {
    matchExperience: 10,
    tacticalIq: won ? 25 : 12,
    distanceControl: Math.max(3, Math.round(m.distanceScore / 3)),
    timing: Math.max(5, Math.round(m.timing / 2)),
    mentalGame: won ? 10 : 5
  }, "Match Simulator");
  const review = buildAiMatchReview(m);
  applyMatchReviewToLearningProfile(state.progress, review);
  completeSessionStep({ type: "match" });
  awardReviewXp(review);
  saveReview(state.progress, review);
  state.progress = progressManager.saveProgress(state.progress);
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
  renderMatchReview(els, review);
  renderRecentMatchReviews();
  els.nextExchange.classList.remove("show");
  els.replayExchange.disabled = true;
  els.matchActions.querySelectorAll(".action-btn").forEach((btn) => { btn.disabled = true; });
  setMatchView("analysis");
}

function handleDrillKey(event) {
  if (state.duel?.active && !els.duelGame.classList.contains("hidden")) {
    handleDuelKey(event);
    return;
  }
  if (els.matchGame.classList.contains("hidden")) return;
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
  let action = event.code === "Space" && event.shiftKey ? "Step-Lunge" : keyToAction[event.code];
  if (event.code === "KeyB" && event.shiftKey) action = "Beat";
  if (!action) return;
  event.preventDefault();
  queueAction(action);
}

function handleDuelKey(event) {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement) return;
  let action = null;
  if (event.code === "KeyA") action = "Retreat";
  if (event.code === "KeyD") action = "Advance";
  if (event.code === "KeyQ") action = "Half Step Out";
  if (event.code === "KeyE") action = "Half Step In";
  if (event.code === "KeyH") action = "Hold Distance";
  if (event.code === "KeyC") action = "Change Rhythm";
  if (event.code === "KeyF") action = event.shiftKey ? "Fleche" : "Feint";
  if (event.code === "KeyB") action = event.shiftKey ? "Beat" : "Bait";
  if (event.code === "Space") action = event.shiftKey ? "Step-Lunge" : "Lunge";
  if (event.code === "KeyK") action = "Counterattack";
  if (event.code === "KeyR") action = "Parry-Riposte";
  if (!action) return;
  event.preventDefault();
  queueDuelAction(action);
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
      style: els.profileStyleInput.value,
      avatarId: els.profileAvatarInput.value || "classic-epee"
    });
    els.profileSetup.classList.remove("show");
    showView("profile");
  });
  els.changeAvatarBtn.addEventListener("click", () => {
    pendingAvatarId = profileAvatarId();
    renderProfile();
    els.avatarModal.classList.remove("hidden");
  });
  els.avatarChoiceGrid.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-avatar-id]");
    if (!choice || choice.disabled) return;
    pendingAvatarId = choice.dataset.avatarId;
    els.avatarChoiceGrid.querySelectorAll(".avatar-choice").forEach((btn) => {
      btn.classList.toggle("selected", btn.dataset.avatarId === pendingAvatarId);
    });
  });
  [els.avatarCancelBtn, els.avatarCancelFooterBtn].forEach((button) => button.addEventListener("click", () => {
    pendingAvatarId = null;
    els.avatarModal.classList.add("hidden");
    renderProfile();
  }));
  els.avatarSaveBtn.addEventListener("click", () => {
    if (pendingAvatarId) setProfileAvatar(pendingAvatarId);
    pendingAvatarId = null;
    els.avatarModal.classList.add("hidden");
  });
  els.flashCard.addEventListener("click", () => { state.flashFlipped = !state.flashFlipped; renderFlashcard(); });
  $("prevCard").addEventListener("click", () => moveCard(-1));
  $("nextCard").addEventListener("click", () => moveCard(1));
  $("shuffleCards").addEventListener("click", () => { flashcards.sort(() => Math.random() - 0.5); state.flashIndex = 0; state.flashFlipped = false; renderFlashcard(); });
  $("masterCard").addEventListener("click", () => {
    const card = flashcards[state.flashIndex];
    const id = card.id;
    if (!state.progress.mastered.includes(id)) {
      state.progress.mastered.push(id);
      grantXp(10, { bladeWork: 10, mentalGame: 3 }, "Flashcards");
      trackFlashcardProgress();
    }
    trackLearningActivity("flashcard", card, { mastered: true, source: "Flashcards" });
    renderFlashcard();
  });
  els.quizDifficulty.addEventListener("change", () => { state.quizDifficulty = els.quizDifficulty.value; resetQuiz(); });
  $("restartQuiz").addEventListener("click", resetQuiz);
  els.nextQuestion.addEventListener("click", () => { state.quizIndex += 1; renderQuiz(); });
  els.scenarioDifficulty.addEventListener("change", () => { state.scenarioDifficulty = els.scenarioDifficulty.value; state.scenarioIndex = 0; renderScenario(); });
  els.scenarioPack.addEventListener("change", () => { state.scenarioPack = els.scenarioPack.value; state.scenarioIndex = 0; renderScenario(); });
  $("replayScenario").addEventListener("click", renderScenario);
  els.nextScenario.addEventListener("click", () => { state.scenarioIndex += 1; renderScenario(); });
  els.activePathSelect.addEventListener("change", () => {
    setActivePath(state.progress, els.activePathSelect.value);
    saveProgress();
  });
  document.addEventListener("click", (event) => {
    const reviewButton = event.target.closest("[data-review-target]");
    if (reviewButton) {
      event.preventDefault();
      navigateReviewRecommendation(reviewButton);
      return;
    }
    const myTrainingAction = event.target.closest("[data-my-training-action]");
    if (myTrainingAction) {
      event.preventDefault();
      handleMyTrainingAction(myTrainingAction.dataset.myTrainingAction);
      return;
    }
    const guideComplete = event.target.closest("[data-guide-session-complete]");
    if (guideComplete) {
      event.preventDefault();
      const currentStep = state.progress.learningProfile.activeSession?.steps[state.progress.learningProfile.activeSession.currentStep];
      if (currentStep?.type === "guide" && guideComplete.dataset.guideSessionComplete === currentStep.id) {
        completeSessionStep({ type: "guide", contentId: currentStep.contentId });
      }
      return;
    }
    const sessionContinue = event.target.closest("[data-session-continue]");
    if (sessionContinue) {
      event.preventDefault();
      continuePersonalizedActivity(sessionContinue.dataset.sessionContinue);
      return;
    }
    const sessionRetry = event.target.closest("[data-session-retry]");
    if (sessionRetry) {
      event.preventDefault();
      retryPersonalizedActivity(sessionRetry.dataset.sessionRetry);
      return;
    }
    const sessionStep = event.target.closest("[data-session-step]");
    if (sessionStep) {
      event.preventDefault();
      navigateSessionStep(sessionStep.dataset.sessionStep);
      return;
    }
    const pathSelect = event.target.closest("[data-path-select]");
    if (pathSelect) {
      setActivePath(state.progress, pathSelect.dataset.pathSelect);
      saveProgress();
      return;
    }
    const trainingStepAction = event.target.closest("[data-training-step-action]");
    if (trainingStepAction) {
      event.preventDefault();
      navigateTrainingStep(trainingStepAction.dataset.trainingStepAction, trainingStepAction.dataset.view || "hub");
      return;
    }
    const manualComplete = event.target.closest("[data-path-step-complete]");
    if (manualComplete) {
      const [pathId, stepId] = manualComplete.dataset.pathStepComplete.split(":");
      completeTrainingPathStep(pathId, stepId);
      return;
    }
    const pathView = event.target.closest(".path-step [data-view]");
    if (pathView) {
      event.preventDefault();
      showView(pathView.dataset.view);
    }
  });
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
      btn.dataset.group = action.group;
      btn.innerHTML = `<i>${actionIcon(action.name, action.group)}</i><span>${action.name}</span><small>${action.key}</small>`;
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
  els.simulatorMode.addEventListener("change", updateSimulatorSetupMode);
  document.querySelectorAll("[data-duel-plan-action]").forEach((btn) => {
    btn.addEventListener("click", () => queueDuelAction(btn.dataset.duelPlanAction));
  });
  els.lockDuelPlan.addEventListener("click", lockDuelPlan);
  els.duelPlayerReady.addEventListener("click", startPlayerTwoPlanning);
  els.clearDuelPlan.addEventListener("click", clearDuelPlan);
  els.startMatch.addEventListener("click", () => {
    if (els.simulatorMode.value === "duel") startDuelMatch();
    else resetMatch();
  });
  els.nextExchange.addEventListener("click", nextExchange);
  $("replayExchange").addEventListener("click", replayExchange);
  $("resetMatch").addEventListener("click", returnToMatchSetup);
  els.resetDuel.addEventListener("click", resetDuel);
  els.analysisResetMatch.addEventListener("click", returnToMatchSetup);
  $("resetAll").addEventListener("click", () => {
    state.progress = normalizeProgress({ ...defaultProgress, mastered: [] });
    saveProgress();
    renderFlashcard();
    showProfileSetupIfNeeded();
  });
}

function actionIcon(action, group) {
  if (group === "Movement") return action.includes("Retreat") || action.includes("Out") ? "↔" : "→";
  if (group === "Preparation") {
    if (action === "Feint") return "◎";
    if (action === "Bait") return "◇";
    if (action === "Beat") return "▰";
    return "◷";
  }
  if (action === "Parry-Riposte") return "▰";
  if (action === "Counterattack") return "↩";
  if (action === "Fleche") return "⚡";
  return "◆";
}

renderGuide();
bindEvents();
renderProgress();
renderTrainingPath();
renderRecentMatchReviews();
renderPersonalizedTraining();
renderFlashcard();
renderQuiz();
renderScenario();
updateSimulatorSetupMode();
showMatchSetup();
showProfileSetupIfNeeded();
