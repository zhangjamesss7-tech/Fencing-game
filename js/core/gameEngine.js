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

export function actionCommitment(action) {
  if (["Half Step In", "Half Step Out", "Hold Distance", "Change Rhythm"].includes(action)) return 1;
  if (["Advance", "Retreat", "Feint", "Bait", "Beat"].includes(action)) return 2;
  if (["Lunge", "Step-Lunge", "Fleche", "Counterattack", "Parry-Riposte"].includes(action)) return 3;
  return 1;
}

export function sequenceCommitment(sequence = []) {
  return sequence.reduce((sum, action) => sum + actionCommitment(action), 0);
}

export function opponentState(aiAction) {
  if (aiAction === "Attack") return "Attacking";
  if (aiAction === "Retreat") return "Retreating";
  if (aiAction === "Counterattack") return "Counterattacking";
  if (aiAction === "Feint") return "Feinting";
  if (aiAction === "Hold Distance") return "Preparing";
  return "Observing";
}

export function distanceProfile(distance) {
  const key = Math.max(1, Math.min(5, Math.round(distance)));
  return {
    5: { key, label: "too far", attack: -6, defense: 3, note: "direct attacks usually need preparation from distance 5" },
    4: { key, label: "long measure", attack: -2, defense: 2, note: "long measure rewards step-lunge, fleche, or patient preparation" },
    3: { key, label: "middle distance", attack: 3, defense: 2, note: "middle distance supports most tactical choices" },
    2: { key, label: "close distance", attack: 2, defense: 1, note: "close distance raises double-touch risk" },
    1: { key, label: "dangerously close", attack: -3, defense: 4, note: "dangerously close distance rewards compact defense and timing" }
  }[key];
}

export function scoreContext(match) {
  const finalTouch = match.mode !== "training" && match.player >= 4 && match.opponent >= 4;
  if (finalTouch && match.player === match.opponent) return { label: "final-touch tie", safeBonus: 3, riskPenalty: 5 };
  if (match.player > match.opponent) return { label: "ahead", safeBonus: 2, riskPenalty: 3 };
  if (match.player < match.opponent) return { label: "behind", safeBonus: 0, riskPenalty: 1 };
  return { label: "tied", safeBonus: 1, riskPenalty: 2 };
}

export function evaluatePlanQuality(sequence = [], aiAction, distance, match) {
  const finalAction = finalActionFromSequence(sequence);
  const distanceInfo = distanceProfile(distance);
  const context = scoreContext(match);
  const hasFinish = sequence.some(isFinishAction);
  const hasBladePrep = sequence.some((action) => ["Feint", "Beat"].includes(action));
  const hasFootPrep = sequence.some((action) => ["Half Step In", "Half Step Out", "Advance", "Retreat"].includes(action));
  const hasTempoPrep = sequence.includes("Change Rhythm");
  const hasBaitTrap = sequence.includes("Bait") && sequence.includes("Retreat");
  const commitment = sequenceCommitment(sequence);
  const opponent = opponentState(aiAction);
  const notes = [];
  let quality = 0;

  if (hasFootPrep) {
    quality += 2;
    notes.push("your footwork changed the measure before the finish");
  }
  if (hasBladePrep) {
    quality += 2;
    notes.push("your blade preparation asked the opponent to react first");
  }
  if (hasTempoPrep) {
    quality += 2;
    notes.push("your rhythm change made the timing less predictable");
  }
  if (hasBaitTrap && aiAction === "Attack") {
    quality += 5;
    notes.push("the bait-retreat sequence invited commitment and opened counterattack timing");
  }
  if (hasFinish) quality += distanceInfo.attack;
  else quality += Math.max(0, distanceInfo.defense - 1);

  if (finalAction === "Lunge") {
    if (distanceInfo.key === 3 && (hasBladePrep || hasFootPrep)) quality += 4;
    if (distanceInfo.key >= 4 && !hasFootPrep) quality -= 5;
    if (aiAction === "Counterattack") quality -= 4;
  }
  if (finalAction === "Step-Lunge") {
    if ([3, 4].includes(distanceInfo.key) && (hasFootPrep || hasTempoPrep)) quality += 4;
    if (aiAction === "Counterattack") quality -= 3;
  }
  if (finalAction === "Fleche") {
    if (["Retreat", "Hold Distance", "Feint"].includes(aiAction) && distanceInfo.key >= 3) quality += 3;
    if (distanceInfo.key <= 1) quality -= 6;
    if (context.label === "ahead" || context.label === "final-touch tie") quality -= context.riskPenalty;
  }
  if (finalAction === "Counterattack") {
    if (aiAction === "Attack") quality += 6;
    else quality -= 5;
    if (distanceInfo.key <= 2) quality -= 1;
  }
  if (finalAction === "Parry-Riposte") {
    if (aiAction === "Attack") quality += 6;
    if (aiAction === "Feint") quality -= 5;
  }
  if (["Retreat", "Half Step Out", "Hold Distance"].includes(finalAction) && aiAction === "Attack") {
    quality += 4 + context.safeBonus;
  }
  if (sequence.filter((action) => ["Advance", "Lunge", "Step-Lunge", "Fleche"].includes(action)).length >= 2 && !hasBladePrep && !hasTempoPrep) {
    quality -= 4;
    notes.push("the plan was direct enough for the opponent to time");
  }
  if (commitment >= 7 && !hasBaitTrap) {
    quality -= context.riskPenalty;
    notes.push(`${context.label} score context makes unnecessary commitment more expensive`);
  }

  return { quality, commitment, opponent, distanceInfo, context, notes };
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
