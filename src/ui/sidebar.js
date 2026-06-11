// Sidebar: abas de categoria, busca e grid de peças.

import * as state from '../state.js';
import { requestThumb } from './thumbs.js';

export const TABS = [
  { slot: 'head', label: '🙂 Cabeça', cat: 'cabeca' },
  { slot: 'headgear', label: '🧢 Cabelo/Chapéu', cat: 'chapeu', removable: true, removeLabel: 'Careca / nada' },
  { slot: 'torso', label: '👕 Torso', cat: 'torso' },
  { slot: 'arms', label: '💪 Braços', cat: 'bracos' },
  { slot: 'hands', label: '✋ Mãos', cat: 'maos' },
  { slot: 'legs', label: '👖 Pernas', cat: 'pernas' },
  { slot: 'handL', label: '🤛 Mão esquerda', cat: 'acessorio', removable: true, removeLabel: 'Mão vazia' },
  { slot: 'handR', label: '🤜 Mão direita', cat: 'acessorio', removable: true, removeLabel: 'Mão vazia' },
  { slot: 'body', label: '🎒 Corpo', cat: 'corpo', removable: true, removeLabel: 'Nada' },
  { slot: 'extras', label: '⭐ Extras', cat: 'extra' },
];

let activeTab = TABS[0];
let onSlotFocus = () => {};

const tabsEl = document.getElementById('tabs');
const gridEl = document.getElementById('parts-grid');
const searchEl = document.getElementById('search');

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function matches(part, query) {
  if (!query) return true;
  const q = normalize(query);
  return normalize(part.nome).includes(q) || part.tags.some((t) => normalize(t).includes(q)) || part.id.includes(q);
}

function makeCard({ name, partId, selected, part, removeIcon, onClick }) {
  const card = document.createElement('button');
  card.className = 'part-card' + (selected ? ' selected' : '');
  card.type = 'button';

  const thumb = document.createElement('div');
  thumb.className = 'part-thumb';
  if (removeIcon) {
    thumb.innerHTML = '<span class="ph">∅</span>';
  } else {
    const img = document.createElement('img');
    img.alt = name;
    img.loading = 'lazy';
    thumb.appendChild(img);
    requestThumb(part, img);
  }
  card.appendChild(thumb);

  const label = document.createElement('div');
  label.className = 'part-name';
  label.textContent = name;
  card.appendChild(label);

  if (partId) {
    const idEl = document.createElement('div');
    idEl.className = 'part-id';
    idEl.textContent = partId;
    card.appendChild(idEl);
  }

  card.addEventListener('click', onClick);
  return card;
}

function renderGrid() {
  const cfg = state.config;
  const query = searchEl.value.trim();
  gridEl.innerHTML = '';
  gridEl.scrollTop = 0;

  const addSection = (title) => {
    const el = document.createElement('div');
    el.className = 'grid-section-title';
    el.textContent = title;
    gridEl.appendChild(el);
  };

  if (activeTab.slot === 'extras') {
    // duas sub-seções: base e pet, ambas removíveis
    for (const sub of [
      { key: 'base', title: 'Base' },
      { key: 'pet', title: 'Pet' },
    ]) {
      const items = state.db.partsList.filter((p) => p.categoria === 'extra' && p.sub === sub.key && matches(p, query));
      if (!items.length && query) continue;
      addSection(sub.title);
      gridEl.appendChild(
        makeCard({
          name: 'Nenhum',
          selected: !cfg.slots[sub.key].part,
          removeIcon: true,
          onClick: () => state.setPart(sub.key, null),
        })
      );
      for (const p of items) {
        gridEl.appendChild(
          makeCard({
            name: p.nome,
            partId: p.id,
            part: p,
            selected: cfg.slots[sub.key].part === p.id,
            onClick: () => {
              state.setPart(sub.key, p.id, { toggle: true });
              onSlotFocus(sub.key);
            },
          })
        );
      }
    }
    if (!gridEl.children.length) showEmpty();
    return;
  }

  const items = state.db.partsList.filter((p) => p.categoria === activeTab.cat && matches(p, query));

  if (activeTab.removable && !query) {
    gridEl.appendChild(
      makeCard({
        name: activeTab.removeLabel || 'Nenhum',
        selected: !cfg.slots[activeTab.slot].part,
        removeIcon: true,
        onClick: () => state.setPart(activeTab.slot, null),
      })
    );
  }

  for (const p of items) {
    gridEl.appendChild(
      makeCard({
        name: p.nome,
        partId: p.id,
        part: p,
        selected: cfg.slots[activeTab.slot].part === p.id,
        onClick: () => {
          state.setPart(activeTab.slot, p.id, { toggle: !!activeTab.removable });
          onSlotFocus(activeTab.slot);
        },
      })
    );
  }

  if (!gridEl.children.length) showEmpty();
}

function showEmpty() {
  const el = document.createElement('div');
  el.className = 'grid-empty';
  el.textContent = 'Nenhuma peça encontrada 🔍';
  gridEl.appendChild(el);
}

function renderTabs() {
  tabsEl.innerHTML = '';
  for (const tab of TABS) {
    const btn = document.createElement('button');
    btn.className = 'tab' + (tab === activeTab ? ' active' : '');
    btn.textContent = tab.label;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      activeTab = tab;
      searchEl.value = '';
      renderTabs();
      renderGrid();
      onSlotFocus(tab.slot === 'extras' ? 'base' : tab.slot);
    });
    tabsEl.appendChild(btn);
  }
}

export function initSidebar({ onFocusSlot }) {
  onSlotFocus = onFocusSlot;
  renderTabs();
  renderGrid();
  searchEl.addEventListener('input', renderGrid);
  state.on('change', renderGrid);
}
