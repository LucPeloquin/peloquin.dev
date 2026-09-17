/*
 * Shared Three.js renderer for Selected Work.
 *
 * The topology, instanced core, and deformable line-field techniques are
 * substantially adapted from Meng To's ThreeUI Community sources at pinned
 * commit fbc9b3d61b0ef4b2e93b42e4fffa617ca277429b. ThreeUI is MIT licensed;
 * the complete notice and exact source paths are in THIRD_PARTY_NOTICES.md.
 * No ThreeUI package, React dependency, thumbnail, preview, or remote asset is
 * included here.
 */

import {
  ACESFilmicToneMapping,
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  DynamicDrawUsage,
  Euler,
  Group,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Matrix4,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  PointLight,
  Points,
  PointsMaterial,
  Quaternion,
  Scene,
  Spherical,
  SRGBColorSpace,
  TOUCH,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  buildWorkVisualStates,
  FIELD_COLUMNS,
  FIELD_ROWS,
  INSTANCE_COUNT,
  POINT_COUNT,
  TOPOLOGY_EDGES,
} from "./work-visual-states.js";

const MORPH_DURATION = 800;
const THEME_DURATION = 520;
const CAMERA_RESET_DURATION = 620;
const MIN_CAMERA_DISTANCE = 6.2;
const MAX_CAMERA_DISTANCE = 18.5;
const MIN_FRAMING_ASPECT = 0.72;

const PALETTES = {
  light: {
    structure: 0x545b57,
    signal: 0xc5b174,
    gold: 0xc5b174,
    points: 0xdc3030,
    topology: 0x68736c,
    field: 0x6f4acc,
    key: 0xfafbf6,
    rim: 0xffffff,
    ambient: 0xcfd4cd,
  },
  dark: {
    structure: 0xd6dbd5,
    signal: 0xc5b174,
    gold: 0xc5b174,
    points: 0xffffff,
    topology: 0x9ba49e,
    field: 0x6f4acc,
    key: 0xffffff,
    rim: 0xffffff,
    ambient: 0x515b55,
  },
};

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2;
}

function createDynamicAttribute(array) {
  const attribute = new BufferAttribute(array, 3);
  attribute.setUsage(DynamicDrawUsage);
  return attribute;
}

function clonePalette(name) {
  const source = PALETTES[name] ?? PALETTES.light;
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, new Color(value)]));
}

function copyPalette(target, source) {
  Object.keys(target).forEach((key) => target[key].copy(source[key]));
}

function lerpPalette(target, from, to, amount) {
  Object.keys(target).forEach((key) => target[key].copy(from[key]).lerp(to[key], amount));
}

function toneColor(target, tone, palette) {
  if (tone <= 1) return target.copy(palette.structure).lerp(palette.signal, MathUtils.clamp(tone, 0, 1));
  return target.copy(palette.signal).lerp(palette.gold, MathUtils.clamp(tone - 1, 0, 1));
}

function interpolateBuffer(target, from, to, amount) {
  for (let index = 0; index < target.length; index += 1) {
    target[index] = from[index] + (to[index] - from[index]) * amount;
  }
}

function copyInstanceLayer(target, source) {
  target.positions.set(source.positions);
  target.rotations.set(source.rotations);
  target.scales.set(source.scales);
  target.tones.set(source.tones);
}

function createInstanceLayerBuffer() {
  return {
    positions: new Float32Array(INSTANCE_COUNT * 3),
    rotations: new Float32Array(INSTANCE_COUNT * 3),
    scales: new Float32Array(INSTANCE_COUNT * 3),
    tones: new Float32Array(INSTANCE_COUNT),
  };
}

function interpolateInstanceLayer(target, from, to, amount) {
  interpolateBuffer(target.positions, from.positions, to.positions, amount);
  interpolateBuffer(target.rotations, from.rotations, to.rotations, amount);
  interpolateBuffer(target.scales, from.scales, to.scales, amount);
  interpolateBuffer(target.tones, from.tones, to.tones, amount);
}

