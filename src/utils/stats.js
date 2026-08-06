import { AREAS } from '../constants/areas';
import { BUILTIN_BADGES } from '../constants/badges';
import { getTodayStr, getPrevDay } from './date';

export function computeStats(entries) {
  const totalTokens = entries.reduce((s, e) => s + (e.tokens || 0), 0);
  const totalDeeds = entries.length;

  const daysSet = new Set(entries.map(e => e.date));
  const daysLogged = daysSet.size;

  const areaCounts = {};
  AREAS.forEach(a => { areaCounts[a.id] = 0; });
  entries.forEach(e => {
    if (areaCounts[e.area] !== undefined) areaCounts[e.area]++;
  });

  const allAreasLogged = AREAS.every(a => areaCounts[a.id] > 0);
  const streak = computeStreak(daysSet);

  return { totalTokens, totalDeeds, daysLogged, areaCounts, allAreasLogged, streak };
}

export function computeStreak(daysSet) {
  const today = getTodayStr();
  const yesterday = getPrevDay(today);

  // Start counting from today if logged today, else from yesterday
  const startDay = daysSet.has(today) ? today : yesterday;
  if (!daysSet.has(startDay)) return 0;

  let streak = 0;
  let day = startDay;
  while (daysSet.has(day)) {
    streak++;
    day = getPrevDay(day);
  }
  return streak;
}

export function checkBuiltinBadges(stats, currentUnlockedIds) {
  const newlyUnlocked = [];
  for (const badge of BUILTIN_BADGES) {
    if (currentUnlockedIds.includes(badge.id)) continue;
    if (isBadgeConditionMet(badge, stats)) {
      newlyUnlocked.push(badge.id);
    }
  }
  return newlyUnlocked;
}

export function checkCustomBadges(customBadges, stats) {
  const newlyUnlocked = [];
  for (const badge of customBadges) {
    if (badge.unlocked) continue;
    if (isCustomBadgeConditionMet(badge, stats)) {
      newlyUnlocked.push(badge.id);
    }
  }
  return newlyUnlocked;
}

export function isBadgeConditionMet(badge, stats) {
  switch (badge.metric) {
    case 'total_deeds':   return stats.totalDeeds >= badge.threshold;
    case 'total_tokens':  return stats.totalTokens >= badge.threshold;
    case 'streak':        return stats.streak >= badge.threshold;
    case 'days_logged':   return stats.daysLogged >= badge.threshold;
    case 'all_areas':     return stats.allAreasLogged;
    case 'area_deeds':    return (stats.areaCounts[badge.area] || 0) >= badge.threshold;
    default:              return false;
  }
}

export function isCustomBadgeConditionMet(badge, stats) {
  return isBadgeConditionMet(badge, stats);
}
