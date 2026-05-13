'use strict';

/**
 * scheduler.js — Dose generation and scheduling logic.
 *
 * Depends on: data.js (MEDICATIONS, FEEDING_SCHEDULE)
 */

/**
 * Generates all scheduled dose ISO strings for a medication.
 *
 * @param {Object} med        — Medication definition from MEDICATIONS
 * @param {string|null} startISO — Effective start time (may come from state.startOverrides)
 * @returns {string[]}        — Sorted array of ISO datetime strings
 */
function generateDoses(med, startISO) {
  if (!startISO) return [];

  const start = new Date(startISO);
  const totalDays = med.totalDays || 60;
  const endMs = start.getTime() + totalDays * 24 * 60 * 60 * 1000;
  const intervalMs = med.intervalHours * 60 * 60 * 1000;

  const doses = [];
  let t = new Date(start);

  while (t.getTime() < endMs) {
    doses.push(t.toISOString());
    t = new Date(t.getTime() + intervalMs);
  }

  return doses;
}

/**
 * Returns the effective start ISO for a medication, considering user overrides.
 *
 * @param {Object} med   — Medication definition
 * @param {Object} state — App state from loadState()
 * @returns {string|null}
 */
function getEffectiveStart(med, state) {
  return state.startOverrides[med.id] ?? med.startISO ?? null;
}

/**
 * Builds the full list of timeline entries for a given calendar date.
 * Entries include both medication doses and feeding events, sorted by time.
 *
 * @param {Date}   targetDate  — The calendar day to query (time portion is ignored)
 * @param {Object} state       — App state from loadState()
 * @returns {Object[]}         — Sorted array of timeline entry objects
 */
function getDayEntries(targetDate, state) {
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  const entries = [];

  // ── Medication doses ──────────────────────────────────────
  for (const med of MEDICATIONS) {
    const startISO = getEffectiveStart(med, state);
    const doses = generateDoses(med, startISO);

    for (const scheduledISO of doses) {
      const d = new Date(scheduledISO);
      if (d >= dayStart && d < dayEnd) {
        const key = buildDoseKey(med.id, scheduledISO);
        entries.push({
          type: 'dose',
          med,
          scheduledISO,
          takenAt: state.takenDoses[key] || null,
          key,
        });
      }
    }
  }

  // ── Feeding events ────────────────────────────────────────
  const treatmentStart = new Date(TREATMENT_START_ISO);
  for (const timeStr of FEEDING_SCHEDULE) {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(dayStart);
    d.setHours(h, m, 0, 0);
    if (d < treatmentStart) continue; // skip feeding slots before treatment began
    entries.push({
      type: 'feeding',
      scheduledISO: d.toISOString(),
      key: `feeding_${timeStr}`,
    });
  }

  // Sort chronologically, feeding events after doses at the same minute
  entries.sort((a, b) => {
    const diff = new Date(a.scheduledISO) - new Date(b.scheduledISO);
    if (diff !== 0) return diff;
    // doses before feeding at the same time
    if (a.type === 'dose' && b.type === 'feeding') return -1;
    if (a.type === 'feeding' && b.type === 'dose') return 1;
    return 0;
  });

  return entries;
}

/**
 * Computes the display status of a dose.
 *
 * @param {string}      scheduledISO
 * @param {string|null} takenAt
 * @returns {'done'|'overdue'|'imminent'|'upcoming'}
 */
function getDoseStatus(scheduledISO, takenAt) {
  if (takenAt) return 'done';
  const now = new Date();
  const scheduled = new Date(scheduledISO);
  const diffMs = scheduled - now;
  if (diffMs < 0) return 'overdue';
  if (diffMs <= 30 * 60 * 1000) return 'imminent';
  return 'upcoming';
}

/**
 * Returns aggregate progress stats for a medication.
 *
 * @param {Object} med
 * @param {Object} state
 * @returns {{ totalDoses: number, takenCount: number, daysRemaining: number|null }}
 */
function getMedStats(med, state) {
  const startISO = getEffectiveStart(med, state);
  const allDoses = generateDoses(med, startISO);

  const takenCount = allDoses.filter(
    (iso) => !!state.takenDoses[buildDoseKey(med.id, iso)]
  ).length;

  let daysRemaining = null;
  if (med.totalDays && startISO) {
    const end = new Date(new Date(startISO).getTime() + med.totalDays * 86400000);
    daysRemaining = Math.ceil((end - new Date()) / 86400000);
  }

  return {
    totalDoses: allDoses.length,
    takenCount,
    daysRemaining,
    hasStart: !!startISO,
  };
}

/**
 * Builds the localStorage key for a specific dose.
 *
 * @param {string} medId
 * @param {string} scheduledISO
 * @returns {string}
 */
function buildDoseKey(medId, scheduledISO) {
  return `${medId}_${scheduledISO}`;
}

/**
 * Formats a Date as "HH:MM".
 *
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Formats a Date as "DD/MM/YYYY".
 *
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
}

/**
 * Returns a human-readable relative time string ("em 5 min", "há 10 min").
 *
 * @param {string} scheduledISO
 * @returns {string}
 */
function getRelativeTime(scheduledISO) {
  const diffMs = new Date(scheduledISO) - new Date();
  const absMin = Math.round(Math.abs(diffMs) / 60000);

  if (absMin < 1) return 'agora';
  if (diffMs > 0) {
    if (absMin < 60) return `em ${absMin} min`;
    const h = Math.floor(absMin / 60);
    return `em ${h}h`;
  } else {
    if (absMin < 60) return `há ${absMin} min`;
    const h = Math.floor(absMin / 60);
    return `há ${h}h`;
  }
}
