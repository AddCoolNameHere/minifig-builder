// Estado central: configuração da minifig, undo/redo, serialização e aleatório.

import { defaultPose, POSES, randomPose } from './minifig/poses.js';

const listeners = { change: new Set(), pose: new Set(), history: new Set() };

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
    v: 1,
    nome: '',
    slots: {
      head: { part: '3626-smiley', color: 'yellow' },
      headgear: { part: '3901-hair', color: 'brown' },
      torso: { part: '973-plain', color: 'red' },
      arms: { part: '981-982', color: 'red' },
      hands: { part: '983', color: 'yellow' },
      legs: { part: '970-plain', color: 'blue' },
      handL: { part: null, color: 'lightGray' },
      handR: { part: null, color: 'lightGray' },
      body: { part: null, color: 'red' },
      base: { part: null, color: 'green' },
      pet: { part: null, color: 'white' },
    },
    pose: defaultPose(),
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

const THEMES = [
  { headgear: '3842-helmet', torso: '973-space', body: '3838-airtanks', handR: '3963-blaster', palette: ['white', 'red', 'blue', 'yellow'] },
  { headgear: '2528-bicorne', torso: '973-pirate', handR: '3847-sword', pet: '2546-parrot', legs: '970-belt', palette: ['black', 'darkRed', 'brown'] },
  { headgear: 'x577-bandana', torso: '973-pirate', handR: '2561-musket', legs: '970-belt', palette: ['red', 'black', 'brown'] },
  { headgear: '3844-helm', torso: '973-knight', handR: '3847-sword', handL: '3846-shield', body: 'bb38-cape', palette: ['lightGray', 'darkGray', 'blue', 'darkRed'] },
  { headgear: '3624-police', torso: '973-police', legs: '970-plain', palette: ['darkBlue', 'black'] },
  { headgear: '3834-fire', torso: '973-fire', handR: '3835-axe', palette: ['red', 'black', 'yellow'] },
  { headgear: '3833-helmet', torso: '973-overalls', handR: '3837-shovel', palette: ['yellow', 'orange', 'blue'] },
  { headgear: '3629-cowboy', torso: '973-plaid', handR: '30258-map', palette: ['brown', 'darkRed', 'tan'] },
  { headgear: '6131-wizard', torso: '973-plain', handR: '36752-wand', body: 'bb38-cape', palette: ['darkBlue', 'magenta', 'black'] },
  { headgear: '71015-crown', torso: '973-plain', handR: '2343-goblet', body: 'bb38-cape', palette: ['darkRed', 'pearlGold', 'magenta'] },
  { headgear: null, torso: '973-doctor', legs: '970-plain', palette: ['white', 'mediumBlue', 'sandGreen'] },
  { headgear: '4485-cap', torso: '973-hawaii', handR: '30089-camera', palette: ['mediumBlue', 'orange', 'lime', 'magenta'] },
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function randomize() {
  pushHistory();
  const byCat = (cat) => db.partsList.filter((p) => p.categoria === cat);
  const heads = byCat('cabeca');
  const skins = ['yellow', 'yellow', 'yellow', 'nougat'];
  const skin = pick(skins);
  const next = defaultConfig();
  next.nome = config.nome;

  if (Math.random() < 0.65) {
    // tema coerente
    const t = pick(THEMES);
    const torsoPart = db.parts.get(t.torso);
    next.slots.head = { part: pick(heads).id, color: skin };
    next.slots.headgear = { part: t.headgear, color: t.headgear ? db.parts.get(t.headgear).defaultColor : 'brown' };
    next.slots.torso = { part: t.torso, color: torsoPart.defaultColor };
    next.slots.arms.color = torsoPart.defaultColor;
    next.slots.hands.color = skin;
    next.slots.legs = { part: t.legs || '970-plain', color: pick(t.palette) };
    next.slots.handR = { part: t.handR || null, color: t.handR ? db.parts.get(t.handR).defaultColor : 'lightGray' };
    next.slots.handL = { part: t.handL || null, color: t.handL ? db.parts.get(t.handL).defaultColor : 'lightGray' };
    next.slots.body = { part: t.body || null, color: t.body ? pick(t.palette) : 'red' };
    next.slots.pet = { part: t.pet || null, color: t.pet ? db.parts.get(t.pet).defaultColor : 'white' };
  } else {
    // mistura livre
    const solidColors = db.colorsList.filter((c) => !c.trans).map((c) => c.id);
    const gear = byCat('chapeu');
    const torsos = byCat('torso');
    const legs = byCat('pernas');
    const accs = byCat('acessorio');
    next.slots.head = { part: pick(heads).id, color: skin };
    next.slots.headgear = { part: Math.random() < 0.85 ? pick(gear).id : null, color: pick(solidColors) };
    const torsoColor = pick(solidColors);
    next.slots.torso = { part: pick(torsos).id, color: torsoColor };
    next.slots.arms.color = torsoColor;
    next.slots.hands.color = skin;
    next.slots.legs = { part: pick(legs).id, color: pick(solidColors) };
    next.slots.handR = { part: Math.random() < 0.7 ? pick(accs).id : null, color: pick(solidColors) };
    next.slots.handL = { part: Math.random() < 0.35 ? pick(accs).id : null, color: pick(solidColors) };
    next.slots.body = { part: Math.random() < 0.3 ? pick(byCat('corpo')).id : null, color: pick(solidColors) };
  }

  if (Math.random() < 0.35) {
    const bases = db.partsList.filter((p) => p.sub === 'base');
    next.slots.base = { part: pick(bases).id, color: pick(['green', 'lightGray', 'tan', 'darkGray']) };
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
  return base;
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
