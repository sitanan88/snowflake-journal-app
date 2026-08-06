import { supabase } from './supabase';

// ─── Pull (Supabase → app state) ─────────────────────────────────────────────

export async function pullAll(userId) {
  const [
    { data: entries },
    { data: tasks },
    { data: customBadges },
    { data: userVocab },
    { data: settings },
  ] = await Promise.all([
    supabase.from('entries').select('*').eq('user_id', userId),
    supabase.from('tasks').select('*').eq('user_id', userId),
    supabase.from('custom_badges').select('*').eq('user_id', userId),
    supabase.from('user_vocab').select('*').eq('user_id', userId),
    supabase.from('user_settings').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  return {
    entries:            (entries      || []).map(dbToEntry),
    tasks:              (tasks        || []).map(dbToTask),
    customBadges:       (customBadges || []).map(dbToCustomBadge),
    userVocab:          (userVocab    || []).map(dbToVocab),
    unlockedBuiltinIds: settings?.unlocked_builtin_ids || [],
    userQuotes:         settings?.user_quotes           || [],
    soundOn:            settings?.sound_on              ?? true,
  };
}

// ─── Push individual items ────────────────────────────────────────────────────

export async function pushEntry(entry, userId) {
  await supabase.from('entries').upsert(entryToDb(entry, userId));
}

export async function removeEntry(id) {
  await supabase.from('entries').delete().eq('id', id);
}

export async function pushTask(task, userId) {
  await supabase.from('tasks').upsert(taskToDb(task, userId));
}

export async function removeTask(id) {
  await supabase.from('tasks').delete().eq('id', id);
}

export async function pushCustomBadge(badge, userId) {
  await supabase.from('custom_badges').upsert(customBadgeToDb(badge, userId));
}

export async function removeCustomBadge(id) {
  await supabase.from('custom_badges').delete().eq('id', id);
}

export async function pushVocab(vocab, userId) {
  await supabase.from('user_vocab').upsert(vocabToDb(vocab, userId));
}

export async function removeVocab(id) {
  await supabase.from('user_vocab').delete().eq('id', id);
}

export async function pushSettings(userId, { soundOn, unlockedBuiltinIds, userQuotes }) {
  await supabase.from('user_settings').upsert({
    user_id:             userId,
    sound_on:            soundOn,
    unlocked_builtin_ids: unlockedBuiltinIds,
    user_quotes:         userQuotes,
    updated_at:          new Date().toISOString(),
  });
}

// ─── DB ↔ app shape transforms ───────────────────────────────────────────────

function entryToDb(e, userId) {
  return {
    id:         e.id,
    user_id:    userId,
    date:       e.date,
    timestamp:  e.timestamp,
    area:       e.area,
    tokens:     e.tokens,
    note:       e.note    ?? null,
    task_id:    e.taskId  ?? null,
    updated_at: new Date().toISOString(),
  };
}

function dbToEntry(row) {
  return {
    id:        row.id,
    date:      row.date,
    timestamp: row.timestamp,
    area:      row.area,
    tokens:    row.tokens,
    note:      row.note,
    taskId:    row.task_id,
  };
}

function taskToDb(t, userId) {
  return {
    id:         t.id,
    user_id:    userId,
    name:       t.name,
    area:       t.area,
    tokens:     t.tokens,
    updated_at: new Date().toISOString(),
  };
}

function dbToTask(row) {
  return { id: row.id, name: row.name, area: row.area, tokens: row.tokens };
}

function customBadgeToDb(b, userId) {
  return {
    id:           b.id,
    user_id:      userId,
    name:         b.name,
    icon:         b.icon,
    description:  b.desc        ?? null,
    metric:       b.metric,
    area:         b.area        ?? null,
    threshold:    b.threshold   ?? null,
    unlocked:     b.unlocked,
    unlocked_date: b.unlockedDate ?? null,
    updated_at:   new Date().toISOString(),
  };
}

function dbToCustomBadge(row) {
  return {
    id:          row.id,
    name:        row.name,
    icon:        row.icon,
    desc:        row.description,
    metric:      row.metric,
    area:        row.area,
    threshold:   row.threshold,
    unlocked:    row.unlocked,
    unlockedDate: row.unlocked_date,
  };
}

function vocabToDb(v, userId) {
  return {
    id:         v.id,
    user_id:    userId,
    term:       v.term,
    definition: v.definition,
    example:    v.example ?? null,
    updated_at: new Date().toISOString(),
  };
}

function dbToVocab(row) {
  return { id: row.id, term: row.term, definition: row.definition, example: row.example };
}
