// Geometria procedural da minifig: corpo, articulações e montagem.
// Eixo Y para cima; a minifig olha para +Z.

import * as THREE from 'three';
import { drawHeadTexture, drawTorsoTexture, drawHipTexture, drawLegTexture } from './decals.js';
import { buildAttachment } from './parts3d.js';

export const D = {
  legW: 0.62, legH: 1.02, legD: 0.66, footH: 0.38, footD: 0.92, legGapX: 0.345,
  hipH: 0.32, hipW: 1.32, hipD: 0.62,
  torsoH: 1.42, torsoWB: 1.54, torsoWT: 1.10, torsoD: 0.64,
  neckH: 0.10, neckR: 0.30,
  headR: 0.50, headH: 0.84, studR: 0.29, studH: 0.16,
  armR: 0.165, shoulderX: 0.64, shoulderDrop: 0.26,
};

/* ============================ materiais ============================ */

export function makeMaterial(colorEntry) {
  const params = {
    color: new THREE.Color(colorEntry.hex),
    roughness: 0.32,
    metalness: 0.0,
    clearcoat: 0.55,
    clearcoatRoughness: 0.35,
  };
  if (colorEntry.metal) {
    params.metalness = 0.85;
    params.roughness = 0.32;
    params.clearcoat = 0.2;
  }
  if (colorEntry.trans) {
    params.transparent = true;
    params.opacity = 0.5;
    params.roughness = 0.08;
    params.clearcoat = 1.0;
    params.clearcoatRoughness = 0.05;
  }
  return new THREE.MeshPhysicalMaterial(params);
}

function canvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function decalMaterial(canvas, colorEntry) {
  const m = makeMaterial({ ...colorEntry, hex: '#ffffff' });
  m.map = canvasTexture(canvas);
  return m;
}

// Cilindro/cone entre dois pontos — base de toda a construção orgânica.
export function tube(p1, p2, r1, mat, r2 = r1, seg = 18) {
  const a = new THREE.Vector3(...p1);
  const b = new THREE.Vector3(...p2);
  const dir = new THREE.Vector3().subVectors(b, a);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(r2, r1, len, seg);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(a).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return mesh;
}

export function box(w, h, d, mat, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

export function ball(r, mat, x = 0, y = 0, z = 0, seg = 18) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  mesh.position.set(x, y, z);
  return mesh;
}

/* ============================ peças do corpo ============================ */

// Cabeça: origem na base da cabeça; rosto voltado para +Z.
export function buildHead(decalId, colorEntry) {
  const g = new THREE.Group();
  const plain = makeMaterial(colorEntry);
  const faceMat = decalMaterial(drawHeadTexture(decalId, colorEntry.hex), colorEntry);

  const cap = 0.10;
  const bandH = D.headH - cap * 2;

  // faixa lateral com o rosto (u=0.5 fica em +Z com thetaStart=PI)
  const side = new THREE.Mesh(
    new THREE.CylinderGeometry(D.headR, D.headR, bandH, 36, 1, true, Math.PI, Math.PI * 2),
    faceMat
  );
  side.position.y = cap + bandH / 2;
  g.add(side);

  // bordas arredondadas (lathe de um quarto de círculo)
  const mkRim = (top) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      pts.push(new THREE.Vector2(D.headR - 0.1 + Math.cos(a) * 0.1, top ? Math.sin(a) * cap : -Math.sin(a) * cap));
    }
    const rim = new THREE.Mesh(new THREE.LatheGeometry(pts, 36), plain);
    rim.position.y = top ? D.headH - cap : cap;
    return rim;
  };
  g.add(mkRim(true), mkRim(false));

  // tampas
  const discTop = new THREE.Mesh(new THREE.CircleGeometry(D.headR - 0.09, 36), plain);
  discTop.rotation.x = -Math.PI / 2;
  discTop.position.y = D.headH;
  const discBot = new THREE.Mesh(new THREE.CircleGeometry(D.headR - 0.09, 36), plain);
  discBot.rotation.x = Math.PI / 2;
  g.add(discTop, discBot);

  // stud no topo
  const stud = new THREE.Mesh(new THREE.CylinderGeometry(D.studR, D.studR, D.studH, 24), plain);
  stud.position.y = D.headH + D.studH / 2;
  stud.name = 'stud';
  g.add(stud);

  return g;
}

// Torso trapezoidal: origem na base, frente +Z com estampa.
export function buildTorso(decalId, colorEntry) {
  const geo = new THREE.BoxGeometry(D.torsoWB, D.torsoH, D.torsoD);
  const pos = geo.attributes.position;
  const k = D.torsoWT / D.torsoWB;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) > 0) pos.setX(i, pos.getX(i) * k);
  }
  geo.computeVertexNormals();

  const plain = makeMaterial(colorEntry);
  const front = decalMaterial(drawTorsoTexture(decalId, colorEntry.hex), colorEntry);
  // ordem das faces do BoxGeometry: +x, -x, +y, -y, +z, -z
  const mesh = new THREE.Mesh(geo, [plain, plain, plain, plain, front, plain]);
  mesh.position.y = D.torsoH / 2;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

