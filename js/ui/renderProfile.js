export function skillTier(levelValue) {
  if (levelValue >= 15) return "Elite";
  if (levelValue >= 10) return "Advanced";
  if (levelValue >= 5) return "Intermediate";
  return "Beginner";
}

export function renderProgress(ctx) {
  const { els, state, avatarOptions, profileAvatarId, avatarById, xpInLevel, level, accuracy, renderProfile, renderSkillTree } = ctx;
  const xpLevel = xpInLevel();
  const profile = state.progress.profile;
  const avatar = avatarById(profileAvatarId());
  els.welcomeLabel.textContent = profile ? `Welcome Back, ${profile.name}` : "Welcome to Fencing IQ";
  renderAvatarFrame(els.hubAvatar, avatar, "mini-avatar");
  els.hubProfileName.textContent = profile?.name || "Create Profile";
  els.hubProfileStyle.textContent = profile ? `${profile.weapon} · ${profile.style}` : "Epee Fencer";
  els.hubLevel.textContent = `Fencer Level ${level()}`;
  els.hubXp.textContent = `${xpLevel}/100 XP`;
  els.hubXpFill.style.width = `${xpLevel}%`;
  els.hubMatches.textContent = state.progress.matches;
  els.hubAccuracy.textContent = `${state.progress.tacticalRating}%`;
  els.hubMastered.textContent = state.progress.mastered.length;
  els.progressLevel.textContent = level();
  els.progressXp.textContent = state.progress.xp;
  els.progressMatches.textContent = state.progress.matches;
  els.progressAccuracy.textContent = `${accuracy()}%`;
  els.progressRating.textContent = `${state.progress.tacticalRating}%`;
  els.progressMastered.textContent = state.progress.mastered.length;
  renderProfile();
  renderSkillTree();
}

export function renderProfile(ctx) {
  const { els, state, avatarOptions, profileAvatarId, avatarById, isAvatarUnlocked, level, xpInLevel, winRate, averageRating, skillDisplayPercent, skillLevel } = ctx;
  const profile = state.progress.profile;
  const avatar = avatarById(profileAvatarId());
  if (!profile) {
    els.profileName.textContent = "No profile yet";
    renderAvatarFrame(els.profileAvatar, avatar, "profile-avatar-frame");
    els.profileSummary.textContent = "Create a profile to start tracking progress.";
    els.profileWeapon.textContent = "Epee";
    els.profileExperience.textContent = "Beginner";
    els.profileStyle.textContent = "Unsure";
    els.profileYears.textContent = "Less than 1 year";
    els.profileLevel.textContent = level();
    els.profileXp.textContent = `${xpInLevel()} / 100`;
    els.profileXpFill.style.width = `${xpInLevel()}%`;
    els.statMatches.textContent = "0";
    els.statWins.textContent = "0";
    els.statLosses.textContent = "0";
    els.statWinRate.textContent = "0%";
    els.statTouchesScored.textContent = "0";
    els.statTouchesReceived.textContent = "0";
    els.statAvgRating.textContent = "0%";
    els.profileSkills.innerHTML = "";
    renderAvatarChoices(ctx);
    return;
  }
  renderAvatarFrame(els.profileAvatar, avatar, "profile-avatar-frame");
  els.profileName.textContent = profile.name;
  els.profileSummary.textContent = `${profile.weapon} · ${profile.experience} · ${profile.style}`;
  els.profileWeapon.textContent = profile.weapon;
  els.profileExperience.textContent = profile.experience;
  els.profileStyle.textContent = profile.style;
  els.profileYears.textContent = profile.years;
  els.profileLevel.textContent = level();
  els.profileXp.textContent = `${xpInLevel()} / 100`;
  els.profileXpFill.style.width = `${xpInLevel()}%`;
  els.avatarCurrentLabel.textContent = avatar.name;
  els.statMatches.textContent = state.progress.matches;
  els.statWins.textContent = state.progress.wins;
  els.statLosses.textContent = state.progress.losses;
  els.statWinRate.textContent = `${winRate()}%`;
  els.statTouchesScored.textContent = state.progress.touchesScored;
  els.statTouchesReceived.textContent = state.progress.touchesReceived;
  els.statAvgRating.textContent = `${averageRating()}%`;
  const skillLabels = [
    ["distanceControl", "Distance Control"],
    ["timing", "Timing"],
    ["bladeWork", "Blade Work"],
    ["tacticalIq", "Tactical IQ"],
    ["matchExperience", "Match Experience"],
    ["mentalGame", "Mental Game"]
  ];
  els.profileSkills.innerHTML = skillLabels.map(([key, label]) => {
    const value = skillDisplayPercent(key);
    return `
      <div class="skill-row">
        <div class="split"><strong>${label}</strong><span>Level ${skillLevel(key)} · ${value}%</span></div>
        <div class="skill-bar"><span style="width: ${value}%"></span></div>
      </div>
    `;
  }).join("");
  renderAvatarChoices(ctx);
}

