// Carregamento de peças oficiais LDraw (empacotadas em .mpd autocontidos).
// Cada peça é parseada por cor e cacheada; instâncias são clones baratos.

import * as THREE from 'three';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';

const loader = new LDrawLoader();
loader.smoothNormals = true;
loader.setPath('ldraw/');
loader.setPartsLibraryPath('ldraw/');

let materialsReady = null;

export function initLDraw() {
  if (!materialsReady) materialsReady = loader.preloadMaterials('LDConfig.ldr');
  return materialsReady;
}

const packedTexts = new Map();   // file -> Promise<string>
const builtCache = new Map();    // `${file}/${color}` -> Promise<Group>
let wrapperSeq = 0;

// Com milhares de peças no catálogo, o cache precisa de teto: FIFO simples,
// sem dispose explícito — clones vivos seguram as geometrias; o GC recolhe o resto.
const MAX_BUILT = 120;
const MAX_TEXTS = 200;

function capCache(map, max) {
  while (map.size > max) {
    map.delete(map.keys().next().value);
  }
}

function fetchPacked(file) {
  if (!packedTexts.has(file)) {
    packedTexts.set(
      file,
      fetch(`ldraw/parts/${file}.mpd`).then((r) => {
        if (!r.ok) throw new Error(`peça não encontrada: ${file}`);
        return r.text();
      })
    );
  }
  return packedTexts.get(file);
}

function parseText(text) {
  return new Promise((resolve, reject) => loader.parse(text, resolve, reject));
}

// Pós-processa um grupo carregado: esconde linhas de aresta (foto-realismo)
// e marca meshes para sombra.
function postprocess(group) {
  group.traverse((o) => {
    if (o.isLineSegments) o.visible = false;
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });
  return group;
}

/**
 * Carrega uma peça com a cor dada (código LDraw). Retorna um clone do
 * resultado cacheado — geometria e materiais são compartilhados.
 */
export async function loadPart(file, colorCode) {
  const key = `${file}/${colorCode}`;
  if (!builtCache.has(key)) {
    builtCache.set(
      key,
      (async () => {
        await initLDraw();
        const packed = await fetchPacked(file);
        const wrapper = `0 FILE __wrap${wrapperSeq++}.ldr\n1 ${colorCode} 0 0 0 1 0 0 0 1 0 0 0 1 ${file}.dat\n0 NOFILE\n${packed}`;
        const group = await parseText(wrapper);
        return postprocess(group);
      })()
    );
  }
  const built = await builtCache.get(key);
  capCache(builtCache, MAX_BUILT);
  capCache(packedTexts, MAX_TEXTS);
  return built.clone();
}

/**
 * Carrega uma peça composta: lista de { file, color | slotColor, pos:[x,y,z] }.
 * slotColor=true usa a cor escolhida pelo usuário.
 */
export async function loadComposite(items, slotColorCode) {
  const group = new THREE.Group();
  const children = await Promise.all(
    items.map((item) => loadPart(item.file, item.slotColor ? slotColorCode : item.color))
  );
  children.forEach((child, i) => {
    const [x, y, z] = items[i].pos || [0, 0, 0];
    child.position.set(x, y, z);
    if (items[i].glow) {
      // brilho: clona materiais para não afetar outras peças da mesma cor
      child.traverse((o) => {
        if (o.isMesh) {
          const wasArray = Array.isArray(o.material);
          const cloned = (wasArray ? o.material : [o.material]).map((m) => {
            const clone = m.clone();
            clone.emissive = clone.color.clone();
            clone.emissiveIntensity = 1.4;
            if (clone.transparent) clone.opacity = Math.max(clone.opacity, 0.85);
            return clone;
          });
          o.material = wasArray ? cloned : cloned[0];
        }
      });
    }
    group.add(child);
  });
  return group;
}

/** Material library do loader (após initLDraw) — para consultas de cor. */
export function getLoader() {
  return loader;
}
