// Toolbar: aleatório, desfazer/refazer, salvar, exportar PNG/JSON, compartilhar.

import * as state from '../state.js';

const SAVES_KEY = 'minifig.saves.v1';

let hooks = {
  exportPNG: () => {},
  captureThumb: () => '',
};

/* ---------------- toast & modal ---------------- */

const toastEl = document.getElementById('toast');
let toastTimer = null;

export function toast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2400);
}

const modalRoot = document.getElementById('modal-root');

function openModal(title, buildBody) {
  modalRoot.innerHTML = '';
  modalRoot.hidden = false;
  const modal = document.createElement('div');
  modal.className = 'modal';
  const head = document.createElement('div');
  head.className = 'modal-head';
  head.innerHTML = `<h2>${title}</h2>`;
  const close = document.createElement('button');
  close.className = 'modal-close';
  close.textContent = '✕';
  close.addEventListener('click', closeModal);
  head.appendChild(close);
  const body = document.createElement('div');
  body.className = 'modal-body';
  buildBody(body);
  modal.append(head, body);
  modalRoot.appendChild(modal);
  modalRoot.addEventListener('click', backdropClose);
}

function backdropClose(e) {
  if (e.target === modalRoot) closeModal();
}

export function closeModal() {
  modalRoot.hidden = true;
  modalRoot.innerHTML = '';
  modalRoot.removeEventListener('click', backdropClose);
}

/* ---------------- salvar / carregar ---------------- */

function loadSaves() {
  try {
    return JSON.parse(localStorage.getItem(SAVES_KEY)) || [];
  } catch {
    return [];
  }
}

function persistSaves(saves) {
  try {
    localStorage.setItem(SAVES_KEY, JSON.stringify(saves));
    return true;
  } catch {
    toast('Não foi possível salvar (armazenamento cheio)');
    return false;
  }
}

function openSavesModal() {
  openModal('Minhas criações', (body) => {
    const saveRow = document.createElement('div');
    saveRow.className = 'modal-row';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'btn btn-accent';
    saveBtn.textContent = '💾 Salvar minifig atual';
    saveBtn.addEventListener('click', () => {
      const saves = loadSaves();
      saves.unshift({
        id: Date.now().toString(36),
        nome: state.config.nome || 'Minifig sem nome',
        date: new Date().toISOString(),
        thumb: hooks.captureThumb(),
        config: JSON.parse(JSON.stringify(state.config)),
      });
      if (saves.length > 30) saves.pop();
      if (persistSaves(saves)) {
        toast('Minifig salva! ✔');
        renderList();
      }
    });
    saveRow.appendChild(saveBtn);
    body.appendChild(saveRow);

    const list = document.createElement('div');
    list.className = 'saves-list';
    body.appendChild(list);

    function renderList() {
      const saves = loadSaves();
      list.innerHTML = '';
      if (!saves.length) {
        const empty = document.createElement('div');
        empty.className = 'modal-note';
        empty.textContent = 'Nenhuma criação salva ainda. Monte sua minifig e clique em salvar!';
        list.appendChild(empty);
        return;
      }
      for (const save of saves) {
        const item = document.createElement('div');
        item.className = 'save-item';
        const img = document.createElement('img');
        if (save.thumb) img.src = save.thumb;
        img.alt = save.nome;
        const info = document.createElement('div');
        const d = new Date(save.date);
        info.innerHTML = `<div class="save-name">${escapeHtml(save.nome)}</div><div class="save-date">${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>`;
        const actions = document.createElement('div');
        actions.className = 'save-actions';
        const load = document.createElement('button');
        load.className = 'btn';
        load.textContent = 'Carregar';
        load.addEventListener('click', () => {
          state.replaceConfig(save.config);
          closeModal();
          toast(`"${save.nome}" carregada`);
        });
        const del = document.createElement('button');
        del.className = 'btn btn-danger';
        del.textContent = '🗑';
        del.title = 'Excluir';
        del.addEventListener('click', () => {
          persistSaves(loadSaves().filter((s) => s.id !== save.id));
          renderList();
        });
        actions.append(load, del);
        item.append(img, info, actions);
        list.appendChild(item);
      }
    }
    renderList();
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------- exportar ---------------- */

function download(filename, url) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}

function slug() {
  return (state.config.nome || 'minifig').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'minifig';
}

function openPngModal() {
  openModal('Exportar PNG', (body) => {
    const check = document.createElement('label');
    check.className = 'check-row';
    check.innerHTML = '<input type="checkbox" checked> Fundo transparente';
    body.appendChild(check);
    const note = document.createElement('div');
    note.className = 'modal-note';
    note.textContent = 'A imagem é gerada em alta resolução (1600×2000).';
    body.appendChild(note);
    const row = document.createElement('div');
    row.className = 'modal-row';
    const btn = document.createElement('button');
    btn.className = 'btn btn-accent';
    btn.textContent = '🖼 Exportar PNG';
    btn.addEventListener('click', () => {
      const transparent = check.querySelector('input').checked;
      const url = hooks.exportPNG({ transparent });
      download(`${slug()}.png`, url);
      closeModal();
      toast('PNG exportado! 🖼');
    });
    row.appendChild(btn);
    body.appendChild(row);
  });
}

function openJsonModal() {
  openModal('Exportar / importar JSON', (body) => {
    const row = document.createElement('div');
    row.className = 'modal-row';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-accent';
    exportBtn.textContent = '⤓ Baixar JSON';
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([state.serialize()], { type: 'application/json' });
      download(`${slug()}.json`, URL.createObjectURL(blob));
      toast('JSON exportado');
    });

    const importBtn = document.createElement('button');
    importBtn.className = 'btn';
    importBtn.textContent = '⤒ Importar JSON';
    const file = document.createElement('input');
    file.type = 'file';
    file.accept = 'application/json,.json';
    file.hidden = true;
    file.addEventListener('change', async () => {
      const f = file.files[0];
      if (!f) return;
      try {
        const raw = JSON.parse(await f.text());
        state.replaceConfig(state.sanitize(raw));
        closeModal();
        toast('Minifig importada! ✔');
      } catch {
        toast('Arquivo JSON inválido');
      }
    });
    importBtn.addEventListener('click', () => file.click());

    row.append(exportBtn, importBtn, file);
    body.appendChild(row);

    const note = document.createElement('div');
    note.className = 'modal-note';
    note.textContent = 'O JSON contém toda a configuração: peças, cores, pose e nome.';
    body.appendChild(note);
  });
}

