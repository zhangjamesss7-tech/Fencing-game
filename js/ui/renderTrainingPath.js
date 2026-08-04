import { pathOrder, trainingPaths } from "../data/trainingPaths.js";

export function renderTrainingPath(ctx) {
  const { els, state, pathProgress, nextStep, isStepComplete } = ctx;
  const activePathId = state.progress.trainingPath.activePath;
  const activePath = trainingPaths[activePathId] || trainingPaths.beginner;
  const progress = pathProgress(state.progress, activePathId);
  const recommended = nextStep(state.progress, activePathId);

  if (els.activePathSelect) {
    els.activePathSelect.value = activePathId;
  }
  if (els.activePathName) {
    els.activePathName.textContent = activePath.title;
    els.activePathProgress.textContent = `${progress.completed}/${progress.total} steps`;
    els.activePathFill.style.width = `${progress.percent}%`;
  }
  if (els.pathRecommendedTitle) {
    els.pathRecommendedButton.innerHTML = `
      <span>
        <b id="pathRecommendedTitle">${recommended ? recommended.title : "Path Complete"}</b>
        <small id="pathRecommendedDescription">${recommended ? recommended.description : "You finished this path. Choose another path or keep training."}</small>
      </span>
      <strong>${recommended ? recommended.actionLabel : "Review"}</strong>
    `;
    els.pathRecommendedButton.dataset.view = recommended?.view || "progress";
    els.pathRecommendedButton.dataset.trainingStepAction = recommended?.id || "progress-review";
  }
  if (els.trainingPathCards) {
    els.trainingPathCards.innerHTML = pathOrder.map((pathId) => pathCardMarkup(state.progress, pathId, pathProgress)).join("");
  }
  if (els.activePathSteps) {
    els.activePathSteps.innerHTML = activePath.steps.map((step, index) => stepMarkup({
      progress: state.progress,
      step,
      index,
      complete: isStepComplete(state.progress, activePathId, step.id),
      activePathId
    })).join("");
  }
  if (els.progressTrainingPaths) {
    els.progressTrainingPaths.innerHTML = pathOrder.map((pathId) => progressPathMarkup(state.progress, pathId, pathProgress)).join("");
  }
}

function pathCardMarkup(progress, pathId, pathProgress) {
  const path = trainingPaths[pathId];
  const status = pathProgress(progress, pathId);
  const active = progress.trainingPath.activePath === pathId;
  return `
    <article class="path-card ${active ? "active" : ""}">
      <div class="path-top">
        <div>
          <span class="path-badge">${path.difficulty}</span>
          <h3>${path.shortTitle}</h3>
        </div>
        <div class="progress-ring" style="--value:${status.percent}"><strong>${status.percent}%</strong></div>
      </div>
      <p>${path.goal}</p>
      <div class="bar compact-bar"><span style="width: ${status.percent}%"></span></div>
      <div class="split">
        <span class="path-status">${status.completed}/${status.total} complete</span>
        <button class="ghost-btn" type="button" data-path-select="${pathId}">${active ? "Active" : "Choose"}</button>
      </div>
    </article>
  `;
}

function stepMarkup({ progress, step, index, complete, activePathId }) {
  const stepProgress = stepProgressLabel(progress, step);
  return `
    <article class="path-step ${complete ? "complete" : ""}">
      <span class="step-number">${complete ? "✓" : stepIcon(step)}</span>
      <div>
        <h4>${step.title}</h4>
        <p>${step.description}</p>
        <div class="step-meta">
          <span>${stepProgress}</span>
          <small>+${step.reward} XP</small>
        </div>
      </div>
      <div class="path-step-actions">
        <button class="secondary-btn path-main-action" type="button" data-view="${step.view}" data-training-step-action="${step.id}">${step.actionLabel}</button>
        ${complete ? `<span class="complete-pill">Done</span>` : `<button class="path-fallback-btn" type="button" data-path-step-complete="${activePathId}:${step.id}">Mark done manually</button>`}
      </div>
    </article>
  `;
}

function stepIcon(step) {
  if (step.id.startsWith("guide")) return "▣";
  if (step.id.startsWith("flashcards")) return "◫";
  if (step.id.startsWith("scenarios")) return "◎";
  if (step.id.startsWith("quiz")) return "?";
  if (step.id.startsWith("ai")) return "⚔";
  if (step.id.startsWith("local-duel")) return "◇";
  if (step.id.includes("rating")) return "%";
  if (step.id.includes("skill")) return "✦";
  return "•";
}

function stepProgressLabel(progress, step) {
  const stats = progress.trainingPath.stats;
  const scenarios = stats.scenarios || {};
  const quizzes = stats.quizCompleted || {};
  const guideViews = stats.guideViews || [];
  const aiTypes = stats.aiOpponentTypes || [];
  const rating = progress.tacticalRating || 0;
  const labels = {
    "guide-fundamentals": guideViews.includes("guide-fundamentals") ? "Guide opened" : "Guide not opened",
    "guide-distance": guideViews.includes("guide-distance") ? "Guide opened" : "Guide not opened",
    "guide-tactics": guideViews.includes("guide-tactics") ? "Guide opened" : "Guide not opened",
    "flashcards-10": `${Math.min(stats.flashcardsMastered || 0, 10)} / 10 mastered`,
    "flashcards-technique-10": `${Math.min(stats.flashcardsMastered || 0, 10)} / 10 mastered`,
    "scenarios-beginner-5": `${Math.min(scenarios.Beginner || 0, 5)} / 5 complete`,
    "scenarios-intermediate-10": `${Math.min(scenarios.Intermediate || 0, 10)} / 10 complete`,
    "scenarios-advanced-10": `${Math.min(scenarios.Advanced || 0, 10)} / 10 complete`,
    "quiz-beginner-1": `${Math.min(quizzes.Beginner || 0, 1)} / 1 complete`,
    "ai-match-1": `${Math.min(stats.aiMatches || 0, 1)} / 1 complete`,
    "ai-matches-2": `${Math.min(stats.aiMatches || 0, 2)} / 2 complete`,
    "ai-opponent-types-3": `${Math.min(aiTypes.length, 3)} / 3 opponent types`,
    "local-duel-1": `${Math.min(stats.localDuelExchanges || 0, 1)} / 1 exchange`,
    "local-duel-complete-1": `${Math.min((stats.localDuelMatches || 0) || (stats.localDuelExchanges || 0), 1)} / 1 complete`,
    "local-duel-match-1": `${Math.min(stats.localDuelMatches || 0, 1)} / 1 match`,
    "progress-review": stats.progressReviewed ? "Reviewed" : "Not reviewed",
    "rating-70": `${Math.min(rating, 70)} / 70% rating`,
    "skill-tree-review": stats.skillTreeReviewed ? "Reviewed" : "Not reviewed"
  };
  return labels[step.id] || "In progress";
}

function progressPathMarkup(progress, pathId, pathProgress) {
  const path = trainingPaths[pathId];
  const status = pathProgress(progress, pathId);
  const complete = progress.trainingPath.completedPaths.includes(pathId);
  return `
    <article class="progress-path-card ${complete ? "complete" : ""}">
      <div class="split">
        <div>
          <span class="path-badge">${path.difficulty}</span>
          <h3>${path.title}</h3>
        </div>
        <div class="progress-ring small" style="--value:${status.percent}"><strong>${status.percent}%</strong></div>
      </div>
      <div class="skill-bar"><span style="width: ${status.percent}%"></span></div>
      <p>${complete ? "Full path completed." : `${status.completed} of ${status.total} steps complete.`}</p>
    </article>
  `;
}
