'use strict';

/**
 * data.js — Static prescription data (source of truth).
 * All medication definitions live here. Only immutable facts.
 * Mutable state (taken doses, start overrides) lives in storage.js.
 */

const MEDICATIONS = [
  {
    id: 'emedron',
    name: 'Emedron',
    dosage: '1 ml',
    intervalHours: 8,
    totalDays: 5,
    startISO: '2026-05-13T05:00:00',
    route: 'sonda',
    color: '#a855f7',
    observations: ['Manter 2 horas de distância do Tramadol'],
  },
  {
    id: 'beneflora',
    name: 'Beneflora',
    dosage: '1 g',
    intervalHours: 24,
    totalDays: 5,
    startISO: '2026-05-13T19:00:00',
    route: 'oral',
    color: '#60a5fa',
    observations: [],
  },
  {
    id: 'sanus',
    name: 'Sanus 100mg',
    dosage: '1 comprimido',
    intervalHours: 24,
    totalDays: 25,
    startISO: '2026-05-13T19:00:00',
    route: 'oral',
    color: '#34d399',
    observations: [],
  },
  {
    id: 'sucrafilm',
    name: 'Sucrafilm',
    dosage: '4 ml',
    intervalHours: 12,
    totalDays: 5,
    startISO: '2026-05-13T11:00:00',
    route: 'sonda',
    color: '#fb923c',
    observations: [
      'Administrar 1 hora distante da alimentação',
      'Administrar 1 hora distante de outros medicamentos',
    ],
  },
  {
    id: 'plasivet',
    name: 'Plasivet Gatos',
    dosage: '',
    intervalHours: 8,
    totalDays: 4,
    startISO: '2026-05-13T05:00:00',
    route: 'sonda',
    color: '#f472b6',
    observations: [],
  },
  {
    id: 'ursacol',
    name: 'Ursacol',
    dosage: '1 ml',
    intervalHours: 24,
    totalDays: 25,
    startISO: '2026-05-13T19:00:00',
    route: 'sonda',
    color: '#facc15',
    observations: ['74 mg/dose'],
  },
  {
    id: 'tramadol',
    name: 'Tramadol',
    dosage: '2 gotas',
    intervalHours: 12,
    totalDays: 5,
    startISO: '2026-05-13T07:00:00',
    route: 'sonda',
    color: '#f87171',
    observations: ['Manter 2 horas de distância do Emedron'],
  },
  {
    id: 'prednone',
    name: 'Prednone',
    dosage: '0,8 ml',
    intervalHours: 24,
    totalDays: 3,
    startISO: '2026-05-13T19:00:00',
    route: 'sonda',
    color: '#94a3b8',
    observations: [],
  },
  {
    // Receita de 10/05/2026 — Uso Oral para Manipulação
    id: 'gabapentina',
    name: 'Gabapentina',
    dosage: '25 mg',
    intervalHours: 12,
    totalDays: 60,       // "até novas recomendações" — gerando 60 dias
    startISO: '2026-05-13T07:00:00',
    route: 'sonda',
    color: '#c084fc',
    observations: ['Uso oral para manipulação — líquido via sonda', 'Até novas recomendações da veterinária'],
  },
  {
    id: 'vitamina_e_taurina',
    name: 'Vitamina E + Taurina',
    dosage: '',
    intervalHours: 24,
    totalDays: 60,
    startISO: '2026-05-13T19:00:00',
    route: '',
    color: '#2dd4bf',
    observations: [],
  },
];

/** Feeding schedule: 07:00, 13:00, 19:00, 00:00 */
const FEEDING_SCHEDULE = ['07:00', '13:00', '19:00', '00:00'];

/** Treatment start — feeding and doses before this moment are ignored */
const TREATMENT_START_ISO = '2026-05-12T22:00:00';

/** General care reminders shown in the banner */
const CARE_ALERTS = [
  'Lavar a sonda após cada alimentação',
  'Lavar a sonda após cada medicamento',
  'Evitar misturar medicamentos espessos na mesma seringa',
];

/** Symptoms requiring veterinary contact */
const WATCH_SIGNS = [
  'Vômitos',
  'Tremores',
  'Salivação excessiva',
  'Sonolência intensa',
  'Dor',
  'Dificuldade respiratória',
  'Obstrução da sonda',
];
