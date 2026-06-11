// Presets de pose. Ângulos em radianos.
// Convenções: armX negativo = braço para frente/cima; legX negativo = perna para frente.

export const POSE_KEYS = ['head', 'armLx', 'armLz', 'armRx', 'armRz', 'handL', 'handR', 'legLx', 'legRx', 'itemL', 'itemR'];

export function defaultPose() {
  return { preset: 'parado', head: 0, armLx: -0.06, armLz: 0, armRx: -0.06, armRz: 0, handL: 0, handR: 0, legLx: 0, legRx: 0, itemL: 0, itemR: 0 };
}

export const POSES = {
  parado: {
    nome: 'Parado',
    pose: { head: 0, armLx: -0.06, armLz: 0, armRx: -0.06, armRz: 0, handL: 0, handR: 0, legLx: 0, legRx: 0 },
  },
  acenando: {
    nome: 'Acenando',
    pose: { head: -0.18, armLx: -0.1, armLz: 0, armRx: -2.85, armRz: -0.35, handL: 0, handR: 0.5, legLx: 0, legRx: 0 },
  },
  caminhando: {
    nome: 'Caminhando',
    pose: { head: 0, armLx: 0.45, armLz: 0, armRx: -0.55, armRz: 0, handL: 0, handR: 0, legLx: -0.5, legRx: 0.45 },
  },
  correndo: {
    nome: 'Correndo',
    pose: { head: 0, armLx: 0.8, armLz: 0, armRx: -1.15, armRz: 0, handL: 0, handR: 0, legLx: -0.95, legRx: 0.85 },
  },
  sentado: {
    nome: 'Sentado',
    pose: { head: 0, armLx: -0.5, armLz: 0, armRx: -0.5, armRz: 0, handL: 0, handR: 0, legLx: -1.5, legRx: -1.5 },
  },
  heroi: {
    nome: 'Herói',
    pose: { head: 0.12, armLx: -0.4, armLz: 0.7, armRx: -0.4, armRz: -0.7, handL: -0.6, handR: 0.6, legLx: 0, legRx: 0 },
  },
};

export function randomPose(rng = Math.random) {
  const r = (a, b) => a + rng() * (b - a);
  return {
    head: r(-0.5, 0.5),
    armLx: r(-2.6, 0.6),
    armLz: 0,
    armRx: r(-2.6, 0.6),
    armRz: 0,
    handL: r(-0.8, 0.8),
    handR: r(-0.8, 0.8),
    legLx: r(-0.9, 0.6),
    legRx: r(-0.9, 0.6),
  };
}
