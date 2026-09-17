/*
 * Morphing Selected Work scene definitions.
 *
 * The procedural topology, platform/core, and line-field layers substantially
 * adapt techniques from Meng To's ThreeUI Community sources at commit fbc9b3d:
 * - nexus-topology.html (deterministic point-and-connection field)
 * - platform-core.html (instanced platform and central core)
 * - vertex-9.html (deformable parallel-line data surface)
 *
 * ThreeUI is MIT licensed. See THIRD_PARTY_NOTICES.md for the complete notice.
 * This module contains no ThreeUI package code, media, thumbnails, or assets.
 */

export const WORK_VISUAL_SOURCE_COMMIT = "fbc9b3d61b0ef4b2e93b42e4fffa617ca277429b";
export const POINT_COUNT = 240;
export const FIELD_ROWS = 22;
export const FIELD_COLUMNS = 32;
export const FIELD_POINT_COUNT = FIELD_ROWS * FIELD_COLUMNS;
export const INSTANCE_COUNT = 30;

const TAU = Math.PI * 2;
const HIDDEN_SCALE = 0.001;

function seededNoise(index, seed = 1) {
  const value = Math.sin((index + 1) * (12.9898 + seed * 0.731)) * 43758.5453123;
  return (value - Math.floor(value)) * 2 - 1;
}

function setVector(buffer, index, x, y, z) {
  const offset = index * 3;
  buffer[offset] = x;
  buffer[offset + 1] = y;
  buffer[offset + 2] = z;
}

function createInstanceLayer() {
  const scales = new Float32Array(INSTANCE_COUNT * 3);
  for (let index = 0; index < INSTANCE_COUNT; index += 1) {
    setVector(scales, index, HIDDEN_SCALE, HIDDEN_SCALE, HIDDEN_SCALE);
  }
  return {
    positions: new Float32Array(INSTANCE_COUNT * 3),
    rotations: new Float32Array(INSTANCE_COUNT * 3),
    scales,
    tones: new Float32Array(INSTANCE_COUNT),
  };
}

function setInstance(layer, index, {
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [HIDDEN_SCALE, HIDDEN_SCALE, HIDDEN_SCALE],
  tone = 0,
}) {
  setVector(layer.positions, index, ...position);
  setVector(layer.rotations, index, ...rotation);
  setVector(layer.scales, index, ...scale);
  layer.tones[index] = tone;
}

function buildTopologyEdges() {
  const pairs = [];
  for (let index = 0; index < POINT_COUNT; index += 1) {
    pairs.push(index, (index + 1) % POINT_COUNT);
    if (index % 2 === 0) pairs.push(index, (index + 7 + (index % 5)) % POINT_COUNT);
  }
  return Uint16Array.from(pairs);
}

export const TOPOLOGY_EDGES = buildTopologyEdges();