// Braço: origem no pivô do ombro. side: -1 esquerda (x-), +1 direita (x+).
export function buildArm(side, armColor, handColor) {
  const s = side;
  const mat = makeMaterial(armColor);
  const g = new THREE.Group();

  // ombro cilíndrico (eixo X)
  const shoulder = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.26, 18), mat);
  shoulder.rotation.z = Math.PI / 2;
  shoulder.position.x = s * 0.01;
  g.add(shoulder);

  const elbow = [s * 0.07, -0.52, 0.02];
  const wristEnd = [s * 0.07, -0.84, 0.30];
  g.add(tube([s * 0.0, -0.02, 0], elbow, D.armR, mat));
  g.add(ball(D.armR, mat, ...elbow));
  g.add(tube(elbow, wristEnd, D.armR - 0.012, mat));

  // pivô da mão no fim do antebraço
  const hand = buildHand(handColor);
  hand.position.set(...wristEnd);
  const dir = new THREE.Vector3(wristEnd[0] - elbow[0], wristEnd[1] - elbow[1], wristEnd[2] - elbow[2]).normalize();
  hand.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
  hand.userData.baseQuat = hand.quaternion.clone();
  g.add(hand);
  g.userData.hand = hand;
  return g;
}

// Mão: origem no pulso; -Y local segue o antebraço. O "grip" é o centro do C.
export function buildHand(colorEntry) {
  const mat = makeMaterial(colorEntry);
  const g = new THREE.Group();

  const wrist = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.18, 14), mat);
  wrist.position.y = -0.09;
  g.add(wrist);

  // clipe em C: furo ao longo de Y (segura barras paralelas ao antebraço)
  const c = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.078, 12, 26, 4.6), mat);
  c.rotation.x = Math.PI / 2;          // plano do C fica horizontal (furo no eixo Y)
  c.rotation.z = Math.PI / 2 + (2 * Math.PI - 4.6) / 2 + Math.PI; // abertura voltada para +Z
  c.position.y = -0.28;
  g.add(c);

  const grip = new THREE.Group();
  grip.position.set(0, -0.28, 0);
  grip.name = 'grip';
  g.add(grip);
  g.userData.grip = grip;
  return g;
}

// Pernas: origem no chão (y=0). Retorna pivôs para a pose.
export function buildLegsAssembly(part, colorEntry) {
  const mat = makeMaterial(colorEntry);
  const g = new THREE.Group();
  const type = part.legs || 'normal';

  if (type === 'skirt') {
    const height = D.footH + D.legH + D.hipH;
    const geo = new THREE.BoxGeometry(D.torsoWB, height, D.torsoD);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      if (pos.getY(i) < 0) {
        pos.setX(i, pos.getX(i) * 1.28);
        pos.setZ(i, pos.getZ(i) * 1.5);
      }
    }
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = height / 2;
    g.add(mesh);
    return { group: g, legL: null, legR: null, height };
  }

  const short = type === 'short';
  const legH = short ? 0.46 : D.legH;
  const footH = short ? 0.30 : D.footH;
  const legsTop = legH + footH;
  const height = legsTop + D.hipH;

  // quadril
  const hipCanvas = drawHipTexture(part.decal, colorEntry.hex);
  let hipMats = mat;
  if (hipCanvas) {
    const front = decalMaterial(hipCanvas, colorEntry);
    hipMats = [mat, mat, mat, mat, front, mat];
  }
  const hip = new THREE.Mesh(new THREE.BoxGeometry(D.hipW, D.hipH, D.hipD), hipMats);
  hip.position.y = legsTop + D.hipH / 2;
  g.add(hip);
  // pino central entre as pernas
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, D.hipW, 14), mat);
  pin.rotation.z = Math.PI / 2;
  pin.position.y = legsTop - 0.13;
  g.add(pin);

  const legCanvas = drawLegTexture(part.decal, colorEntry.hex);
  const mkLeg = (s) => {
    const pivot = new THREE.Group();
    pivot.position.set(s * D.legGapX, legsTop - 0.06, 0);
    let legMats = mat;
    if (legCanvas) {
      const front = decalMaterial(legCanvas, colorEntry);
      legMats = [mat, mat, mat, mat, front, mat];
    }
    const leg = new THREE.Mesh(new THREE.BoxGeometry(D.legW, legH, D.legD), legMats);
    leg.position.y = -(legsTop - 0.06) + footH + legH / 2;
    pivot.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(D.legW, footH, D.footD), mat);
    foot.position.set(0, -(legsTop - 0.06) + footH / 2, (D.footD - D.legD) / 2);
    pivot.add(foot);
    g.add(pivot);
    return pivot;
  };

  return { group: g, legL: mkLeg(-1), legR: mkLeg(1), height };
}

