import { learningSkills } from "../data/contentMetadata.js";

export const masteryConfig = {
  startingScore: 50,
  maxRecentAttempts: 60,
  maxRecentContentIds: 18,
  confidenceCorrect: 0.08,
  confidenceIncorrect: -0.05,
  repeatPenalty: 0.35,
  difficultyDelta: {
    Beginner: { correct: 3, incorrect: -1 },
    Intermediate: { correct: 5, incorrect: -2 },
    Advanced: { correct: 7, incorrect: -3 }
  },
  matchReviewWeight: {
    strong: 3,
    weak: -3
  }
};

export function defaultLearningProfile(profile = null) {
  return {
    profileId: profile?.profileId || createProfileId(),
    skillMastery: Object.fromEntries(learningSkills.map((skill) => [skill, defaultMastery()])),
    mistakePatterns: {},
    recentContentIds: [],
    recentAttempts: [],
    completedSessions: [],
    activeSession: null,
    dailySessionCompletedDate: null,
    dailySessionRewardClaimedDate: null,
    extraPracticeCompletedDate: null,
    preferredDifficulty: preferredDifficultyFromProfile(profile),
    lastSessionDate: null,
    currentFocus: "distanceControl"
  };
}

export function normalizeLearningProfile(learningProfile = {}, profile = null) {
  const base = defaultLearningProfile(profile);
  const skillMastery = { ...base.skillMastery };
  Object.entries(learningProfile.skillMastery || {}).forEach(([skill, value]) => {
    if (!skillMastery[skill]) skillMastery[skill] = defaultMastery();
    skillMastery[skill] = normalizeMastery(value);
  });
  return {
    ...base,
    ...learningProfile,
    profileId: learningProfile.profileId || profile?.profileId || base.profileId,
    skillMastery,
    mistakePatterns: normalizeMistakePatterns(learningProfile.mistakePatterns),
    recentContentIds: Array.isArray(learningProfile.recentContentIds) ? learningProfile.recentContentIds.slice(0, masteryConfig.maxRecentContentIds) : [],
    recentAttempts: Array.isArray(learningProfile.recentAttempts) ? learningProfile.recentAttempts.slice(0, masteryConfig.maxRecentAttempts) : [],
    completedSessions: Array.isArray(learningProfile.completedSessions) ? learningProfile.completedSessions.slice(0, 12) : [],
    activeSession: learningProfile.activeSession || null,
    dailySessionCompletedDate: learningProfile.dailySessionCompletedDate || null,
    dailySessionRewardClaimedDate: learningProfile.dailySessionRewardClaimedDate || null,
    extraPracticeCompletedDate: learningProfile.extraPracticeCompletedDate || null,
    preferredDifficulty: learningProfile.preferredDifficulty || preferredDifficultyFromProfile(profile),
    lastSessionDate: learningProfile.lastSessionDate || null,
    currentFocus: learningProfile.currentFocus || base.currentFocus
  };
}

