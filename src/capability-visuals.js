import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  Group,
  IcosahedronGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Points,
  PointsMaterial,
  Scene,
  Sprite,
  SpriteMaterial,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  TubeGeometry,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const THEME_DURATION = 420;
const CAPABILITY_COUNT = 4;

const PALETTES = {
  light: {
    structure: 0x555c5a,
    metal: 0xa9b0b0,
    panel: 0xd6d9d5,
    dark: 0x131313,
    line: 0x333a37,
    signal: 0xc5b174,
    gold: 0xc5b174,
    red: 0xdc3030,
    purple: 0x6f4acc,
    paper: 0xffffff,
  },
  dark: {
    structure: 0xd9ddda,
    metal: 0x737b79,
    panel: 0x3a3f3c,
    dark: 0x131313,
    line: 0xe7ece8,
    signal: 0xc5b174,
    gold: 0xc5b174,
    red: 0xdc3030,
    purple: 0x6f4acc,
    paper: 0xffffff,
  },
};

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value ** 3 : 1 - ((-2 * value + 2) ** 3) / 2;
}

function createPalette(theme) {
  return Object.fromEntries(Object.entries(PALETTES[theme === "dark" ? "dark" : "light"]).map(([key, value]) => [key, new Color(value)]));
}

function copyPalette(target, source) {
  Object.keys(source).forEach((key) => target[key].copy(source[key]));
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function addSceneLighting(scene, registry) {
  const ambient = new AmbientLight(0xffffff, 1.3);
  ambient.userData.tone = "paper";
  registry.lights.add(ambient);
  scene.add(ambient);

  const key = new DirectionalLight(0xffffff, 3.15);
  key.position.set(5.5, 8, 6.5);
  key.userData.tone = "paper";
  registry.lights.add(key);
  scene.add(key);

  const rim = new DirectionalLight(0xffffff, 2.1);
  rim.position.set(-5, 2.5, -5.5);
  rim.userData.tone = "paper";
  registry.lights.add(rim);
  scene.add(rim);
}

function createKit(registry, palette) {
  function geometry(value) {
    registry.geometries.add(value);
    return value;
  }

  function material(type, tone, options = {}) {
    const parameters = { color: palette[tone], ...options };
    let value;
    if (type === "line") value = new LineBasicMaterial(parameters);
    else if (type === "basic") value = new MeshBasicMaterial(parameters);
    else if (type === "points") value = new PointsMaterial(parameters);
    else value = new MeshStandardMaterial(parameters);
    value.userData.tone = tone;
    registry.materials.add(value);
    return value;
  }

  function roundedBox(width, height, depth, radius, tone, options = {}) {
    return new Mesh(
      geometry(new RoundedBoxGeometry(width, height, depth, 3, radius)),
      material("standard", tone, { metalness: 0.68, roughness: 0.36, ...options }),
    );
  }

  function box(width, height, depth, tone, options = {}) {
    return new Mesh(
      geometry(new BoxGeometry(width, height, depth)),
      material("standard", tone, { metalness: 0.58, roughness: 0.42, ...options }),
    );
  }

  function wireBox(width, height, depth, tone, opacity = 0.72) {
    const source = new BoxGeometry(width, height, depth);
    const edges = geometry(new EdgesGeometry(source));
    source.dispose();
    return new LineSegments(edges, material("line", tone, { opacity, transparent: true, depthWrite: false }));
  }

  function lineSegments(points, tone, opacity = 0.72) {
    const positions = [];
    points.forEach(([from, to]) => positions.push(...from, ...to));
    const value = geometry(new BufferGeometry());
    value.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
    return new LineSegments(value, material("line", tone, { opacity, transparent: true, depthWrite: false }));
  }

  function grid(size = 6, divisions = 12, y = -1.18) {
    const half = size / 2;
    const lines = [];
    for (let index = 0; index <= divisions; index += 1) {
      const value = -half + (index / divisions) * size;
      lines.push([[-half, y, value], [half, y, value]], [[value, y, -half], [value, y, half]]);
    }
    return lineSegments(lines, "line", 0.13);
  }

  return { box, geometry, grid, lineSegments, material, roundedBox, wireBox };
}

function createScene(cameraPosition, target, registry) {
  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.fromArray(cameraPosition);
  camera.userData.target = new Vector3(...target);
  camera.lookAt(camera.userData.target);
  const world = new Group();
  scene.add(world);
  addSceneLighting(scene, registry);
  return { camera, scene, world };
}

function buildProductScene(kit, registry) {
  const view = createScene([6.1, 4.8, 7.4], [0, -0.25, 0], registry);
  const { world } = view;
  world.add(kit.grid(7, 14, -1.16));

  const platform = kit.roundedBox(5.7, 0.24, 4.1, 0.12, "metal", { roughness: 0.5 });
  platform.position.y = -1.02;
  world.add(platform);

  const core = new Mesh(
    kit.geometry(new CylinderGeometry(0.7, 0.88, 1.05, 32, 1)),
    kit.material("standard", "gold", { metalness: 0.78, roughness: 0.28 }),
  );
  core.position.y = -0.37;
  world.add(core);

  const cap = new Mesh(
    kit.geometry(new CylinderGeometry(0.48, 0.48, 0.04, 32)),
    kit.material("basic", "paper"),
  );
  cap.position.y = 0.17;
  world.add(cap);

  const rings = [0.93, 1.13].map((radius, index) => {
    const ring = new Mesh(
      kit.geometry(new TorusGeometry(radius, 0.025, 8, 64)),
      kit.material("basic", index ? "signal" : "line", { transparent: true, opacity: index ? 0.75 : 0.42 }),
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = -0.18 + index * 0.24;
    world.add(ring);
    return ring;
  });

  const curves = [];
  const packets = [];
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2 + Math.PI / 6;
    const radius = index % 2 ? 2.28 : 2.05;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.72;
    const node = kit.roundedBox(0.72, 0.76 + (index % 3) * 0.16, 0.72, 0.08, index % 2 ? "structure" : "metal");
    node.position.set(x, -0.58 + node.geometry.parameters.height / 2, z);
    world.add(node);

    const nodeTop = kit.box(0.46, 0.035, 0.46, index % 2 ? "signal" : "gold", { metalness: 0.3, roughness: 0.36 });
    nodeTop.position.set(x, node.position.y + node.geometry.parameters.height / 2 + 0.025, z);
    world.add(nodeTop);

    const curve = new CatmullRomCurve3([
      new Vector3(0, -0.66, 0),
      new Vector3(x * 0.45, -0.42 + (index % 2) * 0.15, z * 0.45),
      new Vector3(x, node.position.y - 0.2, z),
    ]);
    curves.push(curve);
    const tube = new Mesh(
      kit.geometry(new TubeGeometry(curve, 22, 0.018, 5, false)),
      kit.material("basic", index % 2 ? "signal" : "gold", { transparent: true, opacity: 0.8 }),
    );
    world.add(tube);

    const packet = new Mesh(
      kit.geometry(new IcosahedronGeometry(0.075, 1)),
      kit.material("basic", "paper"),
    );
    packets.push(packet);
    world.add(packet);
  }

  view.update = (time) => {
    const seconds = time * 0.001;
    rings[0].rotation.z = seconds * 0.18;
    rings[1].rotation.z = -seconds * 0.14;
    core.rotation.y = seconds * 0.22;
    packets.forEach((packet, index) => {
      packet.position.copy(curves[index].getPointAt((seconds * 0.12 + index / packets.length) % 1));
      packet.scale.setScalar(0.75 + Math.sin(seconds * 3 + index) * 0.18);
    });
    world.rotation.y = Math.sin(seconds * 0.28) * 0.045;
  };
  return view;
}

function buildVisionScene(kit, registry) {
  const view = createScene([6.3, 3.7, 8], [0, -0.15, -0.4], registry);
  const { world } = view;
  world.add(kit.grid(7, 14, -1.38));

  const deck = kit.roundedBox(5.8, 0.18, 4.6, 0.09, "dark", { roughness: 0.54 });
  deck.position.y = -1.3;
  world.add(deck);

  const cameraBody = kit.roundedBox(1.28, 0.86, 0.9, 0.12, "structure");
  cameraBody.position.set(-1.85, 0.05, 2.05);
  world.add(cameraBody);

  const lens = new Mesh(
    kit.geometry(new CylinderGeometry(0.42, 0.52, 0.62, 32)),
    kit.material("standard", "metal", { metalness: 0.88, roughness: 0.24 }),
  );
  lens.rotation.x = Math.PI / 2;
  lens.position.set(-1.85, 0.05, 1.38);
  world.add(lens);

  const lensGlass = new Mesh(
    kit.geometry(new CylinderGeometry(0.3, 0.3, 0.025, 32)),
    kit.material("basic", "signal", { opacity: 0.72, transparent: true }),
  );
  lensGlass.rotation.x = Math.PI / 2;
  lensGlass.position.set(-1.85, 0.05, 1.055);
  world.add(lensGlass);

  const sensorPlane = kit.wireBox(4.4, 2.75, 0.08, "line", 0.42);
  sensorPlane.position.set(0, 0, -1.6);
  world.add(sensorPlane);

  const frustum = kit.lineSegments(
    [
      [[-2.22, 0.38, 1.03], [-2.2, 1.36, -1.56]],
      [[-1.48, 0.38, 1.03], [2.2, 1.36, -1.56]],
      [[-2.22, -0.28, 1.03], [-2.2, -1.36, -1.56]],
      [[-1.48, -0.28, 1.03], [2.2, -1.36, -1.56]],
    ],
    "gold",
    0.62,
  );
  world.add(frustum);

  const boxes = [
    [-0.8, -0.25, -1.48, 1.15, 1.75, 0.26],
    [0.85, 0.55, -1.42, 1.15, 0.85, 0.22],
    [1.25, -0.65, -1.38, 1.42, 0.62, 0.2],
  ].map(([x, y, z, width, height, depth], index) => {
    const box = kit.wireBox(width, height, depth, index ? "red" : "signal", 0.92);
    box.position.set(x, y, z);
    world.add(box);
    return box;
  });

  const landmarkCoordinates = [
    [-0.8, 0.52], [-0.8, 0.25], [-1.12, 0.04], [-1.32, -0.28], [-0.48, 0.04], [-0.25, -0.25],
    [-0.96, -0.32], [-1.1, -0.8], [-1.22, -1.05], [-0.65, -0.32], [-0.52, -0.78], [-0.4, -1.08],
  ];
  const landmarkGeometry = kit.geometry(new BufferGeometry());
  landmarkGeometry.setAttribute(
    "position",
    new BufferAttribute(new Float32Array(landmarkCoordinates.flatMap(([x, y]) => [x, y, -1.31])), 3),
  );
  const landmarks = new Points(
    landmarkGeometry,
    kit.material("points", "paper", { size: 0.095, sizeAttenuation: true, depthWrite: false }),
  );
  world.add(landmarks);

  const scan = kit.box(4.3, 0.025, 0.12, "signal", { transparent: true, opacity: 0.74, metalness: 0.1 });
  scan.position.set(0, 1.25, -1.26);
  world.add(scan);

  const reticle = new Mesh(
    kit.geometry(new TorusGeometry(0.58, 0.018, 6, 72)),
    kit.material("basic", "signal", { opacity: 0.7, transparent: true }),
  );
  reticle.position.set(-0.8, 0.15, -1.24);
  world.add(reticle);

  view.update = (time) => {
    const seconds = time * 0.001;
    scan.position.y = MathUtils.lerp(-1.2, 1.2, (Math.sin(seconds * 1.25) + 1) / 2);
    reticle.rotation.z = seconds * 0.3;
    boxes.forEach((box, index) => {
      box.scale.setScalar(1 + Math.sin(seconds * 1.6 + index * 1.4) * 0.015);
    });
    lensGlass.material.opacity = 0.58 + Math.sin(seconds * 2.4) * 0.12;
    world.rotation.y = Math.sin(seconds * 0.25) * 0.025;
  };
  return view;
}

function buildDataScene(kit, registry, palette) {
  const view = createScene([5.8, 4.9, 7.2], [0, -0.25, 0], registry);
  const { world } = view;
  world.add(kit.grid(7, 14, -1.45));

  const cols = 27;
  const rows = 19;
  const vertexCount = cols * rows;
  const positions = new Float32Array(vertexCount * 3);
  const colors = new Float32Array(vertexCount * 3);
  const base = new Float32Array(vertexCount * 3);
  const noise = new Float32Array(vertexCount);
  const random = seededRandom(0x1a6e2026);
  const indices = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < cols; column += 1) {
      const index = row * cols + column;
      const offset = index * 3;
      base[offset] = (column / (cols - 1) - 0.5) * 5.4;
      base[offset + 1] = -0.3;
      base[offset + 2] = (row / (rows - 1) - 0.5) * 4;
      noise[index] = random() * 2 - 1;
      positions.set(base.subarray(offset, offset + 3), offset);
    }
  }

  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < cols - 1; column += 1) {
      const a = row * cols + column;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const clothGeometry = kit.geometry(new BufferGeometry());
  clothGeometry.setAttribute("position", new BufferAttribute(positions, 3));
  clothGeometry.setAttribute("color", new BufferAttribute(colors, 3));
  clothGeometry.setIndex(indices);
  const clothMaterial = kit.material("standard", "paper", {
    metalness: 0.42,
    roughness: 0.5,
    side: DoubleSide,
    vertexColors: true,
  });
  const cloth = new Mesh(clothGeometry, clothMaterial);
  world.add(cloth);

  const seamPositions = new Float32Array(rows * 3);
  const seamGeometry = kit.geometry(new BufferGeometry());
  seamGeometry.setAttribute("position", new BufferAttribute(seamPositions, 3));
  const seam = new Line(seamGeometry, kit.material("line", "purple", { opacity: 0.95, transparent: true }));
  seam.renderOrder = 4;
  world.add(seam);

  const bars = [];
  for (let index = 0; index < 9; index += 1) {
    const height = 0.25 + random() * 1.1;
    const bar = kit.box(0.16, height, 0.16, index % 3 ? "metal" : "gold", { roughness: 0.32 });
    bar.position.set(-2.45 + index * 0.34, -1.3 + height / 2, -2.55);
    bars.push(bar);
    world.add(bar);
  }

  const particles = [];
  for (let index = 0; index < 18; index += 1) {
    const particle = new Mesh(
      kit.geometry(new IcosahedronGeometry(0.045 + (index % 3) * 0.012, 1)),
      kit.material("basic", index % 4 ? "signal" : "gold"),
    );
    particle.userData.phase = random();
    particle.userData.depth = random() * 3.4 - 1.7;
    particles.push(particle);
    world.add(particle);
  }

  function updateSurface(time) {
    const seconds = time * 0.001;
    for (let index = 0; index < vertexCount; index += 1) {
      const offset = index * 3;
      const x = base[offset];
      const z = base[offset + 2];
      const wave = Math.sin(z * 1.4 + x * 0.65 + seconds * 0.55) * 0.16;
      const detail = x < 0
        ? Math.sin(x * 5.2 - z * 3.7 + seconds * 1.2) * 0.12 + noise[index] * 0.11
        : Math.sin(x * 1.6 - z * 1.1 + seconds * 0.45) * 0.035;
      positions[offset] = x;
      positions[offset + 1] = -0.2 + wave + detail + Math.cos(z * 0.8) * 0.08;
      positions[offset + 2] = z;
      const source = x < 0 ? palette.dark : palette.metal;
      const accentMix = MathUtils.clamp(1 - Math.abs(x) * 2.2, 0, 0.42);
      colors[offset] = MathUtils.lerp(source.r, palette.signal.r, accentMix);
      colors[offset + 1] = MathUtils.lerp(source.g, palette.signal.g, accentMix);
      colors[offset + 2] = MathUtils.lerp(source.b, palette.signal.b, accentMix);
    }
    clothGeometry.attributes.position.needsUpdate = true;
    clothGeometry.attributes.color.needsUpdate = true;
    clothGeometry.computeVertexNormals();

    const seamColumn = Math.floor((cols - 1) / 2);
    for (let row = 0; row < rows; row += 1) {
      const sourceOffset = (row * cols + seamColumn) * 3;
      const targetOffset = row * 3;
      seamPositions[targetOffset] = positions[sourceOffset];
      seamPositions[targetOffset + 1] = positions[sourceOffset + 1] + 0.045;
      seamPositions[targetOffset + 2] = positions[sourceOffset + 2];
    }
    seamGeometry.attributes.position.needsUpdate = true;
  }

  view.update = (time) => {
    const seconds = time * 0.001;
    updateSurface(time);
    bars.forEach((bar, index) => {
      bar.scale.y = 0.82 + Math.sin(seconds * 1.1 + index * 0.55) * 0.16;
    });
    particles.forEach((particle, index) => {
      const progress = (seconds * 0.09 + particle.userData.phase) % 1;
      particle.position.set(-2.45 + progress * 4.9, 0.48 + Math.sin(progress * Math.PI) * 0.65, particle.userData.depth);
      particle.rotation.y = seconds + index;
    });
    world.rotation.y = Math.sin(seconds * 0.22) * 0.035;
  };
  view.update(0);
  return view;
}

