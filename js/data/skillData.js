export const defaultSkills = {
  distanceControl: 0,
  timing: 0,
  bladeWork: 0,
  tacticalIq: 0,
  matchExperience: 0,
  mentalGame: 0
};

export const skillCatalog = {
  distanceControl: {
    name: "Distance Control",
    description: "Your ability to manage distance, create openings, and control the opponent's attacks.",
    measures: "Maintaining correct distance, making opponents miss, and knowing when to advance or retreat.",
    improves: ["Tactical scenarios", "Match simulator", "Distance-based decisions"],
    next: "Complete more distance-based scenarios or score with retreats in the match simulator.",
    unlocks: [
      [3, "Unlock half steps and distance drills"],
      [5, "Unlock advanced distance scenarios"],
      [7, "Unlock bait and invite-attack setups"],
      [10, "Unlock elite opponent patterns"]
    ]
  },
  timing: {
    name: "Timing",
    description: "Your ability to choose the right moment to attack, counterattack, or recover.",
    measures: "Recognizing preparation, reaction windows, and the opponent's commitment.",
    improves: ["Match simulator decisions", "Counterattack success", "Tactical scenarios"],
    next: "Win exchanges through counterattacks, parry-ripostes, and preparation attacks.",
    unlocks: [
      [3, "Unlock timing cue prompts"],
      [5, "Unlock evasive reaction drills"],
      [7, "Unlock step-lunge timing drills"],
      [10, "Unlock elite preparation reads"]
    ]
  },
  bladeWork: {
    name: "Blade Work",
    description: "Your understanding of parries, ripostes, feints, disengages, and blade control.",
    measures: "Blade action vocabulary, parry choices, feints, and disengages.",
    improves: ["Flashcards", "Knowledge quiz", "Technique lessons"],
    next: "Master flashcards and answer epee technique questions correctly.",
    unlocks: [
      [3, "Unlock beginner blade action review"],
      [5, "Unlock feint and beat-attack controls"],
      [10, "Unlock advanced blade traps"]
    ]
  },
  tacticalIq: {
    name: "Tactical IQ",
    description: "Your ability to read opponents, create strategies, and adapt during matches.",
    measures: "Opponent reading, strategy selection, and adaptation under pressure.",
    improves: ["Tactical scenarios", "AI matches", "Correct strategic choices"],
    next: "Complete tactical scenarios and adapt to AI opponent patterns.",
    unlocks: [
      [5, "Unlock hidden opponent patterns"],
      [7, "Unlock compound bait sequences"],
      [10, "Unlock change-rhythm and adaptive AI opponents"],
      [15, "Unlock elite tactical scouting"]
    ]
  },
  matchExperience: {
    name: "Match Experience",
    description: "Your performance under pressure in bout-like situations.",
    measures: "Completing bouts, managing scores, and making match decisions.",
    improves: ["Playing AI matches", "Completing bouts", "Winning first-to-5 matches"],
    next: "Finish more AI bouts and review match feedback.",
    unlocks: [
      [3, "Unlock match review notes"],
      [5, "Unlock pressure situation prompts"],
      [10, "Unlock tournament-mode preparation"]
    ]
  },
  mentalGame: {
    name: "Mental Game",
    description: "Your patience, adaptability, and decision making under pressure.",
    measures: "Patience, adaptability, comeback decisions, and avoiding panic actions.",
    improves: ["Advanced scenarios", "Difficult matches", "Comeback situations"],
    next: "Use replay thoughtfully, avoid predictable choices, and complete hard bouts.",
    unlocks: [
      [3, "Unlock patience reminders"],
      [5, "Unlock comeback scenario prompts"],
      [10, "Unlock elite pressure training"]
    ]
  }
};

