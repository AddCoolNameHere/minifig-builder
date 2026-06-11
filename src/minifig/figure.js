// Montagem da minifig com peças oficiais LDraw.
//
// Coordenadas LDraw: Y para BAIXO, frente da minifig em -Z, direita dela em -X.
// Offsets oficiais (extraídos dos shortcuts 973c01.dat e 3815c01.dat):
//   torso 973 na origem
//   cabeça 3626 em (0,-24,0)
//   braço dir. 3818 em (-15.552, 9, 0) com inclinação Rz(+9.79°); esq. espelhado
//   mão 3820 (local ao braço) em (∓5, 18.89, -9.9) com Rx(45°)
//   quadril 3815b em (0,32,0); pernas 3816c/3817c pivotam em (0,44,0)
// O grupo raiz é rotacionado em X por π (LDraw → mundo Y-up) e escalado.

import * as THREE from 'three';
import { loadPart, loadComposite } from './ldparts.js';

export const SCALE = 0.045;
const ARM_TILT = Math.asin(0.17);          // 9.79°
const HAND_LOCAL = { x: 5, y: 18.89, z: -9.9 };

async function buildSlotPart(part, colorCode) {
  if (!part) return null;
  const obj = part.composite
    ? await loadComposite(part.composite, colorCode)
    : await loadPart(part.file, colorCode);
  // correção de orientação no grip (ex.: escudos penduram verticais)
  if (part.gripRotX) {
    const wrap = new THREE.Group();
    wrap.rotation.x = (part.gripRotX * Math.PI) / 180;
    wrap.add(obj);
    return wrap;
  }
  return obj;
}

