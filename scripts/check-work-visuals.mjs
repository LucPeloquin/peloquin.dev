#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  buildWorkVisualStates,
  FIELD_POINT_COUNT,
  INSTANCE_COUNT,
  POINT_COUNT,
  TOPOLOGY_EDGES,
  WORK_VISUAL_SOURCE_COMMIT,
} from "../src/work-visual-states.js";

const expectedIds = ["vct-fantasy", "broadcast-vision", "fashion-enhancer", "portfolio-os", "quick-save"];

function assertFiniteBuffer(buffer, label) {
  assert.ok(ArrayBuffer.isView(buffer), `${label} must be a typed array.`);
  for (let index = 0; index < buffer.length; index += 1) {
    assert.ok(Number.isFinite(buffer[index]), `${label}[${index}] is not finite.`);
    assert.ok(Math.abs(buffer[index]) <= 20, `${label}[${index}] exceeds the scene bounds.`);
  }
}

function assertEqualBuffers(first, second, label) {
  assert.equal(first.length, second.length, `${label} lengths differ.`);
  for (let index = 0; index < first.length; index += 1) {
    assert.equal(first[index], second[index], `${label} is not deterministic at ${index}.`);
  }
}

const firstBuild = buildWorkVisualStates();
const secondBuild = buildWorkVisualStates();

assert.equal(firstBuild.length, 5, "Exactly five work visual states are required.");
assert.deepEqual(firstBuild.map((state) => state.id), expectedIds, "Work state order or IDs changed.");
assert.equal(new Set(firstBuild.map((state) => state.id)).size, 5, "Work state IDs must be unique.");

firstBuild.forEach((state, stateIndex) => {
  const repeated = secondBuild[stateIndex];
  assert.equal(state.topology.length, POINT_COUNT * 3, `${state.id} has the wrong topology buffer size.`);
  assert.equal(state.field.length, FIELD_POINT_COUNT * 3, `${state.id} has the wrong line-field buffer size.`);
  assert.equal(state.instances.positions.length, INSTANCE_COUNT * 3, `${state.id} has the wrong instance position count.`);
  assert.equal(state.instances.rotations.length, INSTANCE_COUNT * 3, `${state.id} has the wrong instance rotation count.`);
  assert.equal(state.instances.scales.length, INSTANCE_COUNT * 3, `${state.id} has the wrong instance scale count.`);
  assert.equal(state.instances.tones.length, INSTANCE_COUNT, `${state.id} has the wrong instance tone count.`);

  assertFiniteBuffer(state.topology, `${state.id}.topology`);
  assertFiniteBuffer(state.field, `${state.id}.field`);
  assertFiniteBuffer(state.instances.positions, `${state.id}.instances.positions`);
  assertFiniteBuffer(state.instances.rotations, `${state.id}.instances.rotations`);
  assertFiniteBuffer(state.instances.scales, `${state.id}.instances.scales`);
  assertFiniteBuffer(state.instances.tones, `${state.id}.instances.tones`);
  for (const scale of state.instances.scales) assert.ok(scale > 0, `${state.id} includes a non-positive instance scale.`);
  for (const tone of state.instances.tones) assert.ok(tone >= 0 && tone <= 2, `${state.id} includes an invalid material tone.`);

  assertEqualBuffers(state.topology, repeated.topology, `${state.id}.topology`);
  assertEqualBuffers(state.field, repeated.field, `${state.id}.field`);
  assertEqualBuffers(state.instances.positions, repeated.instances.positions, `${state.id}.instances.positions`);
  assertEqualBuffers(state.instances.rotations, repeated.instances.rotations, `${state.id}.instances.rotations`);
  assertEqualBuffers(state.instances.scales, repeated.instances.scales, `${state.id}.instances.scales`);
  assertEqualBuffers(state.instances.tones, repeated.instances.tones, `${state.id}.instances.tones`);

  assert.equal(state.camera.position.length, 3, `${state.id} camera position is invalid.`);
  assert.equal(state.camera.target.length, 3, `${state.id} camera target is invalid.`);
  [...state.camera.position, ...state.camera.target].forEach((value) => assert.ok(Number.isFinite(value), `${state.id} camera contains a non-finite value.`));
  const cameraDistance = Math.hypot(
    state.camera.position[0] - state.camera.target[0],
    state.camera.position[1] - state.camera.target[1],
    state.camera.position[2] - state.camera.target[2],
  );
  assert.ok(cameraDistance >= 6.2 && cameraDistance <= 18.5, `${state.id} camera distance is outside OrbitControls bounds.`);
  assert.ok(state.camera.fov >= 28 && state.camera.fov <= 45, `${state.id} camera FOV is unsafe.`);
  assert.ok(state.label.length >= 20, `${state.id} needs a descriptive accessible label.`);
});

