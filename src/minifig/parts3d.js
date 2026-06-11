// Construtores procedurais de peças acopláveis: cabelos/chapéus, acessórios
// de mão, itens de corpo e extras. Tudo com primitivas do Three.js.
//
// Convenções de origem:
//  - chapéus/cabelos: y=0 no topo da cabeça (cabeça abaixo, raio 0.50)
//  - acessórios de mão: origem no centro do clipe em C; -Y aponta para fora
//    da mão (direção "da lâmina"), +Z é a frente da minifig em pose neutra
//  - itens de corpo: origem no topo do torso, costas em -Z
//  - bases/pets: origem no chão

import * as THREE from 'three';
import { makeMaterial, tube, box, ball } from './figure.js';

const V2 = (x, y) => new THREE.Vector2(x, y);

function lathe(points, mat, seg = 32) {
  return new THREE.Mesh(new THREE.LatheGeometry(points.map((p) => V2(p[0], p[1])), seg), mat);
}

function grey(hexish) {
  return makeMaterial({ hex: hexish });
}

/* ========================= CABELOS E CHAPÉUS ========================= */

const HEADGEAR = {
  hairClassic(mat) {
    const g = new THREE.Group();
    // casca arredondada; inclinada para trás para liberar a testa
    const capMesh = lathe(
      [[0, 0.15], [0.22, 0.14], [0.40, 0.08], [0.50, -0.01], [0.55, -0.12], [0.55, -0.20], [0.51, -0.27], [0.46, -0.29]],
      mat
    );
    capMesh.material.side = THREE.DoubleSide;
    capMesh.rotation.x = 0.18; // franja sobe, nuca desce
    capMesh.scale.z = 1.05;
    capMesh.position.z = -0.02;
    g.add(capMesh);
    return g;
  },

  hairMessy(mat) {
    const g = new THREE.Group();
    g.add(lathe([[0, 0.14], [0.3, 0.12], [0.5, 0.02], [0.57, -0.14], [0.55, -0.3], [0.5, -0.34]], mat));
    const tufts = [
      [0.3, 0.1, 0.25, 0.16], [-0.35, 0.08, 0.15, 0.15], [0.05, 0.2, -0.1, 0.17],
      [-0.2, 0.05, -0.4, 0.15], [0.42, -0.05, -0.3, 0.14], [-0.45, -0.1, 0.28, 0.13],
      [0.1, 0.05, 0.5, 0.13], [-0.05, 0.16, 0.3, 0.14],
    ];
    for (const [x, y, z, r] of tufts) g.add(ball(r, mat, x, y, z, 10));
    return g;
  },

  hairPonytail(mat) {
    const g = new THREE.Group();
    g.add(lathe([[0, 0.14], [0.3, 0.12], [0.5, 0.02], [0.57, -0.14], [0.55, -0.3], [0.5, -0.36]], mat));
    g.add(box(0.56, 0.1, 0.1, mat, 0, -0.08, 0.50));
    g.add(ball(0.13, mat, 0, 0.0, -0.52));
    g.add(tube([0, -0.02, -0.56], [0, -0.62, -0.72], 0.11, mat, 0.05));
    g.add(ball(0.06, mat, 0, -0.64, -0.73));
    return g;
  },

  hairLong(mat) {
    const g = new THREE.Group();
    g.add(lathe([[0, 0.14], [0.3, 0.12], [0.5, 0.02], [0.58, -0.12], [0.58, -0.3], [0.55, -0.36]], mat));
    // cortina traseira/lateral (meio-cilindro aberto)
    const shell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.58, 0.52, 0.85, 28, 1, true, Math.PI * 0.55, Math.PI * 1.9),
      mat
    );
    shell.material.side = THREE.DoubleSide;
    shell.position.y = -0.62;
    g.add(shell);
    g.add(box(0.56, 0.12, 0.1, mat, 0, -0.1, 0.50));
    return g;
  },

  cap(mat) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.54, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    dome.scale.y = 0.72;
    dome.position.y = -0.18;
    g.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24, 1, false, -Math.PI / 2, Math.PI), mat);
    brim.position.set(0, -0.18, 0.3);
    brim.scale.z = 1.15;
    g.add(brim);
    g.add(ball(0.07, mat, 0, 0.21, 0));
    return g;
  },

  policeCap(mat) {
    const g = new THREE.Group();
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.52, 0.22, 28), mat);
    band.position.y = -0.16;
    g.add(band);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.5, 0.14, 28), mat);
    top.scale.z = 1.12;
    top.position.y = 0.0;
    g.add(top);
    const brimMat = grey('#15151a');
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.05, 24, 1, false, -Math.PI / 2, Math.PI), brimMat);
    brim.position.set(0, -0.26, 0.22);
    brim.scale.z = 1.25;
    g.add(brim);
    const badge = box(0.14, 0.16, 0.03, grey('#d9b44a'), 0, -0.1, 0.55);
    g.add(badge);
    return g;
  },

  spaceHelmet(mat) {
    const g = new THREE.Group();
    // casco com abertura frontal (vão de 0.64π centrado em -X; +π/2 leva para +Z)
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.64, 32, 20, Math.PI * 0.32, Math.PI * 1.36), mat);
    shell.material.side = THREE.DoubleSide;
    shell.position.y = -0.42;
    shell.rotation.y = Math.PI / 2;
    g.add(shell);
    // queixeira
    const chin = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.07, 10, 24, Math.PI * 0.9), mat);
    chin.rotation.x = Math.PI / 2;
    chin.rotation.z = Math.PI * 0.55;
    chin.position.y = -0.78;
    g.add(chin);
    return g;
  },

  constructionHelmet(mat) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.52, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    dome.scale.y = 0.8;
    dome.position.y = -0.16;
    g.add(dome);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.05, 28), mat);
    brim.scale.z = 1.18;
    brim.position.y = -0.16;
    g.add(brim);
    const ridge = box(0.16, 0.07, 0.7, mat, 0, 0.22, 0);
    g.add(ridge);
    return g;
  },

  knightHelm(mat) {
    const g = new THREE.Group();
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.58, 0.92, 28, 1, true), mat);
    shell.material.side = THREE.DoubleSide;
    shell.position.y = -0.42;
    g.add(shell);
    const top = new THREE.Mesh(new THREE.SphereGeometry(0.56, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    top.scale.y = 0.5;
    top.position.y = 0.04;
    g.add(top);
    // viseira com fenda (duas placas curvas)
    const dark = grey('#3a3d42');
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.22, 20, 1, true, -Math.PI * 0.36, Math.PI * 0.72), dark);
    upper.material.side = THREE.DoubleSide;
    upper.position.y = -0.3;
    g.add(upper);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.34, 20, 1, true, -Math.PI * 0.36, Math.PI * 0.72), dark);
    lower.material.side = THREE.DoubleSide;
    lower.position.y = -0.62;
    g.add(lower);
    // rebites laterais
    g.add(ball(0.07, dark, 0.58, -0.34, 0), ball(0.07, dark, -0.58, -0.34, 0));
    return g;
  },

  pirateHat(mat) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    dome.scale.y = 0.62;
    dome.position.y = -0.1;
    g.add(dome);
    // abas levantadas (bicorne): torus achatado e inclinado
    const brim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.1, 12, 36), mat);
    brim.rotation.x = Math.PI / 2;
    brim.scale.set(1.45, 0.8, 1);
    brim.position.y = -0.12;
    g.add(brim);
    const tipL = ball(0.1, mat, -0.86, 0.1, 0);
    const tipR = ball(0.1, mat, 0.86, 0.1, 0);
    g.add(tipL, tipR);
    // detalhe branco
    const trim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.035, 8, 36), grey('#e8e8e8'));
    trim.rotation.x = Math.PI / 2;
    trim.scale.set(1.45, 0.8, 1);
    trim.position.y = -0.05;
    g.add(trim);
    return g;
  },

  bandana(mat) {
    const g = new THREE.Group();
    const wrap = new THREE.Mesh(new THREE.SphereGeometry(0.54, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.46), mat);
    wrap.position.y = -0.06;
    g.add(wrap);
    g.add(ball(0.1, mat, 0, -0.2, -0.52));
    // pontas do nó
    g.add(tube([0, -0.24, -0.56], [0.16, -0.52, -0.66], 0.05, mat, 0.02));
    g.add(tube([0, -0.24, -0.56], [-0.12, -0.5, -0.7], 0.05, mat, 0.02));
    return g;
  },

  cowboyHat(mat) {
    const g = new THREE.Group();
    // aba curvada para cima nas laterais
    const brimPts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      brimPts.push([0.3 + t * 0.62, Math.pow(t, 2.4) * 0.22 - 0.02]);
    }
    const brim = lathe(brimPts, mat, 32);
    brim.material.side = THREE.DoubleSide;
    brim.position.y = -0.14;
    brim.scale.z = 0.82;
    g.add(brim);
    const crown = lathe([[0, 0.34], [0.18, 0.33], [0.3, 0.22], [0.34, 0.0], [0.36, -0.16]], mat);
    crown.position.y = -0.12;
    g.add(crown);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.37, 0.09, 24), grey('#3a2414'));
    band.position.y = -0.2;
    g.add(band);
    return g;
  },

  wizardHat(mat) {
    const g = new THREE.Group();
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.05, 26), mat);
    cone.position.y = 0.4;
    cone.rotation.z = 0.08;
    g.add(cone);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.74, 0.05, 28), mat);
    brim.position.y = -0.1;
    g.add(brim);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.12, 26), grey('#d9b44a'));
    band.position.y = -0.02;
    g.add(band);
    return g;
  },

  crown(mat) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.44, 0.22, 24, 1, true), mat);
    ring.material.side = THREE.DoubleSide;
    ring.position.y = 0.05;
    g.add(ring);
    const base = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.045, 10, 26), mat);
    base.rotation.x = Math.PI / 2;
    base.position.y = -0.05;
    g.add(base);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.22, 8), mat);
      spike.position.set(Math.cos(a) * 0.42, 0.26, Math.sin(a) * 0.42);
      g.add(spike);
      g.add(ball(0.035, mat, Math.cos(a) * 0.42, 0.38, Math.sin(a) * 0.42, 8));
    }
    return g;
  },

  fireHelmet(mat) {
    const g = new THREE.Group();
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.54, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat);
    dome.scale.y = 0.78;
    dome.position.y = -0.14;
    g.add(dome);
    // aba longa atrás
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 0.05, 28), mat);
    brim.scale.z = 1.3;
    brim.position.set(0, -0.16, -0.12);
    g.add(brim);
    const ridge = box(0.12, 0.08, 0.66, mat, 0, 0.22, -0.02);
    g.add(ridge);
    const shield = box(0.2, 0.2, 0.04, grey('#d9b44a'), 0, -0.04, 0.52);
    g.add(shield);
    return g;
  },

  topHat(mat) {
    const g = new THREE.Group();
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.62, 26), mat);
    crown.position.y = 0.21;
    g.add(crown);
    const top = new THREE.Mesh(new THREE.CircleGeometry(0.4, 26), mat);
    top.rotation.x = -Math.PI / 2;
    top.position.y = 0.52;
    g.add(top);
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.05, 28), mat);
    brim.position.y = -0.1;
    g.add(brim);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.425, 0.435, 0.12, 26), grey('#7a1220'));
    band.position.y = -0.02;
    g.add(band);
    return g;
  },
};

