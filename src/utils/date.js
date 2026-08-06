export function getTodayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function getPrevDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
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
