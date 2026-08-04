export const reviewRules = {
  poorDistanceThreshold: 3,
  predictabilityShare: 0.4,
  strongCounterRate: 0.6,
  preparedAttackThreshold: 3,
  fallShortStrengthThreshold: 3,
  doubleTouchWarning: 2
};

const finishActions = ["Lunge", "Step-Lunge", "Fleche", "Counterattack", "Parry-Riposte"];
const attackActions = ["Lunge", "Step-Lunge", "Fleche"];

export function buildAiMatchReview(match) {
  const metrics = collectAiMetrics(match);
  const won = match.player > match.opponent;
  const tied = match.player === match.opponent;
  const review = {
    id: `ai-${Date.now()}`,
    date: new Date().toLocaleDateString(),
    matchType: "AI Match",
    result: tied ? "Draw" : won ? "Win" : "Loss",
    score: `${match.player}-${match.opponent}`,
    tacticalRating: metrics.tacticalRating,
    ratings: buildRatings(metrics),
    strengths: buildStrengths(metrics),
    improvements: buildImprovements(metrics),
    keyMoment: selectKeyMoment(metrics.events),
    recommendations: buildRecommendations(metrics),
    metrics,
    xpAwarded: false
  };
  return ensureReviewFallbacks(review);
}

export function buildDuelReview(duel) {
  const metrics = collectDuelMetrics(duel);
  const p1Won = duel.p1 > duel.p2;
  const tied = duel.p1 === duel.p2;
  const review = {
    id: `duel-${Date.now()}`,
    date: new Date().toLocaleDateString(),
    matchType: "Local Duel",
    result: tied ? "Draw" : p1Won ? "Player 1 wins" : "Player 2 wins",
    score: `${duel.p1}-${duel.p2}`,
    tacticalRating: metrics.tacticalRating,
    ratings: buildRatings(metrics),
    strengths: buildDuelStrengths(metrics),
    improvements: buildDuelImprovements(metrics),
    keyMoment: selectKeyMoment(metrics.events),
    recommendations: buildRecommendations(metrics),
    metrics,
    xpAwarded: false
  };
  return ensureReviewFallbacks(review);
}

export function saveReview(progress, review) {
  const existing = Array.isArray(progress.matchReviews) ? progress.matchReviews : [];
  progress.matchReviews = [review, ...existing.filter((item) => item.id !== review.id)].slice(0, 5);
  return review;
}

export function reviewSkillAward(review) {
  const weakest = Object.entries(review.ratings).sort((a, b) => a[1] - b[1])[0]?.[0] || "tactical";
  const awards = {
    distance: { distanceControl: 6, tacticalIq: 2 },
    timing: { timing: 6, tacticalIq: 2 },
    tactical: { tacticalIq: 6, mentalGame: 2 },
    adaptability: { mentalGame: 5, tacticalIq: 3 }
  };
  return awards[weakest] || awards.tactical;
}