/* ========================= ACESSÓRIOS DE MÃO ========================= */

const ACCESSORIES = {
  sword(mat) {
    const g = new THREE.Group();
    const metal = grey('#c8ccd2');
    g.add(tube([0, 0.16, 0], [0, -0.14, 0], 0.055, mat)); // punho
    g.add(ball(0.07, mat, 0, 0.18, 0)); // pomo
    g.add(box(0.3, 0.05, 0.09, metal, 0, -0.16, 0)); // guarda
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.62, 0.028), metal);
    blade.position.y = -0.48;
    g.add(blade);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.066, 0.16, 4), metal);
    tip.rotation.x = Math.PI;
    tip.rotation.y = Math.PI / 4;
    tip.scale.z = 0.36;
    tip.position.y = -0.86;
    g.add(tip);
    return g;
  },

  energyBlade(mat, colorEntry) {
    const g = new THREE.Group();
    const hilt = grey('#2c2f35');
    g.add(tube([0, 0.18, 0], [0, -0.12, 0], 0.055, hilt));
    g.add(tube([0, -0.12, 0], [0, -0.16, 0], 0.075, grey('#c8ccd2')));
    const glowColor = colorEntry.trans ? '#9BE7FF' : colorEntry.hex;
    const blade = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.05, 0.78, 6, 12),
      new THREE.MeshStandardMaterial({
        color: glowColor,
        emissive: glowColor,
        emissiveIntensity: 1.6,
        transparent: true,
        opacity: 0.92,
        roughness: 0.2,
      })
    );
    blade.position.y = -0.58;
    g.add(blade);
    return g;
  },

  axe(mat) {
    const g = new THREE.Group();
    g.add(tube([0, 0.22, 0], [0, -0.62, 0], 0.05, mat));
    const headMat = grey('#aab0b8');
    const head = box(0.3, 0.26, 0.07, headMat, 0.2, -0.44, 0);
    g.add(head);
    const edge = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.07, 14, 1, false, 0, Math.PI), headMat);
    edge.rotation.x = Math.PI / 2;
    edge.rotation.z = -Math.PI / 2;
    edge.scale.y = 0.5;
    edge.position.set(0.36, -0.44, 0);
    g.add(edge);
    return g;
  },

  wand(mat) {
    const g = new THREE.Group();
    g.add(tube([0, 0.14, 0], [0, -0.42, 0], 0.035, mat, 0.025));
    g.add(tube([0, -0.42, 0], [0, -0.54, 0], 0.025, grey('#f0f0f0'), 0.015));
    return g;
  },

  spear(mat) {
    const g = new THREE.Group();
    g.add(tube([0, 0.7, 0], [0, -1.0, 0], 0.045, mat));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.24, 12), grey('#aab0b8'));
    tip.rotation.x = Math.PI;
    tip.position.y = -1.1;
    g.add(tip);
    return g;
  },

  mug(mat) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.13, 0.26, 18, 1, true), mat);
    body.material.side = THREE.DoubleSide;
    body.position.set(0, -0.02, 0.21);
    g.add(body);
    const bottom = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), mat);
    bottom.rotation.x = Math.PI / 2;
    bottom.position.set(0, -0.15, 0.21);
    g.add(bottom);
    g.add(box(0.05, 0.2, 0.06, mat, 0, -0.02, 0.045)); // alça que encaixa na mão
    return g;
  },

  goblet(mat) {
    const g = new THREE.Group();
    const cup = lathe([[0.06, 0], [0.1, 0.02], [0.04, 0.08], [0.035, 0.2], [0.13, 0.3], [0.15, 0.42], [0.14, 0.44]], mat);
    cup.material.side = THREE.DoubleSide;
    cup.position.y = -0.3;
    g.add(cup);
    return g;
  },

  wrench(mat) {
    const g = new THREE.Group();
    g.add(box(0.09, 0.5, 0.05, mat, 0, -0.18, 0));
    const head = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.05, 8, 18, Math.PI * 1.4), mat);
    head.rotation.z = Math.PI * 0.8;
    head.position.y = -0.5;
    g.add(head);
    const head2 = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.045, 8, 18, Math.PI * 1.4), mat);
    head2.rotation.z = -Math.PI * 0.2;
    head2.position.y = 0.12;
    g.add(head2);
    return g;
  },

  shovel(mat) {
    const g = new THREE.Group();
    g.add(tube([0, 0.34, 0], [0, -0.72, 0], 0.045, grey('#6b4a2a')));
    g.add(box(0.22, 0.05, 0.06, grey('#6b4a2a'), 0, 0.36, 0));
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.34, 0.05), mat);
    blade.position.y = -0.88;
    g.add(blade);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 12, 1, false, 0, Math.PI), mat);
    tip.rotation.x = Math.PI / 2;
    tip.rotation.z = Math.PI;
    tip.position.y = -1.05;
    g.add(tip);
    return g;
  },

  pickaxe(mat) {
    const g = new THREE.Group();
    g.add(tube([0, 0.26, 0], [0, -0.6, 0], 0.05, grey('#6b4a2a')));
    const head = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.05, 8, 24, Math.PI * 0.85), mat);
    head.rotation.z = Math.PI * 0.575;
    head.scale.y = 0.6;
    head.position.y = -0.5;
    g.add(head);
    return g;
  },

  musket(mat) {
    const g = new THREE.Group();
    const wood = mat;
    const metal = grey('#5a5e66');
    g.add(tube([0, 0.18, 0], [0, -0.95, 0], 0.04, metal, 0.035)); // cano
    const stock = box(0.07, 0.42, 0.1, wood, 0, 0.32, 0.03);
    stock.rotation.x = 0.25;
    g.add(stock);
    g.add(box(0.06, 0.3, 0.07, wood, 0, -0.1, 0.045));
    g.add(ball(0.045, metal, 0, 0.05, 0.08));
    return g;
  },

  blaster(mat) {
    const g = new THREE.Group();
    g.add(box(0.07, 0.26, 0.1, mat, 0, -0.02, 0.02)); // empunhadura
    g.add(box(0.09, 0.12, 0.4, mat, 0, 0.14, 0.12)); // corpo
    g.add(tube([0, 0.14, 0.32], [0, 0.14, 0.5], 0.035, mat)); // cano
    g.add(tube([0, 0.14, 0.5], [0, 0.14, 0.54], 0.055, mat));
    g.add(ball(0.05, mat, 0, 0.24, 0.0));
    return g;
  },

  flashlight(mat) {
    const g = new THREE.Group();
    g.add(tube([0, 0.12, 0], [0, -0.26, 0], 0.07, mat));
    g.add(tube([0, -0.26, 0], [0, -0.4, 0], 0.07, mat, 0.105));
    const lensOn = new THREE.Mesh(
      new THREE.CircleGeometry(0.095, 16),
      new THREE.MeshStandardMaterial({ color: '#fff8d0', emissive: '#fff3b0', emissiveIntensity: 1.2 })
    );
    lensOn.rotation.x = Math.PI / 2;
    lensOn.position.y = -0.405;
    g.add(lensOn);
    return g;
  },

  briefcase(mat) {
    const g = new THREE.Group();
    const caseBox = box(0.66, 0.46, 0.16, mat, 0, -0.42, 0);
    g.add(caseBox);
    const clasp = grey('#d9b44a');
    g.add(box(0.08, 0.05, 0.04, clasp, -0.18, -0.22, 0.08));
    g.add(box(0.08, 0.05, 0.04, clasp, 0.18, -0.22, 0.08));
    // alça até o grip
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.035, 8, 16, Math.PI), mat);
    handle.position.y = -0.16;
    g.add(handle);
    return g;
  },

  guitar(mat) {
    const g = new THREE.Group();
    const bodyMat = mat;
    const b1 = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.09, 22), bodyMat);
    b1.rotation.x = Math.PI / 2;
    b1.position.set(0, -0.52, 0.06);
    const b2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.09, 22), bodyMat);
    b2.rotation.x = Math.PI / 2;
    b2.position.set(0, -0.24, 0.06);
    g.add(b1, b2);
    const neckMat = grey('#5a3a20');
    g.add(box(0.08, 0.62, 0.04, neckMat, 0, 0.18, 0.06));
    g.add(box(0.12, 0.16, 0.05, grey('#222'), 0, 0.54, 0.06));
    // cordas
    const stringMat = grey('#dddddd');
    for (const x of [-0.02, 0.02]) g.add(box(0.008, 0.86, 0.052, stringMat, x, 0.0, 0.062));
    return g;
  },

  microphone(mat) {
    const g = new THREE.Group();
    g.add(tube([0, 0.12, 0], [0, -0.3, 0], 0.06, mat, 0.045));
    g.add(ball(0.11, grey('#3a3d42'), 0, -0.4, 0));
    return g;
  },

  camera(mat) {
    const g = new THREE.Group();
    g.add(box(0.4, 0.24, 0.18, mat, 0, -0.06, 0.06));
    const lens = tube([0, -0.06, 0.15], [0, -0.06, 0.28], 0.08, grey('#3a3d42'));
    g.add(lens);
    g.add(box(0.08, 0.04, 0.06, grey('#c8ccd2'), -0.12, 0.08, 0.06));
    return g;
  },

  binoculars(mat) {
    const g = new THREE.Group();
    for (const x of [-0.1, 0.1]) {
      g.add(tube([x, -0.08, -0.1], [x, -0.08, 0.24], 0.08, mat));
      g.add(tube([x, -0.08, 0.24], [x, -0.08, 0.3], 0.095, mat));
    }
    g.add(box(0.12, 0.05, 0.2, mat, 0, -0.08, 0.06));
    return g;
  },

  bone(mat) {
    const g = new THREE.Group();
    const r = 0.07;
    g.add(tube([-0.2, -0.16, 0], [0.2, -0.16, 0], 0.05, mat));
    for (const s of [-1, 1]) {
      g.add(ball(r, mat, s * 0.22, -0.1, 0, 12));
      g.add(ball(r, mat, s * 0.22, -0.22, 0, 12));
    }
    g.rotation.z = Math.PI / 2; // atravessado na mão
    return g;
  },

  fish(mat) {
    const g = new THREE.Group();
    const body = ball(0.16, mat, 0, -0.16, 0.06, 14);
    body.scale.set(0.5, 0.8, 1.6);
    g.add(body);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), mat);
    tail.rotation.x = -Math.PI / 2;
    tail.scale.x = 0.4;
    tail.position.set(0, -0.16, -0.26);
    g.add(tail);
    g.add(ball(0.025, grey('#111'), 0.045, -0.12, 0.27, 8));
    return g;
  },

  scroll(mat) {
    const g = new THREE.Group();
    const paper = grey('#e8dcc0');
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 14), paper);
    roll.rotation.z = Math.PI / 2;
    roll.position.y = -0.16;
    g.add(roll);
    for (const s of [-1, 1]) {
      const end = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), mat);
      end.rotation.z = Math.PI / 2;
      end.position.set(s * 0.3, -0.16, 0);
      g.add(end);
    }
    return g;
  },

  roundShield(mat) {
    const g = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 28), mat);
    disc.rotation.x = Math.PI / 2;
    disc.position.set(0, -0.1, 0.14);
    g.add(disc);
    const boss = ball(0.1, grey('#c8ccd2'), 0, -0.1, 0.19);
    boss.scale.z = 0.6;
    g.add(boss);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 8, 28), grey('#c8ccd2'));
    rim.position.set(0, -0.1, 0.15);
    g.add(rim);
    return g;
  },

  kiteShield(mat) {
    const g = new THREE.Group();
    const shape = new THREE.Shape();
    shape.moveTo(-0.32, 0.3);
    shape.quadraticCurveTo(0, 0.42, 0.32, 0.3);
    shape.quadraticCurveTo(0.34, -0.1, 0, -0.5);
    shape.quadraticCurveTo(-0.34, -0.1, -0.32, 0.3);
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -0.12, 0.12);
    g.add(mesh);
    return g;
  },
};

