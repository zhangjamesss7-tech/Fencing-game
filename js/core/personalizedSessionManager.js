import { contentLibrary, difficultyOrder } from "../data/contentMetadata.js";
import { activeMistakePatterns, adaptiveDifficulty, masteryBand, skillLabel, strongestSkills, weakestSkills } from "./learningProfileManager.js";

export function trainingToday(progress) {
  const completedToday = isDailySessionCompleteToday(progress);
  const extraCompletedToday = isExtraPracticeCompleteToday(progress);
  const previewMode = completedToday && !extraCompletedToday ? "extra" : "daily";
  const session = progress.learningProfile?.activeSession || generatePersonalizedSession(progress, { preview: true, mode: previewMode });
  const activeResume = Boolean(progress.learningProfile?.activeSession && !progress.learningProfile.activeSession.completed);
  return {
    focus: skillLabel(session.focusSkill),
    stepCount: session.steps.length,
    estimatedMinutes: session.estimatedMinutes,
    isResume: activeResume,
    completedToday,
    extraCompletedToday,
    currentStep: session.currentStep || 0,
    title: session.title
  };
}

export function startPersonalizedSession(progress, preference = "auto", mode = "daily") {
  const sessionMode = isDailySessionCompleteToday(progress) && mode === "daily" ? "extra" : mode;
  if (sessionMode === "daily" && isDailySessionCompleteToday(progress)) return progress.learningProfile.activeSession;
  if (sessionMode === "extra" && isExtraPracticeCompleteToday(progress)) return progress.learningProfile.activeSession;
  progress.learningProfile.activeSession = generatePersonalizedSession(progress, { preference, mode: sessionMode });
  progress.learningProfile.lastSessionDate = new Date().toISOString();
  return progress.learningProfile.activeSession;
}

export function resumeOrStartSession(progress, mode = "daily") {
  return progress.learningProfile.activeSession || startPersonalizedSession(progress, "auto", mode);
}

export function generatePersonalizedSession(progress, options = {}) {
  const learningProfile = progress.learningProfile;
  const weakest = weakestSkills(learningProfile, 2);
  const strongest = strongestSkills(learningProfile, 1);
  const mistakes = activeMistakePatterns(learningProfile, 3);
  const reviewFocus = focusFromMatchReviews(progress.matchReviews || []);
  const focusSkill = reviewFocus || weakest[0]?.skill || "distanceControl";
  const secondSkill = weakest.find((item) => item.skill !== focusSkill)?.skill || weakest[1]?.skill || "timing";
  const strengthSkill = strongest[0]?.skill || "bladeWork";
  const difficulty = adjustedDifficulty(learningProfile, progress.profile, options.preference);
  const recent = new Set(learningProfile.recentContentIds || []);
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const steps = [
    pickStep({ focusSkill, difficulty, recent, type: "guide", reason: reasonForFocus(progress, focusSkill, mistakes), slot: "weakest-foundation" }),
    pickStep({ focusSkill, difficulty, recent, type: "scenario", reason: reasonForFocus(progress, focusSkill, mistakes), slot: "weakest-practice" }),
    pickStep({ focusSkill: secondSkill, difficulty, recent, type: "quiz", reason: `Recommended because ${skillLabel(secondSkill)} is your next lowest mastery area.`, slot: "second-skill" }),
    pickStep({ focusSkill, difficulty, recent, type: "flashcard", reason: overdueReason(learningProfile, focusSkill), slot: "overdue-review" }),
    pickStep({ focusSkill: strengthSkill, difficulty, recent, type: "match", reason: `Recommended because match practice turns ${skillLabel(focusSkill)} work into bout decisions.`, slot: "match-application" })
  ].filter(Boolean);

  return {
    id: sessionId,
    title: options.mode === "extra" ? "Extra Practice" : `${progress.profile?.name || "Your"} Training Session`,
    mode: options.mode || "daily",
    focusSkill,
    secondSkill,
    difficulty,
    createdAt: new Date().toISOString(),
    currentStep: 0,
    completed: false,
    completionRewardClaimed: false,
    estimatedMinutes: steps.reduce((sum, step) => sum + step.estimatedMinutes, 0),
    steps: steps.map((step, index) => ({ ...step, index, completed: false }))
  };
}

export function completeCurrentSessionStep(progress, matcher = {}) {
  const session = progress.learningProfile?.activeSession;
  if (!session || session.completed) return null;
  const step = session.steps[session.currentStep];
  if (!step || step.completed) return null;
  if (!stepMatches(step, matcher)) return null;
  step.completed = true;
  step.completedAt = new Date().toISOString();
  if (step.contentId) {
    progress.learningProfile.recentContentIds = [step.contentId, ...(progress.learningProfile.recentContentIds || []).filter((id) => id !== step.contentId)].slice(0, 18);
  }
  const nextIndex = session.steps.findIndex((item) => !item.completed);
  session.currentStep = nextIndex === -1 ? session.steps.length : nextIndex;
  if (nextIndex === -1) {
    session.completed = true;
    session.completedAt = new Date().toISOString();
    if (session.mode !== "extra") {
      progress.learningProfile.dailySessionCompletedDate = localDateKey();
    } else {
      progress.learningProfile.extraPracticeCompletedDate = localDateKey();
    }
    progress.learningProfile.completedSessions.unshift(sessionSummary(session));
    progress.learningProfile.completedSessions = progress.learningProfile.completedSessions.slice(0, 12);
  }
  return step;
}

export function exitSession(progress) {
  if (progress.learningProfile?.activeSession) {
    progress.learningProfile.activeSession.pausedAt = new Date().toISOString();
  }
}

export function clearCompletedSession(progress) {
  if (progress.learningProfile?.activeSession?.completed) {
    progress.learningProfile.activeSession = null;
  }
}

