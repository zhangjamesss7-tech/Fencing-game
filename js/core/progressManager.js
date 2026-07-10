import { defaultSkills } from "../data/skillData.js";

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
  trainingHistory: {}
};

export function normalizeProgress(progress = {}) {
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

export function loadProgress() {
  try {
    return normalizeProgress({ ...defaultProgress, ...JSON.parse(localStorage.getItem(storeKey)) });
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
    avatar: "Beginner Fencer"
  };
}