function createFantasyState() {
  const topology = new Float32Array(POINT_COUNT * 3);
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const role = Math.floor(index / 48);
    const layer = index % 48;
    const roleAngle = -Math.PI / 2 + (role / 5) * TAU;
    const towerRadius = 2.75;
    const localAngle = layer * 2.399963 + role;
    const spread = 0.18 + (layer % 7) * 0.018;
    const rise = 0.26 + (layer / 47) * 2.8;
    setVector(
      topology,
      index,
      Math.cos(roleAngle) * towerRadius + Math.cos(localAngle) * spread,
      rise + seededNoise(index, 11) * 0.055,
      Math.sin(roleAngle) * towerRadius + Math.sin(localAngle) * spread,
    );
  }

  const field = new Float32Array(FIELD_POINT_COUNT * 3);
  for (let row = 0; row < FIELD_ROWS; row += 1) {
    const role = row % 5;
    const lane = Math.floor(row / 5);
    const angle = -Math.PI / 2 + (role / 5) * TAU;
    for (let column = 0; column < FIELD_COLUMNS; column += 1) {
      const t = column / (FIELD_COLUMNS - 1);
      const radius = 0.35 + t * (2.2 + lane * 0.12);
      const bend = Math.sin(t * Math.PI) * (lane - 1.5) * 0.09;
      setVector(
        field,
        row * FIELD_COLUMNS + column,
        Math.cos(angle + bend) * radius,
        0.08 + lane * 0.035 + Math.sin(t * Math.PI * 4 + row) * 0.025,
        Math.sin(angle + bend) * radius,
      );
    }
  }

  const instances = createInstanceLayer();
  setInstance(instances, 0, { position: [0, 0.48, 0], scale: [1.15, 0.96, 1.15], tone: 2 });
  setInstance(instances, 1, { position: [0, -0.12, 0], scale: [6.7, 0.22, 6.7], tone: 0 });
  for (let role = 0; role < 5; role += 1) {
    const angle = -Math.PI / 2 + (role / 5) * TAU;
    const x = Math.cos(angle) * 2.75;
    const z = Math.sin(angle) * 2.75;
    setInstance(instances, 2 + role, {
      position: [x, 1.02, z],
      rotation: [0, -angle, 0],
      scale: [0.72, 2.15, 0.72],
      tone: role === 0 ? 1 : 0,
    });
    setInstance(instances, 7 + role, {
      position: [x * 0.52, 0.08, z * 0.52],
      rotation: [0, -angle, 0],
      scale: [0.14, 0.08, 2.0],
      tone: 1,
    });
  }
  for (let index = 12; index < INSTANCE_COUNT; index += 1) {
    const slot = index - 12;
    const angle = (slot / (INSTANCE_COUNT - 12)) * TAU;
    setInstance(instances, index, {
      position: [Math.cos(angle) * 3.42, 0.12, Math.sin(angle) * 3.42],
      rotation: [0, -angle, 0],
      scale: [0.16, 0.22 + (slot % 3) * 0.1, 0.56],
      tone: slot % 5 === 0 ? 2 : 0,
    });
  }

  return {
    id: "vct-fantasy",
    label: "VCT Fantasy tactical roster network",
    camera: { position: [8.6, 6.8, 9.6], target: [0, 0.55, 0], fov: 34 },
    topology,
    field,
    instances,
  };
}

function createVisionState() {
  const topology = new Float32Array(POINT_COUNT * 3);
  const columns = 20;
  const rows = POINT_COUNT / columns;
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const u = column / (columns - 1);
    const v = row / (rows - 1);
    const depth = -2.25 + Math.sin(u * Math.PI * 3 + v * 4) * 0.13;
    setVector(topology, index, (u - 0.5) * 6.5, (v - 0.5) * 3.75, depth + seededNoise(index, 23) * 0.04);
  }

  const field = new Float32Array(FIELD_POINT_COUNT * 3);
  for (let row = 0; row < FIELD_ROWS; row += 1) {
    const v = row / (FIELD_ROWS - 1);
    for (let column = 0; column < FIELD_COLUMNS; column += 1) {
      const u = column / (FIELD_COLUMNS - 1);
      const scan = Math.sin(u * TAU * 2 + row * 0.35) * 0.08;
      setVector(field, row * FIELD_COLUMNS + column, (u - 0.5) * 7.1, (v - 0.5) * 4.25, -1.8 + scan);
    }
  }

  const instances = createInstanceLayer();
  setInstance(instances, 0, { position: [0, -2.18, -0.4], scale: [7.6, 0.16, 5.4], tone: 0 });
  setInstance(instances, 1, { position: [0, 0.05, 3.2], rotation: [0.08, 0, 0], scale: [1.15, 0.82, 1.6], tone: 2 });
  setInstance(instances, 2, { position: [0, -0.02, 2.05], rotation: [Math.PI / 2, 0, 0], scale: [0.44, 0.44, 0.86], tone: 1 });
  const detections = [
    [-2.15, -0.55, -1.65, 1.3, 1.95],
    [0.25, 0.15, -1.65, 1.65, 2.45],
    [2.35, -0.85, -1.65, 1.05, 1.45],
  ];
  let next = 3;
  detections.forEach(([x, y, z, width, height], detectionIndex) => {
    const thickness = 0.075;
    const tone = detectionIndex === 1 ? 1 : 2;
    setInstance(instances, next++, { position: [x, y + height / 2, z], scale: [width, thickness, thickness], tone });
    setInstance(instances, next++, { position: [x, y - height / 2, z], scale: [width, thickness, thickness], tone });
    setInstance(instances, next++, { position: [x - width / 2, y, z], scale: [thickness, height, thickness], tone });
    setInstance(instances, next++, { position: [x + width / 2, y, z], scale: [thickness, height, thickness], tone });
  });
  for (; next < INSTANCE_COUNT; next += 1) {
    const index = next - 15;
    const side = index % 2 === 0 ? -1 : 1;
    const depth = 2.6 - Math.floor(index / 2) * 0.55;
    setInstance(instances, next, {
      position: [side * (0.5 + Math.floor(index / 2) * 0.42), -0.1 + (index % 3) * 0.16, depth],
      rotation: [0, side * 0.62, 0],
      scale: [0.065, 0.065, 2.1 + index * 0.08],
      tone: index % 4 === 0 ? 1 : 0,
    });
  }

  return {
    id: "broadcast-vision",
    label: "Broadcast Vision camera tracking field",
    camera: { position: [7.5, 4.7, 11.8], target: [0, 0, -0.45], fov: 33 },
    topology,
    field,
    instances,
  };
}

