// Miniaturas 3D das peças, renderizadas sob demanda num renderer offscreen.

import * as THREE from 'three';
import { buildHead, buildTorso, buildLegsAssembly, buildArm, buildHand, disposeObject } from '../minifig/figure.js';
import { buildAttachment } from '../minifig/parts3d.js';
import { db } from '../state.js';

const SIZE = 140;
let renderer = null;
let scene = null;
let camera = null;
const cache = new Map();
const queue = [];
let scheduled = false;

function ensureRenderer() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(SIZE, SIZE);
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xcdd9ff, 0x4a4036, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xaac4ff, 0.9);
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  camera = new THREE.PerspectiveCamera(30, 1, 0.01, 50);
}

function buildPreviewObject(part) {
  const colorEntry = db.colors.get(part.defaultColor) || db.colors.get('lightGray');
  switch (part.categoria) {
    case 'cabeca':
      return buildHead(part.decal, colorEntry);
    case 'torso':
      return buildTorso(part.decal, colorEntry);
    case 'pernas':
      return buildLegsAssembly(part, colorEntry).group;
    case 'bracos': {
      const g = new THREE.Group();
      const l = buildArm(-1, colorEntry, db.colors.get('yellow'));
      const r = buildArm(1, colorEntry, db.colors.get('yellow'));
      l.position.x = -0.35;
      r.position.x = 0.35;
      g.add(l, r);
      return g;
    }
    case 'maos':
      return buildHand(colorEntry);
    default:
      return buildAttachment(part.geo, colorEntry, db);
  }
}

function renderThumb(part) {
  ensureRenderer();
  const obj = buildPreviewObject(part);
  if (!obj) return null;
  scene.add(obj);

  const bbox = new THREE.Box3().setFromObject(obj);
  const center = bbox.getCenter(new THREE.Vector3());
  const sphere = bbox.getBoundingSphere(new THREE.Sphere());
  const dist = Math.max(sphere.radius, 0.2) * 3.4;
  const dir = new THREE.Vector3(0.55, 0.45, 1).normalize();
  camera.position.copy(center).addScaledVector(dir, dist);
  camera.lookAt(center);

  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  scene.remove(obj);
  disposeObject(obj);
  return url;
}

function pump() {
  scheduled = false;
  const started = performance.now();
  while (queue.length && performance.now() - started < 12) {
    const { part, img } = queue.shift();
    let url = cache.get(part.id);
    if (url === undefined) {
      try {
        url = renderThumb(part);
      } catch {
        url = null;
      }
      cache.set(part.id, url);
    }
    if (url && img.isConnected) img.src = url;
  }
  if (queue.length) schedule();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(pump);
}

export function requestThumb(part, img) {
  const cached = cache.get(part.id);
  if (cached) {
    img.src = cached;
    return;
  }
  queue.push({ part, img });
  schedule();
}
