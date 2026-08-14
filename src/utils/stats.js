import { AREAS } from '../constants/areas';
import { BUILTIN_BADGES } from '../constants/badges';
import { getLevelForXP } from '../constants/levels';
import { getTodayStr, getPrevDay, getWeekStart, getWeekKey, getDaysInWeek, addDays } from './date';

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

// ─── Adulting stats ──────────────────────────────────────────────────────────

export function computeAdultingStats(bundles, bundleCompletions) {
  const today = getTodayStr();
  const empty = {
    adultingStreak:     0,
    adultingXP:         0,
    bankedXP:           0,
    currentWeekXP:      0,
    currentWeekFailed:  false,
    adultingLevel:      1,
    adultingLevelName:  'Getting By',
    adultingBonusTokens: 0,
  };

  if (!bundleCompletions || bundleCompletions.length === 0) return empty;

  // Days that had ≥1 completed bundle
  const completionDates = new Set(bundleCompletions.map(c => c.date));

  // Adulting streak: consecutive days with ≥1 completed bundle
  const adultingStreak = computeStreak(completionDates);

  // Earliest completion date = start of tracking window
  const trackingStart = [...completionDates].sort()[0];

  // Collect all unique week starts in the tracking window
  const weekStartsSeen = new Set();
  let cursor = trackingStart;
  while (cursor <= today) {
    weekStartsSeen.add(getWeekStart(cursor));
    cursor = addDays(cursor, 1);
  }

  const currentWeekStart = getWeekStart(today);
  let bankedXP           = 0;
  let currentWeekXP      = 0;
  let currentWeekFailed  = false;
  let adultingBonusTokens = 0;

  for (const weekStart of weekStartsSeen) {
    const weekDays       = getDaysInWeek(weekStart);
    // Only care about days within our tracking window and not in the future
    const trackedDays    = weekDays.filter(d => d >= trackingStart && d <= today);
    const pastDays       = trackedDays.filter(d => d < today);
    const completedDays  = trackedDays.filter(d => completionDates.has(d));
    const missedDays     = pastDays.filter(d => !completionDates.has(d));

    // Bonus tokens from bundle completions in this week
    const weekBonus = bundleCompletions
      .filter(c => getWeekStart(c.date) === weekStart)
      .reduce((sum, c) => sum + (c.bonusTokens || 0), 0);

    if (weekStart === currentWeekStart) {
      currentWeekXP     = completedDays.length;
      currentWeekFailed = missedDays.length > 0;
      if (!currentWeekFailed) adultingBonusTokens += weekBonus;
    } else {
      // Past week: only banks if no missed days
      if (missedDays.length === 0) {
        bankedXP            += completedDays.length;
        adultingBonusTokens += weekBonus;
      }
    }
  }

  const adultingXP  = bankedXP + (currentWeekFailed ? 0 : currentWeekXP);
  const levelData   = getLevelForXP(adultingXP);

  return {
    adultingStreak,
    adultingXP,
    bankedXP,
    currentWeekXP,
    currentWeekFailed,
    adultingLevel:      levelData.level,
    adultingLevelName:  levelData.name,
    adultingBonusTokens,
  };
}

// ─── Badge helpers ───────────────────────────────────────────────────────────

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