function garmentWidth(v) {
  if (v < 0.2) return 1.7 + v * 3.2;
  if (v < 0.48) return 2.75 - (v - 0.2) * 2.8;
  return 1.95 - (v - 0.48) * 0.38;
}

function createFashionState() {
  const topology = new Float32Array(POINT_COUNT * 3);
  const columns = 16;
  const rows = POINT_COUNT / columns;
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const u = column / (columns - 1);
    const v = row / (rows - 1);
    const width = garmentWidth(v);
    const x = (u - 0.5) * width * 2;
    const rawWeight = Math.max(0, 1 - u * 2);
    const folds = Math.sin(v * Math.PI * 5 + u * 3) * 0.18 + Math.cos(u * Math.PI * 4) * 0.12;
    const noise = seededNoise(index, 37) * 0.24 * rawWeight;
    setVector(topology, index, x, 2.7 - v * 5.35, folds + noise);
  }

  const field = new Float32Array(FIELD_POINT_COUNT * 3);
  for (let row = 0; row < FIELD_ROWS; row += 1) {
    const v = row / (FIELD_ROWS - 1);
    const width = garmentWidth(v);
    for (let column = 0; column < FIELD_COLUMNS; column += 1) {
      const u = column / (FIELD_COLUMNS - 1);
      const x = (u - 0.5) * width * 2;
      const rawWeight = Math.max(0, 1 - u * 1.85);
      const smoothFold = Math.sin(v * Math.PI * 4.5 + u * 2.1) * 0.22 + Math.cos(u * Math.PI * 3) * 0.1;
      const noise = seededNoise(row * FIELD_COLUMNS + column, 41) * 0.32 * rawWeight;
      setVector(field, row * FIELD_COLUMNS + column, x, 2.72 - v * 5.4, smoothFold + noise);
    }
  }

  const instances = createInstanceLayer();
  setInstance(instances, 0, { position: [0, -2.88, 0], scale: [5.4, 0.18, 2.4], tone: 0 });
  setInstance(instances, 1, { position: [0, 0, 0.04], scale: [0.065, 5.65, 0.065], tone: 1 });
  for (let index = 2; index < INSTANCE_COUNT; index += 1) {
    const t = (index - 2) / (INSTANCE_COUNT - 3);
    const side = index % 2 === 0 ? -1 : 1;
    const v = (Math.floor((index - 2) / 2) % 14) / 13;
    const width = garmentWidth(v);
    setInstance(instances, index, {
      position: [side * width, 2.7 - v * 5.35, 0],
      rotation: [0, 0, side * (0.16 + Math.sin(t * Math.PI) * 0.12)],
      scale: [0.12, 0.38, 0.12],
      tone: index % 6 === 0 ? 2 : index % 4 === 0 ? 1 : 0,
    });
  }

  return {
    id: "fashion-enhancer",
    label: "Fashion Enhancer segmented cloth field",
    camera: { position: [7.8, 3.4, 11.5], target: [0, 0, 0], fov: 34 },
    topology,
    field,
    instances,
  };
}

