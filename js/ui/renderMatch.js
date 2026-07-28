import { els } from "./dom.js";

export function setMatchView(view) {
  els.matchSetup.classList.toggle("hidden", view !== "setup");
  els.matchGame.classList.toggle("hidden", view !== "fight");
  els.duelGame.classList.toggle("hidden", view !== "duel");
  els.matchAnalysis.classList.toggle("hidden", view !== "analysis");
}

export function showMatchSetup() {
  setMatchView("setup");
  els.matchFeedback.textContent = "Choose an action to fence the first exchange.";
}

export function renderMatch(ctx) {
  const {
    els,
    state,
    distanceNames,
    analyzeOpponent,
    buildMemoryList,
    renderSequenceBuilder,
    renderLearningPanels,
    finalActionFromSequence
  } = ctx;
  const m = state.match;
  const analysis = analyzeOpponent();
  const matchRating = Math.max(0, Math.min(100, Math.round(55 + (m.tactical + m.distanceScore + m.timing) / Math.max(1, m.round * 1.6))));
  const distanceKey = Math.max(1, Math.min(5, Math.round(m.distance)));
  els.playerScore.textContent = m.player;
  els.opponentScore.textContent = m.opponent;
  els.matchRatingDisplay.textContent = `${matchRating}%`;
  els.tacticalScore.textContent = m.tactical;
  els.distanceScore.textContent = m.distanceScore;
  els.timingScore.textContent = m.timing;
  els.roundNumber.textContent = m.round;
  els.matchDistance.textContent = `Distance: ${m.distance}`;
  els.matchDistanceName.textContent = distanceNames[distanceKey];
  els.youFencer.style.left = `${8 + (5 - m.distance) * 5.5}%`;
  els.themFencer.style.right = `${8 + (5 - m.distance) * 5.5}%`;
  els.youFencer.dataset.intent = actionVisualLabel(finalActionFromSequence(m.sequence || []));
  els.themFencer.dataset.intent = actionVisualLabel(m.pendingAiAction || m.lastAiAction || "Observe");
  els.opponentTitle.textContent = "Unknown Opponent";
  els.opponentAnalysis.textContent = analysis.label;
  els.analysisConfidence.textContent = `${analysis.confidence}%`;
  els.memoryList.innerHTML = buildMemoryList().map((item) => `<li>${item}</li>`).join("");
  els.aiAdjustment.textContent = m.lastAdjustment;
  if (m.situation) {
    els.aiBehaviour.innerHTML = opponentCueMarkup(m.liveCue || (m.learningMode === "advanced" ? "Watch the feet and blade" : m.situation.behaviour));
    els.aiPattern.textContent = m.learningMode === "beginner" ? m.situation.pattern : "Infer from exchanges";
    els.matchSituation.textContent = `Distance: ${distanceNames[distanceKey]}. ${m.situation.prompt}`;
  }
  if (els.matchEventTimeline) {
    els.matchEventTimeline.innerHTML = matchTimelineMarkup(m);
  }
  renderSequenceBuilder();
  renderLearningPanels();
}

export function renderSequenceBuilder(ctx) {
  const {
    els,
    state,
    shortPlanHint,
    sequenceRisk,
    riskLabel,
    recommendedSequence,
    isFinishAction,
    actionMeta,
    isActionUnlocked,
    actionCue
  } = ctx;
  const sequence = state.match.sequence || [];
  const risk = sequenceRisk(sequence);
  els.sequenceCount.textContent = shortPlanHint(sequence);
  els.sequenceList.innerHTML = sequence.length
    ? sequence.map((action) => sequenceChipMarkup(action, actionMeta(action))).join("<b class=\"sequence-arrow\">→</b>")
    : `
      <span class="sequence-chip ghost"><i>↔</i><span>Prepare</span></span>
      <b class="sequence-arrow">→</b>
      <span class="sequence-chip ghost"><i>◌</i><span>React</span></span>
      <b class="sequence-arrow">→</b>
      <span class="sequence-chip ghost"><i>◆</i><span>Finish</span></span>
    `;
  els.commitmentText.textContent = riskLabel(risk);
  els.commitmentFill.style.width = `${Math.min(100, risk * 12)}%`;
  els.commitmentFill.classList.toggle("danger", risk >= 7);
  const suggestion = recommendedSequence();
  els.suggestedSequence.textContent = suggestion.length
    ? `Coach Suggestion: Try ${suggestion.join(" -> ")}`
    : "Coach Suggestion: Build your own plan.";
  els.trySuggestion.disabled = state.match.locked || !suggestion.length;
  els.undoSequence.disabled = !sequence.length || state.match.locked;
  els.clearSequence.disabled = !sequence.length || state.match.locked;
  els.simpleControls.classList.toggle("active", state.controlMode === "simple");
  els.advancedControls.classList.toggle("active", state.controlMode === "advanced");
  els.matchActions.querySelectorAll(".action-btn").forEach((btn) => {
    const action = btn.dataset.action;
    const meta = actionMeta(action);
    const locked = !isActionUnlocked(action);
    const simpleHidden = state.controlMode === "simple" && !meta.simple;
    const sequenceFull = sequence.length >= 3 && !isFinishAction(action);
    btn.hidden = simpleHidden;
    btn.disabled = state.match.locked || locked || sequenceFull;
    btn.classList.toggle("locked", locked);
    btn.classList.toggle("recommended", actionCue(action) === "good");
    btn.classList.toggle("warning", actionCue(action) === "warn");
    btn.classList.toggle("finish-now", actionCue(action) === "finish");
    btn.dataset.group = meta.group;
    btn.title = locked ? `Unlocks at drill level ${meta.unlock}` : `${meta.key} · ${meta.group}`;
  });
}

