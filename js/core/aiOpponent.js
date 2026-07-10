export function opponentSequenceLabel(aiAction, playerSequence) {
  if (aiAction === "Attack") return playerSequence.includes("Bait") || playerSequence.includes("Invite Attack") ? "Advance -> Attack" : "Attack";
  if (aiAction === "Counterattack") return "Retreat -> Counterattack";
  if (aiAction === "Feint") return "Feint -> Change Line";
  if (aiAction === "Retreat") return "Retreat -> Reset Distance";
  return aiAction;
}