function screenPoint(x, y, topScreen) {
  if (topScreen) {
    const angle = -0.2;
    return [x, 1.15 + y * Math.cos(angle), -0.45 + y * Math.sin(angle)];
  }
  const angle = -1.03;
  return [x, -1.15 + y * Math.cos(angle), 0.5 + y * Math.sin(angle)];
}

function createPortfolioState() {
  const topology = new Float32Array(POINT_COUNT * 3);
  const columns = 12;
  const rowsPerScreen = 10;
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const screenIndex = index < POINT_COUNT / 2 ? 0 : 1;
    const local = index % (POINT_COUNT / 2);
    const column = local % columns;
    const row = Math.floor(local / columns);
    const x = (column / (columns - 1) - 0.5) * 5.4;
    const y = (row / (rowsPerScreen - 1) - 0.5) * 2.65;
    const [px, py, pz] = screenPoint(x, y, screenIndex === 0);
    setVector(topology, index, px, py, pz + seededNoise(index, 53) * 0.025);
  }

  const field = new Float32Array(FIELD_POINT_COUNT * 3);
  for (let row = 0; row < FIELD_ROWS; row += 1) {
    const topScreen = row < FIELD_ROWS / 2;
    const localRow = row % (FIELD_ROWS / 2);
    const v = localRow / (FIELD_ROWS / 2 - 1);
    for (let column = 0; column < FIELD_COLUMNS; column += 1) {
      const u = column / (FIELD_COLUMNS - 1);
      const x = (u - 0.5) * 5.75;
      const y = (v - 0.5) * 2.85;
      const point = screenPoint(x, y, topScreen);
      point[2] += Math.sin(u * Math.PI * 6 + row) * 0.025;
      setVector(field, row * FIELD_COLUMNS + column, ...point);
    }
  }

  const instances = createInstanceLayer();
  setInstance(instances, 0, { position: [0, 1.15, -0.45], rotation: [-0.2, 0, 0], scale: [6.15, 3.2, 0.18], tone: 0 });
  setInstance(instances, 1, { position: [0, -1.15, 0.5], rotation: [-1.03, 0, 0], scale: [6.15, 3.2, 0.18], tone: 0 });
  for (let index = 2; index < 7; index += 1) {
    setInstance(instances, index, {
      position: [(index - 4) * 1.05, -0.03, 0.04],
      rotation: [0, 0, Math.PI / 2],
      scale: [0.28, 0.86, 0.28],
      tone: index === 4 ? 2 : 0,
    });
  }
  for (let index = 7; index < INSTANCE_COUNT; index += 1) {
    const local = index - 7;
    const top = local < 12;
    const slot = local % 12;
    const row = Math.floor(slot / 4);
    const column = slot % 4;
    const [x, y, z] = screenPoint(-2.05 + column * 1.36, 0.72 - row * 0.72, top);
    setInstance(instances, index, {
      position: [x, y, z + 0.12],
      rotation: [top ? -0.2 : -1.03, 0, 0],
      scale: [0.85, 0.38, 0.07],
      tone: local % 5 === 0 ? 1 : local % 7 === 0 ? 2 : 0,
    });
  }

  return {
    id: "portfolio-os",
    label: "Portfolio OS dual-screen interface system",
    camera: { position: [8.7, 6.6, 11.8], target: [0, 0, 0], fov: 34 },
    topology,
    field,
    instances,
  };
}

