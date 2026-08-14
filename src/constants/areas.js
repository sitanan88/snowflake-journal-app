export const AREAS = [
  { id: 'social',       name: 'Social',       icon: '👥', color: '#6B8CFF', tokens: 10 },
  { id: 'professional', name: 'Professional', icon: '💼', color: '#FFB347', tokens: 10 },
  { id: 'finance',      name: 'Finance',      icon: '💰', color: '#4DD37A', tokens: 10 },
  { id: 'love',         name: 'Love',         icon: '❤️',  color: '#FF6B9D', tokens: 10 },
  { id: 'family',       name: 'Family',       icon: '🏠', color: '#FF8C42', tokens: 10 },
  { id: 'pets',         name: 'Pets',         icon: '🐾', color: '#C4956A', tokens: 10 },
  { id: 'investing',    name: 'Investing',    icon: '📈', color: '#00C9D4', tokens: 10 },
  { id: 'gaming',       name: 'Gaming',       icon: '🎮', color: '#B06EF7', tokens: 10 },
  { id: 'health',       name: 'Health',       icon: '🩺', color: '#F45C5C', tokens: 10 },
  { id: 'fitness',      name: 'Fitness',      icon: '💪', color: '#FF7043', tokens: 10 },
  { id: 'goals',        name: 'Goals',        icon: '⭐', color: '#FFC107', tokens: 10 },
  { id: 'hygiene',      name: 'Hygiene',      icon: '🧼', color: '#A8E6CF', tokens: 10 },
];

export const AREA_MAP = Object.fromEntries(AREAS.map(a => [a.id, a]));
