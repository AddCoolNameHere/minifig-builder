// Bootstrap: cena 3D, estúdio fotográfico, loop de render e ligação estado<->UI.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as state from './state.js';
import { createMinifig, applyPose } from './minifig/figure.js';
import { initLDraw } from './minifig/ldparts.js';
import { initSidebar } from './ui/sidebar.js';
import { initPanel, focusSlot } from './ui/panel.js';
import { initToolbar, toast } from './ui/toolbar.js';
import { getPanorama } from './ui/panoramas.js';

const canvas = document.getElementById('c');
const viewport = document.getElementById('viewport');

let renderer, scene, camera, controls;
let figure = null;
let lights = {};
let cyclorama = null;

/* ---------------- estúdio: fundos e luz ---------------- */

export const FUNDOS = {
  gradiente: { nome: 'Gradiente', css: 'radial-gradient(1200px 700px at 50% 30%, #232b3a 0%, #161a22 55%, #0e1117 100%)', clear: null },
  branco:    { nome: 'Branco',    css: '#e8e8ea', clear: '#e8e8ea' },
  preto:     { nome: 'Preto',     css: '#0a0a0c', clear: '#0a0a0c' },
  ciclorama: { nome: 'Ciclorama', css: '#1a1d24', clear: null, cyc: true },
  ceu:        { nome: '🌤 Céu 360°',       pano: 'ceu' },
  entardecer: { nome: '🌇 Entardecer 360°', pano: 'entardecer' },
  noite:      { nome: '🌙 Noite 360°',      pano: 'noite' },
  espaco:     { nome: '🌌 Espaço 360°',     pano: 'espaco' },
  estudio360: { nome: '💡 Estúdio 360°',    pano: 'estudio360' },
};

export const LUZES = {
  estudio:   { nome: 'Estúdio',   key: [4, 7, 5, 2.6, '#fff4e0'], fill: [-5, 3, -4, 0.7, '#9db8ff'], rim: [0, 5, -7, 0.55, '#ffffff'], hemi: 0.55, env: 0.55 },
  dramatica: { nome: 'Dramática', key: [5, 6, 2, 3.4, '#ffe8c8'], fill: [-6, 2, -2, 0.15, '#7a8cb8'], rim: [-2, 4, -8, 1.1, '#aac4ff'], hemi: 0.2, env: 0.3 },
  entardecer:{ nome: 'Entardecer',key: [6, 3, 4, 2.8, '#ffb070'], fill: [-5, 4, -3, 0.5, '#7a6cb8'], rim: [0, 5, -7, 0.8, '#ff8855'], hemi: 0.35, env: 0.4 },
  suave:     { nome: 'Suave',     key: [3, 6, 6, 1.8, '#ffffff'], fill: [-5, 4, -4, 1.1, '#e8eeff'], rim: [0, 5, -7, 0.4, '#ffffff'], hemi: 0.85, env: 0.8 },
  fria:      { nome: 'Fria',      key: [4, 7, 5, 2.4, '#dceaff'], fill: [-5, 3, -4, 0.6, '#a8c8ff'], rim: [0, 5, -7, 0.7, '#cfe0ff'], hemi: 0.45, env: 0.5 },
};

function applyStudio() {
  const s = state.config.studio;
  const fundo = FUNDOS[s.fundo] || FUNDOS.gradiente;
  const luz = LUZES[s.luz] || LUZES.estudio;
  const k = s.intensidade ?? 1;

  // fundo: panorama 360° (esfera ao redor da cena) ou plano
  if (fundo.pano) {
    scene.background = getPanorama(fundo.pano);
    viewport.style.background = '#000';
  } else {
    scene.background = null;
    viewport.style.background = fundo.css;
  }
  if (cyclorama) cyclorama.visible = !!fundo.cyc;

  // luzes
  const setLight = (light, [x, y, z, i, color]) => {
    light.position.set(x, y, z);
    light.intensity = i * k;
    light.color.set(color);
  };
  setLight(lights.key, luz.key);
  setLight(lights.fill, luz.fill);
  setLight(lights.rim, luz.rim);
  lights.hemi.intensity = luz.hemi * k;
  scene.environmentIntensity = luz.env * k;
}

/* ---------------- cena ---------------- */

