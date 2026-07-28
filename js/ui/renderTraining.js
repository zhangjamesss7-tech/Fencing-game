export function renderOptions(container, options, handler) {
  container.innerHTML = "";
  options.forEach((option, index) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = option;
    btn.addEventListener("click", () => handler(index, btn));
    container.appendChild(btn);
  });
}

export function lockOptions(container, selected, correct) {
  [...container.children].forEach((btn, index) => {
    btn.disabled = true;
    if (index === correct) btn.classList.add("correct");
    if (index === selected && selected !== correct) btn.classList.add("wrong");
  });
}

export function renderGuide(ctx) {
  const { els, guideSections } = ctx;
  els.guideGrid.innerHTML = guideSections.map((section) => `
    <article class="guide-card ${guideClass(section.title)}">
      <div class="guide-top">
        <span class="guide-icon">${guideIcon(section.title)}</span>
        <div>
          <span class="path-badge">${guideCategory(section.title)}</span>
          <h3>${section.title}</h3>
        </div>
      </div>
      <div class="diagram">${guideDiagram(section.title, section.diagram)}</div>
      <div class="guide-points">
        ${section.points.map((point) => `<p><span>•</span>${point}</p>`).join("")}
      </div>
    </article>
  `).join("");
}

export function renderFlashcard(ctx) {
  const { els, state, flashcards } = ctx;
  const card = flashcards[state.flashIndex];
  const mastered = state.progress.mastered.includes(card.id);
  const category = card.category || flashcardCategory(card.term);
  els.flashCard.dataset.category = category;
  els.flashSide.textContent = state.flashFlipped ? `${flashcardIcon(card.term)} Explanation` : `${flashcardIcon(card.term)} ${category}`;
  els.flashText.textContent = state.flashFlipped ? card.back : card.term;
  els.flashHint.textContent = mastered ? "Mastered checkpoint complete" : "Click to flip";
}

export function renderQuiz(ctx) {
  const { els, state, currentQuizPool, grantXp, saveProgress, trackQuizComplete } = ctx;
  const pool = currentQuizPool();
  const question = pool[state.quizIndex % pool.length];
  els.quizMeta.textContent = `Question ${(state.quizIndex % pool.length) + 1} / ${pool.length}`;
  els.quizScore.textContent = `Score ${state.quizScore}`;
  els.quizQuestion.textContent = question.question;
  els.quizFeedback.className = "feedback";
  els.quizFeedback.textContent = "";
  els.nextQuestion.classList.remove("show");
  renderOptions(els.quizOptions, question.options, (choice) => {
    const correct = choice === question.correct;
    lockOptions(els.quizOptions, choice, question.correct);
    state.quizScore += correct ? 10 : 0;
    state.progress.quizAnswered += 1;
    state.progress.quizCorrect += correct ? 1 : 0;
    grantXp(correct ? 10 : 3, { bladeWork: correct ? 10 : 3 }, "Knowledge Quiz");
    trackQuizComplete?.(question, (state.quizIndex % pool.length) + 1, pool.length);
    saveProgress();
    els.quizScore.textContent = `Score ${state.quizScore}`;
    els.quizFeedback.innerHTML = `<strong>${correct ? "Correct." : "Incorrect."}</strong> ${question.explanation}`;
    els.quizFeedback.classList.add("show");
    els.nextQuestion.classList.add("show");
  });
}