export function sessionSummary(session) {
  const skills = [...new Set(session.steps.flatMap((step) => step.skills || []))];
  return {
    id: session.id,
    title: session.title,
    mode: session.mode || "daily",
    focusSkill: session.focusSkill,
    difficulty: session.difficulty,
    completedAt: session.completedAt || new Date().toISOString(),
    activityCount: session.steps.length,
    estimatedMinutes: session.estimatedMinutes,
    skills,
    accuracy: sessionAccuracy(session)
  };
}

export function isDailySessionCompleteToday(progress, dateKey = localDateKey()) {
  return progress.learningProfile?.dailySessionCompletedDate === dateKey;
}

export function hasClaimedDailySessionReward(progress, dateKey = localDateKey()) {
  return progress.learningProfile?.dailySessionRewardClaimedDate === dateKey;
}

export function isExtraPracticeCompleteToday(progress, dateKey = localDateKey()) {
  return progress.learningProfile?.extraPracticeCompletedDate === dateKey;
}

export function markDailySessionRewardClaimed(progress, dateKey = localDateKey()) {
  progress.learningProfile.dailySessionRewardClaimedDate = dateKey;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sessionAccuracy(session) {
  const completed = session.steps.filter((step) => step.completed).length;
  return session.steps.length ? Math.round(completed / session.steps.length * 100) : 0;
}

export function masterySnapshot(progress) {
  const mastery = progress.learningProfile?.skillMastery || {};
  return Object.entries(mastery).map(([skill, data]) => ({
    skill,
    label: skillLabel(skill),
    score: data.score,
    band: masteryBand(data.score),
    lastPractised: data.lastPractised
  })).sort((a, b) => a.score - b.score);
}

function pickStep({ focusSkill, difficulty, recent, type, reason, slot }) {
  const candidates = contentLibrary.filter((item) => {
    const typeMatch = item.type === type;
    const skillMatch = item.skills.includes(focusSkill);
    const difficultyMatch = difficultyAllowed(item.difficulty, difficulty);
    const notRecent = !recent.has(item.id);
    return typeMatch && skillMatch && difficultyMatch && notRecent;
  });
  const fallback = contentLibrary.filter((item) => item.type === type && item.skills.includes(focusSkill));
  const item = candidates[0] || fallback[0] || contentLibrary.find((entry) => entry.type === type);
  if (!item) return null;
  recent.add(item.id);
  return {
    id: `${slot}-${item.id}`,
    contentId: item.id,
    type: item.type,
    title: titleForStep(item),
    actionLabel: actionLabel(item.type),
    target: item.target,
    difficulty: item.difficulty,
    packId: item.packId || "",
    skills: item.skills,
    mistakeTypes: item.mistakeTypes,
    estimatedMinutes: item.estimatedMinutes,
    reason
  };
}

function stepMatches(step, matcher) {
  if (matcher.contentId && matcher.contentId === step.contentId) return true;
  if (matcher.type && matcher.type === step.type && !matcher.contentId) return true;
  if (matcher.type === "match" && step.type === "match") return true;
  return false;
}

function titleForStep(item) {
  if (item.type === "scenario") return item.displayTitle || "Choose Your Tactical Response";
  if (item.type === "quiz") return `Answer: ${item.title}`;
  if (item.type === "flashcard") return `Review: ${item.title}`;
  if (item.type === "guide") return `Review: ${item.title}`;
  return item.title;
}

function actionLabel(type) {
  const labels = {
    guide: "Open Lesson",
    scenario: "Train Scenario",
    quiz: "Answer Question",
    flashcard: "Review Card",
    match: "Start Match"
  };
  return labels[type] || "Start";
}

function adjustedDifficulty(learningProfile, profile, preference = "auto") {
  const base = adaptiveDifficulty(learningProfile, profile);
  if (preference === "easier") {
    if (base === "Advanced") return "Intermediate";
    return "Beginner";
  }
  if (preference === "harder") {
    if (base === "Beginner") return "Intermediate";
    return "Advanced";
  }
  return base;
}

function difficultyAllowed(itemDifficulty, preferred) {
  return difficultyOrder.indexOf(itemDifficulty) <= difficultyOrder.indexOf(preferred);
}

function focusFromMatchReviews(reviews = []) {
  const latest = reviews[0];
  if (!latest?.ratings) return null;
  const ratingToSkill = {
    distance: "distanceControl",
    timing: "timing",
    tactical: "tacticalIq",
    adaptability: "mentalGame"
  };
  const weakest = Object.entries(latest.ratings).sort((a, b) => a[1] - b[1])[0];
  return weakest ? ratingToSkill[weakest[0]] : null;
}

function reasonForFocus(progress, focusSkill, mistakes) {
  const review = progress.matchReviews?.[0];
  const relatedMistake = mistakes.find((mistake) => mistake.relatedSkills?.includes(focusSkill));
  if (review?.ratings) {
    return `Recommended because your latest Match Review points toward ${skillLabel(focusSkill)}.`;
  }
  if (relatedMistake) {
    return `Recommended because ${relatedMistake.label.toLowerCase()} has appeared ${relatedMistake.count} times.`;
  }
  return `Recommended because ${skillLabel(focusSkill)} is your lowest current mastery area.`;
}

function overdueReason(learningProfile, focusSkill) {
  const mastery = learningProfile.skillMastery?.[focusSkill];
  if (!mastery?.lastPractised) return `Recommended because ${skillLabel(focusSkill)} needs an initial review checkpoint.`;
  const days = Math.max(1, Math.round((Date.now() - new Date(mastery.lastPractised).getTime()) / 86400000));
  return `Recommended because ${skillLabel(focusSkill)} has not been practised in ${days} day${days === 1 ? "" : "s"}.`;
}
