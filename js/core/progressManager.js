import { defaultSkills } from "../data/skillData.js";
import { defaultTrainingPathState, normalizeTrainingPathState } from "./trainingPathManager.js";

export const storeKey = "fencingIqEpeeAcademy";

export const defaultProgress = {
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
  trainingHistory: {},
  trainingPath: defaultTrainingPathState()
};

export function normalizeProgress(progress = {}) {
  const profile = progress.profile ? {
    ...progress.profile,
    avatar: progress.profile.avatar || "Beginner Fencer",
    avatarId: progress.profile.avatarId || legacyAvatarId(progress.profile.avatar)
  } : null;
  const normalized = {
    ...defaultProgress,
    ...progress,
    mastered: Array.isArray(progress.mastered) ? progress.mastered : [],
    skills: { ...defaultSkills, ...(progress.skills || {}) },
    unlocked: Array.isArray(progress.unlocked) ? progress.unlocked : [],
    trainingHistory: { ...(progress.trainingHistory || {}) },
    trainingPath: normalizeTrainingPathState(progress.trainingPath, profile),
    profile
  };
  normalized.trainingPath.stats.flashcardsMastered = Math.max(
    normalized.trainingPath.stats.flashcardsMastered || 0,
    normalized.mastered.length
  );
  return normalized;
}

export function loadProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(storeKey)) || {};
    return normalizeProgress({ ...defaultProgress, ...saved, trainingPath: saved.trainingPath });
  } catch {
    return normalizeProgress(defaultProgress);
  }
}

export function saveProgress(progress) {
  const normalized = normalizeProgress(progress);
  localStorage.setItem(storeKey, JSON.stringify(normalized));
  return normalized;
}

export function level(progress) { return Math.floor(progress.xp / 100) + 1; }
export function accuracy(progress) { return progress.quizAnswered ? Math.round(progress.quizCorrect / progress.quizAnswered * 100) : 0; }
export function xpInLevel(progress) { return progress.xp % 100; }
export function winRate(progress) { return progress.matches ? Math.round((progress.wins / progress.matches) * 100) : 0; }
export function averageRating(progress) { return progress.ratingCount ? Math.round(progress.ratingTotal / progress.ratingCount) : 0; }
export function skillLevel(progress, skill) { return Math.floor((progress.skills[skill] || 0) / 100) + 1; }
export function skillProgress(progress, skill) { return (progress.skills[skill] || 0) % 100; }

export function createProfileData(data) {
  return {
    name: data.name,
    weapon: data.weapon,
    experience: data.experience,
    years: data.years,
    goal: data.goal,
    style: data.style,
    avatar: "Beginner Fencer",
    avatarId: data.avatarId || "classic-epee"
  };
}

function legacyAvatarId(avatar = "Beginner Fencer") {
  const map = {
    "Beginner Fencer": "classic-epee",
    "Tactical Fencer": "tactical-fencer",
    "Aggressive Fencer": "aggressive-fencer",
    "Defensive Fencer": "defensive-fencer",
    "Champion Fencer": "competition-fencer"
  };
  return map[avatar] || "classic-epee";
}
