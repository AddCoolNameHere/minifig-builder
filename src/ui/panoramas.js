// Panoramas equiretangulares desenhados proceduralmente em canvas 2D.
// Aplicados como scene.background — a cena fica "dentro de uma esfera",
// como nos ambientes do Hero Forge.

import * as THREE from 'three';

const W = 2048;
const H = 1024;
const cache = new Map();

// gerador determinístico — o panorama é sempre igual entre visitas
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  return c;
}

function vGrad(ctx, stops, y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [t, color] of stops) g.addColorStop(t, color);
  return g;
}

// nuvem fofa: aglomerado de elipses desfocadas
function cloud(ctx, rng, cx, cy, scale, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.filter = `blur(${10 * scale}px)`;
  for (let i = 0; i < 6; i++) {
    const dx = (rng() - 0.5) * 130 * scale;
    const dy = (rng() - 0.5) * 30 * scale;
    const r = (28 + rng() * 36) * scale;
    ctx.beginPath();
    ctx.ellipse(cx + dx, cy + dy, r * 1.6, r * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.filter = 'none';
  ctx.restore();
}

function stars(ctx, rng, n, yMax = H, alphaMax = 0.95) {
  for (let i = 0; i < n; i++) {
    const x = rng() * W;
    const y = rng() * yMax;
    const r = rng() * 1.4 + 0.3;
    ctx.globalAlpha = 0.25 + rng() * alphaMax * 0.75;
    ctx.fillStyle = rng() < 0.12 ? '#cfe2ff' : '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function glow(ctx, x, y, r, inner, outer) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

const PANO_PAINTERS = {
  ceu(ctx) {
    const rng = mulberry32(42);
    ctx.fillStyle = vGrad(ctx, [[0, '#1e5fc4'], [0.32, '#4a90e2'], [0.5, '#a8d8f0']], 0, H * 0.52);
    ctx.fillRect(0, 0, W, H * 0.52);
    // sol
    glow(ctx, W * 0.7, H * 0.3, 200, 'rgba(255,250,220,.95)', 'rgba(255,250,220,0)');
    glow(ctx, W * 0.7, H * 0.3, 60, '#fffdf2', 'rgba(255,253,242,0)');
    // nuvens em duas faixas de altura
    for (let i = 0; i < 14; i++) {
      cloud(ctx, rng, rng() * W, H * (0.26 + rng() * 0.2), 0.7 + rng() * 1.1, 0.5 + rng() * 0.3);
    }
    // gramado
    ctx.fillStyle = vGrad(ctx, [[0, '#8fca6a'], [0.25, '#6faf4e'], [1, '#3f7a30']], H * 0.5, H);
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
    // névoa do horizonte
    ctx.fillStyle = vGrad(ctx, [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(235,245,255,.55)'], [1, 'rgba(255,255,255,0)']], H * 0.45, H * 0.56);
    ctx.fillRect(0, H * 0.45, W, H * 0.11);
  },

  entardecer(ctx) {
    const rng = mulberry32(7);
    ctx.fillStyle = vGrad(ctx, [[0, '#1b1038'], [0.3, '#5d2a63'], [0.42, '#c4504f'], [0.5, '#ff9b4a']], 0, H * 0.52);
    ctx.fillRect(0, 0, W, H * 0.52);
    // sol no horizonte
    glow(ctx, W * 0.5, H * 0.49, 260, 'rgba(255,200,120,.9)', 'rgba(255,160,80,0)');
    ctx.fillStyle = '#ffe9b8';
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.49, 52, Math.PI, 0);
    ctx.fill();
    // nuvens alongadas escuras
    ctx.fillStyle = 'rgba(60,25,70,.5)';
    for (let i = 0; i < 10; i++) {
      const y = H * (0.2 + rng() * 0.25);
      const x = rng() * W;
      const w = 160 + rng() * 360;
      ctx.beginPath();
      ctx.ellipse(x, y, w, 9 + rng() * 14, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // chão escurecido
    ctx.fillStyle = vGrad(ctx, [[0, '#4a3144'], [0.3, '#33222f'], [1, '#1c1219']], H * 0.5, H);
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
    glow(ctx, W * 0.5, H * 0.52, 300, 'rgba(255,150,70,.25)', 'rgba(255,150,70,0)');
  },

  noite(ctx) {
    const rng = mulberry32(99);
    ctx.fillStyle = vGrad(ctx, [[0, '#05081a'], [0.4, '#0d1430'], [0.5, '#1a2347']], 0, H * 0.52);
    ctx.fillRect(0, 0, W, H * 0.52);
    stars(ctx, rng, 420, H * 0.5);
    // lua
    glow(ctx, W * 0.32, H * 0.24, 130, 'rgba(220,230,255,.5)', 'rgba(220,230,255,0)');
    ctx.fillStyle = '#e8edf8';
    ctx.beginPath();
    ctx.arc(W * 0.32, H * 0.24, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(170,185,210,.5)';
    for (const [dx, dy, r] of [[-14, -8, 9], [12, 10, 7], [4, -16, 5]]) {
      ctx.beginPath();
      ctx.arc(W * 0.32 + dx, H * 0.24 + dy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    // chão noturno
    ctx.fillStyle = vGrad(ctx, [[0, '#16203a'], [0.3, '#0e1526'], [1, '#070b15']], H * 0.5, H);
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
  },

  espaco(ctx) {
    const rng = mulberry32(2001);
    ctx.fillStyle = '#02030c';
    ctx.fillRect(0, 0, W, H);
    // nebulosas
    for (const [x, y, r, cor] of [
      [W * 0.22, H * 0.35, 320, 'rgba(110,60,200,.18)'],
      [W * 0.78, H * 0.6, 380, 'rgba(40,140,200,.15)'],
      [W * 0.55, H * 0.25, 260, 'rgba(200,60,140,.12)'],
    ]) {
      glow(ctx, x, y, r, cor, 'rgba(0,0,0,0)');
    }
    stars(ctx, rng, 700, H);
    // planeta distante
    glow(ctx, W * 0.85, H * 0.3, 110, 'rgba(255,170,90,.35)', 'rgba(255,170,90,0)');
    ctx.fillStyle = '#c97a3d';
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.3, 58, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,220,180,.25)';
    ctx.beginPath();
    ctx.arc(W * 0.85 - 16, H * 0.3 - 14, 42, 0, Math.PI * 2);
    ctx.fill();
  },

  estudio360(ctx) {
    // sala de estúdio: parede neutra, softboxes e piso
    ctx.fillStyle = vGrad(ctx, [[0, '#3a3f49'], [0.35, '#4d535e'], [0.5, '#6a707c']], 0, H * 0.52);
    ctx.fillRect(0, 0, W, H * 0.52);
    // softboxes (retângulos de luz suaves)
    for (const [x, w] of [[W * 0.18, 200], [W * 0.62, 240], [W * 0.9, 160]]) {
      ctx.save();
      ctx.filter = 'blur(18px)';
      ctx.fillStyle = 'rgba(255,252,240,.75)';
      ctx.fillRect(x - w / 2, H * 0.16, w, 130);
      ctx.restore();
    }
    glow(ctx, W * 0.4, H * 0.1, 300, 'rgba(255,255,255,.18)', 'rgba(255,255,255,0)');
    // piso
    ctx.fillStyle = vGrad(ctx, [[0, '#5a606b'], [0.25, '#41464f'], [1, '#23262c']], H * 0.5, H);
    ctx.fillRect(0, H * 0.5, W, H * 0.5);
    // reflexo suave do softbox no piso
    ctx.save();
    ctx.filter = 'blur(26px)';
    ctx.fillStyle = 'rgba(255,255,255,.08)';
    ctx.fillRect(W * 0.5, H * 0.55, 420, 120);
    ctx.restore();
  },
};

export function getPanorama(kind) {
  if (!cache.has(kind)) {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d');
    (PANO_PAINTERS[kind] || PANO_PAINTERS.ceu)(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    cache.set(kind, tex);
  }
  return cache.get(kind);
}
