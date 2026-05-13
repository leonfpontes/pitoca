'use strict';

/**
 * renderer.js — Pure rendering functions.
 * Receives data, returns HTML strings. No event listeners here.
 *
 * Depends on: data.js, scheduler.js
 */

// ── Banner ────────────────────────────────────────────────────────────────────

function renderBanner() {
  const careItems = CARE_ALERTS.map(
    (item) => `<li class="care-item">${escapeHtml(item)}</li>`
  ).join('');

  const warnItems = WATCH_SIGNS.map(
    (sign) => `<span class="warning-sign">⚠ ${escapeHtml(sign)}</span>`
  ).join('');

  const feedingBadges = FEEDING_SCHEDULE.map(
    (t) => `<span class="feeding-time-badge">${t}</span>`
  ).join('');

  return `
    <div class="banner">
      <div class="banner-header" id="banner-toggle" role="button" aria-expanded="false" aria-controls="banner-body">
        <span class="banner-title">🐾 Cuidados e Alertas da Pitoca</span>
        <span class="toggle-icon" aria-hidden="true">▼</span>
      </div>
      <div class="banner-body hidden" id="banner-body">
        <div class="feeding-block">
          <h4>🍽 Alimentação via sonda — 07h · 13h · 19h · 00h</h4>
          <div class="feeding-times">${feedingBadges}</div>
        </div>
        <div class="care-block">
          <h4>🧴 Cuidados com a sonda</h4>
          <ul class="care-list">${careItems}</ul>
        </div>
        <div class="warning-block">
          <h4>🚨 Sinais de atenção — contate a veterinária</h4>
          <div class="warning-signs">${warnItems}</div>
        </div>
      </div>
    </div>`;
}

// ── Timeline ──────────────────────────────────────────────────────────────────

/**
 * Renders the full timeline, grouping entries by their HH:MM time.
 */
function renderTimeline(entries, viewDate) {
  const isToday = isSameDay(viewDate, new Date());
  const dateLabel = isToday ? `Hoje — ${formatDate(viewDate)}` : formatDate(viewDate);

  const navHtml = `
    <div class="date-nav">
      <button class="date-nav-btn" data-action="prev-day" aria-label="Dia anterior">◀ Anterior</button>
      <span class="date-nav-label">${dateLabel}</span>
      <button class="date-nav-btn${isToday ? '' : ' today-btn'}" data-action="next-day" aria-label="Próximo dia">Próximo ▶</button>
    </div>`;

  if (entries.length === 0) {
    return navHtml + `<div class="timeline-empty">Nenhum evento neste dia 😴</div>`;
  }

  // Day-level progress
  const doseEntries = entries.filter((e) => e.type === 'dose');
  const doneDoses   = doseEntries.filter((e) => e.takenAt).length;
  const totalDoses  = doseEntries.length;
  const pct         = totalDoses > 0 ? Math.round((doneDoses / totalDoses) * 100) : 0;

  const progressHtml = `
    <div class="day-progress">
      <div class="day-progress-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
        <div class="day-progress-fill" style="width:${pct}%"></div>
      </div>
      <span class="day-progress-label">
        <span class="done-count">${doneDoses}</span>/${totalDoses} doses dadas
      </span>
    </div>`;

  // Group entries by time slot (HH:MM)
  const slots = new Map();
  for (const entry of entries) {
    const time = formatTime(new Date(entry.scheduledISO));
    if (!slots.has(time)) slots.set(time, []);
    slots.get(time).push(entry);
  }

  const slotsHtml = Array.from(slots.entries()).map(([time, slotEntries]) =>
    renderTimeSlot(time, slotEntries)
  ).join('');

  return navHtml + progressHtml + `<div class="timeline" role="list">${slotsHtml}</div>`;
}

/**
 * Renders one time-slot group (one time → N items).
 */
function renderTimeSlot(time, entries) {
  const doseEntries    = entries.filter((e) => e.type === 'dose');
  const feedingEntries = entries.filter((e) => e.type === 'feeding');

  // Determine the dominant status for the time bubble
  let slotClass = '';
  if (doseEntries.length > 0) {
    const statuses = doseEntries.map((e) => getDoseStatus(e.scheduledISO, e.takenAt));
    if (statuses.includes('overdue'))  slotClass = 'has-overdue';
    else if (statuses.includes('imminent')) slotClass = 'has-imminent';
    else if (statuses.every((s) => s === 'done')) slotClass = 'all-done';
  } else if (feedingEntries.length > 0) {
    const past = new Date(feedingEntries[0].scheduledISO) < new Date();
    if (past) slotClass = 'all-done';
  }

  const itemsHtml = [
    ...feedingEntries.map(renderFeedingRow),
    ...doseEntries.map(renderDoseRow),
  ].join('');

  return `
    <div class="time-slot ${slotClass}" role="listitem">
      <div class="slot-time-col">
        <div class="slot-time-bubble" aria-label="${time}">${time}</div>
      </div>
      <div class="slot-content">${itemsHtml}</div>
    </div>`;
}