/* ========================= ITENS DE CORPO ========================= */

const BODY_ITEMS = {
  cape(mat) {
    const g = new THREE.Group();
    const geo = new THREE.PlaneGeometry(1.5, 2.05, 10, 12);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const t = (1.025 - y) / 2.05; // 0 no topo, 1 embaixo
      pos.setZ(i, -Math.pow(Math.abs(x) / 0.75, 1.7) * 0.34 * (0.4 + t * 0.6) - t * 0.06);
      pos.setX(i, x * (0.62 + 0.38 * t));
    }
    geo.computeVertexNormals();
    mat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(0, -1.0, -0.36);
    g.add(mesh);
    return g;
  },

  backpack(mat) {
    const g = new THREE.Group();
    const dark = grey('#3a3026');
    g.add(box(0.78, 0.92, 0.34, mat, 0, -0.62, -0.52));
    const flap = box(0.78, 0.3, 0.36, mat, 0, -0.3, -0.52);
    g.add(flap);
    g.add(box(0.2, 0.34, 0.03, dark, 0, -0.46, -0.33));
    // alças sobre os ombros
    for (const s of [-1, 1]) {
      const strap = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.035, 8, 16, Math.PI), dark);
      strap.rotation.y = Math.PI / 2;
      strap.position.set(s * 0.3, -0.2, -0.14);
      g.add(strap);
    }
    return g;
  },

  airTanks(mat) {
    const g = new THREE.Group();
    for (const s of [-1, 1]) {
      const tank = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.6, 6, 14), mat);
      tank.position.set(s * 0.17, -0.62, -0.48);
      g.add(tank);
      g.add(tube([s * 0.17, -0.28, -0.48], [s * 0.17, -0.2, -0.48], 0.05, grey('#5a5e66')));
    }
    g.add(box(0.5, 0.5, 0.06, mat, 0, -0.6, -0.34));
    return g;
  },

  quiver(mat) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.11, 0.78, 14), mat);
    body.rotation.z = 0.45;
    body.rotation.x = 0.1;
    body.position.set(0.2, -0.7, -0.46);
    g.add(body);
    const shaftMat = grey('#caa46a');
    const featherMat = grey('#e8e8e8');
    for (const [dx, dz] of [[0, 0], [0.07, 0.04], [-0.05, -0.03]]) {
      const x0 = 0.2 - Math.sin(0.45) * 0.45 + dx;
      const y0 = -0.7 + Math.cos(0.45) * 0.45;
      g.add(tube([x0 + dx, y0, -0.46 + dz], [x0 + dx - 0.12, y0 + 0.28, -0.46 + dz], 0.018, shaftMat));
      const feather = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.12, 6), featherMat);
      feather.position.set(x0 + dx - 0.12, y0 + 0.3, -0.46 + dz);
      feather.rotation.z = 0.4;
      g.add(feather);
    }
    // tira transversal
    const strap = box(0.06, 1.3, 0.03, grey('#3a2414'), 0, -0.7, -0.3);
    strap.rotation.z = 0.6;
    g.add(strap);
    return g;
  },
};

