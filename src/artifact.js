import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  Group,
  MathUtils,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = new URL("models/tour-de-force-plaque.glb", document.baseURI).href;
const GRAPHITE = 0x111416;
const SETTLE_DURATION = 700;
const MODEL_PARTS = ["PlaqueBase", "SurfaceLand", "EngravingFloor"];

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function fitCamera(camera, stage, objectSize) {
  const rect = stage.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const aspect = width / height;
  const verticalFov = MathUtils.degToRad(camera.fov);
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect);
  const padding = width < 480 ? 1.14 : 1.1;
  const verticalDistance = (objectSize.y * padding) / (2 * Math.tan(verticalFov / 2));
  const horizontalDistance = (objectSize.x * padding) / (2 * Math.tan(horizontalFov / 2));
  camera.aspect = aspect;
  camera.position.set(0, 0, Math.max(verticalDistance, horizontalDistance) + objectSize.z * 0.5);
  camera.updateProjectionMatrix();
  return { height, width };
}

function setStatus(stage, value) {
  const status = stage.querySelector("[data-artifact-status]");
  if (status) status.textContent = value;
}

function showFallback(stage) {
  stage.dataset.artifactState = "failed";
  stage.dataset.artifactRenderState = "fallback";
  stage.classList.remove("artifact-loading", "artifact-ready");
  stage.classList.add("artifact-failed");
  setStatus(stage, "STATIC SVG");
}

