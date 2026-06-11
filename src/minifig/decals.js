// Estampas desenhadas programaticamente em canvas 2D.
// Rostos vão numa faixa que envolve o cilindro da cabeça (1024x256, rosto centrado em x=512).
// Estampas de torso vão na face frontal (512x512).

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) * f));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) * f));
  const b = Math.min(255, Math.max(0, (n & 255) * f));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/* ============================== ROSTOS ============================== */
// Canvas 1024x256. Centro do rosto: cx=512. Olhos ~y=104, boca ~y=170.
const INK = '#1a1a1a';

function eyes(ctx, dx = 50, y = 104, r = 14) {
  ctx.fillStyle = INK;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(512 + s * dx, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function smileArc(ctx, y = 148, r = 56, lw = 13, a0 = Math.PI * 0.18, a1 = Math.PI * 0.82) {
  ctx.strokeStyle = INK;
  ctx.lineWidth = lw;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(512, y, r, a0, a1);
  ctx.stroke();
}

const FACES = {
  smiley(ctx) {
    eyes(ctx);
    smileArc(ctx);
  },

  grin(ctx) {
    eyes(ctx);
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(512, 152, 58, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(512, 152, 40, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillRect(452, 152, 120, 8);
  },

  wink(ctx) {
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(512 - 50, 104, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(512 + 34, 104);
    ctx.lineTo(512 + 68, 104);
    ctx.stroke();
    // sobrancelha sobre o olho piscando
    ctx.beginPath();
    ctx.moveTo(512 + 32, 78);
    ctx.lineTo(512 + 70, 72);
    ctx.stroke();
    smileArc(ctx, 144, 52, 13, Math.PI * 0.22, Math.PI * 0.85);
  },

  angry(ctx) {
    eyes(ctx, 50, 110, 13);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 13;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(512 + s * 22, 74);
      ctx.lineTo(512 + s * 76, 88);
      ctx.stroke();
    }
    // boca brava
    ctx.beginPath();
    ctx.arc(512, 208, 52, Math.PI * 1.2, Math.PI * 1.8);
    ctx.stroke();
  },

  scared(ctx) {
    eyes(ctx, 50, 108, 16);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(512 + s * 50, 96, 26, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.ellipse(512, 172, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
    // gota de suor
    ctx.fillStyle = '#7EC9E8';
    ctx.beginPath();
    ctx.moveTo(512 + 108, 64);
    ctx.quadraticCurveTo(512 + 124, 92, 512 + 108, 102);
    ctx.quadraticCurveTo(512 + 92, 92, 512 + 108, 64);
    ctx.fill();
  },

  glasses(ctx) {
    eyes(ctx, 50, 104, 11);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(512 + s * 50, 104, 30, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(512 - 20, 100);
    ctx.lineTo(512 + 20, 100);
    ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(512 + s * 80, 100);
      ctx.lineTo(512 + s * 130, 92);
      ctx.stroke();
    }
    smileArc(ctx, 152, 48, 12, Math.PI * 0.2, Math.PI * 0.8);
  },

  shades(ctx) {
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(512 + s * 50 - 34, 84, 68, 42, 10);
      ctx.fill();
    }
    ctx.strokeStyle = INK;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(512 - 18, 96);
    ctx.lineTo(512 + 18, 96);
    ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(512 + s * 84, 94);
      ctx.lineTo(512 + s * 132, 86);
      ctx.stroke();
    }
    // reflexo
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(512 + s * 50 - 24, 90, 18, 10, 4);
      ctx.fill();
    }
    smileArc(ctx, 152, 46, 12, Math.PI * 0.25, Math.PI * 0.75);
  },

  beard(ctx) {
    eyes(ctx, 50, 96, 13);
    const brown = '#4a3120';
    ctx.fillStyle = brown;
    ctx.beginPath();
    ctx.moveTo(512 - 108, 102);
    ctx.quadraticCurveTo(512 - 116, 196, 512 - 56, 226);
    ctx.quadraticCurveTo(512, 248, 512 + 56, 226);
    ctx.quadraticCurveTo(512 + 116, 196, 512 + 108, 102);
    ctx.quadraticCurveTo(512 + 80, 132, 512 + 44, 134);
    ctx.quadraticCurveTo(512, 122, 512 - 44, 134);
    ctx.quadraticCurveTo(512 - 80, 132, 512 - 108, 102);
    ctx.fill();
    // boca no meio da barba
    ctx.strokeStyle = '#2a1a0d';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(512, 152, 30, Math.PI * 0.2, Math.PI * 0.8);
    ctx.stroke();
  },

  mustache(ctx) {
    eyes(ctx);
    ctx.fillStyle = '#3a2a18';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(512, 148);
      ctx.quadraticCurveTo(512 + s * 30, 130, 512 + s * 66, 142);
      ctx.quadraticCurveTo(512 + s * 86, 150, 512 + s * 92, 134);
      ctx.quadraticCurveTo(512 + s * 90, 164, 512 + s * 56, 166);
      ctx.quadraticCurveTo(512 + s * 22, 166, 512, 158);
      ctx.fill();
    }
    smileArc(ctx, 178, 30, 9, Math.PI * 0.25, Math.PI * 0.75);
  },

  lips(ctx) {
    eyes(ctx, 50, 104, 13);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    // cílios
    for (const s of [-1, 1]) {
      for (let i = -1; i <= 1; i++) {
        const a = -Math.PI / 2 + i * 0.45;
        const x = 512 + s * 50 + Math.cos(a + (s > 0 ? 0.2 : -0.2)) * 17;
        const y = 104 + Math.sin(a) * 17;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12);
        ctx.stroke();
      }
    }
    // lábios
    ctx.fillStyle = '#C0153D';
    ctx.beginPath();
    ctx.moveTo(512 - 34, 158);
    ctx.quadraticCurveTo(512 - 14, 144, 512, 152);
    ctx.quadraticCurveTo(512 + 14, 144, 512 + 34, 158);
    ctx.quadraticCurveTo(512, 184, 512 - 34, 158);
    ctx.fill();
  },

  skull(ctx) {
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(512 + s * 52, 104, 27, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.beginPath();
    ctx.moveTo(512, 138);
    ctx.lineTo(512 - 13, 162);
    ctx.lineTo(512 + 13, 162);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(512 - 56, 196);
    ctx.lineTo(512 + 56, 196);
    ctx.stroke();
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(512 + i * 26, 184);
      ctx.lineTo(512 + i * 26, 208);
      ctx.stroke();
    }
  },

  robot(ctx) {
    ctx.fillStyle = INK;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.roundRect(512 + s * 50 - 17, 88, 34, 30, 5);
      ctx.fill();
    }
    ctx.fillStyle = '#FFD23F';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(512 + s * 50, 103, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    // grade da boca
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.roundRect(512 - 52, 152, 104, 22, 5);
    ctx.fill();
    ctx.fillStyle = '#888';
    for (let i = -1; i <= 1; i++) ctx.fillRect(512 + i * 28 - 4, 156, 8, 14);
    // rebites
    ctx.fillStyle = '#777';
    for (const [x, y] of [[-96, 70], [96, 70], [-96, 200], [96, 200]]) {
      ctx.beginPath();
      ctx.arc(512 + x, y, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

export function drawHeadTexture(decalId, colorHex) {
  const c = makeCanvas(1024, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 1024, 256);
  ctx.translate(0, 12); // centraliza o rosto na faixa visível sob franjas/chapéus
  (FACES[decalId] || FACES.smiley)(ctx);
  return c;
}

/* ============================== TORSOS ============================== */
// Canvas 512x512 mapeado na face frontal do torso (ombros no topo, cintura embaixo).

const TORSOS = {
  plain() {},

  suit(ctx, base) {
    const lapel = shade(base, 0.55);
    // camisa
    ctx.fillStyle = '#f2f2f2';
    ctx.beginPath();
    ctx.moveTo(176, 0);
    ctx.lineTo(336, 0);
    ctx.lineTo(296, 512);
    ctx.lineTo(216, 512);
    ctx.closePath();
    ctx.fill();
    // lapelas
    ctx.fillStyle = lapel;
    ctx.beginPath();
    ctx.moveTo(176, 0); ctx.lineTo(256, 96); ctx.lineTo(190, 270); ctx.lineTo(140, 512); ctx.lineTo(100, 512); ctx.lineTo(150, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(336, 0); ctx.lineTo(256, 96); ctx.lineTo(322, 270); ctx.lineTo(372, 512); ctx.lineTo(412, 512); ctx.lineTo(362, 0);
    ctx.closePath(); ctx.fill();
    // gravata
    ctx.fillStyle = '#8a1220';
    ctx.beginPath();
    ctx.moveTo(236, 18); ctx.lineTo(276, 18); ctx.lineTo(284, 64); ctx.lineTo(256, 84); ctx.lineTo(228, 64);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(240, 78); ctx.lineTo(272, 78); ctx.lineTo(292, 330); ctx.lineTo(256, 392); ctx.lineTo(220, 330);
    ctx.closePath(); ctx.fill();
    // botões
    ctx.fillStyle = '#222';
    for (const y of [330, 400]) { ctx.beginPath(); ctx.arc(196, y, 8, 0, Math.PI * 2); ctx.fill(); }
  },

  hawaii(ctx, base) {
    ctx.fillStyle = shade(base, 0.7);
    ctx.beginPath();
    ctx.moveTo(176, 0); ctx.lineTo(256, 110); ctx.lineTo(336, 0);
    ctx.closePath(); ctx.fill();
    const flower = (x, y, s, col) => {
      ctx.fillStyle = col;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.72, s * 0.46, a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#FFD23F';
      ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, Math.PI * 2); ctx.fill();
    };
    const spots = [[120, 170, 26], [350, 140, 30], [220, 300, 24], [420, 320, 26], [90, 400, 28], [300, 440, 30], [180, 470, 20]];
    spots.forEach(([x, y, s], i) => flower(x, y, s, i % 2 ? '#ffffff' : '#FF7B9C'));
    // folhas
    ctx.fillStyle = 'rgba(20,90,50,.85)';
    for (const [x, y, r] of [[260, 180, 20], [400, 420, 22], [60, 280, 18]]) {
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.4, 0.7, 0, Math.PI * 2); ctx.fill();
    }
  },

  zipper(ctx, base) {
    const dark = shade(base, 0.6);
    ctx.strokeStyle = dark;
    ctx.lineWidth = 10;
    // gola
    ctx.beginPath(); ctx.moveTo(160, 0); ctx.lineTo(220, 60); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(352, 0); ctx.lineTo(292, 60); ctx.stroke();
    // zíper
    ctx.strokeStyle = '#9aa0a8';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(256, 40); ctx.lineTo(256, 512); ctx.stroke();
    ctx.lineWidth = 3;
    for (let y = 50; y < 512; y += 18) {
      ctx.beginPath(); ctx.moveTo(248, y); ctx.lineTo(264, y); ctx.stroke();
    }
    // puxador
    ctx.fillStyle = '#c8ccd2';
    ctx.beginPath(); ctx.roundRect(248, 96, 16, 30, 4); ctx.fill();
    // bolsos
    ctx.strokeStyle = dark;
    ctx.lineWidth = 7;
    for (const x of [120, 392]) {
      ctx.beginPath(); ctx.moveTo(x - 44, 370); ctx.lineTo(x + 44, 350); ctx.stroke();
    }
  },

  police(ctx) {
    // base esperada: azul escuro
    ctx.strokeStyle = 'rgba(0,0,0,.4)';
    ctx.lineWidth = 6;
    // bolsos
    for (const x of [150, 362]) {
      ctx.strokeRect(x - 56, 120, 112, 86);
      ctx.beginPath(); ctx.moveTo(x - 56, 150); ctx.lineTo(x + 56, 150); ctx.stroke();
    }
    // botões
    ctx.fillStyle = '#d9b44a';
    for (let y = 80; y <= 440; y += 90) {
      ctx.beginPath(); ctx.arc(256, y, 9, 0, Math.PI * 2); ctx.fill();
    }
    // distintivo (estrela)
    ctx.fillStyle = '#f4cf47';
    const cx = 150, cy = 86, R = 30, r = 13;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const rad = i % 2 ? r : R;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rad, cy + Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
    // cinto
    ctx.fillStyle = '#11131a';
    ctx.fillRect(0, 470, 512, 42);
    ctx.fillStyle = '#d9b44a';
    ctx.fillRect(232, 476, 48, 30);
  },

  space(ctx) {
    // logo clássico: planeta com anel
    const cx = 256, cy = 200;
    ctx.fillStyle = '#f4cf47';
    ctx.beginPath(); ctx.arc(cx, cy, 64, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.ellipse(cx, cy, 102, 34, -0.42, 0, Math.PI * 2); ctx.stroke();
    // recorte do anel atrás do planeta (redesenha metade do planeta)
    ctx.fillStyle = '#f4cf47';
    ctx.beginPath(); ctx.arc(cx, cy, 56, -0.42 - Math.PI * 0.5, -0.42 + Math.PI * 0.5); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.ellipse(cx, cy, 102, 34, -0.42, Math.PI * 0.93, Math.PI * 2.04); ctx.stroke();
    // fecho inferior
    ctx.strokeStyle = 'rgba(0,0,0,.25)';
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(140, 420); ctx.lineTo(372, 420); ctx.stroke();
  },

  pirate(ctx) {
    // listras na camisa
    ctx.fillStyle = '#B52D30';
    for (let x = 0; x < 512; x += 80) ctx.fillRect(x, 0, 40, 512);
    // colete aberto
    ctx.fillStyle = '#23150c';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(150, 0); ctx.lineTo(120, 240); ctx.lineTo(150, 512); ctx.lineTo(0, 512);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(512, 0); ctx.lineTo(362, 0); ctx.lineTo(392, 240); ctx.lineTo(362, 512); ctx.lineTo(512, 512);
    ctx.closePath(); ctx.fill();
    // cinto + fivela
    ctx.fillStyle = '#3d2414';
    ctx.fillRect(0, 452, 512, 60);
    ctx.fillStyle = '#d9b44a';
    ctx.fillRect(226, 460, 60, 44);
    ctx.fillStyle = '#3d2414';
    ctx.fillRect(240, 472, 32, 20);
  },

  knight(ctx) {
    // malha (pontos)
    ctx.fillStyle = 'rgba(0,0,0,.25)';
    for (let y = 14; y < 100; y += 22) {
      for (let x = ((y / 22) % 2) * 14 + 20; x < 500; x += 28) {
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      }
    }
    // peitoral
    ctx.strokeStyle = 'rgba(0,0,0,.45)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(96, 110);
    ctx.quadraticCurveTo(256, 70, 416, 110);
    ctx.lineTo(396, 410);
    ctx.quadraticCurveTo(256, 470, 116, 410);
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(256, 96); ctx.lineTo(256, 444); ctx.stroke();
    // rebites
    ctx.fillStyle = 'rgba(0,0,0,.5)';
    for (const [x, y] of [[120, 130], [392, 130], [136, 390], [376, 390]]) {
      ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
    }
    // brilho
    ctx.fillStyle = 'rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.ellipse(190, 200, 46, 90, 0.3, 0, Math.PI * 2); ctx.fill();
  },

  overalls(ctx) {
    const denim = '#2A5CAA';
    const dark = shade(denim, 0.7);
    // peitoral
    ctx.fillStyle = denim;
    ctx.fillRect(150, 170, 212, 342);
    // alças
    ctx.fillStyle = denim;
    ctx.beginPath(); ctx.moveTo(118, 0); ctx.lineTo(170, 0); ctx.lineTo(196, 200); ctx.lineTo(150, 200); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(394, 0); ctx.lineTo(342, 0); ctx.lineTo(316, 200); ctx.lineTo(362, 200); ctx.closePath(); ctx.fill();
    // botões das alças
    ctx.fillStyle = '#d9b44a';
    ctx.beginPath(); ctx.arc(176, 190, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(336, 190, 11, 0, Math.PI * 2); ctx.fill();
    // bolso central
    ctx.strokeStyle = dark;
    ctx.lineWidth = 7;
    ctx.strokeRect(206, 250, 100, 86);
    ctx.beginPath(); ctx.moveTo(206, 250); ctx.lineTo(256, 290); ctx.lineTo(306, 250); ctx.stroke();
  },

  doctor(ctx) {
    // base esperada: branco
    ctx.strokeStyle = 'rgba(0,0,0,.3)';
    ctx.lineWidth = 7;
    // gola V
    ctx.beginPath(); ctx.moveTo(176, 0); ctx.lineTo(256, 120); ctx.lineTo(336, 0); ctx.stroke();
    // botões
    ctx.fillStyle = 'rgba(0,0,0,.45)';
    for (let y = 170; y <= 450; y += 70) {
      ctx.beginPath(); ctx.arc(300, y, 7, 0, Math.PI * 2); ctx.fill();
    }
    // bolso com caneta
    ctx.strokeRect(120, 320, 96, 96);
    ctx.fillStyle = '#2A5CAA';
    ctx.fillRect(150, 296, 12, 44);
    // estetoscópio
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.moveTo(216, 0);
    ctx.quadraticCurveTo(190, 150, 170, 220);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(296, 0);
    ctx.quadraticCurveTo(300, 90, 240, 180);
    ctx.stroke();
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(166, 240, 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#9aa0a8';
    ctx.beginPath(); ctx.arc(166, 240, 12, 0, Math.PI * 2); ctx.fill();
  },

  fire(ctx) {
    // faixas refletivas
    for (const y of [150, 340]) {
      ctx.fillStyle = '#F2CD37';
      ctx.fillRect(0, y, 512, 56);
      ctx.fillStyle = '#d8d8d8';
      ctx.fillRect(0, y + 20, 512, 16);
    }
    // fechos
    ctx.fillStyle = '#16181d';
    for (const y of [80, 260, 450]) {
      ctx.beginPath(); ctx.roundRect(236, y - 20, 40, 40, 6); ctx.fill();
    }
    ctx.fillStyle = '#9aa0a8';
    for (const y of [80, 260, 450]) ctx.fillRect(250, y - 14, 12, 28);
  },

  plaid(ctx, base) {
    const dark = 'rgba(0,0,0,.32)';
    const light = 'rgba(255,255,255,.18)';
    ctx.fillStyle = dark;
    for (let x = 26; x < 512; x += 110) ctx.fillRect(x, 0, 46, 512);
    for (let y = 26; y < 512; y += 110) ctx.fillRect(0, y, 512, 46);
    ctx.fillStyle = light;
    for (let x = 92; x < 512; x += 110) ctx.fillRect(x, 0, 10, 512);
    for (let y = 92; y < 512; y += 110) ctx.fillRect(0, y, 512, 10);
    // botões
    ctx.fillStyle = '#1a1a1a';
    for (let y = 60; y <= 460; y += 80) {
      ctx.beginPath(); ctx.arc(256, y, 8, 0, Math.PI * 2); ctx.fill();
    }
  },
};

export function drawTorsoTexture(decalId, colorHex) {
  const c = makeCanvas(512, 512);
  const ctx = c.getContext('2d');
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 512);
  (TORSOS[decalId] || TORSOS.plain)(ctx, colorHex);
  return c;
}

/* ============================== PERNAS ============================== */
// belt: canvas para a frente do quadril; pockets: canvas para a frente de cada perna.

export function drawHipTexture(decalId, colorHex) {
  if (decalId !== 'belt') return null;
  const c = makeCanvas(512, 160);
  const ctx = c.getContext('2d');
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = '#4a2f17';
  ctx.fillRect(0, 36, 512, 88);
  ctx.fillStyle = '#d9b44a';
  ctx.beginPath(); ctx.roundRect(196, 28, 120, 104, 14); ctx.fill();
  ctx.fillStyle = '#4a2f17';
  ctx.beginPath(); ctx.roundRect(224, 52, 64, 56, 8); ctx.fill();
  return c;
}

export function drawLegTexture(decalId, colorHex) {
  if (decalId !== 'pockets') return null;
  const c = makeCanvas(256, 256);
  const ctx = c.getContext('2d');
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(0,0,0,.4)';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.roundRect(48, 40, 160, 110, 12); ctx.stroke();
  ctx.setLineDash([12, 9]);
  ctx.beginPath(); ctx.roundRect(62, 54, 132, 82, 8); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(48, 86); ctx.lineTo(208, 86); ctx.stroke();
  return c;
}
