// Estado central: configuração da minifig, undo/redo, serialização e aleatório.

import { defaultPose, POSES, randomPose } from './minifig/poses.js';

const listeners = { change: new Set(), pose: new Set(), history: new Set(), studio: new Set() };

export const db = {
  parts: new Map(),
  colors: new Map(),
  partsList: [],
  colorsList: [],
};

export let config = defaultConfig();

let undoStack = [];
let redoStack = [];
const HISTORY_LIMIT = 80;

export function defaultConfig() {
  return {
    v: 2,
    nome: '',
    slots: {
      head: { part: '3626bp01', color: '14' },
      headgear: { part: '3901', color: '70' },
      torso: { part: '973', color: '4' },
      arms: { part: '3818', color: '4' },
      hands: { part: '3820', color: '14' },
      legs: { part: '970c00', color: '1' },
      handL: { part: null, color: '71' },
      handR: { part: null, color: '71' },
      body: { part: null, color: '4' },
      base: { part: null, color: '2' },
      pet: { part: null, color: '15' },
    },
    pose: defaultPose(),
    studio: { fundo: 'gradiente', luz: 'estudio', intensidade: 1.0 },
  };
}

/* ---------------- dados ---------------- */

export async function loadData() {
  const [partsRes, colorsRes] = await Promise.all([
    fetch('data/parts.json'),
    fetch('data/colors.json'),
  ]);
  const partsJson = await partsRes.json();
  const colorsJson = await colorsRes.json();
  db.partsList = partsJson.parts;
  db.colorsList = colorsJson.colors;
  for (const p of db.partsList) db.parts.set(p.id, p);
  for (const c of db.colorsList) db.colors.set(c.id, c);
}

/* ---------------- eventos ---------------- */

export function on(event, fn) {
  listeners[event].add(fn);
  return () => listeners[event].delete(fn);
}

function emit(event) {
  for (const fn of listeners[event]) fn(config);
}

function emitHistory() {
  for (const fn of listeners.history) fn({ canUndo: undoStack.length > 0, canRedo: redoStack.length > 0 });
}

/* ---------------- histórico ---------------- */

function pushHistory() {
  undoStack.push(JSON.stringify(config));
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack = [];
  emitHistory();
}

export function undo() {
  if (!undoStack.length) return;
  redoStack.push(JSON.stringify(config));
  config = JSON.parse(undoStack.pop());
  emit('change');
  emit('pose');
  emitHistory();
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(JSON.stringify(config));
  config = JSON.parse(redoStack.pop());
  emit('change');
  emit('pose');
  emitHistory();
}

/* ---------------- mutações ---------------- */

export function setPart(slot, partId, { toggle = false } = {}) {
  const s = config.slots[slot];
  if (!s) return;
  if (toggle && s.part === partId) partId = null;
  if (s.part === partId) return;
  pushHistory();
  s.part = partId;
  // adota a cor padrão da peça ao trocá-la
  const part = partId ? db.parts.get(partId) : null;
  if (part?.defaultColor) s.color = part.defaultColor;
  emit('change');
}

export function setColor(slot, colorId) {
  const s = config.slots[slot];
  if (!s || s.color === colorId) return;
  pushHistory();
  // braços acompanham o torso quando estavam com a mesma cor
  if (slot === 'torso' && config.slots.arms.color === s.color) {
    config.slots.arms.color = colorId;
  }
  s.color = colorId;
  emit('change');
}

export function setName(nome) {
  if (config.nome === nome) return;
  config.nome = nome;
  emit('pose'); // nada para reconstruir; só notifica autosave
}

let poseHistoryPending = false;

export function setPose(patch, { record = false } = {}) {
  if (record && !poseHistoryPending) {
    pushHistory();
    poseHistoryPending = true;
  }
  Object.assign(config.pose, patch);
  emit('pose');
}

export function commitPose() {
  poseHistoryPending = false;
}

export function applyPreset(name) {
  const preset = POSES[name];
  if (!preset) return;
  pushHistory();
  config.pose = { ...config.pose, ...preset.pose, preset: name };
  emit('pose');
}

