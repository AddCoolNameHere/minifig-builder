// Sidebar: abas de categoria, busca, grid de peças, pré-carga de miniaturas
// e redimensionamento por arrasto.

import * as state from '../state.js';
import { requestThumb, preloadThumbs, onThumbProgress, pendingThumbs } from './thumbs.js';

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
let currentItems = [];

const tabsEl = document.getElementById('tabs');
const gridEl = document.getElementById('parts-grid');
const searchEl = document.getElementById('search');
const preloadBtn = document.getElementById('btn-preload');

function normalize(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function matches(part, query) {
  if (!query) return true;
  const q = normalize(query);
  return (
    normalize(part.nome).includes(q) ||
    (part.tags || []).some((t) => normalize(t).includes(q)) ||
    part.id.toLowerCase().includes(q)
  );
}

function makeCard({ name, partId, selected, part, removeIcon, selCheck, onClick }) {
  const card = document.createElement('button');
  card.className = 'part-card' + (selected ? ' selected' : '');
  card.type = 'button';
  card._selCheck = selCheck;

  const thumb = document.createElement('div');
  thumb.className = 'part-thumb';
  if (removeIcon) {
    thumb.innerHTML = '<span class="ph">∅</span>';
  } else {
    const img = document.createElement('img');
    img.alt = name;
    img.loading = 'lazy';
    img.dataset.partId = part.id;
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

// Atualiza só o destaque de seleção — sem reconstruir a lista (preserva o scroll)
function updateSelection() {
  for (const card of gridEl.querySelectorAll('.part-card')) {
    if (card._selCheck) card.classList.toggle('selected', card._selCheck());
  }
}

function renderGrid({ keepScroll = false } = {}) {
  const cfg = state.config;
  const query = searchEl.value.trim();
  const prevScroll = gridEl.scrollTop;
  gridEl.innerHTML = '';
  currentItems = [];

  const addSection = (title) => {
    const el = document.createElement('div');
    el.className = 'grid-section-title';
    el.textContent = title;
    gridEl.appendChild(el);
  };

  if (activeTab.slot === 'extras') {
    for (const sub of [
      { key: 'base', title: 'Base' },
      { key: 'pet', title: 'Pet' },
    ]) {
      const items = state.db.partsList.filter((p) => p.categoria === 'extra' && (p.sub || 'pet') === sub.key && matches(p, query));
      if (!items.length && query) continue;
      currentItems.push(...items);
      addSection(sub.title);
      gridEl.appendChild(
        makeCard({
          name: 'Nenhum',
          selected: !cfg.slots[sub.key].part,
          removeIcon: true,
          selCheck: () => !state.config.slots[sub.key].part,
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
            selCheck: () => state.config.slots[sub.key].part === p.id,
            onClick: () => {
              state.setPart(sub.key, p.id, { toggle: true });
              onSlotFocus(sub.key);
            },
          })
        );
      }
    }
  } else {
    const items = state.db.partsList.filter((p) => p.categoria === activeTab.cat && matches(p, query));
    currentItems = items;
    const slot = activeTab.slot;

    if (activeTab.removable && !query) {
      gridEl.appendChild(
        makeCard({
          name: activeTab.removeLabel || 'Nenhum',
          selected: !cfg.slots[slot].part,
          removeIcon: true,
          selCheck: () => !state.config.slots[slot].part,
          onClick: () => state.setPart(slot, null),
        })
      );
    }

    for (const p of items) {
      gridEl.appendChild(
        makeCard({
          name: p.nome,
          partId: p.id,
          part: p,
          selected: cfg.slots[slot].part === p.id,
          selCheck: () => state.config.slots[slot].part === p.id,
          onClick: () => {
            state.setPart(slot, p.id, { toggle: !!activeTab.removable });
            onSlotFocus(slot);
          },
        })
      );
    }
  }

  if (!gridEl.querySelector('.part-card')) {
    const el = document.createElement('div');
    el.className = 'grid-empty';
    el.textContent = 'Nenhuma peça encontrada 🔍';
    gridEl.appendChild(el);
  }

  gridEl.scrollTop = keepScroll ? prevScroll : 0;
  updatePreloadButton();
}

/* ---------------- pré-carga de miniaturas ---------------- */

let preloadActive = false;

function updatePreloadButton(pending) {
  if (!preloadBtn) return;
  if (preloadActive && pending > 0) {
    preloadBtn.textContent = `⏳ Gerando… faltam ${pending}`;
    preloadBtn.disabled = true;
  } else {
    preloadActive = false;
    preloadBtn.textContent = `⚡ Gerar miniaturas da aba (${currentItems.length})`;
    preloadBtn.disabled = currentItems.length === 0;
  }
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

/* ---------------- redimensionamento ---------------- */

function initResize() {
  const handle = document.getElementById('sidebar-resize');
  const mainEl = document.querySelector('main');
  if (!handle || !mainEl) return;
  const saved = localStorage.getItem('minifig.sidebarW');
  if (saved) mainEl.style.setProperty('--sidebar-w', `${saved}px`);

  let startX = 0;
  let startW = 0;
  const onMove = (e) => {
    const w = Math.min(640, Math.max(240, startW + (e.clientX - startX)));
    mainEl.style.setProperty('--sidebar-w', `${w}px`);
  };
  const onUp = (e) => {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    const w = Math.min(640, Math.max(240, startW + (e.clientX - startX)));
    localStorage.setItem('minifig.sidebarW', String(w));
  };
  handle.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    startX = e.clientX;
    startW = document.getElementById('sidebar').getBoundingClientRect().width;
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

/* ---------------- init ---------------- */

export function initSidebar({ onFocusSlot }) {
  onSlotFocus = onFocusSlot;
  renderTabs();
  renderGrid();
  initResize();

  searchEl.addEventListener('input', () => renderGrid());

  // seleção muda sem reconstruir a lista; a lista só re-renderiza em
  // troca de aba/busca (ou import/aleatório, onde manter o scroll é ok)
  state.on('change', updateSelection);

  preloadBtn?.addEventListener('click', () => {
    preloadActive = true;
    preloadThumbs(currentItems);
    updatePreloadButton(pendingThumbs());
  });
  onThumbProgress((pending) => {
    if (preloadActive) updatePreloadButton(pending);
  });
}