export async function initArtifact(canvas, stage, { reducedMotion = false } = {}) {
  stage.dataset.artifactState = "loading";
  stage.dataset.artifactRenderState = "loading";
  stage.classList.remove("artifact-failed", "artifact-ready");
  stage.classList.add("artifact-loading");
  setStatus(stage, "MACHINING");

  let renderer;
  let environmentTexture;
  let pmremGenerator;
  let roomEnvironment;

  try {
    renderer = new WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;

    pmremGenerator = new PMREMGenerator(renderer);
    roomEnvironment = new RoomEnvironment();
    environmentTexture = pmremGenerator.fromScene(roomEnvironment, 0.035).texture;

    const scene = new Scene();
    scene.environment = environmentTexture;

    const camera = new PerspectiveCamera(30, 1, 0.1, 100);
    const world = new Group();
    scene.add(world);

    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    const plaque = gltf.scene;
    const foundParts = new Set();

    plaque.traverse((object) => {
      if (!object.isMesh) return;
      if (MODEL_PARTS.includes(object.name)) foundParts.add(object.name);
      object.castShadow = false;
      object.receiveShadow = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material.name === "BrushedSilver") {
          material.color.setHex(0xbfc3c6);
          material.metalness = 0.9;
          material.roughness = 0.32;
          material.envMapIntensity = 1.15;
        } else if (material.name === "GraphiteRecess") {
          material.color.setHex(GRAPHITE);
          material.metalness = 0.35;
          material.roughness = 0.5;
          material.envMapIntensity = 0.72;
        }
        material.needsUpdate = true;
      });
    });

    for (const part of MODEL_PARTS) {
      if (!foundParts.has(part)) throw new Error(`The plaque model is missing ${part}.`);
    }

    const modelBounds = new Box3().setFromObject(plaque);
    const modelCenter = modelBounds.getCenter(new Vector3());
    const modelSize = modelBounds.getSize(new Vector3());
    plaque.position.sub(modelCenter);
    world.add(plaque);

    const key = new DirectionalLight(0xffffff, 3.4);
    key.position.set(3.8, 4.7, 6.5);
    scene.add(key);
    const rim = new DirectionalLight(0xdde7ef, 2.2);
    rim.position.set(-4.6, 1.8, 3.2);
    scene.add(rim);
    const edge = new DirectionalLight(0xffffff, 0.9);
    edge.position.set(0, -3.8, 2.2);
    scene.add(edge);

    const baseRotation = { x: -0.055, y: -0.105, z: 0.012 };
    const pointer = new Vector2();
    const pointerTarget = new Vector2();
    const settleStart = performance.now();
    let frameId = 0;
    let stageVisible = true;
    let contextAvailable = true;
    let workRendererActive = false;
    let capabilityRendererActive = false;
    let lastScrollY = window.scrollY;
    let scrollImpulse = 0;

    function syncRenderState() {
      if (!contextAvailable) stage.dataset.artifactRenderState = "fallback";
      else if (reducedMotion) stage.dataset.artifactRenderState = "static";
      else stage.dataset.artifactRenderState = stageVisible && !document.hidden && !workRendererActive && !capabilityRendererActive ? "active" : "paused";
    }

    function resize() {
      const { height, width } = fitCamera(camera, stage, modelSize);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      if (reducedMotion || !frameId) renderer.render(scene, camera);
    }

    function canAnimate() {
      return !reducedMotion && stageVisible && !document.hidden && contextAvailable && !workRendererActive && !capabilityRendererActive;
    }

    function requestFrame() {
      if (canAnimate() && !frameId) frameId = requestAnimationFrame(render);
    }

    function render(now) {
      frameId = 0;
      if (!canAnimate()) return;

      const settleProgress = MathUtils.clamp((now - settleStart) / SETTLE_DURATION, 0, 1);
      const settled = easeOutCubic(settleProgress);
      const elapsed = (now - settleStart) / 1000;
      pointer.lerp(pointerTarget, 0.075);
      scrollImpulse *= 0.9;

      world.scale.setScalar(MathUtils.lerp(0.94, 1, settled));
      world.position.y = MathUtils.lerp(-0.08, 0, settled) + Math.sin(elapsed * 1.05) * 0.026;
      world.position.z = MathUtils.lerp(-0.48, 0, settled);
      world.rotation.x = baseRotation.x + pointer.y * 0.055 + MathUtils.lerp(0.055, 0, settled);
      world.rotation.y = baseRotation.y + pointer.x * 0.11 + scrollImpulse;
      world.rotation.z = baseRotation.z - scrollImpulse * 0.14;

      if (settleProgress === 1) setStatus(stage, "INTERACTIVE");
      renderer.render(scene, camera);
      requestFrame();
    }

    function handlePointerMove(event) {
      const rect = stage.getBoundingClientRect();
      pointerTarget.x = MathUtils.clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
      pointerTarget.y = MathUtils.clamp(-(((event.clientY - rect.top) / rect.height) * 2 - 1), -1, 1);
    }

    function handlePointerLeave() {
      pointerTarget.set(0, 0);
    }

    function handleScroll() {
      const delta = window.scrollY - lastScrollY;
      lastScrollY = window.scrollY;
      scrollImpulse = MathUtils.clamp(scrollImpulse + delta * 0.0016, -0.09, 0.09);
    }

    function handleVisibilityChange() {
      syncRenderState();
      requestFrame();
    }

    function handleWorkRendererActivity(event) {
      workRendererActive = Boolean(event.detail?.active);
      syncRenderState();
      requestFrame();
    }

    function handleCapabilityRendererActivity(event) {
      capabilityRendererActive = Boolean(event.detail?.active);
      syncRenderState();
      requestFrame();
    }

    function handleContextLost(event) {
      event.preventDefault();
      contextAvailable = false;
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      showFallback(stage);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        stageVisible = entry.isIntersecting;
        syncRenderState();
        requestFrame();
      },
      { rootMargin: "100px" },
    );
    visibilityObserver.observe(stage);

    canvas.addEventListener("webglcontextlost", handleContextLost, false);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("jl:work-visual-activity", handleWorkRendererActivity);
    window.addEventListener("jl:capability-visual-activity", handleCapabilityRendererActivity);
    if (!reducedMotion) {
      stage.addEventListener("pointermove", handlePointerMove);
      stage.addEventListener("pointerleave", handlePointerLeave);
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    if (reducedMotion) {
      world.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z);
      world.scale.setScalar(1);
      setStatus(stage, "STATIC FRAME");
    } else {
      world.position.set(0, -0.08, -0.48);
      world.rotation.set(baseRotation.x + 0.055, baseRotation.y, baseRotation.z);
      world.scale.setScalar(0.94);
    }

    resize();
    renderer.render(scene, camera);
    stage.dataset.artifactState = "ready";
    syncRenderState();
    stage.classList.remove("artifact-loading");
    requestAnimationFrame(() => stage.classList.add("artifact-ready"));
    requestFrame();

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("jl:work-visual-activity", handleWorkRendererActivity);
      window.removeEventListener("jl:capability-visual-activity", handleCapabilityRendererActivity);
      stage.removeEventListener("pointermove", handlePointerMove);
      stage.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("scroll", handleScroll);
      plaque.traverse((object) => {
        if (!object.isMesh) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      environmentTexture.dispose();
      pmremGenerator.dispose();
      roomEnvironment.dispose();
      renderer.dispose();
    };
  } catch (error) {
    environmentTexture?.dispose();
    pmremGenerator?.dispose();
    roomEnvironment?.dispose();
    renderer?.dispose();
    showFallback(stage);
    throw error;
  }
}