function collectAiMetrics(match) {
  const events = (match.history || []).map((entry, index) => normalizeAiEvent(entry, index));
  const actions = events.flatMap((event) => event.actions);
  const finishes = events.map((event) => event.finalAction).filter(Boolean);
  const finishCounts = countItems(finishes);
  const counterAttempts = events.filter((event) => event.finalAction === "Counterattack");
  const counterSuccesses = counterAttempts.filter((event) => event.playerTouch && !event.opponentTouch);
  const parryAttempts = events.filter((event) => event.finalAction === "Parry-Riposte");
  const parrySuccesses = parryAttempts.filter((event) => event.playerTouch && !event.opponentTouch);
  const preparedAttacks = events.filter((event) => event.actions.length > 1 && finishActions.includes(event.finalAction));
  const uniqueFinishCount = new Set(finishes).size;
  const repeated = mostCommon(finishCounts);
  const tacticalRating = Math.max(0, Math.min(100, Math.round(55 + (match.tactical + match.distanceScore + match.timing) / Math.max(1, match.round * 1.6))));
  return {
    events,
    tacticalRating,
    finalScore: `${match.player}-${match.opponent}`,
    touchesFor: match.player,
    touchesAgainst: match.opponent,
    actions,
    finishes,
    finishCounts,
    repeatedAction: repeated,
    poorDistanceAttacks: events.filter((event) => event.poorDistance).length,
    fallsShort: events.filter((event) => event.fellShort).length,
    doubleTouches: events.filter((event) => event.doubleTouch).length,
    distanceWins: events.filter((event) => event.distanceWin).length,
    counterAttempts: counterAttempts.length,
    counterSuccesses: counterSuccesses.length,
    parryAttempts: parryAttempts.length,
    parrySuccesses: parrySuccesses.length,
    preparedAttacks: preparedAttacks.length,
    uniqueFinishCount,
    exchangeCount: events.length,
    scoreManagedLead: events.filter((event) => event.distanceWin && match.player >= match.opponent).length
  };
}

function collectDuelMetrics(duel) {
  const events = (duel.reviewEvents || []).map((entry, index) => normalizeDuelEvent(entry, index));
  const finishes = events.flatMap((event) => [event.p1Final, event.p2Final]).filter(Boolean);
  const finishCounts = countItems(finishes);
  const repeated = mostCommon(finishCounts);
  return {
    events,
    tacticalRating: Math.max(45, Math.min(95, 58 + events.length * 4 - events.filter((event) => event.doubleTouch).length * 4)),
    finalScore: `${duel.p1}-${duel.p2}`,
    touchesFor: duel.p1,
    touchesAgainst: duel.p2,
    actions: events.flatMap((event) => [...event.p1Actions, ...event.p2Actions]),
    finishes,
    finishCounts,
    repeatedAction: repeated,
    poorDistanceAttacks: events.filter((event) => event.poorDistance).length,
    fallsShort: events.filter((event) => event.fellShort).length,
    doubleTouches: events.filter((event) => event.doubleTouch).length,
    distanceWins: events.filter((event) => event.distanceWin).length,
    counterAttempts: events.filter((event) => event.p1Final === "Counterattack" || event.p2Final === "Counterattack").length,
    counterSuccesses: events.filter((event) => event.result.includes("counter")).length,
    parryAttempts: events.filter((event) => event.p1Final === "Parry-Riposte" || event.p2Final === "Parry-Riposte").length,
    parrySuccesses: events.filter((event) => event.result.includes("parry")).length,
    preparedAttacks: events.filter((event) => event.p1Actions.length > 1 || event.p2Actions.length > 1).length,
    uniqueFinishCount: new Set(finishes).size,
    exchangeCount: events.length
  };
}

function normalizeAiEvent(entry, index) {
  const actions = (entry.sequence || entry.player || "").split(" -> ").filter(Boolean);
  const finalAction = entry.finalAction || actions.at(-1) || entry.player;
  const playerTouch = Boolean(entry.playerTouch);
  const opponentTouch = Boolean(entry.opponentTouch);
  const resultText = `${entry.result || ""} ${entry.resultLabel || ""}`.toLowerCase();
  return {
    id: index + 1,
    playerPlan: entry.sequence || entry.player || "Hold Distance",
    opponentPlan: entry.aiSequence || entry.ai || "Observe",
    outcome: entry.resultLabel || entry.result || "Exchange",
    analysis: keyMomentWhy(entry, finalAction),
    actions,
    finalAction,
    playerTouch,
    opponentTouch,
    doubleTouch: Boolean(entry.doubleTouch || playerTouch && opponentTouch || resultText.includes("double")),
    fellShort: Boolean(entry.fellShort || resultText.includes("short")),
    poorDistance: Boolean(entry.poorDistance || attackActions.includes(finalAction) && entry.distanceBefore >= 4),
    distanceWin: Boolean(entry.distanceWin || /Retreat|Hold Distance|Half Step Out/.test(entry.sequence || "") && entry.ai === "Attack" && !opponentTouch),
    tacticalScore: entry.tacticalScore || 0
  };
}

