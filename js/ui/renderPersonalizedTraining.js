import { activeMistakePatterns, masteryBand, skillLabel, weakestSkills } from "../core/learningProfileManager.js";
import { masterySnapshot, trainingToday } from "../core/personalizedSessionManager.js";
import { contentById } from "../data/contentMetadata.js";

export function renderPersonalizedTraining(ctx) {
  renderHomeTrainingCard(ctx);
  renderMyTrainingPage(ctx);
  renderPersonalizedProgress(ctx);
}

export function renderHomeTrainingCard({ els, state }) {
  if (!els.myTrainingHomeCard) return;
  const today = trainingToday(state.progress);
  const activeSession = state.progress.learningProfile.activeSession;
  const completedAllToday = today.completedToday && today.extraCompletedToday;
  const completedDailyVisible = (today.completedToday && !state.progress.learningProfile.activeSession)
    || (today.completedToday && activeSession?.completed);
  if (completedAllToday) {
    els.myTrainingHomeCard.innerHTML = `
      <div>
        <p class="eyebrow">Your Training Today</p>
        <h3>Today's Training Complete</h3>
        <p>Extra Practice Complete. New personalized training will be available tomorrow.</p>
      </div>
      <div class="training-today-meta">
        <span>Daily complete</span>
        <span>Extra complete</span>
      </div>
    `;
    return;
  }
  if (completedDailyVisible) {
    els.myTrainingHomeCard.innerHTML = `
      <div>
        <p class="eyebrow">Your Training Today</p>
        <h3>Today's Training Complete</h3>
        <p>Come back tomorrow for your next personalized session.</p>
      </div>
      <div class="training-today-meta">
        <span>${today.stepCount} extra activities ready</span>
        <span>About ${today.estimatedMinutes} min</span>
      </div>
      <button class="secondary-btn" type="button" data-my-training-action="extra">Start Extra Practice</button>
    `;
    return;
  }
  els.myTrainingHomeCard.innerHTML = `
    <div>
      <p class="eyebrow">Your Training Today</p>
      <h3>${today.isResume ? "Resume Training" : "Start My Training"}</h3>
      <p>${today.isResume ? `Step ${Math.min(today.currentStep + 1, today.stepCount)} of ${today.stepCount}` : `Focus: ${today.focus}`}</p>
    </div>
    <div class="training-today-meta">
      <span>${today.stepCount} activities</span>
      <span>About ${today.estimatedMinutes} min</span>
    </div>
    <button class="primary-btn" type="button" data-my-training-action="${today.isResume ? "resume" : "start"}">
      ${today.isResume ? "Resume Training" : "Start My Training"}
    </button>
  `;
}

export function renderMyTrainingPage({ els, state }) {
  if (!els.myTrainingSession) return;
  const session = state.progress.learningProfile.activeSession;
  const preview = trainingToday(state.progress);
  const completedToday = preview.completedToday;
  const extraCompletedToday = preview.extraCompletedToday;
  els.myTrainingSummary.innerHTML = `
    <article class="personal-focus-card">
      <div>
        <p class="eyebrow">${session?.mode === "extra" ? "Extra Practice" : completedToday ? "Daily Training Complete" : "Personalized Daily Session"}</p>
        <h3>${session ? session.title : completedToday ? "Today's Training Complete" : `${state.progress.profile?.name || "Your"} Training Session`}</h3>
        <p>${session ? `Focus: ${skillLabel(session.focusSkill)}` : completedToday ? extraCompletedToday ? "Extra Practice Complete. New personalized training will be available tomorrow." : "Come back tomorrow for your next personalized session." : `Focus: ${preview.focus}`}</p>
      </div>
      <div class="progress-ring small" style="--value:${session ? sessionProgress(session) : 0}">
        <strong>${session ? sessionProgress(session) : 0}%</strong>
      </div>
    </article>
    <div class="session-controls">
      ${session ? `<button class="primary-btn" type="button" data-my-training-action="resume">Resume Training</button>` : completedToday && !extraCompletedToday ? `<button class="primary-btn" type="button" data-my-training-action="extra">Start Extra Practice</button>` : !completedToday ? `<button class="primary-btn" type="button" data-my-training-action="start">Start My Training</button>` : ""}
      ${session && !session.completed ? `<button class="secondary-btn" type="button" data-my-training-action="easier">Easier Session</button>
      <button class="secondary-btn" type="button" data-my-training-action="harder">Harder Session</button>` : ""}
    </div>
  `;

  if (!session) {
    els.myTrainingSession.innerHTML = `
      <article class="empty-session-card">
        <h3>${completedToday ? "Today's Training Complete" : "No active session yet"}</h3>
        <p>${completedToday ? extraCompletedToday ? "Extra Practice Complete. New personalized training will be available tomorrow." : "Come back tomorrow for your next personalized session. One optional Extra Practice session is available today." : "Start My Training to generate about five activities from your saved performance, Match Reviews, and skill mastery."}</p>
      </article>
    `;
    return;
  }

  if (session.completed) {
    els.myTrainingSession.innerHTML = completionMarkup(session);
    return;
  }

  const current = session.steps[session.currentStep] || session.steps.at(-1);
  els.myTrainingSession.innerHTML = `
    <article class="guided-session-card">
      <div class="split">
        <div>
          <p class="eyebrow">Current Step</p>
          <h3>${safeStepTitle(current)}</h3>
        </div>
        <span class="path-badge">${session.currentStep + 1}/${session.steps.length}</span>
      </div>
      <p class="why-box"><strong>Why this activity?</strong> ${current.reason}</p>
      <div class="session-step-list">
        ${session.steps.map((step, index) => sessionStepMarkup(step, index, session.currentStep)).join("")}
      </div>
      <div class="session-controls">
        <button class="primary-btn" type="button" data-session-step="${current.id}">${current.actionLabel}</button>
        <button class="secondary-btn" type="button" disabled>Continue after completing this activity</button>
        <button class="ghost-btn" type="button" data-my-training-action="exit">Exit and Resume Later</button>
      </div>
    </article>
  `;
}