export function renderScenario(ctx) {
  const { els, state, scenarioPacks, scenarios, actions, scenarioPool, grantXp, saveProgress, trackScenarioComplete } = ctx;
  syncScenarioPackOptions(els, state, scenarioPacks);
  const pool = scenarioPool();
  if (!pool.length) {
    state.scenarioPack = "all";
    els.scenarioPack.value = "all";
    return renderScenario(ctx);
  }
  const scenario = pool[state.scenarioIndex % pool.length];
  els.scenarioCount.textContent = `${scenario.packTitle || "Scenario"} · ${state.scenarioIndex % pool.length + 1} / ${pool.length}`;
  els.scenarioDistance.textContent = `${distanceIcon(scenario.distance)} ${scenario.distance}`;
  els.scenarioStyle.textContent = `${styleIcon(scenario.style)} ${scenario.cue || scenario.style}`;
  els.scenarioVisual.innerHTML = scenarioVisualMarkup(scenario);
  els.scenarioSituation.innerHTML = scenario.title
    ? `<span class="scenario-title">${scenario.title}</span>${scenario.situation}`
    : scenario.situation;
  els.scenarioFeedback.className = "feedback";
  els.nextScenario.classList.remove("show");
  const opts = scenario.choices || [scenario.correctAction, ...actions.filter((action) => action !== scenario.correctAction).sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
  renderOptions(els.scenarioOptions, opts, (choice) => {
    const correctIndex = Number.isInteger(scenario.correct) ? scenario.correct : opts.indexOf(scenario.correctAction);
    const correct = choice === correctIndex;
    lockOptions(els.scenarioOptions, choice, correctIndex);
    state.progress.scenarioAnswered += 1;
    trackScenarioComplete?.(scenario);
    grantXp(
      correct ? 15 : 5,
      {
        tacticalIq: correct ? 15 : 5,
        distanceControl: correct ? 10 : 2,
        mentalGame: correct && scenario.difficulty === "Advanced" ? 5 : 0
      },
      "Tactical Scenario"
    );
    state.progress.tacticalRating = Math.round((state.progress.tacticalRating * 4 + (correct ? 100 : 55)) / 5);
    saveProgress();
    els.scenarioFeedback.innerHTML = `<strong>${correct ? "Successful decision." : "Lower-percentage choice."}</strong> ${scenario.explanation}<p><b>Training focus:</b> ${scenario.trainingFocus || "Tactical decision-making"}</p>`;
    els.scenarioFeedback.classList.add("show");
    els.nextScenario.classList.add("show");
  });
}

function syncScenarioPackOptions(els, state, scenarioPacks = []) {
  if (!els.scenarioPack) return;
  const eligiblePacks = scenarioPacks.filter((pack) => pack.id === "all" || pack.difficulty === state.scenarioDifficulty);
  const optionMarkup = eligiblePacks.map((pack) => `<option value="${pack.id}">${pack.title}</option>`).join("");
  if (els.scenarioPack.dataset.options !== optionMarkup) {
    els.scenarioPack.innerHTML = optionMarkup;
    els.scenarioPack.dataset.options = optionMarkup;
  }
  if (!eligiblePacks.some((pack) => pack.id === state.scenarioPack)) {
    state.scenarioPack = "all";
  }
  els.scenarioPack.value = state.scenarioPack;
}

function guideIcon(title) {
  if (title.includes("Distance")) return "↔";
  if (title.includes("Attack")) return "◇";
  if (title.includes("Defense") || title.includes("Parry")) return "▰";
  if (title.includes("Tactical") || title.includes("Reading")) return "◎";
  if (title.includes("Score") || title.includes("Double")) return "4";
  if (title.includes("Mistakes")) return "!";
  if (title.includes("Phrase")) return "→";
  return "◉";
}

function guideCategory(title) {
  if (title.includes("Distance")) return "Measure";
  if (title.includes("Attack")) return "Offense";
  if (title.includes("Defense") || title.includes("Parry")) return "Defense";
  if (title.includes("Tactical") || title.includes("Reading")) return "Decision";
  if (title.includes("Score") || title.includes("Double")) return "Match";
  if (title.includes("Mistakes")) return "Habits";
  if (title.includes("Phrase")) return "Flow";
  return "Core";
}

function guideClass(title) {
  return `guide-${guideCategory(title).toLowerCase()}`;
}

function guideDiagram(title, fallback) {
  if (title.includes("Fundamentals")) {
    return `<div class="target-diagram"><span>Mask</span><span>Hand</span><strong>Full Body Target</strong><span>Torso</span><span>Foot</span></div>`;
  }
  if (title.includes("Target")) {
    return `<div class="target-diagram"><span>Mask</span><span>Hand</span><strong>Everything Counts</strong><span>Torso</span><span>Foot</span></div>`;
  }
  if (title.includes("Double")) {
    return `<div class="flow-diagram"><span>You hit</span><b>+</b><span>They hit</span><b>→</b><span>Both score</span></div>`;
  }
  if (title.includes("Distance")) {
    return `<div class="distance-diagram"><b>YOU</b><i></i><span>measure</span><i></i><b>OPP</b></div>`;
  }
  if (title.includes("Attack")) {
    return `<div class="flow-diagram"><span>Advance</span><b>→</b><span>Lunge</span><b>→</b><span>Recover</span></div>`;
  }
  if (title.includes("Defense") || title.includes("Parry")) {
    return `<div class="flow-diagram"><span>Parry</span><b>→</b><span>Riposte</span><b>|</b><span>Stop Hit</span></div>`;
  }
  if (title.includes("Counter")) {
    return `<div class="flow-diagram"><span>They commit</span><b>→</b><span>Keep range</span><b>→</b><span>Hit</span></div>`;
  }
  if (title.includes("Feints")) {
    return `<div class="flow-diagram"><span>Threat</span><b>→</b><span>Reaction</span><b>→</b><span>Finish</span></div>`;
  }
  if (title.includes("Tactical") || title.includes("Reading")) {
    return `<div class="flow-diagram"><span>Pattern</span><b>→</b><span>Prediction</span><b>→</b><span>Decision</span></div>`;
  }
  if (title.includes("Score")) {
    return `<div class="flow-diagram"><span>Ahead</span><b>|</b><span>Behind</span><b>|</b><span>4-4</span></div>`;
  }
  if (title.includes("Mistakes")) {
    return `<div class="flow-diagram"><span>Mistake</span><b>→</b><span>Why</span><b>→</b><span>Habit</span></div>`;
  }
  if (title.includes("Phrase")) {
    return `<div class="flow-diagram"><span>Draw</span><b>→</b><span>Retreat</span><b>→</b><span>Counter</span></div>`;
  }
  return fallback;
}

function flashcardCategory(term) {
  if (/Parry|Riposte|Beat|Disengage|Sixte|Quarte|Octave|Opposition|Remise/i.test(term)) return "Blade Work";
  if (/Distance|Measure|Close|Long|Preparation|Fall Short/i.test(term)) return "Distance";
  if (/Tempo|Second|Feint|Invitation|Pressure|Counterattack/i.test(term)) return "Tactics";
  if (/Double|Priority|Target|Piste|Cards|Bout/i.test(term)) return "Rules / Match";
  if (/Fleche|Lunge|Counterattack|Stop hit/i.test(term)) return "Action";
  return "Concept";
}

function flashcardIcon(term) {
  if (/Parry|Riposte|Beat|Disengage|Sixte|Quarte|Octave|Opposition|Remise/i.test(term)) return "▰";
  if (/Distance|Measure|Close|Long|Preparation|Fall Short/i.test(term)) return "↔";
  if (/Double|Priority|Target|Piste|Cards|Bout/i.test(term)) return "4";
  if (/Fleche|Lunge|Counterattack|Stop hit/i.test(term)) return "◇";
  return "◎";
}

function distanceIcon(distance) {
  if (distance.includes("Long")) return "↔";
  if (distance.includes("Close")) return "!";
  return "⇄";
}

function styleIcon(style) {
  if (style.includes("Aggressive")) return "◇";
  if (style.includes("Defensive")) return "▰";
  if (style.includes("Counter")) return "↩";
  if (style.includes("Unpredictable")) return "◎";
  return "◉";
}

function scenarioVisualMarkup(scenario) {
  const distanceLevel = scenario.distance.includes("Long") ? "far" : scenario.distance.includes("Close") ? "close" : "middle";
  const left = distanceLevel === "far" ? 14 : distanceLevel === "close" ? 30 : 22;
  const right = distanceLevel === "far" ? 14 : distanceLevel === "close" ? 30 : 22;
  return `
    <div class="scenario-piste ${distanceLevel}">
      <span class="scenario-fencer player" style="left:${left}%">YOU</span>
      <span class="scenario-line"></span>
      <span class="scenario-fencer opponent" style="right:${right}%">OPP</span>
    </div>
    <div class="cue-card-grid">
      <div class="cue-card"><span>Distance</span><strong>${distanceIcon(scenario.distance)} ${scenario.distance}</strong></div>
      <div class="cue-card"><span>Opponent Cue</span><strong>${styleIcon(scenario.style)} ${scenario.cue || scenario.style}</strong></div>
      <div class="cue-card"><span>Score</span><strong>${scenario.scoreContext || "Open score"}</strong></div>
      <div class="cue-card"><span>Focus</span><strong>${scenario.trainingFocus || actionTheme(scenario.correctAction)}</strong></div>
    </div>
  `;
}

function actionTheme(action) {
  if (/Retreat|Hold/.test(action)) return "Control measure";
  if (/Parry/.test(action)) return "Take the blade";
  if (/Counter/.test(action)) return "Hit in tempo";
  if (/Feint/.test(action)) return "Draw reaction";
  if (/Lunge|Advance/.test(action)) return "Claim initiative";
  return "Choose timing";
}
