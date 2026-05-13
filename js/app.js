'use strict';

/**
 * app.js — Entry point and main application loop.
 *
 * Depends on: data.js, storage.js, scheduler.js, renderer.js, ui.js
 */

// ── App state ─────────────────────────────────────────────────────────────────

/** Offset (in days) from today for the timeline view. 0 = today. */
let _dayOffset = 0;

/** setInterval handle for the 30-second refresh loop. */
let _refreshInterval = null;

// ── Public API (consumed by ui.js via window.App) ────────────────────────────

window.App = {
  refresh,
  shiftDay,
};

// ── Initialisation ────────────────────────────────────────────────────────────

/**
 * Bootstraps the app: renders all regions and binds events.
 */
function init() {
  renderBannerRegion();
  refresh();
  bindEvents();

  // Refresh every 30 seconds to update countdowns and status classes
  _refreshInterval = setInterval(refresh, 30_000);
}

// ── Core refresh ──────────────────────────────────────────────────────────────

/**
 * Re-renders the datetime header, timeline and cards using current state.
 */
function refresh() {
  const state = loadState();
  const viewDate = getViewDate();

  // Header datetime
  document.getElementById('current-datetime').innerHTML = renderDatetime(new Date());

  // Timeline
  const entries = getDayEntries(viewDate, state);
  document.getElementById('timeline-container').innerHTML = renderTimeline(entries, viewDate);

  // Cards panel (only if expanded to avoid wasted work)
  const cardsContent = document.getElementById('cards-content');
  if (!cardsContent.classList.contains('hidden')) {
    cardsContent.innerHTML = renderCards(state);
  }
}

// ── Day navigation ────────────────────────────────────────────────────────────

/**
 * Shifts the timeline view by `delta` days.
 * @param {number} delta  — typically -1 or +1
 */
function shiftDay(delta) {
  _dayOffset += delta;
  refresh();
}

/**
 * Returns the Date object for the currently viewed day.
 * @returns {Date}
 */
function getViewDate() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + _dayOffset);
  return d;
}

// ── Banner ────────────────────────────────────────────────────────────────────

/**
 * Renders the banner (done once; content doesn't change).
 */
function renderBannerRegion() {
  document.getElementById('banner-container').innerHTML = renderBanner();
}

// ── Shooting stars ────────────────────────────────────────────────────────────

function spawnShootingStar() {
  const el = document.createElement('span');
  el.className = 'shooting-star';

  // Random vertical position (5%–90% of viewport height)
  el.style.top = (Math.random() * 85 + 5) + '%';

  // Slight random angle variation (-15° to -5°)
  const angle = -(Math.random() * 10 + 5);
  el.style.setProperty('--angle', angle + 'deg');

  // Random speed (0.6s–1.1s)
  const duration = (Math.random() * 0.5 + 0.6).toFixed(2);
  el.style.animationDuration = duration + 's';

  document.querySelector('.star-field').appendChild(el);
  el.addEventListener('animationend', () => el.remove());
}

function startShootingStars() {
  // Fire 1–3 stars in a quick burst, then wait ~10s
  function burst() {
    const count = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < count; i++) {
      setTimeout(spawnShootingStar, i * 300);
    }
    // Next burst in 8–14s
    setTimeout(burst, Math.random() * 6000 + 8000);
  }
  // First burst after 4–8s
  setTimeout(burst, Math.random() * 4000 + 4000);
}

// ── Star field ────────────────────────────────────────────────────────────────

function createStarField() {
  const container = document.createElement('div');
  container.className = 'star-field';
  container.setAttribute('aria-hidden', 'true');

  const COUNT = 120;
  for (let i = 0; i < COUNT; i++) {
    const star = document.createElement('span');
    star.className = 'star';

    star.style.left = Math.random() * 100 + '%';
    star.style.top  = Math.random() * 100 + '%';

    const size = (Math.random() * 1.5 + 1).toFixed(1);
    star.style.width  = size + 'px';
    star.style.height = size + 'px';

    const duration = (Math.random() * 6 + 4).toFixed(1);
    const delay    = (Math.random() * 10).toFixed(1);
    star.style.animationDuration = duration + 's';
    star.style.animationDelay   = '-' + delay + 's';

    if (Math.random() > 0.7) star.classList.add('star-bright');

    container.appendChild(star);
  }

  document.body.prepend(container);
}

// ── Boot ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => { createStarField(); startShootingStars(); init(); });
