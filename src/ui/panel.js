// Painel direito: nome, cor da peça ativa e controles de pose.

import * as state from '../state.js';
import { POSES } from '../minifig/poses.js';

const SLOT_LABELS = {
  head: 'Cabeça',
  headgear: 'Cabelo/Chapéu',
  torso: 'Torso',
  arms: 'Braços',
  hands: 'Mãos',
  legs: 'Pernas',
  handL: 'Acessório (mão esq.)',
  handR: 'Acessório (mão dir.)',
  body: 'Corpo',
  base: 'Base',
  pet: 'Pet',
};

const SLIDERS = [
  { key: 'head', label: 'Cabeça', min: -180, max: 180 },
  { key: 'armLx', label: 'Braço esq.', min: -170, max: 60 },
  { key: 'armRx', label: 'Braço dir.', min: -170, max: 60 },
  { key: 'handL', label: 'Mão esq.', min: -150, max: 150 },
  { key: 'handR', label: 'Mão dir.', min: -150, max: 150 },
  { key: 'legLx', label: 'Perna esq.', min: -110, max: 70 },
  { key: 'legRx', label: 'Perna dir.', min: -110, max: 70 },
];

let activeSlot = 'torso';

const titleEl = document.getElementById('color-title');
const swatchesEl = document.getElementById('swatches');
const presetsEl = document.getElementById('pose-presets');
const slidersEl = document.getElementById('pose-sliders');
const nameEl = document.getElementById('fig-name');

const deg = (rad) => Math.round((rad * 180) / Math.PI);
const rad = (d) => (d * Math.PI) / 180;

function renderSwatches() {
  titleEl.textContent = `Cor — ${SLOT_LABELS[activeSlot] || activeSlot}`;
  swatchesEl.innerHTML = '';
  const current = state.config.slots[activeSlot]?.color;
  for (const c of state.db.colorsList) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (c.trans ? ' trans' : '') + (c.id === current ? ' selected' : '');
    b.style.background = c.trans
      ? `linear-gradient(135deg, ${c.hex}cc, ${c.hex}55)`
      : c.hex;
    b.title = c.nome;
    b.addEventListener('click', () => state.setColor(activeSlot, c.id));
    swatchesEl.appendChild(b);
  }
}

function renderPresets() {
  presetsEl.innerHTML = '';
  for (const [key, def] of Object.entries(POSES)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pose-btn' + (state.config.pose.preset === key ? ' active' : '');
    b.textContent = def.nome;
    b.addEventListener('click', () => state.applyPreset(key));
    presetsEl.appendChild(b);
  }
  const rand = document.createElement('button');
  rand.type = 'button';
  rand.className = 'pose-btn';
  rand.textContent = '🎲 Pose aleatória';
  rand.addEventListener('click', () => state.applyRandomPose());
  presetsEl.appendChild(rand);
}

const sliderInputs = new Map();

function renderSliders() {
  slidersEl.innerHTML = '';
  sliderInputs.clear();
  for (const s of SLIDERS) {
    const row = document.createElement('div');
    row.className = 'slider-row';
    const label = document.createElement('label');
    label.textContent = s.label;
    const input = document.createElement('input');
    input.type = 'range';
    input.min = s.min;
    input.max = s.max;
    input.step = 1;
    input.value = deg(state.config.pose[s.key] || 0);
    const out = document.createElement('output');
    out.textContent = `${input.value}°`;
    input.addEventListener('input', () => {
      out.textContent = `${input.value}°`;
      state.setPose({ [s.key]: rad(Number(input.value)), preset: null }, { record: true });
    });
    input.addEventListener('change', () => state.commitPose());
    row.append(label, input, out);
    slidersEl.appendChild(row);
    sliderInputs.set(s.key, { input, out });
  }
}

function syncSliders() {
  for (const s of SLIDERS) {
    const ctl = sliderInputs.get(s.key);
    if (!ctl) continue;
    const value = deg(state.config.pose[s.key] || 0);
    ctl.input.value = value;
    ctl.out.textContent = `${value}°`;
  }
  // realça preset ativo
  renderPresets();
}

export function focusSlot(slot) {
  activeSlot = slot;
  renderSwatches();
}

export function initPanel() {
  renderSwatches();
  renderPresets();
  renderSliders();

  nameEl.addEventListener('input', () => state.setName(nameEl.value));

  state.on('change', () => {
    renderSwatches();
    if (nameEl.value !== state.config.nome) nameEl.value = state.config.nome;
  });
  state.on('pose', () => {
    syncSliders();
    if (nameEl.value !== state.config.nome) nameEl.value = state.config.nome;
  });
}