/* ---------------- compartilhar ---------------- */

async function share() {
  const url = `${location.origin}${location.pathname}#c=${state.encodeShare()}`;
  history.replaceState(null, '', `#c=${state.encodeShare()}`);
  try {
    await navigator.clipboard.writeText(url);
    toast('Link copiado! Cole para compartilhar 🔗');
  } catch {
    openModal('Compartilhar', (body) => {
      const note = document.createElement('div');
      note.className = 'modal-note';
      note.textContent = 'Copie o link abaixo:';
      const input = document.createElement('input');
      input.value = url;
      input.readOnly = true;
      input.style.width = '100%';
      input.addEventListener('focus', () => input.select());
      body.append(note, input);
    });
  }
}

/* ---------------- init ---------------- */

export function initToolbar(h) {
  hooks = { ...hooks, ...h };

  document.getElementById('btn-random').addEventListener('click', () => state.randomize());
  document.getElementById('btn-save').addEventListener('click', openSavesModal);
  document.getElementById('btn-png').addEventListener('click', openPngModal);
  document.getElementById('btn-json').addEventListener('click', openJsonModal);
  document.getElementById('btn-share').addEventListener('click', share);

  const undoBtn = document.getElementById('btn-undo');
  const redoBtn = document.getElementById('btn-redo');
  undoBtn.addEventListener('click', () => state.undo());
  redoBtn.addEventListener('click', () => state.redo());
  state.on('history', ({ canUndo, canRedo }) => {
    undoBtn.disabled = !canUndo;
    redoBtn.disabled = !canRedo;
  });

  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input[type="text"], input[type="search"], textarea')) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && !e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      state.undo();
    } else if ((mod && e.shiftKey && e.key.toLowerCase() === 'z') || (mod && e.key.toLowerCase() === 'y')) {
      e.preventDefault();
      state.redo();
    } else if (e.key === 'Escape') {
      closeModal();
    }
  });

  // drawers mobile
  const sidebar = document.getElementById('sidebar');
  const panel = document.getElementById('panel');
  const toggle = (el, other) => {
    other.classList.remove('open');
    el.classList.toggle('open');
  };
  document.getElementById('btn-mobile-parts').addEventListener('click', () => toggle(sidebar, panel));
  document.getElementById('btn-mobile-panel').addEventListener('click', () => toggle(panel, sidebar));
}
