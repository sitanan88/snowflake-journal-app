export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getPrevDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function formatDateLabel(dateStr) {
  const today = getTodayStr();
  const yesterday = getPrevDay(today);
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Returns the Monday date string for the ISO week containing dateStr
export function getWeekStart(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun
  const daysToMon = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + daysToMon);
  return d.toISOString().slice(0, 10);
}

// Week key is the Monday date of that week, e.g. "2026-08-10"
export function getWeekKey(dateStr) {
  return getWeekStart(dateStr);
}

// Returns an array of 7 date strings (Mon–Sun) for the week starting at weekStart
export function getDaysInWeek(weekStart) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

// Advance a date string by n days
export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
