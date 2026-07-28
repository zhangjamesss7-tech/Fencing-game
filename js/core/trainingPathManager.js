import { trainingPaths } from "../data/trainingPaths.js";

export function defaultTrainingPathState(profile = null) {
  return {
    activePath: pathForExperience(profile?.experience),
    completedSteps: {},
    completedPaths: [],
    stepRewardsClaimed: [],
    pathRewardsClaimed: [],
    stats: {
      guideViews: [],
      flashcardsMastered: 0,
      scenarios: { Beginner: 0, Intermediate: 0, Advanced: 0 },
      quizCompleted: { Beginner: 0, Intermediate: 0, Advanced: 0 },
      aiMatches: 0,
      aiOpponentTypes: [],
      localDuelExchanges: 0,
      localDuelMatches: 0,
      progressReviewed: false,
      skillTreeReviewed: false
    }
  };
}

export function pathForExperience(experience = "Beginner") {
  if (experience === "Advanced") return "advanced";
  if (experience === "Intermediate") return "intermediate";
  return "beginner";
}

export function normalizeTrainingPathState(state = {}, profile = null) {
  state = state || {};
  const base = defaultTrainingPathState(profile);
  return {
    ...base,
    ...state,
    activePath: state.activePath || base.activePath,
    completedSteps: { ...(state.completedSteps || {}) },
    completedPaths: Array.isArray(state.completedPaths) ? state.completedPaths : [],
    stepRewardsClaimed: Array.isArray(state.stepRewardsClaimed) ? state.stepRewardsClaimed : [],
    pathRewardsClaimed: Array.isArray(state.pathRewardsClaimed) ? state.pathRewardsClaimed : [],
    stats: {
      ...base.stats,
      ...(state.stats || {}),
      guideViews: Array.isArray(state.stats?.guideViews) ? state.stats.guideViews : [],
      scenarios: { ...base.stats.scenarios, ...(state.stats?.scenarios || {}) },
      quizCompleted: { ...base.stats.quizCompleted, ...(state.stats?.quizCompleted || {}) },
      aiOpponentTypes: Array.isArray(state.stats?.aiOpponentTypes) ? state.stats.aiOpponentTypes : []
    }
  };
}

export function setActivePath(progress, pathId) {
  if (!trainingPaths[pathId]) return progress.trainingPath.activePath;
  progress.trainingPath.activePath = pathId;
  return pathId;
}

export function pathProgress(progress, pathId) {
  const path = trainingPaths[pathId];
  if (!path) return { completed: 0, total: 0, percent: 0 };
  const completed = path.steps.filter((step) => isStepComplete(progress, pathId, step.id)).length;
  const total = path.steps.length;
  return { completed, total, percent: total ? Math.round((completed / total) * 100) : 0 };
}

export function nextStep(progress, pathId = progress.trainingPath.activePath) {
  const path = trainingPaths[pathId];
  if (!path) return null;
  return path.steps.find((step) => !isStepComplete(progress, pathId, step.id)) || null;
}

export function isStepComplete(progress, pathId, stepId) {
  return Boolean(progress.trainingPath.completedSteps?.[`${pathId}:${stepId}`]);
}

export function setStepComplete(progress, pathId, stepId) {
  progress.trainingPath.completedSteps[`${pathId}:${stepId}`] = true;
}

export function evaluateTrainingPaths(progress) {
  const completions = [];
  Object.entries(trainingPaths).forEach(([pathId, path]) => {
    path.steps.forEach((step) => {
      if (!isStepComplete(progress, pathId, step.id) && meetsStepRequirement(progress, step.id)) {
        setStepComplete(progress, pathId, step.id);
        completions.push({ type: "step", pathId, step });
      }
    });
    const status = pathProgress(progress, pathId);
    if (status.total && status.completed === status.total && !progress.trainingPath.completedPaths.includes(pathId)) {
      progress.trainingPath.completedPaths.push(pathId);
      completions.push({ type: "path", pathId, path });
    }
  });
  return completions;
}

function meetsStepRequirement(progress, stepId) {
  const stats = progress.trainingPath.stats;
  if (stepId === "guide-fundamentals") return stats.guideViews.includes("guide-fundamentals");
  if (stepId === "guide-distance") return stats.guideViews.includes("guide-distance");
  if (stepId === "guide-tactics") return stats.guideViews.includes("guide-tactics");
  if (stepId === "flashcards-10" || stepId === "flashcards-technique-10") return stats.flashcardsMastered >= 10;
  if (stepId === "scenarios-beginner-5") return stats.scenarios.Beginner >= 5;
  if (stepId === "scenarios-intermediate-10") return stats.scenarios.Intermediate >= 10;
  if (stepId === "scenarios-advanced-10") return stats.scenarios.Advanced >= 10;
  if (stepId === "quiz-beginner-1") return stats.quizCompleted.Beginner >= 1;
  if (stepId === "ai-match-1") return stats.aiMatches >= 1;
  if (stepId === "ai-matches-2") return stats.aiMatches >= 2;
  if (stepId === "ai-opponent-types-3") return stats.aiOpponentTypes.length >= 3;
  if (stepId === "local-duel-1" || stepId === "local-duel-complete-1") return stats.localDuelExchanges >= 1 || stats.localDuelMatches >= 1;
  if (stepId === "local-duel-match-1") return stats.localDuelMatches >= 1;
  if (stepId === "progress-review") return stats.progressReviewed;
  if (stepId === "rating-70") return progress.tacticalRating >= 70;
  if (stepId === "skill-tree-review") return stats.skillTreeReviewed;
  return false;
}