assert.equal(TOPOLOGY_EDGES.length % 2, 0, "Topology edge pairs are malformed.");
for (const index of TOPOLOGY_EDGES) assert.ok(index < POINT_COUNT, `Topology edge index ${index} is out of bounds.`);

const [rendererSource, stateSource, notices, provenance, packageJson] = await Promise.all([
  readFile(new URL("../src/work-visual.js", import.meta.url), "utf8"),
  readFile(new URL("../src/work-visual-states.js", import.meta.url), "utf8"),
  readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), "utf8"),
  readFile(new URL("../ASSET_PROVENANCE.md", import.meta.url), "utf8"),
  readFile(new URL("../package.json", import.meta.url), "utf8"),
]);

const visualSource = `${rendererSource}\n${stateSource}`;
assert.equal((rendererSource.match(/new WebGLRenderer/g) ?? []).length, 1, "The Work renderer must create exactly one WebGL context.");
assert.match(rendererSource, /MORPH_DURATION\s*=\s*800/, "The authored 800ms morph duration is missing.");
for (const method of ["setProject", "setTheme", "resetCamera", "dispose"]) {
  assert.match(rendererSource, new RegExp(`\\b${method}\\b`), `Renderer interface is missing ${method}().`);
}
assert.doesNotMatch(visualSource, /https?:\/\//i, "Work visual source must not reference remote assets.");
assert.doesNotMatch(visualSource, /TextureLoader|GLTFLoader|fetch\s*\(/, "Work visual source must remain fully procedural and local.");

for (const sourceName of ["platform-core.html", "nexus-topology.html", "vertex-9.html"]) {
  assert.ok(notices.includes(sourceName), `Third-party notice is missing ${sourceName}.`);
  assert.ok(provenance.includes(sourceName), `Asset provenance is missing ${sourceName}.`);
}
assert.ok(notices.includes(WORK_VISUAL_SOURCE_COMMIT), "Third-party notice is missing the pinned ThreeUI commit.");
assert.match(notices, /Permission is hereby granted, free of charge/, "Complete MIT license text is missing.");
assert.match(notices, /Copyright \(c\) 2026 Meng To/, "ThreeUI copyright notice is missing.");

const packageData = JSON.parse(packageJson);
const installedNames = [...Object.keys(packageData.dependencies ?? {}), ...Object.keys(packageData.devDependencies ?? {})];
assert.ok(!installedNames.some((name) => /react|threeui/i.test(name)), "React or the ThreeUI package must not be installed.");
assert.equal(packageData.dependencies?.three, "^0.180.0", "Work visuals must use the existing three@0.180 runtime.");

console.log(`Validated ${firstBuild.length} deterministic work states (${POINT_COUNT} topology points, ${FIELD_POINT_COUNT} field points, ${INSTANCE_COUNT} instances each).`);
console.log(`Pinned ThreeUI Community attribution: ${WORK_VISUAL_SOURCE_COMMIT.slice(0, 7)}; one local WebGL renderer; no remote assets.`);
