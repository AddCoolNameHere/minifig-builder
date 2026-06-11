// Bootstrap: cena 3D, loop de render e ligação entre estado e UI.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as state from './state.js';
import { createMinifig, applyPose, disposeObject } from './minifig/figure.js';
import { initSidebar } from './ui/sidebar.js';
import { initPanel, focusSlot } from './ui/panel.js';
import { initToolbar, toast } from './ui/toolbar.js';

const canvas = document.getElementById('c');
const viewport = document.getElementById('viewport');

let renderer, scene, camera, controls;
let figure = null;

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = null;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;

  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(3.4, 3.6, 7.2);

  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 2.05, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2.2;
  controls.maxDistance = 16;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.update();

  const hemi = new THREE.HemisphereLight(0xcdd9ff, 0x4a4036, 0.55);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff4e0, 2.6);
  key.position.set(4, 7, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -4.5;
  key.shadow.camera.right = 4.5;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -2;
  key.shadow.camera.far = 24;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x9db8ff, 0.7);
  fill.position.set(-5, 3, -4);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffffff, 0.55);
  rim.position.set(0, 5, -7);
  scene.add(rim);

  // chão que só recebe sombra
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(40, 48),
    new THREE.ShadowMaterial({ opacity: 0.34 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  controls.addEventListener('start', () => { userMovedCamera = true; });

  resize();
  new ResizeObserver(resize).observe(viewport);
}

let userMovedCamera = false;

function resize() {
  const w = viewport.clientWidth;
  const h = viewport.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  // afasta a câmera em telas estreitas para a minifig caber inteira
  if (!userMovedCamera) {
    const dist = camera.aspect < 0.9 ? 8.0 / Math.max(camera.aspect, 0.45) : 8.0;
    camera.position.sub(controls.target).setLength(dist).add(controls.target);
    controls.update();
  }
}

function rebuild() {
  if (figure) {
    scene.remove(figure.root);
    disposeObject(figure.root);
  }
  figure = createMinifig(state.config, state.db);
  applyPose(figure.joints, state.config.pose);
  scene.add(figure.root);
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/* ---------------- captura / export ---------------- */

function makeGradientTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 512;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#2a3347');
  grad.addColorStop(0.6, '#181d27');
  grad.addColorStop(1, '#0e1116');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function renderShot(w, h, { transparent = true } = {}) {
  const prevW = renderer.domElement.width;
  const prevH = renderer.domElement.height;
  const prevRatio = renderer.getPixelRatio();
  const prevAspect = camera.aspect;

  renderer.setPixelRatio(1);
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  let bg = null;
  if (!transparent) {
    bg = makeGradientTexture();
    scene.background = bg;
  }
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');

  scene.background = null;
  bg?.dispose();
  renderer.setPixelRatio(prevRatio);
  renderer.setSize(prevW / prevRatio, prevH / prevRatio, false);
  camera.aspect = prevAspect;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  return url;
}

function exportPNG({ transparent }) {
  return renderShot(1600, 2000, { transparent });
}

function captureThumb() {
  return renderShot(180, 180, { transparent: false });
}

/* ---------------- boot ---------------- */

async function boot() {
  try {
    await state.loadData();
  } catch (err) {
    document.body.innerHTML = `<div style="display:grid;place-items:center;height:100vh;color:#e8eaef;font-family:sans-serif;text-align:center;padding:20px">
      <div><h2>Não foi possível carregar o catálogo de peças 😕</h2>
      <p>Sirva o app por HTTP (ex.: <code>python3 -m http.server</code>) — abrir o arquivo direto não funciona.</p></div></div>`;
    throw err;
  }

  // config inicial: URL compartilhada > autosave > padrão
  let initial = null;
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('c')) {
    initial = state.decodeShare(hash.get('c'));
    if (initial) toast('Minifig carregada do link! 🔗');
  }
  if (!initial) initial = state.loadAutosave();
  state.initConfig(initial);

  initScene();
  rebuild();
  animate();

  initSidebar({ onFocusSlot: focusSlot });
  initPanel();
  initToolbar({ exportPNG, captureThumb });

  state.on('change', () => {
    rebuild();
    state.autosave();
  });
  state.on('pose', () => {
    if (figure) applyPose(figure.joints, state.config.pose);
    state.autosave();
  });

  // some o hint depois de interagir
  const hint = document.getElementById('viewport-hint');
  canvas.addEventListener('pointerdown', () => hint.classList.add('fade'), { once: true });

  // nome inicial no campo
  const nameEl = document.getElementById('fig-name');
  nameEl.value = state.config.nome;

  // hook para depuração/testes no console
  window.__minifig = { camera, controls, get figure() { return figure; } };
}

boot();