export function renderPersonalizedProgress({ els, state }) {
  if (!els.learningProgressPanel) return;
  const profile = state.progress.learningProfile;
  const weakest = weakestSkills(profile, 2);
  const mistakes = activeMistakePatterns(profile, 3);
  const mastery = masterySnapshot(state.progress).slice(0, 6);
  els.learningProgressPanel.innerHTML = `
    <div class="split">
      <div>
        <p class="eyebrow">Personal Training</p>
        <h3>Adaptive Learning Profile</h3>
      </div>
      <button class="secondary-btn" type="button" data-view="myTraining">Open My Training</button>
    </div>
    <div class="learning-mastery-grid">
      ${mastery.map((item) => `
        <article>
          <span>${item.label}</span>
          <strong>${item.score}%</strong>
          <div class="bar compact-bar"><span style="width:${item.score}%"></span></div>
          <small>${item.band}</small>
        </article>
      `).join("")}
    </div>
    <div class="learning-insight-grid">
      <section>
        <h4>Current Focus</h4>
        <p>${weakest[0] ? `${weakest[0].label} · ${masteryBand(weakest[0].score)}` : "Fence more activities to build a focus."}</p>
      </section>
      <section>
        <h4>Repeated Patterns</h4>
        <p>${mistakes.length ? mistakes.map((mistake) => `${mistake.label} (${mistake.count})`).join(", ") : "No repeated mistake pattern yet."}</p>
      </section>
      <section>
        <h4>Completed Sessions</h4>
        <p>${profile.completedSessions.length} personalized session${profile.completedSessions.length === 1 ? "" : "s"} complete.</p>
      </section>
    </div>
  `;
}

function sessionStepMarkup(step, index, currentStep) {
  const state = step.completed ? "complete" : index === currentStep ? "active" : "";
  return `
    <article class="session-step ${state}">
      <span>${step.completed ? "✓" : index + 1}</span>
      <div>
        <strong>${safeStepTitle(step)}</strong>
        <small>${step.reason}</small>
      </div>
      <em>${step.estimatedMinutes} min</em>
    </article>
  `;
}

function completionMarkup(session) {
  const skills = [...new Set(session.steps.flatMap((step) => step.skills || []))];
  return `
    <article class="guided-session-card complete">
      <p class="eyebrow">${session.mode === "extra" ? "Extra Practice Complete" : "Today's Training Complete"}</p>
      <h3>${session.mode === "extra" ? session.title : `Focus: ${skillLabel(session.focusSkill)}`}</h3>
      <div class="review-rating-grid">
        <article class="review-rating-card"><span>✓</span><strong>Activities completed</strong><small>${session.steps.length}</small></article>
        <article class="review-rating-card"><span>◎</span><strong>Focus</strong><small>${skillLabel(session.focusSkill)}</small></article>
        <article class="review-rating-card"><span>%</span><strong>Accuracy</strong><small>${sessionProgress(session)}%</small></article>
        <article class="review-rating-card"><span>◷</span><strong>Estimated time</strong><small>${session.estimatedMinutes} min</small></article>
      </div>
      <p class="why-box"><strong>Skills practised:</strong> ${skills.map(skillLabel).join(", ")}</p>
      <p class="why-box"><strong>Recommended next session:</strong> ${session.mode === "extra" ? "Return to your daily training tomorrow." : "Tomorrow"}</p>
      ${session.mode === "extra" ? "" : `<button class="secondary-btn" type="button" data-my-training-action="extra">Start Extra Practice</button>`}
      <button class="primary-btn" type="button" data-my-training-action="finish">Finish Session</button>
    </article>
  `;
}

function sessionProgress(session) {
  return session.steps.length ? Math.round(session.steps.filter((step) => step.completed).length / session.steps.length * 100) : 0;
}

function safeStepTitle(step) {
  if (step?.type !== "scenario") return step?.title || "Training Step";
  const metadata = contentById[step.contentId];
  return metadata?.displayTitle || neutralFallbackTitle(step);
}

function neutralFallbackTitle(step) {
  if (step?.skills?.includes("scoreManagement")) return `${step.difficulty || "Epee"} Score-Management Decision`;
  if (step?.skills?.includes("opponentReading")) return "Opponent-Reading Challenge";
  if (step?.skills?.includes("timing")) return `${step.difficulty || "Epee"} Timing Scenario`;
  if (step?.skills?.includes("distanceControl")) return "Tactical Decision: Distance Control";
  if (step?.skills?.includes("bladeWork")) return "Blade-Work Decision";
  return "Choose Your Tactical Response";
}