function normalizeDuelEvent(entry, index) {
  const p1Actions = entry.p1Plan || [];
  const p2Actions = entry.p2Plan || [];
  const p1Final = p1Actions.at(-1);
  const p2Final = p2Actions.at(-1);
  const result = (entry.outcome || "").toLowerCase();
  return {
    id: index + 1,
    playerPlan: `P1: ${p1Actions.join(" -> ") || "Hold Distance"}`,
    opponentPlan: `P2: ${p2Actions.join(" -> ") || "Hold Distance"}`,
    outcome: entry.outcome || "Exchange",
    analysis: entry.why || "Both players created a tactical phrase.",
    p1Actions,
    p2Actions,
    p1Final,
    p2Final,
    result,
    doubleTouch: result.includes("double"),
    fellShort: result.includes("short"),
    poorDistance: entry.distance >= 5 && [p1Final, p2Final].some((action) => attackActions.includes(action)),
    distanceWin: /fall short|distance/.test(result)
  };
}

function buildRatings(metrics) {
  const counterRate = metrics.counterAttempts ? metrics.counterSuccesses / metrics.counterAttempts : 0;
  const sameActionShare = metrics.exchangeCount ? (metrics.repeatedAction.count || 0) / metrics.exchangeCount : 0;
  return {
    distance: clamp(64 + metrics.distanceWins * 8 - metrics.poorDistanceAttacks * 10 - metrics.fallsShort * 6),
    timing: clamp(58 + Math.round(counterRate * 28) + metrics.parrySuccesses * 5 - metrics.doubleTouches * 5),
    tactical: clamp(metrics.tacticalRating + metrics.preparedAttacks * 3 - metrics.poorDistanceAttacks * 4),
    adaptability: clamp(58 + metrics.uniqueFinishCount * 8 - (sameActionShare > reviewRules.predictabilityShare ? 18 : 0))
  };
}

function buildStrengths(metrics) {
  const strengths = [];
  if (metrics.fallsShort >= reviewRules.fallShortStrengthThreshold || metrics.distanceWins >= 2) strengths.push(`You made ${Math.max(metrics.fallsShort, metrics.distanceWins)} attacks fall short or lose distance.`);
  if (metrics.counterAttempts >= 2 && metrics.counterSuccesses / metrics.counterAttempts >= reviewRules.strongCounterRate) strengths.push(`Your counterattacks scored on ${metrics.counterSuccesses} of ${metrics.counterAttempts} attempts.`);
  if (metrics.parryAttempts >= 2 && metrics.parrySuccesses >= 1) strengths.push(`Your parry-riposte scored ${metrics.parrySuccesses} time${metrics.parrySuccesses === 1 ? "" : "s"}.`);
  if (metrics.preparedAttacks >= reviewRules.preparedAttackThreshold) strengths.push(`You used preparation before ${metrics.preparedAttacks} finishing actions.`);
  if (metrics.uniqueFinishCount >= 4) strengths.push("You varied your finishing actions well.");
  return strengths.slice(0, 2);
}

function buildImprovements(metrics) {
  const improvements = [];
  if (metrics.poorDistanceAttacks >= reviewRules.poorDistanceThreshold) improvements.push(`You attacked from poor distance ${metrics.poorDistanceAttacks} times.`);
  if (metrics.repeatedAction.item && metrics.exchangeCount && metrics.repeatedAction.count / metrics.exchangeCount > reviewRules.predictabilityShare) improvements.push(`You repeated ${metrics.repeatedAction.item} too often and risked becoming predictable.`);
  if (metrics.doubleTouches >= reviewRules.doubleTouchWarning) improvements.push(`${metrics.doubleTouches} double touches suggest score-management risk.`);
  if (metrics.counterAttempts >= 2 && metrics.counterSuccesses === 0) improvements.push("Your counterattacks were not timed to a real commitment.");
  if (metrics.fallsShort >= 2 && metrics.poorDistanceAttacks >= 2) improvements.push("Several attacks fell short because distance was not prepared first.");
  return improvements.slice(0, 2);
}