export async function createMinifig(config, db) {
  const slots = config.slots;
  const colorOf = (slot) => slots[slot]?.color ?? '71';
  const partOf = (slot) => (slots[slot]?.part ? db.parts.get(slots[slot].part) : null);

  // dispara todos os carregamentos em paralelo
  const legsPart = partOf('legs') || db.parts.get('970c00');
  const legsType = legsPart.legs || 'normal';
  const loads = {
    torso: buildSlotPart(partOf('torso') || db.parts.get('973'), colorOf('torso')),
    head: buildSlotPart(partOf('head') || db.parts.get('3626bp01'), colorOf('head')),
    headgear: partOf('headgear') ? buildSlotPart(partOf('headgear'), colorOf('headgear')) : null,
    armR: loadPart('3818', colorOf('arms')),
    armL: loadPart('3819', colorOf('arms')),
    handR: loadPart('3820', colorOf('hands')),
    handL: loadPart('3820', colorOf('hands')),
    accR: partOf('handR') ? buildSlotPart(partOf('handR'), colorOf('handR')) : null,
    accL: partOf('handL') ? buildSlotPart(partOf('handL'), colorOf('handL')) : null,
    body: partOf('body') ? buildSlotPart(partOf('body'), colorOf('body')) : null,
    base: partOf('base') ? buildSlotPart(partOf('base'), colorOf('base')) : null,
    pet: partOf('pet') ? buildSlotPart(partOf('pet'), colorOf('pet')) : null,
  };
  if (legsType === 'normal') {
    loads.hips = loadPart('3815b', colorOf('legs'));
    loads.legR = loadPart('3816c', colorOf('legs'));
    loads.legL = loadPart('3817c', colorOf('legs'));
  } else {
    loads.hipsLegs = buildSlotPart(legsPart, colorOf('legs'));
  }

  const keys = Object.keys(loads).filter((k) => loads[k]);
  const results = await Promise.all(keys.map((k) => loads[k]));
  const got = {};
  keys.forEach((k, i) => (got[k] = results[i]));

  // ---- montagem em coordenadas LDraw ----
  const ldraw = new THREE.Group();   // espaço LDraw (Y para baixo)
  const joints = {};

  // torso
  ldraw.add(got.torso);

  // cabeça (pivô de rotação Y)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, -24, 0);
  headPivot.add(got.head);
  if (got.headgear) headPivot.add(got.headgear);
  ldraw.add(headPivot);
  joints.head = headPivot;

  // braços: pivô no ombro com inclinação fixa; swing em X dentro dele
  const mkArm = (side, armMesh, handMesh, acc) => {
    const s = side; // -1 = direita da minifig (x negativo), +1 = esquerda
    const pivot = new THREE.Group();
    pivot.position.set(s * 15.552, 9, 0);
    pivot.rotation.z = -s * ARM_TILT;
    const swing = new THREE.Group();
    pivot.add(swing);
    swing.add(armMesh);

    const hand = new THREE.Group();
    hand.position.set(s * HAND_LOCAL.x, HAND_LOCAL.y, HAND_LOCAL.z);
    hand.rotation.x = Math.PI / 4;
    hand.userData.baseQuat = new THREE.Quaternion().setFromEuler(hand.rotation);
    hand.add(handMesh);
    if (acc) hand.add(acc);
    swing.add(hand);

    ldraw.add(pivot);
    return { swing, hand };
  };
  // 3818 é o braço DIREITO (fica em x negativo); 3819 o esquerdo
  const armR = mkArm(-1, got.armR, got.handR, got.accR || null);
  const armL = mkArm(1, got.armL, got.handL, got.accL || null);
  joints.armR = armR.swing;
  joints.armL = armL.swing;
  joints.handR = armR.hand;
  joints.handL = armL.hand;

  // pernas
  if (legsType === 'normal') {
    const hips = got.hips;
    hips.position.set(0, 32, 0);
    ldraw.add(hips);
    const mkLeg = (mesh) => {
      const pivot = new THREE.Group();
      pivot.position.set(0, 44, 0);
      pivot.add(mesh);
      ldraw.add(pivot);
      return pivot;
    };
    joints.legR = mkLeg(got.legR);
    joints.legL = mkLeg(got.legL);
  } else {
    got.hipsLegs.position.set(0, 32, 0);
    ldraw.add(got.hipsLegs);
    joints.legR = null;
    joints.legL = null;
  }

  // capa/mochila/tanques — ancorados ao torso (origem das peças já é o pescoço/costas)
  if (got.body) ldraw.add(got.body);

  // papagaio no ombro
  if (got.pet && partOf('pet')?.file === '2546') {
    got.pet.position.set(15.8, -1, 0);
    got.pet.rotation.y = -0.35;
    ldraw.add(got.pet);
  }

  // ---- nivelamento: pés no chão ----
  ldraw.updateMatrixWorld(true);
  const bbox = new THREE.Box3().setFromObject(ldraw);
  const groundY = bbox.max.y; // ponto mais baixo (Y cresce para baixo no LDraw)

  // ---- raiz no mundo (Y para cima) ----
  const root = new THREE.Group();
  const fig = new THREE.Group();
  fig.rotation.x = Math.PI;            // Y-down -> Y-up (frente vira +Z)
  fig.scale.setScalar(SCALE);
  fig.position.y = groundY * SCALE;
  root.add(fig);
  fig.add(ldraw);

  // base sob os pés: fundo da placa no chão, minifig sobe até a superfície
  if (got.base) {
    const base = new THREE.Group();
    base.rotation.x = Math.PI;
    base.scale.setScalar(SCALE);
    got.base.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(got.base);
    base.position.y = bb.max.y * SCALE; // bb.max.y = fundo da placa (LDraw y cresce p/ baixo)
    base.add(got.base);
    root.add(base);
    fig.position.y += bb.max.y * SCALE; // superfície da placa = origem da peça (y=0)
  }

  // pet no chão ao lado
  if (got.pet && partOf('pet')?.file !== '2546') {
    const pet = new THREE.Group();
    pet.rotation.x = Math.PI;
    pet.scale.setScalar(SCALE);
    got.pet.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(got.pet);
    pet.position.set(1.6, bb.max.y * SCALE, 0.3);
    pet.rotation.y = -0.5;
    pet.add(got.pet);
    root.add(pet);
  }

  return { root, joints, height: (groundY - bbox.min.y) * SCALE };
}

export function applyPose(joints, pose) {
  if (joints.head) joints.head.rotation.y = -(pose.head || 0);
  // em LDraw (antes do flip) os sinais de X são invertidos em relação ao mundo
  if (joints.armL) joints.armL.rotation.x = -(pose.armLx || 0);
  if (joints.armR) joints.armR.rotation.x = -(pose.armRx || 0);
  if (joints.armL) joints.armL.rotation.z = -(pose.armLz || 0);
  if (joints.armR) joints.armR.rotation.z = (pose.armRz || 0);
  for (const k of ['L', 'R']) {
    const hand = joints['hand' + k];
    if (hand && hand.userData.baseQuat) {
      hand.quaternion
        .copy(hand.userData.baseQuat)
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pose['hand' + k] || 0));
    }
  }
  if (joints.legL) joints.legL.rotation.x = -(pose.legLx || 0);
  if (joints.legR) joints.legR.rotation.x = -(pose.legRx || 0);
}

export function disposeObject(obj) {
  // geometrias e materiais são compartilhados pelo cache do loader — não descartar.
  // (clones só removem referências; o GC cuida dos grupos)
}