/* ============================ montagem ============================ */

export function createMinifig(config, db) {
  const root = new THREE.Group();
  // "fig" agrupa o boneco para poder erguê-lo sobre uma base
  const fig = new THREE.Group();
  root.add(fig);
  const joints = {};
  const slots = config.slots;
  const colorOf = (slot) => db.colors.get(slots[slot].color) || db.colors.get('lightGray');
  const partOf = (slot) => (slots[slot].part ? db.parts.get(slots[slot].part) : null);

  // pernas
  const legsPart = partOf('legs') || { legs: 'normal' };
  const legs = buildLegsAssembly(legsPart, colorOf('legs'));
  fig.add(legs.group);
  joints.legL = legs.legL;
  joints.legR = legs.legR;

  const hipTop = legs.height;
  const torsoTop = hipTop + D.torsoH;

  // torso
  const torsoPart = partOf('torso') || { decal: 'plain' };
  const torso = buildTorso(torsoPart.decal, colorOf('torso'));
  torso.position.y = hipTop;
  fig.add(torso);

  // braços + mãos
  for (const s of [-1, 1]) {
    const arm = buildArm(s, colorOf('arms'), colorOf('hands'));
    arm.position.set(s * D.shoulderX, torsoTop - D.shoulderDrop, 0);
    fig.add(arm);
    const key = s < 0 ? 'L' : 'R';
    joints['arm' + key] = arm;
    joints['hand' + key] = arm.userData.hand;

    // acessório de mão
    const accSlot = s < 0 ? 'handL' : 'handR';
    const accPart = partOf(accSlot);
    if (accPart) {
      const acc = buildAttachment(accPart.geo, colorOf(accSlot), db);
      if (acc) arm.userData.hand.userData.grip.add(acc);
    }
  }

  // pescoço + cabeça
  const headPivot = new THREE.Group();
  headPivot.position.y = torsoTop;
  fig.add(headPivot);
  joints.head = headPivot;

  const neckMat = makeMaterial(colorOf('head'));
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(D.neckR, D.neckR, D.neckH, 24), neckMat);
  neck.position.y = D.neckH / 2;
  headPivot.add(neck);

  const headPart = partOf('head') || { decal: 'smiley' };
  const head = buildHead(headPart.decal, colorOf('head'));
  head.position.y = D.neckH;
  headPivot.add(head);

  // cabelo / chapéu
  const gearPart = partOf('headgear');
  if (gearPart) {
    const gear = buildAttachment(gearPart.geo, colorOf('headgear'), db);
    if (gear) {
      gear.position.y = D.neckH + D.headH;
      headPivot.add(gear);
      const stud = head.getObjectByName('stud');
      if (stud) stud.visible = false;
    }
  }

  // item de corpo (capa, mochila…) — ancorado nas costas do torso
  const bodyPart = partOf('body');
  if (bodyPart) {
    const item = buildAttachment(bodyPart.geo, colorOf('body'), db);
    if (item) {
      item.position.y = torsoTop;
      fig.add(item);
    }
  }

  // extras: base (a minifig sobe na placa) e pet
  const basePart = partOf('base');
  if (basePart) {
    const base = buildAttachment(basePart.geo, colorOf('base'), db);
    if (base) {
      root.add(base);
      fig.position.y = base.userData.lift || 0;
    }
  }
  const petPart = partOf('pet');
  if (petPart) {
    const pet = buildAttachment(petPart.geo, colorOf('pet'), db);
    if (pet) {
      if (petPart.geo === 'parrot') {
        pet.position.set(-(D.shoulderX + 0.02), torsoTop + 0.02, 0);
        fig.add(pet);
      } else {
        root.add(pet);
      }
    }
  }

  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = false;
    }
  });

  return { root, joints, height: torsoTop + D.neckH + D.headH + D.studH };
}

export function applyPose(joints, pose) {
  if (joints.head) joints.head.rotation.y = pose.head || 0;
  if (joints.armL) joints.armL.rotation.set(pose.armLx || 0, 0, pose.armLz || 0);
  if (joints.armR) joints.armR.rotation.set(pose.armRx || 0, 0, pose.armRz || 0);
  for (const k of ['L', 'R']) {
    const hand = joints['hand' + k];
    if (hand && hand.userData.baseQuat) {
      hand.quaternion
        .copy(hand.userData.baseQuat)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), pose['hand' + k] || 0));
    }
  }
  if (joints.legL) joints.legL.rotation.x = pose.legLx || 0;
  if (joints.legR) joints.legR.rotation.x = pose.legRx || 0;
}

export function disposeObject(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.geometry?.dispose();
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        m.map?.dispose();
        m.dispose();
      }
    }
  });
}