export function recordActivityAttempt(progress, metadata, result = {}) {
  if (!metadata) return null;
  progress.learningProfile = normalizeLearningProfile(progress.learningProfile, progress.profile);
  const profile = progress.learningProfile;
  const correct = Boolean(result.correct ?? result.mastered ?? result.viewed);
  const repeatedRecently = profile.recentContentIds.slice(0, 6).includes(metadata.id);
  const deltaScale = repeatedRecently ? masteryConfig.repeatPenalty : 1;
  const deltaRule = masteryConfig.difficultyDelta[metadata.difficulty] || masteryConfig.difficultyDelta.Beginner;
  const date = new Date().toISOString();
  const attempt = {
    id: `attempt-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    contentId: metadata.id,
    type: metadata.type,
    correct,
    difficulty: metadata.difficulty,
    skills: metadata.skills,
    mistakeTypes: result.mistakeTypes || (!correct ? metadata.mistakeTypes : []),
    date,
    source: result.source || metadata.type
  };

  metadata.skills.forEach((skill) => {
    const mastery = profile.skillMastery[skill] || defaultMastery();
    const delta = (correct ? deltaRule.correct : deltaRule.incorrect) * deltaScale;
    profile.skillMastery[skill] = {
      score: clamp(mastery.score + delta),
      confidence: clamp01(mastery.confidence + (correct ? masteryConfig.confidenceCorrect : masteryConfig.confidenceIncorrect)),
      attempts: mastery.attempts + 1,
      correct: mastery.correct + (correct ? 1 : 0),
      lastPractised: date
    };
  });

  attempt.mistakeTypes.forEach((mistake) => recordMistake(profile, mistake, metadata.skills, date));
  profile.recentAttempts.unshift(attempt);
  profile.recentAttempts = profile.recentAttempts.slice(0, masteryConfig.maxRecentAttempts);
  profile.recentContentIds = [metadata.id, ...profile.recentContentIds.filter((id) => id !== metadata.id)].slice(0, masteryConfig.maxRecentContentIds);
  profile.preferredDifficulty = adaptiveDifficulty(profile, progress.profile);
  profile.currentFocus = weakestSkills(profile, 1)[0]?.skill || profile.currentFocus;
  return attempt;
}

export function applyMatchReviewToLearningProfile(progress, review) {
  if (!review) return;
  progress.learningProfile = normalizeLearningProfile(progress.learningProfile, progress.profile);
  const profile = progress.learningProfile;
  const date = new Date().toISOString();
  const ratingToSkill = {
    distance: "distanceControl",
    timing: "timing",
    tactical: "tacticalIq",
    adaptability: "mentalGame"
  };
  Object.entries(review.ratings || {}).forEach(([rating, value]) => {
    const skill = ratingToSkill[rating];
    if (!skill) return;
    const mastery = profile.skillMastery[skill] || defaultMastery();
    const delta = value >= 75 ? masteryConfig.matchReviewWeight.strong : value < 55 ? masteryConfig.matchReviewWeight.weak : 0;
    profile.skillMastery[skill] = {
      score: clamp(mastery.score + delta),
      confidence: clamp01(mastery.confidence + 0.04),
      attempts: mastery.attempts + 1,
      correct: mastery.correct + (value >= 60 ? 1 : 0),
      lastPractised: date
    };
  });

  const metrics = review.metrics || {};
  if (metrics.poorDistanceAttacks >= 2 || metrics.fallsShort >= 2) recordMistake(profile, "attackingTooFar", ["distanceControl"], date, Math.max(metrics.poorDistanceAttacks || 0, metrics.fallsShort || 0));
  if (metrics.counterAttempts >= 2 && metrics.counterSuccesses === 0) recordMistake(profile, "counterattackingTooLate", ["timing"], date, metrics.counterAttempts);
  if (metrics.doubleTouches >= 2) recordMistake(profile, "creatingDoublesWhileLeading", ["scoreManagement", "mentalGame"], date, metrics.doubleTouches);
  if (metrics.repeatedAction?.item) recordMistake(profile, "repeatingSameFinish", ["opponentReading", "tacticalIq"], date, metrics.repeatedAction.count || 1);
  if (metrics.preparedAttacks < 2 && metrics.exchangeCount >= 4) recordMistake(profile, "attackingWithoutPreparation", ["tacticalIq", "timing"], date, 1);

  profile.currentFocus = weakestSkills(profile, 1)[0]?.skill || profile.currentFocus;
  profile.preferredDifficulty = adaptiveDifficulty(profile, progress.profile);
}

export function weakestSkills(learningProfile, count = 2) {
  const profile = normalizeLearningProfile(learningProfile);
  return Object.entries(profile.skillMastery)
    .map(([skill, mastery]) => ({ skill, ...mastery, label: skillLabel(skill), band: masteryBand(mastery.score) }))
    .sort((a, b) => a.score - b.score)
    .slice(0, count);
}

export function strongestSkills(learningProfile, count = 2) {
  const profile = normalizeLearningProfile(learningProfile);
  return Object.entries(profile.skillMastery)
    .map(([skill, mastery]) => ({ skill, ...mastery, label: skillLabel(skill), band: masteryBand(mastery.score) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

export function recentAccuracy(learningProfile, limit = 8) {
  const attempts = (learningProfile?.recentAttempts || []).slice(0, limit);
  if (!attempts.length) return null;
  return Math.round(attempts.filter((attempt) => attempt.correct).length / attempts.length * 100);
}

export function adaptiveDifficulty(learningProfile, profile = null) {
  const accuracy = recentAccuracy(learningProfile, 8);
  const current = learningProfile?.preferredDifficulty || preferredDifficultyFromProfile(profile);
  if (accuracy === null) return current;
  const enoughAttempts = (learningProfile.recentAttempts || []).length >= 4;
  if (accuracy < 50) return "Beginner";
  if (accuracy >= 80 && enoughAttempts) {
    if (current === "Beginner") return "Intermediate";
    if (current === "Intermediate") return "Advanced";
  }
  return current;
}

export function masteryBand(score = 0) {
  if (score < 40) return "Needs Foundations";
  if (score < 60) return "Developing";
  if (score < 80) return "Proficient";
  return "Strong";
}

export function skillLabel(skill) {
  const labels = {
    distanceControl: "Distance Control",
    timing: "Timing",
    bladeWork: "Blade Work",
    tacticalIq: "Tactical IQ",
    matchExperience: "Match Experience",
    mentalGame: "Mental Game",
    scoreManagement: "Score Management",
    opponentReading: "Opponent Reading"
  };
  return labels[skill] || skill;
}

export function activeMistakePatterns(learningProfile, limit = 4) {
  const patterns = Object.entries(learningProfile?.mistakePatterns || {})
    .map(([mistake, data]) => ({ mistake, label: mistakeLabel(mistake), ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
  return patterns;
}

export function mistakeLabel(mistake) {
  const labels = {
    attackingTooFar: "Attacking from too far",
    counterattackingTooLate: "Counterattacking too late",
    creatingDoublesWhileLeading: "Creating risky doubles",
    repeatingSameFinish: "Repeating the same finish",
    attackingWithoutPreparation: "Attacking without preparation",
    parryingBeforeCommitment: "Parrying before commitment",
    poorDistanceRecovery: "Poor distance recovery",
    failingToChangeRhythm: "Failing to change rhythm"
  };
  return labels[mistake] || mistake;
}

export function createProfileId() {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function preferredDifficultyFromProfile(profile = null) {
  const experience = profile?.experience || "Beginner";
  if (experience === "Advanced") return "Advanced";
  if (experience === "Intermediate") return "Intermediate";
  return "Beginner";
}

function defaultMastery() {
  return {
    score: masteryConfig.startingScore,
    confidence: 0,
    attempts: 0,
    correct: 0,
    lastPractised: null
  };
}

function normalizeMastery(value = {}) {
  return {
    score: clamp(Number.isFinite(value.score) ? value.score : masteryConfig.startingScore),
    confidence: clamp01(Number.isFinite(value.confidence) ? value.confidence : 0),
    attempts: Number.isFinite(value.attempts) ? value.attempts : 0,
    correct: Number.isFinite(value.correct) ? value.correct : 0,
    lastPractised: value.lastPractised || null
  };
}

function normalizeMistakePatterns(patterns = {}) {
  return Object.fromEntries(Object.entries(patterns).map(([mistake, value]) => [mistake, {
    count: Number.isFinite(value.count) ? value.count : 0,
    lastSeen: value.lastSeen || null,
    relatedSkills: Array.isArray(value.relatedSkills) ? value.relatedSkills : []
  }]));
}

function recordMistake(profile, mistake, relatedSkills = [], date = new Date().toISOString(), amount = 1) {
  const current = profile.mistakePatterns[mistake] || { count: 0, lastSeen: null, relatedSkills: [] };
  profile.mistakePatterns[mistake] = {
    count: current.count + amount,
    lastSeen: date,
    relatedSkills: [...new Set([...current.relatedSkills, ...relatedSkills])]
  };
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clamp01(value) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}