export function applyRandomPose() {
  pushHistory();
  config.pose = { ...config.pose, ...randomPose(), preset: null };
  emit('pose');
}

export function replaceConfig(next) {
  pushHistory();
  config = sanitize(next);
  emit('change');
  emit('pose');
}

/* ---------------- aleatório ---------------- */

// Temas com cores fiéis aos conjuntos clássicos
const THEMES = [
  { headgear: '2447b-helm', torso: '973p90', body: '3838', handR: '3959', torsoColor: '4', legsColor: '4', gearColor: '4', palette: ['4'] },
  { headgear: '3842b', torso: '973p90', body: '3838', torsoColor: '15', legsColor: '15', gearColor: '15', palette: ['15'] },
  { headgear: '2528a', torso: '973p36', handR: '2530', pet: '2546', torsoColor: '0', legsColor: '0', gearColor: '0', palette: ['0', '320'] },
  { headgear: '30133', torso: '973p31', handR: '2561', torsoColor: '15', legsColor: '1', gearColor: '4', palette: ['4', '1'] },
  { headgear: '3844-visor', torso: '973p40', handR: '3847', handL: '3846', body: '50231', torsoColor: '71', legsColor: '71', gearColor: '71', palette: ['1', '4', '320'] },
  { headgear: '3624', torso: '973p1f', torsoColor: '0', legsColor: '0', gearColor: '0', palette: ['0'] },
  { headgear: '3834', torso: '973p21', handR: '3835', torsoColor: '0', legsColor: '0', gearColor: '4', palette: ['4', '0'] },
  { headgear: '3833', torso: '973p0e', handR: '3837', torsoColor: '15', legsColor: '1', gearColor: '14', palette: ['14', '25'] },
  { headgear: '3629', torso: '973p0l', handR: '2561', torsoColor: '4', legsColor: '70', gearColor: '70', palette: ['70', '19'] },
  { headgear: '6131', torso: '973', handR: 'energy-blade', body: '50231', torsoColor: '272', legsColor: '272', gearColor: '272', palette: ['272', '26', '0'] },
  { headgear: '71015', torso: '973', handR: '2343', body: '50231', torsoColor: '320', legsColor: '320', gearColor: '297', palette: ['320', '26'] },
  { headgear: null, torso: '973p25', torsoColor: '15', legsColor: '15', palette: ['15', '73'] },
  { headgear: '4485b', torso: '973p5l', handR: '30089a', torsoColor: '15', legsColor: '1', gearColor: '1', palette: ['73', '25', '27'] },
  { headgear: '3878', torso: '973p18', handR: '4449', torsoColor: '0', legsColor: '0', gearColor: '0', palette: ['0', '72'] },
  { headgear: '10048', torso: '973p7k', torsoColor: '15', legsColor: '0', gearColor: '0', palette: ['15', '0'] },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function randomize() {
  pushHistory();
  const byCat = (cat) => db.partsList.filter((p) => p.categoria === cat);
  const heads = byCat('cabeca').filter((p) => !['3626bpa8', '3626bp63'].includes(p.id));
  const skin = '14'; // amarelo clássico
  const next = defaultConfig();
  next.nome = config.nome;
  next.studio = { ...config.studio };

  if (Math.random() < 0.7) {
    // tema fiel a um conjunto clássico
    const t = pick(THEMES);
    next.slots.head = { part: pick(heads).id, color: skin };
    next.slots.headgear = { part: t.headgear, color: t.gearColor || '70' };
    next.slots.torso = { part: t.torso, color: t.torsoColor };
    next.slots.arms.color = t.torsoColor;
    next.slots.hands.color = skin;
    next.slots.legs = { part: t.legs || '970c00', color: t.legsColor };
    next.slots.handR = { part: t.handR || null, color: t.handR ? db.parts.get(t.handR).defaultColor : '71' };
    next.slots.handL = { part: t.handL || null, color: t.handL ? db.parts.get(t.handL).defaultColor : '71' };
    next.slots.body = { part: t.body || null, color: t.body ? pick(t.palette) : '4' };
    next.slots.pet = { part: t.pet || null, color: t.pet ? db.parts.get(t.pet).defaultColor : '15' };
  } else {
    // mistura livre
    const solidColors = db.colorsList.filter((c) => !c.trans).map((c) => c.id);
    next.slots.head = { part: pick(heads).id, color: skin };
    next.slots.headgear = { part: Math.random() < 0.85 ? pick(byCat('chapeu')).id : null, color: pick(solidColors) };
    const torsoPart = pick(byCat('torso'));
    next.slots.torso = { part: torsoPart.id, color: torsoPart.defaultColor };
    next.slots.arms.color = torsoPart.defaultColor;
    next.slots.hands.color = skin;
    next.slots.legs = { part: pick(byCat('pernas')).id, color: pick(solidColors) };
    const accs = byCat('acessorio');
    const accR = Math.random() < 0.7 ? pick(accs) : null;
    const accL = Math.random() < 0.35 ? pick(accs) : null;
    next.slots.handR = { part: accR?.id || null, color: accR?.defaultColor || '71' };
    next.slots.handL = { part: accL?.id || null, color: accL?.defaultColor || '71' };
    next.slots.body = { part: Math.random() < 0.3 ? pick(byCat('corpo')).id : null, color: pick(solidColors) };
  }

  if (Math.random() < 0.35) {
    const bases = db.partsList.filter((p) => p.sub === 'base');
    next.slots.base = { part: pick(bases).id, color: pick(['2', '71', '19', '72']) };
  }
  if (!next.slots.pet.part && Math.random() < 0.2) {
    const pets = db.partsList.filter((p) => p.sub === 'pet');
    const pet = pick(pets);
    next.slots.pet = { part: pet.id, color: pet.defaultColor };
  }

  next.pose = { ...defaultPose(), ...pick(Object.values(POSES)).pose };
  config = next;
  emit('change');
  emit('pose');
}

/* ---------------- serialização ---------------- */

export function serialize() {
  return JSON.stringify(config, null, 2);
}

export function sanitize(raw) {
  const base = defaultConfig();
  if (!raw || typeof raw !== 'object') return base;
  base.nome = typeof raw.nome === 'string' ? raw.nome.slice(0, 40) : '';
  for (const key of Object.keys(base.slots)) {
    const s = raw.slots?.[key];
    if (!s) continue;
    if (s.part === null || db.parts.has(s.part)) base.slots[key].part = s.part;
    if (db.colors.has(s.color)) base.slots[key].color = s.color;
  }
  if (raw.pose && typeof raw.pose === 'object') {
    for (const k of Object.keys(base.pose)) {
      if (typeof raw.pose[k] === 'number' && isFinite(raw.pose[k])) base.pose[k] = raw.pose[k];
    }
    base.pose.preset = raw.pose.preset ?? null;
  }
  if (raw.studio && typeof raw.studio === 'object') {
    if (typeof raw.studio.fundo === 'string') base.studio.fundo = raw.studio.fundo;
    if (typeof raw.studio.luz === 'string') base.studio.luz = raw.studio.luz;
    if (typeof raw.studio.intensidade === 'number' && isFinite(raw.studio.intensidade)) {
      base.studio.intensidade = Math.min(2, Math.max(0.2, raw.studio.intensidade));
    }
  }
  return base;
}

export function setStudio(patch) {
  Object.assign(config.studio, patch);
  emit('studio');
}

// base64url da config para compartilhar por URL
export function encodeShare() {
  const json = JSON.stringify(config);
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return b64.replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

export function decodeShare(str) {
  try {
    const b64 = str.replaceAll('-', '+').replaceAll('_', '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

/* ---------------- autosave ---------------- */

const AUTOSAVE_KEY = 'minifig.current.v1';

export function autosave() {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(config));
  } catch { /* storage cheio/indisponível */ }
}

export function loadAutosave() {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (raw) return sanitize(JSON.parse(raw));
  } catch { /* ignora */ }
  return null;
}

export function initConfig(initial) {
  config = initial || defaultConfig();
  undoStack = [];
  redoStack = [];
  emitHistory();
}
