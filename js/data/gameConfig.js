export const actions = ["Advance", "Retreat", "Lunge", "Fleche", "Counterattack", "Parry-Riposte", "Feint", "Hold Distance"];
export const drillActions = [
  { name: "Advance", group: "Movement", key: "D", risk: 1, unlock: 1, simple: true },
  { name: "Retreat", group: "Movement", key: "A", risk: 1, unlock: 1, simple: true },
  { name: "Half Step In", group: "Movement", key: "E", risk: 1, unlock: 3 },
  { name: "Half Step Out", group: "Movement", key: "Q", risk: 1, unlock: 3 },
  { name: "Hold Distance", group: "Movement", key: "H", risk: 1, unlock: 3 },
  { name: "Feint", group: "Preparation", key: "F", risk: 2, unlock: 1, simple: true },
  { name: "Bait", group: "Preparation", key: "B", risk: 2, unlock: 5 },
  { name: "Beat", group: "Preparation", key: "Shift+B", risk: 2, unlock: 5 },
  { name: "Change Rhythm", group: "Preparation", key: "C", risk: 1, unlock: 10 },
  { name: "Lunge", group: "Finish", key: "Space", risk: 3, unlock: 1, simple: true },
  { name: "Step-Lunge", group: "Finish", key: "Shift+Space", risk: 4, unlock: 7 },
  { name: "Fleche", group: "Finish", key: "Shift+F", risk: 4, unlock: 7 },
  { name: "Counterattack", group: "Finish", key: "K", risk: 2, unlock: 1, simple: true },
  { name: "Parry-Riposte", group: "Finish", key: "R", risk: 2, unlock: 1, simple: true }
];
export const actionAliases = {
  Parry: "Parry-Riposte",
  "Half Step": "Advance",
  "Half Step In": "Advance",
  "Half Step Out": "Retreat",
  "Half Step Forward": "Advance",
  "Half Step Back": "Retreat",
  "Step-Lunge": "Lunge",
  "Direct Attack": "Lunge",
  Beat: "Lunge",
  "Beat Attack": "Lunge",
  Bait: "Hold Distance",
  "Change Rhythm": "Feint",
  "Invite Attack": "Hold Distance",
  "Duck / Evasive Action": "Retreat"
};
export const keyToAction = {
  KeyA: "Retreat",
  KeyD: "Advance",
  KeyQ: "Half Step Out",
  KeyE: "Half Step In",
  Space: "Lunge",
  KeyF: "Feint",
  KeyB: "Bait",
  KeyJ: "Parry-Riposte",
  KeyK: "Counterattack",
  KeyR: "Parry-Riposte",
  KeyC: "Change Rhythm",
  KeyS: "Retreat"
};
export const distanceNames = { 5: "Long distance", 4: "Long measure", 3: "Middle distance", 2: "Close distance", 1: "Dangerously close" };

export const opponentTypes = {
  aggressive: {
    title: "Pressure Fencer",
    styleName: "pressure attacks",
    notes: ["Frequently advances", "Creates pressure", "Attacks when distance closes"],
    strength: "Forces mistakes",
    weakness: "Vulnerable to counterattacks and distance traps",
    behaviours: ["Pressuring forward", "Searching for a fast attack", "Trying to compress distance"],
    patterns: ["Advance-attack rhythm", "Attacks when distance closes", "Overcommits at close distance"],
    preferredDistance: [2, 3],
    weights: { Attack: 42, Retreat: 8, Counterattack: 12, "Hold Distance": 12, Feint: 26 }
  },
  defensive: {
    title: "Defensive Fencer",
    styleName: "defensive distance control",
    notes: ["Maintains distance", "Waits for mistakes", "Uses defensive actions"],
    strength: "Difficult to hit",
    weakness: "Vulnerable to feints and preparation attacks",
    behaviours: ["Waiting for your mistake", "Holding long measure", "Setting a parry trap"],
    patterns: ["Retreats before riposting", "Punishes overreach", "Parries direct attacks"],
    preferredDistance: [4, 5],
    weights: { Attack: 12, Retreat: 26, Counterattack: 16, "Hold Distance": 30, Feint: 16 }
  },
  counterattacker: {
    title: "Counterattacker",
    styleName: "counterattacking",
    notes: ["Looks for predictable attacks", "Punishes aggressive players", "Baits commitment"],
    strength: "Reads opponent habits",
    weakness: "Vulnerable to patience, false attacks, and changing rhythm",
    behaviours: ["Inviting your attack", "Showing a target", "Waiting on your preparation"],
    patterns: ["Counterattacks into lunges", "Scores on bad distance", "Repeats bait-and-hit"],
    preferredDistance: [3, 4],
    weights: { Attack: 10, Retreat: 16, Counterattack: 42, "Hold Distance": 18, Feint: 14 }
  },
  unpredictable: {
    title: "Adaptive Fencer",
    styleName: "adaptive rhythm changes",
    notes: ["Learns from your actions", "Changes strategy during the match", "Uses deception"],
    strength: "Adapts during the match",
    weakness: "Vulnerable to disciplined observation and patient setups",
    behaviours: ["Changing rhythm", "Switching between attack and wait", "Testing your reaction"],
    patterns: ["Changes strategy after repeated actions", "Alternates pressure and retreat", "Punishes repeated choices"],
    preferredDistance: [2, 3, 4],
    weights: { Attack: 22, Retreat: 20, Counterattack: 20, "Hold Distance": 18, Feint: 20 }
  }
};

export const avatarIcons = {
  "Beginner Fencer": "🥉",
  "Tactical Fencer": "🎯",
  "Aggressive Fencer": "⚡",
  "Defensive Fencer": "🛡️",
  "Champion Fencer": "🏆"
};

