export function renderMatchReview(els, review) {
  if (!els.matchReviewPanel || !review) return;
  els.matchReviewPanel.classList.remove("hidden");
  els.matchReviewPanel.innerHTML = `
    <div class="review-head">
      <div>
        <p class="eyebrow">Match Review</p>
        <h3>${review.result}</h3>
        <p>${review.matchType} · Final score ${review.score} · Tactical rating ${review.tacticalRating}%</p>
      </div>
      <div class="progress-ring small" style="--value:${review.tacticalRating}"><strong>${review.tacticalRating}%</strong></div>
    </div>
    <div class="review-rating-grid">
      ${ratingCard("↔", "Distance Control", review.ratings.distance)}
      ${ratingCard("◷", "Timing", review.ratings.timing)}
      ${ratingCard("◎", "Tactical Decisions", review.ratings.tactical)}
      ${ratingCard("✦", "Adaptability", review.ratings.adaptability)}
    </div>
    <div class="review-lists">
      <section>
        <h4>Strengths</h4>
        <ul class="review-strengths">${review.strengths.map((item) => `<li>${item}</li>`).join("")}</ul>
      </section>
      <section>
        <h4>Areas to Improve</h4>
        <ul class="review-improvements">${review.improvements.map((item) => `<li>${item}</li>`).join("")}</ul>
      </section>
    </div>
    <div class="key-moment-card">
      <h4>Key Moment</h4>
      <div class="review-chip-row">
        ${actionChips(review.keyMoment.playerPlan)}
        <b>vs</b>
        ${actionChips(review.keyMoment.opponentPlan)}
      </div>
      <p><strong>Outcome:</strong> ${review.keyMoment.outcome}</p>
      <p>${review.keyMoment.analysis}</p>
    </div>
    <div class="review-recommendations">
      <h4>Recommended Training</h4>
      <div>
        ${review.recommendations.map((rec) => `<button class="secondary-btn" data-review-target="${rec.target}" data-difficulty="${rec.difficulty || ""}" data-pack-id="${rec.packId || ""}" type="button">${rec.label}</button>`).join("")}
      </div>
    </div>
  `;
}

export function renderRecentReviews(ctx) {
  const { els, state } = ctx;
  if (!els.recentReviews) return;
  const reviews = state.progress.matchReviews || [];
  els.recentReviews.innerHTML = reviews.length
    ? reviews.map((review, index) => `
      <details class="recent-review-card" ${index === 0 ? "open" : ""}>
        <summary>
          <span>${review.date}</span>
          <strong>${review.matchType}: ${review.result}</strong>
          <small>${review.score} · ${review.tacticalRating}%</small>
        </summary>
        <div class="recent-review-body">
          <p><b>Strength:</b> ${review.strengths[0] || "Reviewable tactical exchanges."}</p>
          <p><b>Improve:</b> ${review.improvements[0] || "Keep varying preparation."}</p>
          <p><b>Key moment:</b> ${review.keyMoment?.outcome || "No key moment recorded."}</p>
          <div class="review-recommendations compact">
            ${review.recommendations.map((rec) => `<button class="ghost-btn" data-review-target="${rec.target}" data-difficulty="${rec.difficulty || ""}" data-pack-id="${rec.packId || ""}" type="button">${rec.label}</button>`).join("")}
          </div>
        </div>
      </details>
    `).join("")
    : `<p class="muted">Finish an AI Match or Local Duel to generate a coach review.</p>`;
}

function ratingCard(icon, label, value) {
  return `
    <article class="review-rating-card">
      <span>${icon}</span>
      <strong>${label}</strong>
      <div class="bar"><i style="width:${value}%"></i></div>
      <small>${value}%</small>
    </article>
  `;
}

function actionChips(plan = "") {
  const parts = String(plan).split(/->|:/).map((item) => item.trim()).filter(Boolean);
  return `<span class="review-chip-set">${parts.map((item) => `<i>${item}</i>`).join("<b>→</b>")}</span>`;
}