function updateStageCopy(stage, state, renderState) {
  const project = stage.querySelector("[data-work-visual-project]");
  const status = stage.querySelector("[data-work-visual-status]");
  if (project) project.textContent = state.id.replaceAll("-", " / ").toUpperCase();
  if (status) {
    status.textContent = {
      loading: "INITIALIZING",
      ready: "WEBGL / ACTIVE",
      paused: "WEBGL / PAUSED",
      static: "WEBGL / STATIC",
      fallback: "CSS / FALLBACK",
    }[renderState] ?? "WEBGL";
  }
}

function showFallback(stage, state) {
  stage.dataset.workVisualState = "fallback";
  updateStageCopy(stage, state, "fallback");
}

export function initWorkVisual(canvas, stage, {
  initialProject = 0,
  reducedMotion = false,
  theme = "light",
} = {}) {
  const states = buildWorkVisualStates();
  let activeIndex = MathUtils.euclideanModulo(initialProject, states.length);
  let activeState = states[activeIndex];
  stage.dataset.workVisualState = "loading";
  updateStageCopy(stage, activeState, "loading");

  let renderer;
  let environmentTexture;
  let environmentScene;
  let pmremGenerator;

  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme === "dark" ? 1.08 : 0.96;
    renderer.setClearColor(0x000000, 0);

    pmremGenerator = new PMREMGenerator(renderer);
    environmentScene = new RoomEnvironment();
    environmentTexture = pmremGenerator.fromScene(environmentScene, 0.035).texture;

    const scene = new Scene();
    scene.environment = environmentTexture;
    const camera = new PerspectiveCamera(activeState.camera.fov, 1, 0.1, 80);
    camera.position.fromArray(activeState.camera.position);

    const world = new Group();
    scene.add(world);

    const palette = clonePalette(theme);
    const paletteFrom = clonePalette(theme);
    const paletteTo = clonePalette(theme);
    let themeTransitionStart = -Infinity;

    const pointPositions = new Float32Array(POINT_COUNT * 3);
    pointPositions.set(activeState.topology);
    const pointGeometry = new BufferGeometry();
    const pointAttribute = createDynamicAttribute(pointPositions);
    pointGeometry.setAttribute("position", pointAttribute);
    const pointMaterial = new PointsMaterial({
      color: palette.points,
      opacity: theme === "dark" ? 0.92 : 0.82,
      size: 0.085,
      sizeAttenuation: true,
      transparent: true,
      depthWrite: false,
    });
    const points = new Points(pointGeometry, pointMaterial);
    points.renderOrder = 4;
    world.add(points);

    const topologyLinePositions = new Float32Array(TOPOLOGY_EDGES.length * 3);
    const topologyGeometry = new BufferGeometry();
    const topologyAttribute = createDynamicAttribute(topologyLinePositions);
    topologyGeometry.setAttribute("position", topologyAttribute);
    const topologyMaterial = new LineBasicMaterial({
      color: palette.topology,
      opacity: theme === "dark" ? 0.28 : 0.22,
      transparent: true,
      depthWrite: false,
    });
    const topologyLines = new LineSegments(topologyGeometry, topologyMaterial);
    topologyLines.renderOrder = 2;
    world.add(topologyLines);

    const fieldSegmentCount = FIELD_ROWS * (FIELD_COLUMNS - 1);
    const fieldLinePositions = new Float32Array(fieldSegmentCount * 2 * 3);
    const fieldGeometry = new BufferGeometry();
    const fieldAttribute = createDynamicAttribute(fieldLinePositions);
    fieldGeometry.setAttribute("position", fieldAttribute);
    const fieldMaterial = new LineBasicMaterial({
      color: palette.field,
      opacity: theme === "dark" ? 0.72 : 0.62,
      transparent: true,
      depthWrite: false,
    });
    const fieldLines = new LineSegments(fieldGeometry, fieldMaterial);
    fieldLines.renderOrder = 3;
    world.add(fieldLines);

    const instanceGeometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.07);
    const instanceMaterial = new MeshStandardMaterial({
      color: 0xffffff,
      metalness: 0.66,
      roughness: 0.38,
      vertexColors: true,
    });
    const instances = new InstancedMesh(instanceGeometry, instanceMaterial, INSTANCE_COUNT);
    instances.instanceMatrix.setUsage(DynamicDrawUsage);
    instances.frustumCulled = false;
    world.add(instances);

    const ambient = new AmbientLight(palette.ambient, theme === "dark" ? 1.25 : 1.85);
    scene.add(ambient);
    const key = new DirectionalLight(palette.key, theme === "dark" ? 3.1 : 2.8);
    key.position.set(4.8, 8.2, 7.4);
    scene.add(key);
    const rim = new DirectionalLight(palette.rim, theme === "dark" ? 2.25 : 1.55);
    rim.position.set(-6.5, 2.4, -4.2);
    scene.add(rim);
    const coreLight = new PointLight(palette.gold, theme === "dark" ? 13 : 9, 11, 2);
    coreLight.position.set(0, 1.4, 0.6);
    scene.add(coreLight);

    const controls = new OrbitControls(camera, canvas);
    controls.target.fromArray(activeState.camera.target);
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = 0.07;
    controls.enablePan = false;
    controls.enableRotate = !reducedMotion;
    controls.enableZoom = !reducedMotion;
    controls.minDistance = MIN_CAMERA_DISTANCE;
    controls.maxDistance = MAX_CAMERA_DISTANCE;
    controls.minPolarAngle = 0.08;
    controls.maxPolarAngle = Math.PI - 0.08;
    controls.touches.ONE = TOUCH.ROTATE;
    controls.touches.TWO = TOUCH.DOLLY_ROTATE;
    controls.update();

    const currentTopology = new Float32Array(activeState.topology);
    const fromTopology = new Float32Array(activeState.topology);
    const currentField = new Float32Array(activeState.field);
    const fromField = new Float32Array(activeState.field);
    const currentInstances = createInstanceLayerBuffer();
    const fromInstances = createInstanceLayerBuffer();
    copyInstanceLayer(currentInstances, activeState.instances);
    copyInstanceLayer(fromInstances, activeState.instances);

    const toneScratch = new Color();
    const cameraFromPosition = new Vector3();
    const cameraToPosition = new Vector3();
    const cameraFromTarget = new Vector3();
    const cameraToTarget = new Vector3();
    const cameraTargetScratch = new Vector3();
    const matrixScratch = new Matrix4();
    const quaternionScratch = new Quaternion();
    const eulerScratch = new Euler();
    const positionScratch = new Vector3();
    const scaleScratch = new Vector3();
    const spherical = new Spherical();
    const orbitOffset = new Vector3();

    let targetState = activeState;
    let morphStart = -Infinity;
    let morphing = false;
    let cameraTweenStart = -Infinity;
    let cameraTweenDuration = MORPH_DURATION;
    let cameraFromFov = camera.fov;
    let cameraToFov = camera.fov;
    let cameraTweening = false;
    let frameId = 0;
    let stageVisible = true;
    let contextAvailable = true;
    let disposed = false;
    let lastFrameTime = performance.now();
    let activityState;
    let cameraDistanceScale = 1;

    function setCanvasLabel(state) {
      canvas.setAttribute(
        "aria-label",
        `Interactive 3D visualization: ${state.label}. Drag to orbit, pinch or scroll to zoom, or press R to reset the camera.`,
      );
    }

    function canAnimate() {
      return !reducedMotion && stageVisible && !document.hidden && contextAvailable && !disposed;
    }

    function notifyActivity() {
      const active = canAnimate();
      if (active === activityState) return;
      activityState = active;
      window.dispatchEvent(new CustomEvent("jl:work-visual-activity", { detail: { active } }));
    }

    function syncRenderState() {
      let renderState = "ready";
      if (!contextAvailable) renderState = "fallback";
      else if (reducedMotion) renderState = "static";
      else if (!stageVisible || document.hidden) renderState = "paused";
      stage.dataset.workVisualState = renderState;
      updateStageCopy(stage, activeState, renderState);
      notifyActivity();
    }

    function writeTopologyBuffers() {
      pointPositions.set(currentTopology);
      pointAttribute.needsUpdate = true;
      for (let edgeIndex = 0; edgeIndex < TOPOLOGY_EDGES.length; edgeIndex += 1) {
        const pointIndex = TOPOLOGY_EDGES[edgeIndex];
        const sourceOffset = pointIndex * 3;
        const targetOffset = edgeIndex * 3;
        topologyLinePositions[targetOffset] = currentTopology[sourceOffset];
        topologyLinePositions[targetOffset + 1] = currentTopology[sourceOffset + 1];
        topologyLinePositions[targetOffset + 2] = currentTopology[sourceOffset + 2];
      }
      topologyAttribute.needsUpdate = true;
    }

    function writeFieldBuffer() {
      let targetOffset = 0;
      for (let row = 0; row < FIELD_ROWS; row += 1) {
        for (let column = 0; column < FIELD_COLUMNS - 1; column += 1) {
          const first = (row * FIELD_COLUMNS + column) * 3;
          const second = first + 3;
          fieldLinePositions[targetOffset++] = currentField[first];
          fieldLinePositions[targetOffset++] = currentField[first + 1];
          fieldLinePositions[targetOffset++] = currentField[first + 2];
          fieldLinePositions[targetOffset++] = currentField[second];
          fieldLinePositions[targetOffset++] = currentField[second + 1];
          fieldLinePositions[targetOffset++] = currentField[second + 2];
        }
      }
      fieldAttribute.needsUpdate = true;
    }

    function writeInstanceBuffer() {
      for (let index = 0; index < INSTANCE_COUNT; index += 1) {
        const offset = index * 3;
        positionScratch.fromArray(currentInstances.positions, offset);
        eulerScratch.set(
          currentInstances.rotations[offset],
          currentInstances.rotations[offset + 1],
          currentInstances.rotations[offset + 2],
        );
        quaternionScratch.setFromEuler(eulerScratch);
        scaleScratch.fromArray(currentInstances.scales, offset);
        matrixScratch.compose(positionScratch, quaternionScratch, scaleScratch);
        instances.setMatrixAt(index, matrixScratch);
        instances.setColorAt(index, toneColor(toneScratch, currentInstances.tones[index], palette));
      }
      instances.instanceMatrix.needsUpdate = true;
      if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
    }

    function writeSceneBuffers() {
      writeTopologyBuffers();
      writeFieldBuffer();
      writeInstanceBuffer();
    }

    function applyPalette(now) {
      const progress = MathUtils.clamp((now - themeTransitionStart) / THEME_DURATION, 0, 1);
      if (progress < 1) lerpPalette(palette, paletteFrom, paletteTo, easeInOutCubic(progress));
      else copyPalette(palette, paletteTo);
      pointMaterial.color.copy(palette.points);
      topologyMaterial.color.copy(palette.topology);
      fieldMaterial.color.copy(palette.field);
      ambient.color.copy(palette.ambient);
      key.color.copy(palette.key);
      rim.color.copy(palette.rim);
      coreLight.color.copy(palette.gold);
    }

    function beginCameraTween(state, duration = MORPH_DURATION) {
      cameraFromPosition.copy(camera.position);
      cameraFromTarget.copy(controls.target);
      cameraToTarget.fromArray(state.camera.target);
      cameraToPosition
        .fromArray(state.camera.position)
        .sub(cameraToTarget)
        .multiplyScalar(cameraDistanceScale)
        .add(cameraToTarget);
      cameraFromFov = camera.fov;
      cameraToFov = state.camera.fov;
      cameraTweenStart = performance.now();
      cameraTweenDuration = reducedMotion ? 0 : duration;
      cameraTweening = cameraTweenDuration > 0;
      if (!cameraTweening) {
        camera.position.copy(cameraToPosition);
        controls.target.copy(cameraToTarget);
        camera.fov = cameraToFov;
        camera.updateProjectionMatrix();
        controls.update();
      }
    }

    function updateCameraTween(now) {
      if (!cameraTweening) return;
      const progress = MathUtils.clamp((now - cameraTweenStart) / cameraTweenDuration, 0, 1);
      const eased = easeInOutCubic(progress);
      camera.position.lerpVectors(cameraFromPosition, cameraToPosition, eased);
      controls.target.lerpVectors(cameraFromTarget, cameraToTarget, eased);
      camera.fov = MathUtils.lerp(cameraFromFov, cameraToFov, eased);
      camera.updateProjectionMatrix();
      if (progress === 1) cameraTweening = false;
    }

    function updateMorph(now) {
      if (!morphing) return;
      const progress = MathUtils.clamp((now - morphStart) / MORPH_DURATION, 0, 1);
      const eased = easeInOutCubic(progress);
      interpolateBuffer(currentTopology, fromTopology, targetState.topology, eased);
      interpolateBuffer(currentField, fromField, targetState.field, eased);
      interpolateInstanceLayer(currentInstances, fromInstances, targetState.instances, eased);
      if (progress === 1) {
        morphing = false;
        activeState = targetState;
        updateStageCopy(stage, activeState, stage.dataset.workVisualState);
      }
    }

    function resize() {
      const rect = stage.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
      camera.aspect = width / height;
      const framingAspect = width < 480 ? 1.08 : MIN_FRAMING_ASPECT;
      const nextDistanceScale = Math.max(1, framingAspect / camera.aspect);
      const distanceRatio = nextDistanceScale / cameraDistanceScale;
      if (Math.abs(distanceRatio - 1) > 0.001) {
        camera.position.sub(controls.target).multiplyScalar(distanceRatio).add(controls.target);
        cameraFromPosition.sub(cameraFromTarget).multiplyScalar(distanceRatio).add(cameraFromTarget);
        cameraToPosition.sub(cameraToTarget).multiplyScalar(distanceRatio).add(cameraToTarget);
        cameraDistanceScale = nextDistanceScale;
      }
      controls.maxDistance = MAX_CAMERA_DISTANCE * cameraDistanceScale;
      camera.updateProjectionMatrix();
      const mobile = width < 768 || navigator.maxTouchPoints > 0;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      if (reducedMotion || !frameId) renderFrame(performance.now(), false);
    }

    function renderFrame(now, scheduleNext = true) {
      if (disposed || !contextAvailable) return;
      frameId = 0;
      const delta = Math.min(0.05, Math.max(0, (now - lastFrameTime) / 1000));
      lastFrameTime = now;
      updateMorph(now);
      updateCameraTween(now);
      applyPalette(now);
      writeSceneBuffers();

      if (!reducedMotion) {
        const ambientTurn = Math.sin(now * 0.00017) * 0.035;
        world.rotation.y = MathUtils.damp(world.rotation.y, ambientTurn, 3.2, delta);
        world.position.y = Math.sin(now * 0.0007) * 0.045;
        controls.update(delta);
      } else {
        world.rotation.y = 0;
        world.position.y = 0;
      }

      renderer.render(scene, camera);
      if (scheduleNext) requestFrame();
    }

    function requestFrame() {
      if (canAnimate() && !frameId) frameId = requestAnimationFrame((now) => renderFrame(now));
    }

    function setProject(index) {
      const nextIndex = MathUtils.euclideanModulo(index, states.length);
      const nextState = states[nextIndex];
      activeIndex = nextIndex;
      activeState = nextState;
      targetState = nextState;
      setCanvasLabel(nextState);
      updateStageCopy(stage, nextState, stage.dataset.workVisualState);

      if (reducedMotion) {
        currentTopology.set(nextState.topology);
        currentField.set(nextState.field);
        copyInstanceLayer(currentInstances, nextState.instances);
        beginCameraTween(nextState, 0);
        applyPalette(performance.now());
        writeSceneBuffers();
        renderer.render(scene, camera);
        return;
      }

      fromTopology.set(currentTopology);
      fromField.set(currentField);
      copyInstanceLayer(fromInstances, currentInstances);
      morphStart = performance.now();
      morphing = true;
      beginCameraTween(nextState, MORPH_DURATION);
      requestFrame();
    }

    function setTheme(nextTheme) {
      const normalized = nextTheme === "dark" ? "dark" : "light";
      copyPalette(paletteFrom, palette);
      copyPalette(paletteTo, clonePalette(normalized));
      themeTransitionStart = reducedMotion ? -Infinity : performance.now();
      renderer.toneMappingExposure = normalized === "dark" ? 1.08 : 0.96;
      ambient.intensity = normalized === "dark" ? 1.25 : 1.85;
      key.intensity = normalized === "dark" ? 3.1 : 2.8;
      rim.intensity = normalized === "dark" ? 2.25 : 1.55;
      coreLight.intensity = normalized === "dark" ? 13 : 9;
      pointMaterial.opacity = normalized === "dark" ? 0.92 : 0.82;
      topologyMaterial.opacity = normalized === "dark" ? 0.28 : 0.22;
      fieldMaterial.opacity = normalized === "dark" ? 0.72 : 0.62;
      if (reducedMotion) {
        copyPalette(palette, paletteTo);
        writeSceneBuffers();
        renderer.render(scene, camera);
      } else {
        requestFrame();
      }
    }

    function resetCamera() {
      beginCameraTween(states[activeIndex], CAMERA_RESET_DURATION);
      if (reducedMotion) renderer.render(scene, camera);
      else requestFrame();
    }

    function handleKeyboard(event) {
      if (reducedMotion) return;
      const key = event.key.toLowerCase();
      const isOrbitKey = ["arrowleft", "arrowright", "arrowup", "arrowdown"].includes(key);
      const isZoomKey = ["+", "=", "-", "_"].includes(key);
      if (!isOrbitKey && !isZoomKey && key !== "r") return;
      event.preventDefault();
      if (key === "r") {
        resetCamera();
        return;
      }

      orbitOffset.copy(camera.position).sub(controls.target);
      spherical.setFromVector3(orbitOffset);
      if (key === "arrowleft") spherical.theta -= 0.12;
      if (key === "arrowright") spherical.theta += 0.12;
      if (key === "arrowup") spherical.phi = Math.max(controls.minPolarAngle, spherical.phi - 0.1);
      if (key === "arrowdown") spherical.phi = Math.min(controls.maxPolarAngle, spherical.phi + 0.1);
      if (key === "+" || key === "=") spherical.radius = Math.max(MIN_CAMERA_DISTANCE, spherical.radius * 0.9);
      if (key === "-" || key === "_") spherical.radius = Math.min(controls.maxDistance, spherical.radius * 1.1);
      orbitOffset.setFromSpherical(spherical);
      camera.position.copy(controls.target).add(orbitOffset);
      controls.update();
      requestFrame();
    }

    function handleVisibilityChange() {
      syncRenderState();
      requestFrame();
    }

    function handleContextLost(event) {
      event.preventDefault();
      contextAvailable = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      showFallback(stage, activeState);
      notifyActivity();
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        stageVisible = entry.isIntersecting;
        syncRenderState();
        requestFrame();
      },
      { rootMargin: "120px", threshold: 0.01 },
    );
    visibilityObserver.observe(stage);

    canvas.addEventListener("keydown", handleKeyboard);
    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    setCanvasLabel(activeState);
    writeSceneBuffers();
    resize();
    renderer.render(scene, camera);
    syncRenderState();
    requestFrame();

    function dispose() {
      if (disposed) return;
      disposed = true;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      activityState = true;
      notifyActivity();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("keydown", handleKeyboard);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      controls.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      topologyGeometry.dispose();
      topologyMaterial.dispose();
      fieldGeometry.dispose();
      fieldMaterial.dispose();
      instanceGeometry.dispose();
      instanceMaterial.dispose();
      environmentTexture.dispose();
      pmremGenerator.dispose();
      environmentScene.dispose();
      renderer.dispose();
    }

    return { setProject, setTheme, resetCamera, dispose };
  } catch (error) {
    environmentTexture?.dispose();
    pmremGenerator?.dispose();
    environmentScene?.dispose();
    renderer?.dispose();
    showFallback(stage, activeState);
    throw error;
  }
}
