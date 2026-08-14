// Adulting level definitions.
// Each level requires reaching the listed minXP of banked+current week XP.
// XP is earned 1 per day with ≥1 completed bundle.
// A week's XP is forfeited if any day in that week passes with 0 completions.
// Perfect weeks (7/7) bank 7 XP each.

export const LEVELS = [
  { level: 1,  name: 'Getting By',         minXP: 0   },
  { level: 2,  name: 'Finding Routine',    minXP: 7   },
  { level: 3,  name: 'Building Momentum',  minXP: 21  },
  { level: 4,  name: 'Gaining Traction',   minXP: 42  },
  { level: 5,  name: 'Adulting',           minXP: 70  },
  { level: 6,  name: 'Steady',             minXP: 105 },
  { level: 7,  name: 'Locked In',          minXP: 140 },
  { level: 8,  name: 'On Autopilot',       minXP: 182 },
  { level: 9,  name: 'Consistent',         minXP: 224 },
  { level: 10, name: 'Certified Grown-up', minXP: 280 },
];

export function getLevelForXP(xp) {
  let result = LEVELS[0];
  for (const l of LEVELS) {
    if (xp >= l.minXP) result = l;
    else break;
  }
  return result;
}

export function getNextLevel(currentLevel) {
  return LEVELS.find(l => l.level === currentLevel + 1) ?? null;
}
