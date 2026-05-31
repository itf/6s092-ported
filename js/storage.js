/**
 * storage.js
 * IndexedDB wrapper using idb (globally loaded via CDN UMD).
 *
 * Schema:
 *   DB: "pset-checker"
 *   Store "scores": keyPath "id" (string: "course/PS/PSxx/qN")
 *     { id, course, pset, qIndex, earned, total, lastUpdated }
 *   Store "code": keyPath "id"
 *     { id, code, lastUpdated }
 */

const DB_NAME = 'pset-checker';
const DB_VERSION = 1;

let _db = null;

async function getDb() {
  if (_db) return _db;
  // idb is loaded as UMD global
  _db = await idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('scores')) {
        db.createObjectStore('scores', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('code')) {
        db.createObjectStore('code', { keyPath: 'id' });
      }
    },
  });
  return _db;
}

/** Build a key string for a question. */
function qKey(course, pset, qIndex) {
  return `${course}/${pset}/${qIndex}`;
}

/** Save a question score. */
export async function saveScore(course, pset, qIndex, earned, total) {
  const db = await getDb();
  await db.put('scores', {
    id: qKey(course, pset, qIndex),
    course,
    pset,
    qIndex,
    earned,
    total,
    lastUpdated: Date.now(),
  });
}

/**
 * Register a question's total points when the page first renders.
 * Only writes if the question hasn't been recorded yet, so it doesn't
 * overwrite an existing earned score.
 */
export async function initQuestionTotal(course, pset, qIndex, total) {
  const db = await getDb();
  const key = qKey(course, pset, qIndex);
  const existing = await db.get('scores', key);
  if (!existing) {
    await db.put('scores', {
      id: key, course, pset, qIndex,
      earned: 0, total,
      lastUpdated: Date.now(),
    });
  } else if (existing.total !== total) {
    // Update total in case question changed
    await db.put('scores', { ...existing, total });
  }
}

/** Get score for a single question. */
export async function getScore(course, pset, qIndex) {
  const db = await getDb();
  return db.get('scores', qKey(course, pset, qIndex));
}

/** Get all scores for a pset. Returns { earned, total, questions: [...] } */
export async function getPsetScores(course, pset) {
  const db = await getDb();
  const prefix = `${course}/${pset}/`;
  const all = await db.getAll('scores');
  const matching = all.filter(s => s.id.startsWith(prefix));
  const earned = matching.reduce((a, s) => a + (s.earned || 0), 0);
  const total = matching.reduce((a, s) => a + (s.total || 0), 0);
  return { earned, total, questions: matching };
}

/** Get scores for all PSets in a course. Returns Map<pset, {earned, total}> */
export async function getAllPsetScores(course) {
  const db = await getDb();
  const all = await db.getAll('scores');
  const map = new Map();
  for (const s of all) {
    if (!s.id.startsWith(course + '/')) continue;
    const pset = s.pset;
    if (!map.has(pset)) map.set(pset, { earned: 0, total: 0 });
    const entry = map.get(pset);
    entry.earned += (s.earned || 0);
    entry.total += (s.total || 0);
  }
  return map;
}

/**
 * Save the selected answer for a question (for UI restoration on reload).
 * `data` is a plain JSON-serializable object specific to the question type.
 */
export async function saveAnswer(course, pset, qIndex, data) {
  const db = await getDb();
  await db.put('code', {
    id: qKey(course, pset, qIndex) + ':answer',
    code: JSON.stringify(data),
    lastUpdated: Date.now(),
  });
}

/** Load a previously saved answer. Returns the data object or null. */
export async function loadAnswer(course, pset, qIndex) {
  const db = await getDb();
  const entry = await db.get('code', qKey(course, pset, qIndex) + ':answer');
  if (!entry?.code) return null;
  try { return JSON.parse(entry.code); } catch { return null; }
}