function renderFeedingRow(entry) {
  const past = new Date(entry.scheduledISO) < new Date();
  return `
    <div class="feeding-row${past ? ' feeding-past' : ''}">
      <span class="feeding-row-icon">🍽</span>
      <span class="feeding-row-label">Alimentação via sonda</span>
      <span class="feeding-row-note">Lavar sonda após</span>
    </div>`;
}

function renderDoseRow(entry) {
  const { med, scheduledISO, takenAt, key } = entry;
  const status   = getDoseStatus(scheduledISO, takenAt);
  const relative = getRelativeTime(scheduledISO);

  const routeBadge = med.route
    ? `<span class="badge badge-${med.route}">${med.route}</span>`
    : '';

  const dosageBadge = med.dosage
    ? `<span class="badge badge-dosage">${escapeHtml(med.dosage)}</span>`
    : '';

  const obsBtn = med.observations.length > 0
    ? `<button class="obs-toggle" data-obs-key="${key}" title="Ver observações" aria-label="Observações de ${escapeHtml(med.name)}">⚠️</button>`
    : '';

  const relLabel = takenAt
    ? `<span class="dose-relative">✓ ${formatTime(new Date(takenAt))}</span>`
    : `<span class="dose-relative">${relative}</span>`;

  const obsLines = med.observations.length > 0
    ? `<div class="obs-text hidden" id="obs-${key}">
        ${med.observations.map((o) => `<span>${escapeHtml(o)}</span>`).join('')}
       </div>`
    : '';

  const btnHtml = status === 'done'
    ? `<button class="btn-dose btn-done" data-action="toggle-dose" data-key="${key}" title="Toque para desfazer" aria-label="Dose dada — toque para desfazer">✓ Dado</button>`
    : `<button class="btn-dose btn-give" data-action="give-dose" data-key="${key}" data-med-id="${med.id}" data-scheduled="${scheduledISO}" aria-label="Registrar dose de ${escapeHtml(med.name)}">Dar</button>`;

  return `
    <div class="dose-row status-${status}" style="--med-color:${med.color}" data-key="${key}">
      <div class="dose-dot"></div>
      <div class="dose-info">
        <div class="dose-name">${escapeHtml(med.name)}</div>
        <div class="dose-meta">${routeBadge}${dosageBadge}${obsBtn}${relLabel}</div>
        ${obsLines}
      </div>
      ${btnHtml}
    </div>`;
}

// ── Cards ─────────────────────────────────────────────────────────────────────

function renderCards(state) {
  const html = MEDICATIONS.map((med) => renderMedCard(med, state)).join('');
  return `<div class="cards-grid">${html}</div>`;
}

function renderMedCard(med, state) {
  const stats    = getMedStats(med, state);
  const progress = stats.totalDoses > 0
    ? Math.round((stats.takenCount / stats.totalDoses) * 100)
    : 0;

  let daysLabel = '';
  if (stats.daysRemaining !== null) {
    if (stats.daysRemaining <= 0) {
      daysLabel = '<span class="completed-badge">Concluído</span>';
    } else {
      daysLabel = `<span class="days-remaining">${stats.daysRemaining} dia${stats.daysRemaining !== 1 ? 's' : ''} restante${stats.daysRemaining !== 1 ? 's' : ''}</span>`;
    }
  }

  const intervalLabel = med.intervalHours
    ? `A cada ${med.intervalHours}h${med.totalDays ? ` · ${med.totalDays} dias` : ''}`
    : 'Conforme orientação';

  const obsHtml = med.observations.length > 0
    ? `<div class="card-obs">
        ${med.observations.map((o) => `<p class="card-obs-item">⚠️ ${escapeHtml(o)}</p>`).join('')}
       </div>`
    : '';

  const isCompleted = stats.daysRemaining !== null && stats.daysRemaining <= 0;

  return `
    <div class="med-card${isCompleted ? ' completed' : ''}" style="--med-color:${med.color}">
      <div class="card-header">
        <div class="card-color-dot"></div>
        <span class="card-name">${escapeHtml(med.name)}</span>
        ${med.route ? `<span class="badge badge-${med.route}">${med.route}</span>` : ''}
      </div>
      <div class="card-progress">
        <div class="progress-bar" role="progressbar" aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100">
          <div class="progress-fill" style="width:${progress}%"></div>
        </div>
        <span class="progress-label">${stats.takenCount}/${stats.totalDoses} doses &nbsp;·&nbsp; ${daysLabel}</span>
      </div>
      <div class="card-interval">${intervalLabel}</div>
      ${med.dosage ? `<div class="card-dosage"><span class="card-dosage-label">Dose:</span> ${escapeHtml(med.dosage)}</div>` : ''}
      ${obsHtml}
    </div>`;
}

// ── Header datetime ───────────────────────────────────────────────────────────

function renderDatetime(now) {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return `<span class="header-date">${days[now.getDay()]}, ${formatDate(now)}</span>
          <span class="header-time">${formatTime(now)}</span>`;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}