export function renderAvatarChoices(ctx) {
  const { els, avatarOptions, profileAvatarId, pendingAvatarId, isAvatarUnlocked } = ctx;
  if (!els.avatarChoiceGrid) return;
  const selectedId = pendingAvatarId || profileAvatarId();
  els.avatarChoiceGrid.innerHTML = avatarOptions.map((avatar) => {
    const unlocked = isAvatarUnlocked(avatar);
    const selected = avatar.id === selectedId;
    return `
      <button class="avatar-choice ${selected ? "selected" : ""} ${unlocked ? "" : "locked"}" data-avatar-id="${avatar.id}" type="button" ${unlocked ? "" : "disabled"}>
        <span class="avatar-choice-preview ${avatar.className}" aria-hidden="true"></span>
        <span>
          <strong>${avatar.name}</strong>
          <small>${unlocked ? avatar.description : `🔒 ${avatar.unlock.label}`}</small>
        </span>
      </button>
    `;
  }).join("");
}

function renderAvatarFrame(element, avatar, baseClass) {
  if (!element || !avatar) return;
  element.className = `${baseClass} ${avatar.className}`;
  element.innerHTML = `<span class="avatar-crop" aria-hidden="true"></span>`;
  element.setAttribute("aria-label", avatar.name);
}

export function renderSkillTree(ctx) {
  const { els, state, skillCatalog, skillLevel, skillProgress } = ctx;
  if (!els.skillTree) return;
  const sorted = Object.keys(skillCatalog).sort((a, b) => skillLevel(b) - skillLevel(a));
  const strengths = sorted.slice(0, 2).map((skill) => `✓ ${skillCatalog[skill].name} - Level ${skillLevel(skill)}`);
  const improvements = [...sorted].reverse().slice(0, 2).map((skill) => `△ ${skillCatalog[skill].name} - ${skillCatalog[skill].next}`);
  els.strengthList.innerHTML = strengths.map((item) => `<li>${item}</li>`).join("");
  els.improveList.innerHTML = improvements.map((item) => `<li>${item}</li>`).join("");

  els.skillTree.innerHTML = Object.entries(skillCatalog).map(([skill, config]) => {
    const currentLevel = skillLevel(skill);
    const progress = skillProgress(skill);
    const history = state.progress.trainingHistory[skill] || [];
    const unlocks = config.unlocks.map(([requiredLevel, label]) => {
      const isUnlocked = currentLevel >= requiredLevel;
      return `<li class="${isUnlocked ? "unlocked" : "locked"}">${isUnlocked ? "✓" : "○"} Level ${requiredLevel}: ${label}</li>`;
    }).join("");
    const historyMarkup = history.length
      ? history.map((entry) => `<li>${entry.date}: +${entry.amount} XP · ${entry.source}</li>`).join("")
      : "<li>No training history yet.</li>";

    return `
      <article class="skill-card" data-skill="${skill}">
        <div class="skill-top">
          <div>
            <span class="skill-icon">${skillIcon(skill)}</span>
            <h3>${config.name}</h3>
            <span class="tier-label">${skillTier(currentLevel)}</span>
          </div>
          <div class="progress-ring small" style="--value:${progress}"><strong>${progress}%</strong></div>
        </div>
        <span class="level-badge">Level ${currentLevel}</span>
        <div class="skill-bar"><span style="width: ${progress}%"></span></div>
        <div class="xp-note">${progress}% to next level</div>
        <div class="skill-detail">
          <p><strong>Description:</strong> ${config.description}</p>
          <p><strong>Measures:</strong> ${config.measures}</p>
          <h4>Improves through</h4>
          <ul class="improve-list">${config.improves.map((item) => `<li>✓ ${item}</li>`).join("")}</ul>
          <h4>Next level</h4>
          <p>${config.next}</p>
          <h4>Unlocks</h4>
          <ul class="unlock-list">${unlocks}</ul>
          <h4>Training history</h4>
          <ul class="history-list">${historyMarkup}</ul>
        </div>
      </article>
    `;
  }).join("");
}

function skillIcon(skill) {
  const icons = {
    distanceControl: "↔",
    timing: "◷",
    bladeWork: "▰",
    tacticalIq: "◎",
    matchExperience: "⚔",
    mentalGame: "✦"
  };
  return icons[skill] || "•";
}

export function showProfileSetupIfNeeded(ctx) {
  ctx.els.profileSetup.classList.toggle("show", !ctx.state.progress.profile);
}
