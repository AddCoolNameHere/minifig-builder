// Miniaturas 3D das peças oficiais, renderizadas sob demanda.

import * as THREE from 'three';
import { loadPart, loadComposite } from '../minifig/ldparts.js';
import { SCALE } from '../minifig/figure.js';

const SIZE = 140;
let renderer = null;
let scene = null;
let camera = null;
const cache = new Map();
const queue = [];
let pumping = false;

function ensureRenderer() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xcdd9ff, 0x4a4036, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xaac4ff, 1.0);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
}

async function buildPreviewObject(part) {
  const color = part.defaultColor || '71';
  let obj;
  if (part.composite) {
    obj = await loadComposite(part.composite, color);
  } else if (part.legs === 'normal') {
    obj = new THREE.Group();
    const lp = part.legsParts || { hips: '3815b', legR: '3816c', legL: '3817c' };
    const [hips, legR, legL] = await Promise.all([
      loadPart(lp.hips, color),
      loadPart(lp.legR, color),
      loadPart(lp.legL, color),
    ]);
    legR.position.y = 12;
    legL.position.y = 12;
    obj.add(hips, legR, legL);
  } else if (part.categoria === 'bracos') {
    obj = new THREE.Group();
    const [r, l] = await Promise.all([loadPart('3818', color), loadPart('3819', color)]);
    r.position.x = -10;
    l.position.x = 10;
    obj.add(r, l);
  } else {
    obj = await loadPart(part.file, color);
  }
  const wrap = new THREE.Group();
  wrap.rotation.x = Math.PI; // LDraw Y-down -> Y-up
  wrap.scale.setScalar(SCALE);
  wrap.add(obj);
  return wrap;
}

async function renderThumb(part) {
  ensureRenderer();
  const obj = await buildPreviewObject(part);
  scene.add(obj);

  const bbox = new THREE.Box3().setFromObject(obj);
  const center = bbox.getCenter(new THREE.Vector3());
  const sphere = bbox.getBoundingSphere(new THREE.Sphere());
  const dist = Math.max(sphere.radius, 0.2) * 3.2;
  const dir = new THREE.Vector3(0.55, 0.45, 1).normalize();
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.lookAt(center);

  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(obj);
  return url;
}

async function pump() {
  if (pumping) return;
  pumping = true;
  while (queue.length) {
    const { part, img } = queue.shift();
    let url = cache.get(part.id);
    if (url === undefined) {
      try {
        url = await renderThumb(part);
      } catch (err) {
        console.warn('thumb falhou:', part.id, err);
        url = null;
      }
      cache.set(part.id, url);
    }
    // a grid pode ter re-renderizado: localiza o img atual da peça
    const target = img.isConnected ? img : document.querySelector(`img[data-part-id="${CSS.escape(part.id)}"]`);
    if (url && target) target.src = url;
    // respiro para não travar a UI
    await new Promise((r) => setTimeout(r, 0));
  }
  pumping = false;
}

export function requestThumb(part, img) {
  const cached = cache.get(part.id);
  if (cached) {
    img.src = cached;
    return;
  }
  queue.push({ part, img });
  pump();
}