function buildInterfaceScene(kit, registry) {
  const view = createScene([5.5, 4.2, 7.3], [0, -0.05, -0.2], registry);
  const { world } = view;
  world.add(kit.grid(7, 14, -1.42));

  const upper = new Group();
  upper.position.set(0, 0.45, -1.25);
  world.add(upper);

  const upperBody = kit.roundedBox(4.5, 2.65, 0.28, 0.2, "structure", { roughness: 0.3 });
  upper.add(upperBody);
  const upperScreen = kit.roundedBox(3.9, 2.05, 0.055, 0.08, "dark", { metalness: 0.15, roughness: 0.58 });
  upperScreen.position.z = 0.17;
  upper.add(upperScreen);

  const traces = [];
  const traceSpecs = [
    [-1.25, 0.55, 1.05, 0.055, "signal"],
    [0.35, 0.55, 1.45, 0.055, "paper"],
    [-1.25, 0.08, 2.25, 0.05, "gold"],
    [-1.25, -0.38, 0.78, 0.05, "paper"],
    [-0.2, -0.38, 1.28, 0.05, "signal"],
    [-1.25, -0.72, 2.7, 0.025, "line"],
  ];
  traceSpecs.forEach(([x, y, width, height, tone]) => {
    const trace = kit.box(width, height, 0.025, tone, { metalness: 0.1, roughness: 0.5 });
    trace.position.set(x + width / 2, y, 0.215);
    traces.push(trace);
    upper.add(trace);
  });

  const lower = new Group();
  lower.position.set(0, -1.03, 0.42);
  lower.rotation.x = -0.66;
  world.add(lower);
  const lowerBody = kit.roundedBox(4.5, 0.28, 3.2, 0.18, "structure", { roughness: 0.32 });
  lower.add(lowerBody);
  const lowerScreen = kit.roundedBox(3.55, 0.06, 1.86, 0.08, "dark", { metalness: 0.12, roughness: 0.56 });
  lowerScreen.position.set(-0.16, 0.18, -0.2);
  lower.add(lowerScreen);

  const lowerLines = [
    [-1.5, 0.215, -0.7, 1.45, 0.035, 0.04, "signal"],
    [0.15, 0.215, -0.7, 0.95, 0.035, 0.04, "gold"],
    [-1.5, 0.215, -0.2, 2.75, 0.025, 0.04, "paper"],
    [-1.5, 0.215, 0.3, 1.85, 0.025, 0.04, "signal"],
  ];
  lowerLines.forEach(([x, y, z, width, height, depth, tone]) => {
    const line = kit.box(width, height, depth, tone, { metalness: 0.1 });
    line.position.set(x + width / 2, y, z);
    lower.add(line);
  });

  const hinge = new Mesh(
    kit.geometry(new CylinderGeometry(0.16, 0.16, 4.1, 28)),
    kit.material("standard", "metal", { metalness: 0.9, roughness: 0.22 }),
  );
  hinge.rotation.z = Math.PI / 2;
  hinge.position.set(0, -0.91, -1.06);
  world.add(hinge);

  const controls = [-1.7, 1.72].map((x, index) => {
    const control = new Mesh(
      kit.geometry(new CylinderGeometry(0.16, 0.16, 0.07, 28)),
      kit.material("standard", index ? "gold" : "signal", { metalness: 0.48, roughness: 0.3 }),
    );
    control.position.set(x, -0.85, 1.45);
    control.rotation.x = Math.PI / 2;
    world.add(control);
    return control;
  });

  const signalOrb = new Mesh(
    kit.geometry(new SphereGeometry(0.12, 18, 12)),
    kit.material("basic", "signal", { transparent: true, opacity: 0.82 }),
  );
  signalOrb.position.set(1.58, 1.38, -1.04);
  world.add(signalOrb);

  view.update = (time) => {
    const seconds = time * 0.001;
    traces.forEach((trace, index) => {
      trace.scale.x = 0.84 + Math.sin(seconds * 1.4 + index * 0.7) * 0.12;
    });
    controls.forEach((control, index) => {
      control.rotation.y = seconds * (index ? -0.7 : 0.7);
    });
    signalOrb.scale.setScalar(0.88 + Math.sin(seconds * 2.6) * 0.13);
    upper.rotation.y = Math.sin(seconds * 0.32) * 0.025;
    world.rotation.y = Math.sin(seconds * 0.2) * 0.025;
  };
  return view;
}

