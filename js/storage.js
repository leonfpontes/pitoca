'use strict';

/**
 * storage.js — Persistence layer (localStorage).
 *
 * Only mutable state is stored here:
 *   - startOverrides: { [medId]: isoString } — user-defined start times
 *   - takenDoses:     { [doseKey]: isoString } — timestamp when each dose was administered
 *
 * The medication definitions themselves live in data.js and are never stored.
 */

const STORAGE_KEY = 'pitoca_state';

/**
 * Returns the current state from localStorage, or an empty default.
 * @returns {{ startOverrides: Object, takenDoses: Object }}
 */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return _emptyState();
    const parsed = JSON.parse(raw);
    // Ensure both keys always exist for safe access elsewhere
    return {
      startOverrides: parsed.startOverrides || {},
      takenDoses: parsed.takenDoses || {},
    };
  } catch {
    return _emptyState();
  }
}

/**
 * Persists the given state object to localStorage.
 * @param {{ startOverrides: Object, takenDoses: Object }} state
 */
function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Marks a dose as taken (or un-marks it if already taken).
 * @param {string} doseKey  — "${medId}_${scheduledISO}"
 * @returns {{ startOverrides: Object, takenDoses: Object }} updated state
 */
function toggleDose(doseKey) {
  const state = loadState();
  if (state.takenDoses[doseKey]) {
    delete state.takenDoses[doseKey];
  } else {
    state.takenDoses[doseKey] = new Date().toISOString();
  }
  saveState(state);
  return state;
}

/**
 * Marks a dose as taken at a specific time (or removes it if already taken).
 * Use this when the user provides the actual administration time.
 * @param {string} doseKey   — "${medId}_${scheduledISO}"
 * @param {string} isoString — ISO timestamp of when the dose was actually given
 * @returns {{ startOverrides: Object, takenDoses: Object }} updated state
 */
function markDose(doseKey, isoString) {
  const state = loadState();
  state.takenDoses[doseKey] = isoString;
  saveState(state);
  return state;
}

/**
 * Saves a user-defined start time for a medication.
 * @param {string} medId
 * @param {string} isoString
 * @returns {{ startOverrides: Object, takenDoses: Object }} updated state
 */
function setStartOverride(medId, isoString) {
  const state = loadState();
  state.startOverrides[medId] = isoString;
  saveState(state);
  return state;
}

/**
 * Resets all state (start overrides + taken doses).
 * Does NOT reset the medication definitions in data.js.
 */
function resetState() {
  localStorage.removeItem(STORAGE_KEY);
}

/** @private */
function _emptyState() {
  return { startOverrides: {}, takenDoses: {} };
}