export function renderLearningPanels(ctx) {
  const { els, state, buildObservations, analyzeOpponent, detectPattern } = ctx;
  const mode = state.match.learningMode;
  els.observationPanel.classList.toggle("hidden", mode !== "beginner");
  els.historyPanel.classList.toggle("hidden", mode === "beginner");
  els.patternPanel.classList.toggle("hidden", mode === "advanced");
  els.observationList.innerHTML = buildObservations().map((item) => `<li>${item}</li>`).join("");
  els.exchangeHistory.innerHTML = state.match.history.length
    ? state.match.history.slice(-6).map((entry, index) => `
      <li>
        <strong>Exchange ${state.match.history.length - Math.min(6, state.match.history.length) + index + 1}</strong><br>
        You: ${entry.sequence || entry.player}<br>
        Opponent: ${entry.aiSequence || entry.ai}<br>
        Result: ${entry.result}
      </li>
    `).join("")
    : "<li>No exchanges yet.</li>";
  const analysis = analyzeOpponent();
  els.detectedPattern.textContent = `${detectPattern()} Confidence: ${analysis.confidence}%.`;
}

function sequenceChipMarkup(action, meta = {}) {
  return `<span class="sequence-chip" data-group="${meta.group || "Preparation"}"><i>${actionIcon(action, meta.group)}</i><span>${action}</span></span>`;
}

function opponentCueMarkup(label = "Observing distance") {
  const cue = opponentCue(label);
  return `<span class="opponent-cue ${cue.tone}"><i>${cue.icon}</i><span>${label}</span></span>`;
}

function opponentCue(label = "") {
  const text = label.toLowerCase();
  if (text.includes("attack") || text.includes("press")) return { icon: "→", tone: "pressure" };
  if (text.includes("retreat") || text.includes("withdraw")) return { icon: "←", tone: "withdraw" };
  if (text.includes("feint") || text.includes("bait")) return { icon: "◇", tone: "deception" };
  if (text.includes("wait") || text.includes("watch")) return { icon: "◌", tone: "hold" };
  return { icon: "↔", tone: "neutral" };
}

function actionVisualLabel(action = "") {
  if (["Lunge", "Step-Lunge", "Fleche", "Counterattack", "Parry-Riposte"].includes(action)) return "Attack line";
  if (["Retreat", "Half Step Out"].includes(action)) return "Withdraw";
  if (["Advance", "Half Step In"].includes(action)) return "Pressure";
  if (["Feint", "Bait", "Beat", "Change Rhythm"].includes(action)) return "Prepare";
  return "Ready";
}

function actionIcon(action = "", group = "") {
  if (["Advance", "Half Step In"].includes(action)) return "→";
  if (["Retreat", "Half Step Out"].includes(action)) return "←";
  if (["Lunge", "Step-Lunge", "Fleche"].includes(action)) return "◆";
  if (action === "Counterattack") return "↯";
  if (action === "Parry-Riposte") return "⟲";
  if (["Feint", "Bait"].includes(action)) return "◇";
  if (action === "Beat") return "×";
  if (action === "Change Rhythm") return "≈";
  if (group === "Movement") return "↔";
  if (group === "Finish") return "◆";
  return "◌";
}

function matchTimelineMarkup(match) {
  const events = match.history.slice(-4);
  if (!events.length) {
    return `
      <div class="timeline-item active"><span>1</span><strong>Observe</strong></div>
      <div class="timeline-item"><span>2</span><strong>Build Plan</strong></div>
      <div class="timeline-item"><span>3</span><strong>Resolve</strong></div>
    `;
  }
  return events.map((entry, index) => `
    <div class="timeline-item ${index === events.length - 1 ? "active" : ""}">
      <span>${match.history.length - events.length + index + 1}</span>
      <strong>${resultIcon(entry.result)} ${entry.result}</strong>
    </div>
  `).join("");
}

function resultIcon(result = "") {
  if (result.includes("TOUCH") || result.includes("SCORES")) return "◆";
  if (result.includes("DOUBLE")) return "◇";
  if (result.includes("MISS") || result.includes("SHORT")) return "↔";
  if (result.includes("PUNISHED") || result.includes("OVER")) return "!";
  return "•";
}