export function initCapabilityVisuals(canvas, stages, { reducedMotion = false, theme = "light" } = {}) {
  const stageList = [...stages];
  const root = canvas.closest("[data-capability-list]");
  if (!root || stageList.length !== CAPABILITY_COUNT) {
    throw new Error(`Capability renderer expected ${CAPABILITY_COUNT} stages.`);
  }

  root.dataset.capabilityRenderState = "loading";
  root.dataset.capabilityVisible = "false";
  const registry = { geometries: new Set(), lights: new Set(), materials: new Set(), textures: new Set() };
  const palette = createPalette(theme);
  const paletteFrom = createPalette(theme);
  const paletteTo = createPalette(theme);
  const kit = createKit(registry, palette);
  let renderer;
  let pmremGenerator;
  let roomEnvironment;
  let environmentTexture;

  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme === "dark" ? 1.08 : 0.98;
    renderer.setClearColor(0x000000, 0);
    renderer.autoClear = false;

    pmremGenerator = new PMREMGenerator(renderer);
    roomEnvironment = new RoomEnvironment();
    environmentTexture = pmremGenerator.fromScene(roomEnvironment, 0.035).texture;

    const scenes = [
      buildProductScene(kit, registry),
      buildVisionScene(kit, registry),
      buildDataScene(kit, registry, palette),
      buildInterfaceScene(kit, registry),
    ];

    const textureLoader = new TextureLoader();
    const brandTexturePaths = [
      "/brand/vct22/masks/light-radial.svg",
      "/brand/vct22/masks/light-convergence.svg",
      "/brand/vct22/masks/light-diagonal.svg",
      "/brand/vct22/masks/light-radial.svg",
    ];
    const brandLights = scenes.map(({ world }, index) => {
      const material = new SpriteMaterial({
        color: palette.gold,
        depthWrite: false,
        opacity: 0.075,
        transparent: true,
        blending: AdditiveBlending,
      });
      material.userData.tone = "gold";
      registry.materials.add(material);
      const sprite = new Sprite(material);
      sprite.position.set(0, 0.9, -2.8);
      sprite.scale.set(7.2, 4.1, 1);
      sprite.renderOrder = -1;
      world.add(sprite);
      textureLoader.load(brandTexturePaths[index], (texture) => {
        registry.textures.add(texture);
        material.map = texture;
        material.needsUpdate = true;
      });
      return sprite;
    });
    scenes.forEach(({ scene }) => {
      scene.environment = environmentTexture;
    });

    let frameId = 0;
    let resizeFrameId = 0;
    let disposed = false;
    let contextAvailable = true;
    let listVisible = false;
    let workRendererActive = false;
    let activityState;
    let themeTransitionStart = -Infinity;
    let lastFrameTime = 0;

    function hasVisibleStage() {
      return stageList.some((stage) => {
        const rect = stage.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
      });
    }

    function canAnimate() {
      return !reducedMotion && contextAvailable && !disposed && listVisible && !document.hidden && !workRendererActive && hasVisibleStage();
    }

    function notifyActivity() {
      const active = canAnimate();
      if (active === activityState) return;
      activityState = active;
      window.dispatchEvent(new CustomEvent("jl:capability-visual-activity", { detail: { active } }));
    }

    function syncState() {
      const visible = listVisible && hasVisibleStage();
      root.dataset.capabilityVisible = String(visible);
      if (!contextAvailable) root.dataset.capabilityRenderState = "fallback";
      else if (reducedMotion) root.dataset.capabilityRenderState = "static";
      else if (canAnimate()) root.dataset.capabilityRenderState = "active";
      else root.dataset.capabilityRenderState = "paused";
      notifyActivity();
    }

    function resizeRenderer() {
      const mobile = window.innerWidth < 768 || navigator.maxTouchPoints > 0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.2 : 1.4));
      renderer.setSize(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight), false);
    }

    function applyPalette(now) {
      const progress = MathUtils.clamp((now - themeTransitionStart) / THEME_DURATION, 0, 1);
      const eased = easeInOutCubic(progress);
      Object.keys(palette).forEach((key) => {
        if (progress < 1) palette[key].lerpColors(paletteFrom[key], paletteTo[key], eased);
        else palette[key].copy(paletteTo[key]);
      });
      registry.materials.forEach((material) => {
        const tone = material.userData.tone;
        if (tone && material.color) material.color.copy(palette[tone]);
      });
      registry.lights.forEach((light) => {
        const tone = light.userData.tone;
        if (tone) light.color.copy(palette[tone]);
      });
    }

    function renderFrame(now, scheduleNext = true) {
      if (disposed || !contextAvailable) return;
      frameId = 0;
      lastFrameTime = now;
      applyPalette(now);
      scenes.forEach((view) => view.update?.(reducedMotion ? 0 : now));
      brandLights.forEach((light, index) => {
        light.material.opacity = (reducedMotion ? 0.055 : 0.075) + Math.sin(now * 0.0004 + index) * 0.012;
      });

      renderer.setScissorTest(false);
      renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
      renderer.clear(true, true, true);
      renderer.setScissorTest(true);

      stageList.forEach((stage, index) => {
        const rect = stage.getBoundingClientRect();
        const left = Math.max(0, Math.round(rect.left));
        const right = Math.min(window.innerWidth, Math.round(rect.right));
        const top = Math.max(0, Math.round(rect.top));
        const bottom = Math.min(window.innerHeight, Math.round(rect.bottom));
        const width = right - left;
        const height = bottom - top;
        if (width <= 1 || height <= 1) return;

        const view = scenes[index];
        view.camera.aspect = width / height;
        view.camera.updateProjectionMatrix();
        renderer.setViewport(left, window.innerHeight - bottom, width, height);
        renderer.setScissor(left, window.innerHeight - bottom, width, height);
        renderer.render(view.scene, view.camera);
      });

      renderer.setScissorTest(false);
      syncState();
      if (scheduleNext) requestFrame();
    }

    function requestFrame() {
      if (canAnimate() && !frameId) frameId = requestAnimationFrame((now) => renderFrame(now));
    }

    function requestSingleFrame() {
      if (disposed || !contextAvailable || document.hidden || resizeFrameId) return;
      resizeFrameId = requestAnimationFrame((now) => {
        resizeFrameId = 0;
        resizeRenderer();
        renderFrame(now, false);
        requestFrame();
      });
    }

    function setTheme(nextTheme) {
      const normalized = nextTheme === "dark" ? "dark" : "light";
      copyPalette(paletteFrom, palette);
      copyPalette(paletteTo, createPalette(normalized));
      themeTransitionStart = reducedMotion ? -Infinity : performance.now();
      renderer.toneMappingExposure = normalized === "dark" ? 1.08 : 0.98;
      requestSingleFrame();
    }

    function handleVisibilityChange() {
      syncState();
      requestSingleFrame();
      requestFrame();
    }

    function handleWorkActivity(event) {
      workRendererActive = Boolean(event.detail?.active);
      syncState();
      requestSingleFrame();
      requestFrame();
    }

    function handleContextLost(event) {
      event.preventDefault();
      contextAvailable = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      frameId = 0;
      resizeFrameId = 0;
      syncState();
    }

    const listObserver = new IntersectionObserver(
      ([entry]) => {
        listVisible = entry.isIntersecting;
        syncState();
        requestSingleFrame();
        requestFrame();
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );
    listObserver.observe(root);

    const resizeObserver = new ResizeObserver(requestSingleFrame);
    stageList.forEach((stage) => resizeObserver.observe(stage));
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("resize", requestSingleFrame, { passive: true });
    window.addEventListener("scroll", requestSingleFrame, { passive: true });
    window.addEventListener("jl:work-visual-activity", handleWorkActivity);

    resizeRenderer();
    renderFrame(performance.now(), false);
    syncState();
    requestFrame();

    function dispose() {
      if (disposed) return;
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      frameId = 0;
      resizeFrameId = 0;
      activityState = true;
      notifyActivity();
      listObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("resize", requestSingleFrame);
      window.removeEventListener("scroll", requestSingleFrame);
      window.removeEventListener("jl:work-visual-activity", handleWorkActivity);
      registry.geometries.forEach((geometry) => geometry.dispose());
      registry.materials.forEach((material) => material.dispose());
      registry.textures.forEach((texture) => texture.dispose());
      environmentTexture.dispose();
      pmremGenerator.dispose();
      roomEnvironment.dispose();
      renderer.dispose();
      root.dataset.capabilityRenderState = "fallback";
    }

    return { dispose, setTheme };
  } catch (error) {
    registry.geometries.forEach((geometry) => geometry.dispose());
    registry.materials.forEach((material) => material.dispose());
    environmentTexture?.dispose();
    pmremGenerator?.dispose();
    roomEnvironment?.dispose();
    renderer?.dispose();
    root.dataset.capabilityRenderState = "fallback";
    root.dataset.capabilityVisible = "false";
    throw error;
  }
}