function initScene() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(3.4, 3.6, 7.2);

  controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 2.05, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 1.6;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.52;
  controls.update();

  lights.hemi = new THREE.HemisphereLight(0xcdd9ff, 0x4a4036, 0.55);
  scene.add(lights.hemi);

  lights.key = new THREE.DirectionalLight(0xfff4e0, 2.6);
  lights.key.castShadow = true;
  lights.key.shadow.mapSize.set(2048, 2048);
  lights.key.shadow.camera.left = -4.5;
  lights.key.shadow.camera.right = 4.5;
  lights.key.shadow.camera.top = 6;
  lights.key.shadow.camera.bottom = -2;
  lights.key.shadow.camera.far = 28;
  lights.key.shadow.bias = -0.0004;
  lights.key.shadow.radius = 6;
  scene.add(lights.key);

  lights.fill = new THREE.DirectionalLight(0x9db8ff, 0.7);
  scene.add(lights.fill);

  lights.rim = new THREE.DirectionalLight(0xffffff, 0.55);
  scene.add(lights.rim);

  // chão que só recebe sombra
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(40, 48),
    new THREE.ShadowMaterial({ opacity: 0.34 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // ciclorama de estúdio (chão + parede curva), visível só no fundo "ciclorama"
  const cycMat = new THREE.MeshStandardMaterial({ color: 0xcfd2d8, roughness: 0.95, metalness: 0, side: THREE.BackSide });
  const cycGeo = new THREE.CylinderGeometry(16, 16, 44, 64, 1, true, Math.PI * 0.4, Math.PI * 1.2);
  cyclorama = new THREE.Group();
  const wall = new THREE.Mesh(cycGeo, cycMat);
  wall.position.y = 22;
  const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0xcfd2d8, roughness: 0.95, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  cyclorama.add(wall, floor);
  cyclorama.visible = false;
  scene.add(cyclorama);

  controls.addEventListener('start', () => { userMovedCamera = true; });

  applyStudio();
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
  if (!userMovedCamera) {
    const dist = camera.aspect < 0.9 ? 8.0 / Math.max(camera.aspect, 0.45) : 8.0;
    camera.position.sub(controls.target).setLength(dist).add(controls.target);
    controls.update();
  }
}

/* ---------------- reconstrução assíncrona ---------------- */

let buildSeq = 0;
let pendingBuilds = 0;

function setBuildPill(on) {
  const pill = document.getElementById('build-pill');
  if (pill) pill.hidden = !on;
}

async function rebuild() {
  const seq = ++buildSeq;
  pendingBuilds++;
  // só mostra o indicador se a montagem demorar de verdade
  const pillTimer = setTimeout(() => setBuildPill(true), 180);
  try {
    const next = await createMinifig(state.config, state.db);
    if (seq !== buildSeq) return; // outra reconstrução mais nova já chegou
    if (figure) scene.remove(figure.root);
    figure = next;
    applyPose(figure.joints, state.config.pose);
    scene.add(figure.root);
  } catch (err) {
    console.error('falha ao montar minifig:', err);
    toast('Erro ao carregar peça 😕');
  } finally {
    clearTimeout(pillTimer);
    if (--pendingBuilds === 0) setBuildPill(false);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

/* ---------------- captura / export ---------------- */

function makeGradientTexture(stops) {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 512;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  const list = stops || ['#2a3347', '#181d27', '#0e1116'];
  list.forEach((color, i) => grad.addColorStop(i / (list.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 4, 512);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function currentBackgroundForExport() {
  const fundo = FUNDOS[state.config.studio.fundo] || FUNDOS.gradiente;
  if (fundo.cyc) return null; // ciclorama é geometria, já aparece
  if (fundo.clear) return new THREE.Color(fundo.clear);
  return makeGradientTexture(fundo.grad);
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
  const prevBg = scene.background; // pode ser um panorama 360°
  let tempBg = null;
  if (transparent) {
    scene.background = null;
  } else if (!prevBg) {
    tempBg = currentBackgroundForExport();
    scene.background = tempBg;
  }
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');

  scene.background = prevBg;
  if (tempBg?.dispose) tempBg.dispose();
  renderer.setPixelRatio(prevRatio);
  renderer.setSize(prevW / prevRatio, prevH / prevRatio, false);
  camera.aspect = prevAspect;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);
  return url;
}

function exportPNG({ transparent, size = 2000 }) {
  return renderShot(Math.round(size * 0.8), size, { transparent });
}

function captureThumb() {
  return renderShot(180, 180, { transparent: false });
}

/* ---------------- boot ---------------- */

async function boot() {
  const bootLoader = document.getElementById('boot-loader');
  try {
    await Promise.all([state.loadData(), initLDraw()]);
  } catch (err) {
    bootLoader.innerHTML = `<div style="text-align:center;padding:20px;color:#e8eaef">
      <h2>Não foi possível carregar o catálogo de peças 😕</h2>
      <p style="color:#9aa1ad">Sirva o app por HTTP (ex.: <code>python3 -m http.server</code>) — abrir o arquivo direto não funciona.<br>
      Detalhe: ${String(err?.message || err)}</p></div>`;
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
  animate();
  // some o overlay quando a primeira minifig estiver montada
  rebuild().finally(() => {
    bootLoader.classList.add('done');
    setTimeout(() => bootLoader.remove(), 450);
  });

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
  state.on('studio', () => {
    applyStudio();
    state.autosave();
  });

  const hint = document.getElementById('viewport-hint');
  canvas.addEventListener('pointerdown', () => hint.classList.add('fade'), { once: true });

  const nameEl = document.getElementById('fig-name');
  nameEl.value = state.config.nome;

  // hook para depuração/testes no console
  window.__minifig = { camera, controls, scene, get figure() { return figure; } };
}

boot();