function buildDuelStrengths(metrics) {
  return buildStrengths(metrics).length ? buildStrengths(metrics) : ["Both players created reviewable tactical phrases."];
}

function buildDuelImprovements(metrics) {
  return buildImprovements(metrics).length ? buildImprovements(metrics) : ["Use clearer setup before committing to the final action."];
}

function selectKeyMoment(events) {
  return events.find((event) => event.opponentTouch && !event.playerTouch)
    || events.find((event) => event.poorDistance || event.fellShort)
    || events.find((event) => event.doubleTouch)
    || events.find((event) => event.playerTouch)
    || events.at(-1)
    || {
      playerPlan: "No exchanges",
      opponentPlan: "No opponent action",
      outcome: "No result",
      analysis: "Fence a match to generate a key moment."
    };
}

function buildRecommendations(metrics) {
  const recs = [];
  if (metrics.poorDistanceAttacks >= 2 || metrics.fallsShort >= 2) {
    recs.push({ label: "Beginner Distance Pack", target: "scenario-pack", difficulty: "Beginner", packId: "beginner-distance" });
    recs.push({ label: "Distance Control Guide", target: "guide" });
  } else if (metrics.counterAttempts >= 2 && metrics.counterSuccesses === 0) {
    recs.push({ label: "Intermediate Timing Pack", target: "scenario-pack", difficulty: "Intermediate", packId: "intermediate-timing" });
    recs.push({ label: "Counterattack Flashcards", target: "flashcards" });
  } else if (metrics.repeatedAction.item && metrics.repeatedAction.count / Math.max(1, metrics.exchangeCount) > reviewRules.predictabilityShare) {
    recs.push({ label: "Opponent Reading Pack", target: "scenario-pack", difficulty: "Intermediate", packId: "intermediate-reading" });
    recs.push({ label: "Fight Adaptive Opponent", target: "adaptive-match" });
  } else if (metrics.doubleTouches >= 2) {
    recs.push({ label: "Score Strategy Guide", target: "guide" });
    recs.push({ label: "Advanced Score Situation Pack", target: "scenario-pack", difficulty: "Advanced", packId: "advanced-score" });
  } else {
    recs.push({ label: "Tactical Scenario Training", target: "scenarios" });
    recs.push({ label: "AI Match Rematch", target: "ai-match" });
  }
  return recs.slice(0, 2);
}

function ensureReviewFallbacks(review) {
  if (!review.strengths.length) review.strengths = ["You completed enough exchanges to review tactical patterns."];
  if (!review.improvements.length) review.improvements = ["Keep varying distance and preparation before finishing."];
  return review;
}

function keyMomentWhy(entry, finalAction) {
  if (entry.poorDistance || attackActions.includes(finalAction) && entry.distanceBefore >= 4) return "You committed before controlling distance, which made the finish easier to punish.";
  if (entry.doubleTouch || entry.playerTouch && entry.opponentTouch) return "Both fencers committed in the same tempo, creating double-touch risk.";
  if (entry.playerTouch && !entry.opponentTouch) return "This exchange mattered because your plan created a clean scoring action.";
  if (entry.opponentTouch && !entry.playerTouch) return "This exchange mattered because the opponent solved your timing or distance.";
  return entry.adjustment && entry.adjustment !== "No adjustment yet." ? entry.adjustment : "This exchange shows how the plan and opponent response interacted.";
}

function countItems(items) {
  return items.reduce((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});
}

function mostCommon(counts) {
  const [item, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [null, 0];
  return { item, count };
}

function clamp(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}
