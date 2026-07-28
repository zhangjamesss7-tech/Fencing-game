export const trainingPaths = {
  beginner: {
    title: "Beginner Epee Path",
    shortTitle: "Beginner Path",
    difficulty: "Beginner",
    goal: "Learn the basics of epee fencing and make simple tactical decisions.",
    steps: [
      { id: "guide-fundamentals", icon: "Guide", title: "Read Epee Fundamentals", description: "Learn target area, distance, and basic epee rules.", actionLabel: "Start", view: "guide", reward: 5, skills: { bladeWork: 5 } },
      { id: "flashcards-10", icon: "Flashcards", title: "Review 10 Flashcards", description: "Build vocabulary for blade actions, distance, and scoring.", actionLabel: "Review", view: "flashcards", reward: 10, skills: { bladeWork: 10 } },
      { id: "scenarios-beginner-5", icon: "Scenarios", title: "Complete 5 Beginner Tactical Scenarios", description: "Practice simple choices for distance and timing.", actionLabel: "Train", view: "scenarios", reward: 15, skills: { tacticalIq: 10, distanceControl: 5 } },
      { id: "quiz-beginner-1", icon: "Quiz", title: "Complete 1 Beginner Knowledge Quiz", description: "Check your understanding of epee fundamentals.", actionLabel: "Quiz", view: "quiz", reward: 10, skills: { bladeWork: 6, mentalGame: 4 } },
      { id: "ai-match-1", icon: "AI Match", title: "Play 1 AI Training Match", description: "Apply your decisions against an AI opponent.", actionLabel: "Fight AI", view: "match", reward: 20, skills: { matchExperience: 10, timing: 10 } },
      { id: "local-duel-1", icon: "Local Duel", title: "Try 1 Local Duel Mode exchange", description: "Use the hot-seat duel mode with another player.", actionLabel: "Duel", view: "match", reward: 20, skills: { matchExperience: 10, tacticalIq: 10 } }
    ]
  },
  intermediate: {
    title: "Intermediate Tactical Path",
    shortTitle: "Intermediate Path",
    difficulty: "Intermediate",
    goal: "Improve decision-making, distance control, and opponent reading.",
    steps: [
      { id: "guide-distance", icon: "Guide", title: "Review Distance Management guide", description: "Study how distance creates attacks, misses, and counters.", actionLabel: "Study", view: "guide", reward: 5, skills: { bladeWork: 5 } },
      { id: "flashcards-technique-10", icon: "Flashcards", title: "Master 10 technique flashcards", description: "Lock in terms for timing, parries, feints, and attacks.", actionLabel: "Review", view: "flashcards", reward: 10, skills: { bladeWork: 10 } },
      { id: "scenarios-intermediate-10", icon: "Scenarios", title: "Complete 10 Intermediate Tactical Scenarios", description: "Practice reading opponent choices and managing distance.", actionLabel: "Train", view: "scenarios", reward: 15, skills: { tacticalIq: 10, distanceControl: 5 } },
      { id: "ai-matches-2", icon: "AI Match", title: "Play 2 AI Matches", description: "Fence multiple AI bouts to build match rhythm.", actionLabel: "Fight AI", view: "match", reward: 20, skills: { matchExperience: 10, timing: 10 } },
      { id: "local-duel-complete-1", icon: "Local Duel", title: "Win or complete 1 Local Duel", description: "Complete a same-device duel exchange or match.", actionLabel: "Duel", view: "match", reward: 20, skills: { matchExperience: 10, tacticalIq: 10 } },
      { id: "progress-review", icon: "Progress", title: "Review Progress page", description: "Check ratings, path progress, and development areas.", actionLabel: "Review", view: "progress", reward: 5, skills: { mentalGame: 5 } }
    ]
  },
  advanced: {
    title: "Advanced Match Preparation Path",
    shortTitle: "Advanced Path",
    difficulty: "Advanced",
    goal: "Practice score-aware tactics, opponent adaptation, and pressure decisions.",
    steps: [
      { id: "guide-tactics", icon: "Guide", title: "Review Tactical Concepts guide", description: "Review pressure, preparation, and opponent adaptation.", actionLabel: "Study", view: "guide", reward: 5, skills: { bladeWork: 5 } },
      { id: "scenarios-advanced-10", icon: "Scenarios", title: "Complete 10 Advanced Tactical Scenarios", description: "Train score-aware and complex tactical choices.", actionLabel: "Train", view: "scenarios", reward: 15, skills: { tacticalIq: 10, distanceControl: 5 } },
      { id: "ai-opponent-types-3", icon: "AI Match", title: "Play 3 AI Matches against different opponent types", description: "Fence varied AI styles and adapt your plan.", actionLabel: "Fight AI", view: "match", reward: 20, skills: { matchExperience: 10, timing: 10 } },
      { id: "local-duel-match-1", icon: "Local Duel", title: "Complete 1 Local Duel Match", description: "Finish a first-to-5 local duel match.", actionLabel: "Duel", view: "match", reward: 20, skills: { matchExperience: 10, tacticalIq: 10 } },
      { id: "rating-70", icon: "Rating", title: "Reach at least 70% Tactical Rating", description: "Show consistent decision quality across training.", actionLabel: "Progress", view: "progress", reward: 10, skills: { mentalGame: 5, tacticalIq: 5 } },
      { id: "skill-tree-review", icon: "Skill Tree", title: "Review weaknesses in Skill Tree", description: "Use your development page to plan focused training.", actionLabel: "Review", view: "development", reward: 5, skills: { mentalGame: 5 } }
    ]
  }
};

export const pathOrder = ["beginner", "intermediate", "advanced"];
