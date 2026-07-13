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
    <article class="guide-card">
      <div class="diagram">${section.diagram}</div>
      <h3>${section.title}</h3>
      ${section.points.map((point) => `<p>${point}</p>`).join("")}
    </article>
  `).join("");
}

export function renderFlashcard(ctx) {
  const { els, state, flashcards } = ctx;
  const card = flashcards[state.flashIndex];
  const mastered = state.progress.mastered.includes(card.id);
  els.flashSide.textContent = state.flashFlipped ? "Explanation" : "Term";
  els.flashText.textContent = state.flashFlipped ? card.back : card.term;
  els.flashHint.textContent = mastered ? "Mastered" : "Click to flip";
}

export function renderQuiz(ctx) {
  const { els, state, currentQuizPool, grantXp, saveProgress } = ctx;
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
    saveProgress();
    els.quizScore.textContent = `Score ${state.quizScore}`;
    els.quizFeedback.innerHTML = `<strong>${correct ? "Correct." : "Incorrect."}</strong> ${question.explanation}`;
    els.quizFeedback.classList.add("show");
    els.nextQuestion.classList.add("show");
  });
}

export function renderScenario(ctx) {
  const { els, state, scenarios, actions, scenarioPool, grantXp, saveProgress } = ctx;
  const pool = scenarioPool();
  const scenario = pool[state.scenarioIndex % pool.length];
  els.scenarioCount.textContent = `Scenario ${scenario.id} / ${scenarios.length}`;
  els.scenarioDistance.textContent = scenario.distance;
  els.scenarioStyle.textContent = scenario.style;
  els.scenarioSituation.textContent = scenario.situation;
  els.scenarioFeedback.className = "feedback";
  els.nextScenario.classList.remove("show");
  const wrongs = actions.filter((action) => action !== scenario.correctAction).sort(() => Math.random() - 0.5).slice(0, 3);
  const opts = [scenario.correctAction, ...wrongs].sort(() => Math.random() - 0.5);
  renderOptions(els.scenarioOptions, opts, (choice) => {
    const correctIndex = opts.indexOf(scenario.correctAction);
    const correct = choice === correctIndex;
    lockOptions(els.scenarioOptions, choice, correctIndex);
    state.progress.scenarioAnswered += 1;
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
    els.scenarioFeedback.innerHTML = `<strong>${correct ? "Successful decision." : "Lower-percentage choice."}</strong> ${scenario.explanation}`;
    els.scenarioFeedback.classList.add("show");
    els.nextScenario.classList.add("show");
  });
}
