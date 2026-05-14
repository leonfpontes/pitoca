'use strict';

/**
 * ui.js — User interaction handlers and modal management.
 *
 * Depends on: data.js, storage.js, scheduler.js, renderer.js
 * Communicates with app.js via the exported `refresh` callback pattern.
 */

// ── Modal state ───────────────────────────────────────────────────────────────

// 'start-time' = define início do medicamento  |  'give-dose' = registrar dose dada
let _modalMode    = 'start-time';
let _activeMedId  = null;
let _activeDoseKey = null;

/**
 * Opens the start-time editor modal for a given medication.
 * @param {string} medId
 */
function openModal(medId) {
  const med = MEDICATIONS.find((m) => m.id === medId);
  if (!med) return;

  _modalMode   = 'start-time';
  _activeMedId = medId;
  _activeDoseKey = null;

  const input = document.getElementById('modal-datetime-input');

  document.getElementById('modal-title').textContent = 'Definir horário de início';
  document.getElementById('modal-med-name').textContent = med.name;
  document.getElementById('modal-input-label').textContent = 'Data e hora da primeira dose';
  document.getElementById('modal-confirm').textContent = 'Confirmar';

  // Pre-fill with existing override or the med's defined start
  const state = loadState();
  const existing = state.startOverrides[medId] || med.startISO;
  input.value = existing ? _toInputValue(existing) : _nowInputValue();

  _showModal(input);
}

/**
 * Opens the give-dose modal so the user can log the actual administration time.
 * @param {string} doseKey      — "${medId}_${scheduledISO}"
 * @param {string} medId        — medication id
 * @param {string} scheduledISO — scheduled dose time (ISO)
 */
function openGiveDoseModal(doseKey, medId, scheduledISO) {
  const med = MEDICATIONS.find((m) => m.id === medId);
  if (!med) return;

  _modalMode     = 'give-dose';
  _activeDoseKey = doseKey;
  _activeMedId   = medId;

  const input = document.getElementById('modal-datetime-input');

  document.getElementById('modal-title').textContent = 'Registrar dose dada';
  document.getElementById('modal-med-name').textContent = med.name;
  document.getElementById('modal-input-label').textContent = 'Que horas foi dado?';
  document.getElementById('modal-confirm').textContent = 'Registrar';

  // Default: now (rounded to minute). If dose was scheduled in the past, default
  // to the scheduled time so the user just needs to confirm.
  const scheduled = new Date(scheduledISO);
  const now = new Date();
  input.value = _toInputValue(scheduled < now ? scheduled : now);
  // Clamp to now — can't mark future dose
  const maxVal = _nowInputValue();
  input.setAttribute('max', maxVal);

  _showModal(input);
}

/**
 * Closes the modal without saving.
 */
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('modal-datetime-input').removeAttribute('max');
  _activeMedId   = null;
  _activeDoseKey = null;
}

/**
 * Confirms the modal: branches on mode.
 */
function confirmModal() {
  const input = document.getElementById('modal-datetime-input');
  const value = input.value;
  if (!value) return;

  const iso = new Date(value).toISOString();

  if (_modalMode === 'give-dose') {
    if (!_activeDoseKey) return;
    markDose(_activeDoseKey, iso);
  } else {
    if (!_activeMedId) return;
    setStartOverride(_activeMedId, iso);
  }

  closeModal();
  window.App.refresh();
}

/** @private — show modal and focus input */
function _showModal(input) {
  document.getElementById('modal-overlay').classList.remove('hidden');
  // Small delay so the focus doesn't fire before the keyboard animation on iOS
  requestAnimationFrame(() => input.focus());
}

/** @private — returns current datetime as "YYYY-MM-DDTHH:MM" for input[type=datetime-local] */
function _nowInputValue() {
  const now = new Date();
  now.setSeconds(0, 0);
  return _toInputValue(now);
}

/** @private — converts Date/ISO to local "YYYY-MM-DDTHH:MM" for datetime-local */
function _toInputValue(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

// ── Event binding ─────────────────────────────────────────────────────────────

/**
 * Attaches all event listeners to the document.
 * Uses event delegation on main containers for dynamic content.
 */
function bindEvents() {
  // ── Modal buttons ─────────────────────────────────────
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('modal-confirm').addEventListener('click', confirmModal);

  // Close modal on overlay background click
  document.getElementById('modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Close modal on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Confirm modal on Enter key (when input focused)
  document.getElementById('modal-datetime-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmModal();
  });

  // ── Delegated clicks on main ──────────────────────────
  document.querySelector('main').addEventListener('click', handleMainClick);

  // ── Banner toggle ─────────────────────────────────────
  document.getElementById('banner-container').addEventListener('click', (e) => {
    const toggle = e.target.closest('#banner-toggle');
    if (toggle) toggleBanner();
  });

  // ── Cards section toggle ──────────────────────────────
  document.getElementById('cards-toggle').addEventListener('click', toggleCards);
}

/**
 * Handles delegated click events within <main>.
 * @param {MouseEvent} e
 */
function handleMainClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === 'toggle-dose') {
    // "✓ Dado" tapped → undo immediately, no modal
    handleToggleDose(btn.dataset.key);
  } else if (action === 'give-dose') {
    // "Dar" tapped → open time-picker modal
    openGiveDoseModal(btn.dataset.key, btn.dataset.medId, btn.dataset.scheduled);
    return; // obs-toggle check below not needed
  } else if (action === 'open-modal') {
    openModal(btn.dataset.medId);
  } else if (action === 'prev-day') {
    window.App.shiftDay(-1);
  } else if (action === 'next-day') {
    window.App.shiftDay(1);
  }

  // Observation text toggle
  const obsBtn = e.target.closest('.obs-toggle');
  if (obsBtn) {
    const obsKey = obsBtn.dataset.obsKey;
    const obsEl = document.getElementById(`obs-${obsKey}`);
    if (obsEl) obsEl.classList.toggle('hidden');
  }
}

/**
 * Toggles a dose as taken/not-taken and refreshes the UI.
 * @param {string} doseKey
 */
function handleToggleDose(doseKey) {
  toggleDose(doseKey);
  window.App.refresh();
}

/**
 * Toggles the banner collapsed/expanded state.
 */
function toggleBanner() {
  const body = document.getElementById('banner-body');
  const toggle = document.getElementById('banner-toggle');
  const icon = toggle.querySelector('.toggle-icon');

  const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
  body.classList.toggle('hidden', isExpanded);
  toggle.setAttribute('aria-expanded', String(!isExpanded));
  icon.style.transform = isExpanded ? 'rotate(-90deg)' : '';
}

/**
 * Toggles the cards section collapsed/expanded state.
 * Renders cards on first expand.
 */
function toggleCards() {
  const btn = document.getElementById('cards-toggle');
  const content = document.getElementById('cards-content');
  const icon = btn.querySelector('.toggle-icon');

  const isExpanded = btn.getAttribute('aria-expanded') === 'true';
  content.classList.toggle('hidden', isExpanded);
  btn.setAttribute('aria-expanded', String(!isExpanded));
  icon.style.transform = isExpanded ? 'rotate(-90deg)' : '';

  // Render cards when expanding for the first time or after they were hidden
  if (!isExpanded) {
    content.innerHTML = renderCards(loadState());
  }
}