/* ========================= EXTRAS ========================= */

function stud(mat, x, z, y = 0) {
  const s = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.09, 14), mat);
  s.position.set(x, y + 0.045, z);
  return s;
}

const EXTRAS = {
  // Bases: placa de y=0 a 0.18; a minifig é erguida em main/figure via userData.lift.
  baseRound(mat) {
    const g = new THREE.Group();
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.35, 1.42, 0.18, 40), mat);
    plate.position.y = 0.09;
    g.add(plate);
    for (let ring = 0; ring < 2; ring++) {
      const r = 0.55 + ring * 0.55;
      const n = ring === 0 ? 6 : 12;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.26;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        if (Math.abs(x) < 0.85 && z > -0.55 && z < 0.7) continue; // espaço para os pés
        g.add(stud(mat, x, z, 0.18));
      }
    }
    g.userData.lift = 0.18;
    return g;
  },

  baseSquare(mat) {
    const g = new THREE.Group();
    g.add(box(2.6, 0.18, 2.6, mat, 0, 0.09, 0));
    for (let ix = 0; ix < 4; ix++) {
      for (let iz = 0; iz < 4; iz++) {
        const x = -0.975 + ix * 0.65;
        const z = -0.975 + iz * 0.65;
        if (Math.abs(x) < 0.8 && z > -0.5 && z < 0.75) continue;
        g.add(stud(mat, x, z, 0.18));
      }
    }
    g.userData.lift = 0.18;
    return g;
  },

  dog(mat) {
    const g = new THREE.Group();
    const body = box(0.34, 0.34, 0.78, mat, 0, 0.5, 0);
    g.add(body);
    const head = box(0.32, 0.32, 0.34, mat, 0, 0.78, 0.46);
    g.add(head);
    const snout = box(0.18, 0.14, 0.18, mat, 0, 0.7, 0.68);
    g.add(snout);
    g.add(ball(0.035, grey('#111'), 0, 0.74, 0.78, 8));
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.16, 4), mat);
      ear.position.set(s * 0.1, 0.99, 0.42);
      g.add(ear);
      g.add(ball(0.03, grey('#111'), s * 0.08, 0.84, 0.63, 8));
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.1, 0.34, 0.1, mat, sx * 0.11, 0.17, sz * 0.28));
    const tail = tube([0, 0.6, -0.38], [0, 0.84, -0.56], 0.04, mat, 0.025);
    g.add(tail);
    g.position.set(1.5, 0, 0.1);
    g.rotation.y = -0.4;
    return g;
  },

  cat(mat) {
    const g = new THREE.Group();
    const body = box(0.26, 0.28, 0.58, mat, 0, 0.34, 0);
    g.add(body);
    const head = box(0.26, 0.24, 0.22, mat, 0, 0.6, 0.32);
    g.add(head);
    for (const s of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 4), mat);
      ear.position.set(s * 0.08, 0.76, 0.3);
      g.add(ear);
      g.add(ball(0.025, grey('#2d7a2d'), s * 0.06, 0.63, 0.44, 8));
    }
    g.add(ball(0.02, grey('#d77'), 0, 0.56, 0.44, 8));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(box(0.08, 0.2, 0.08, mat, sx * 0.08, 0.1, sz * 0.2));
    const tail = tube([0, 0.4, -0.28], [0, 0.78, -0.4], 0.035, mat, 0.02);
    g.add(tail);
    g.position.set(-1.3, 0, 0.2);
    g.rotation.y = 0.5;
    return g;
  },

  parrot(mat) {
    const g = new THREE.Group();
    const body = ball(0.13, mat, 0, 0.12, 0, 14);
    body.scale.set(0.85, 1.3, 0.95);
    g.add(body);
    g.add(ball(0.09, mat, 0, 0.32, 0.05, 12));
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 8), grey('#F2CD37'));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.31, 0.15);
    g.add(beak);
    g.add(ball(0.018, grey('#111'), 0.05, 0.35, 0.1, 8));
    g.add(ball(0.018, grey('#111'), -0.05, 0.35, 0.1, 8));
    const tail = box(0.07, 0.3, 0.03, grey('#2d7a2d'), 0, -0.1, -0.1);
    tail.rotation.x = 0.5;
    g.add(tail);
    const wing = box(0.03, 0.18, 0.12, grey('#2A5CAA'), 0.11, 0.12, 0);
    const wing2 = wing.clone();
    wing2.position.x = -0.11;
    g.add(wing, wing2);
    return g;
  },
};

/* ========================= registro ========================= */

const REGISTRY = { ...HEADGEAR, ...ACCESSORIES, ...BODY_ITEMS, ...EXTRAS };

export function buildAttachment(geoName, colorEntry, db) {
  const builder = REGISTRY[geoName];
  if (!builder) return null;
  const mat = makeMaterial(colorEntry);
  const obj = builder(mat, colorEntry, db);
  obj.traverse((o) => {
    if (o.isMesh) o.castShadow = true;
  });
  return obj;
}
