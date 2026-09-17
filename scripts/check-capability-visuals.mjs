import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const rendererPath = resolve(root, "src/capability-visuals.js");
const mainPath = resolve(root, "src/main.js");
const artifactPath = resolve(root, "src/artifact.js");
const htmlPath = resolve(root, "index.html");
const emblemPath = resolve(root, "public/images/hero-scope-3d.webp");

const [renderer, main, artifact, html, emblemStats] = await Promise.all([
  readFile(rendererPath, "utf8"),
  readFile(mainPath, "utf8"),
  readFile(artifactPath, "utf8"),
  readFile(htmlPath, "utf8"),
  stat(emblemPath),
]);

assert.match(renderer, /const CAPABILITY_COUNT = 4;/, "Renderer must define exactly four capability states.");
assert.equal((renderer.match(/new WebGLRenderer\(/g) ?? []).length, 1, "Capability visuals must share one WebGL renderer.");
assert.equal((html.match(/data-capability-stage="[0-3]"/g) ?? []).length, 4, "HTML must provide four capability stages.");
assert.equal((html.match(/data-capability-canvas/g) ?? []).length, 1, "HTML must provide one shared capability canvas.");

for (const builder of ["buildProductScene", "buildVisionScene", "buildDataScene", "buildInterfaceScene"]) {
  assert.match(renderer, new RegExp(`function ${builder}\\(`), `Missing ${builder}.`);
}

for (const state of ["loading", "active", "paused", "static", "fallback"]) {
  assert.match(renderer, new RegExp(`"${state}"`), `Missing ${state} renderer state.`);
}

assert.match(main, /import\("\.\/capability-visuals\.js"\)/, "Capability renderer must remain lazy-loaded.");
assert.match(main, /rootMargin: "700px 0px"/, "Capability renderer must initialize near, not at, the viewport.");
assert.match(renderer, /document\.hidden/, "Renderer must pause with the document.");
assert.match(renderer, /IntersectionObserver/, "Renderer must pause offscreen.");
assert.match(renderer, /webglcontextlost/, "Renderer must expose a context-loss fallback.");
assert.match(renderer, /mobile \? 1\.2 : 1\.4/, "Renderer must cap desktop and mobile DPR.");
assert.match(artifact, /jl:capability-visual-activity/, "Hero artifact must coordinate with the capability renderer.");

assert.doesNotMatch(renderer, /https?:\/\//, "Capability renderer must not load remote assets.");
assert.doesNotMatch(renderer, /\bReact\b|threeui/i, "Capability renderer must not add React or ThreeUI runtime code.");
assert.ok(emblemStats.size > 20_000 && emblemStats.size < 400_000, "Enhanced hero emblem must be optimized for web delivery.");

console.log("Capability visual validation passed: 4 procedural scenes, 1 renderer, lazy lifecycle, fallbacks, and optimized hero emblem.");