function savePathPoint(u, lane) {
  const startX = (lane - (FIELD_ROWS - 1) / 2) * 0.24;
  const trayX = startX * 0.46;
  const x = startX * (1 - u) + trayX * u + Math.sin(u * Math.PI) * Math.sin(lane * 1.7) * 0.32;
  const y = 2.3 - u * 4.55 - Math.sin(u * Math.PI) * 0.9;
  const z = -1.3 + u * 1.75 + Math.sin(u * Math.PI) * (0.7 + (lane % 4) * 0.08);
  return [x, y, z];
}

function createQuickSaveState() {
  const topology = new Float32Array(POINT_COUNT * 3);
  for (let index = 0; index < POINT_COUNT; index += 1) {
    const lane = index % FIELD_ROWS;
    const step = Math.floor(index / FIELD_ROWS);
    const u = step / (Math.ceil(POINT_COUNT / FIELD_ROWS) - 1);
    const [x, y, z] = savePathPoint(Math.min(1, u), lane);
    setVector(topology, index, x + seededNoise(index, 67) * 0.08, y, z + seededNoise(index, 71) * 0.08);
  }

  const field = new Float32Array(FIELD_POINT_COUNT * 3);
  for (let row = 0; row < FIELD_ROWS; row += 1) {
    for (let column = 0; column < FIELD_COLUMNS; column += 1) {
      setVector(field, row * FIELD_COLUMNS + column, ...savePathPoint(column / (FIELD_COLUMNS - 1), row));
    }
  }

  const instances = createInstanceLayer();
  setInstance(instances, 0, { position: [0, 2.35, -1.42], rotation: [-0.05, 0, 0], scale: [6.6, 3.0, 0.18], tone: 0 });
  setInstance(instances, 1, { position: [0, 3.55, -1.28], scale: [6.65, 0.38, 0.24], tone: 2 });
  setInstance(instances, 2, { position: [0, -2.18, 0.46], scale: [4.4, 0.28, 2.55], tone: 0 });
  setInstance(instances, 3, { position: [-2.12, -1.55, 0.46], scale: [0.2, 1.4, 2.55], tone: 0 });
  setInstance(instances, 4, { position: [2.12, -1.55, 0.46], scale: [0.2, 1.4, 2.55], tone: 0 });
  setInstance(instances, 5, { position: [0, -1.62, 1.66], scale: [4.4, 1.25, 0.18], tone: 1 });
  for (let index = 6; index < 18; index += 1) {
    const local = index - 6;
    const column = local % 4;
    const row = Math.floor(local / 4);
    setInstance(instances, index, {
      position: [-2.2 + column * 1.46, 2.65 - row * 0.86, -1.25],
      scale: [1.05, 0.5, 0.1],
      tone: local % 5 === 0 ? 1 : 0,
    });
  }
  for (let index = 18; index < INSTANCE_COUNT; index += 1) {
    const local = index - 18;
    const t = local / (INSTANCE_COUNT - 19);
    const lane = local + 4;
    const [x, y, z] = savePathPoint(0.18 + t * 0.72, lane);
    setInstance(instances, index, {
      position: [x, y, z],
      rotation: [t * 0.7, t * 1.15, t * 0.45],
      scale: [0.32, 0.22, 0.08],
      tone: local % 3 === 0 ? 2 : 1,
    });
  }

  return {
    id: "quick-save",
    label: "Quick Save media stream and download tray",
    camera: { position: [8.2, 4.8, 12.4], target: [0, 0.25, 0], fov: 34 },
    topology,
    field,
    instances,
  };
}

export function buildWorkVisualStates() {
  return [
    createFantasyState(),
    createVisionState(),
    createFashionState(),
    createPortfolioState(),
    createQuickSaveState(),
  ];
}
