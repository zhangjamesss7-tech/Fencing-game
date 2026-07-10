import { actionAliases, drillActions } from "../data/gameConfig.js";

export function actionMeta(action) {
  return drillActions.find((item) => item.name === action) || { name: action, risk: 2, unlock: 1, group: "Action" };
}

export function isActionUnlocked(action, unlockLevel) {
  return unlockLevel >= actionMeta(action).unlock;
}

export function isFinishAction(action) {
  return actionMeta(action).group === "Finish";
}

export function sequenceRisk(sequence = []) {
  return sequence.reduce((sum, action) => sum + actionMeta(action).risk, 0);
}

export function riskLabel(risk) {
  if (risk <= 2) return "Low risk";
  if (risk <= 5) return "Medium commitment";
  if (risk <= 7) return "High commitment";
  return "Overcommitted";
}

export function finalActionFromSequence(sequence) {
  const finish = [...sequence].reverse().find(isFinishAction);
  return actionAliases[finish] || finish || actionAliases[sequence.at(-1)] || sequence.at(-1) || "Hold Distance";
}

export function adjustMatchDistance(match, action) {
  if (action === "Advance") match.distance = Math.max(1, match.distance - 1);
  if (action === "Half Step") match.distance = Math.max(1, match.distance - 0.5);
  if (action === "Half Step In") match.distance = Math.max(1, match.distance - 0.5);
  if (action === "Half Step Out") match.distance = Math.min(5, match.distance + 0.5);
  if (action === "Half Step Forward") match.distance = Math.max(1, match.distance - 0.5);
  if (action === "Retreat") match.distance = Math.min(5, match.distance + 1);
  if (action === "Half Step Back") match.distance = Math.min(5, match.distance + 0.5);
  if (action === "Lunge") match.distance = Math.max(1, match.distance - 1);
  if (action === "Step-Lunge" || action === "Direct Attack") match.distance = Math.max(1, match.distance - 1.5);
  if (action === "Fleche") match.distance = Math.max(1, match.distance - 2);
  if (action === "Hold Distance") match.distance = Math.min(5, Math.max(2, match.distance));
  if (action === "Bait" || action === "Invite Attack") match.distance = Math.max(1, match.distance - 0.5);
  if (action === "Duck / Evasive Action") match.distance = Math.min(5, match.distance + 0.5);
}

export function reverseMatchDistance(match, action) {
  if (action === "Advance") match.distance = Math.min(5, match.distance + 1);
  if (action === "Half Step" || action === "Half Step In" || action === "Half Step Forward") match.distance = Math.min(5, match.distance + 0.5);
  if (action === "Retreat") match.distance = Math.max(1, match.distance - 1);
  if (action === "Half Step Out" || action === "Half Step Back") match.distance = Math.max(1, match.distance - 0.5);
  if (action === "Bait" || action === "Invite Attack") match.distance = Math.min(5, match.distance + 0.5);
  if (action === "Duck / Evasive Action") match.distance = Math.max(1, match.distance - 0.5);
}

export function adjustDistanceForAi(match, aiAction) {
  if (aiAction === "Attack") match.distance = Math.max(1, match.distance - 1);
  if (aiAction === "Retreat") match.distance = Math.min(5, match.distance + 1);
  if (aiAction === "Hold Distance") match.distance = Math.min(5, Math.max(2, match.distance));
}
