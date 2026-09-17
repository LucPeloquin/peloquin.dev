import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(new URL("..", import.meta.url).pathname);
const assetRoot = path.join(repoRoot, "public", "brand", "vct22");
const manifestPath = path.join(assetRoot, "manifest.json");

const sourceAssets = [
  {
    id: "satoshi-variable",
    type: "font",
    sourceUrl: "https://suleymanyazki.com/wp-content/themes/semplice7/assets/fonts/satoshi.woff2",
    transformation: "self-hosted local display face; runtime use is constrained to the site Latin/technical unicode range",
    output: "fonts/satoshi-variable.woff2",
  },
  {
    id: "fk-grotesk-semi-mono-regular",
    type: "font",
    sourceUrl: "https://suleymanyazki.com/wp-content/uploads/2026/05/FKGroteskSemiMono-Regular.otf",
    transformation: "self-hosted local label face; runtime use is constrained to the site Latin/technical unicode range",
    output: "fonts/fk-grotesk-semi-mono-regular.otf",
  },
  {
    id: "fk-grotesk-semi-mono-bold",
    type: "font",
    sourceUrl: "https://suleymanyazki.com/wp-content/uploads/2026/05/FKGroteskSemiMono-Bold.otf",
    transformation: "self-hosted local label face; runtime use is constrained to the site Latin/technical unicode range",
    output: "fonts/fk-grotesk-semi-mono-bold.otf",
  },
];

const systemSource = "https://suleymanyazki.com/project/vct22#graphic-system";

const glyphs = {
  "reticle.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="1.5"><circle cx="32" cy="32" r="19"/><circle cx="32" cy="32" r="9"/><path d="M32 0v64M0 32h64"/><path d="M32 6v9M32 49v9M6 32h9M49 32h9"/></g></svg>`,
  "corner-brackets.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M22 5H5v17M42 5h17v17M5 42v17h17M59 42v17H42" stroke="currentColor" stroke-width="2"/></svg>`,
  "radial-burst.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="32" cy="32" r="7"/><circle cx="32" cy="32" r="18" stroke-dasharray="2 4"/>${Array.from({ length: 16 }, (_, index) => { const angle = (Math.PI * 2 * index) / 16; const x1 = 32 + Math.cos(angle) * 22; const y1 = 32 + Math.sin(angle) * 22; const x2 = 32 + Math.cos(angle) * 30; const y2 = 32 + Math.sin(angle) * 30; return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`; }).join("")}</g><circle cx="32" cy="32" r="2.5" fill="currentColor"/></svg>`,
  "segmented-cross.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="2"><path d="M32 4v13M32 47v13M4 32h13M47 32h13"/><path d="m22 22 7 7M42 22l-7 7M22 42l7-7M42 42l-7-7"/></g><circle cx="32" cy="32" r="4" fill="currentColor"/></svg>`,
  "orbital-loops.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="1.25"><ellipse cx="32" cy="32" rx="25" ry="9"/><ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="25" ry="9" transform="rotate(-60 32 32)"/><circle cx="32" cy="32" r="3" fill="currentColor"/></g></svg>`,
  "horizon-sphere.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="1.5"><circle cx="32" cy="32" r="22"/><ellipse cx="32" cy="32" rx="22" ry="9"/><path d="M10 32h44M32 10c-6 7-6 37 0 44M32 10c6 7 6 37 0 44"/></g></svg>`,
  "inward-chevrons.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><g stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M7 23 16 32 7 41M57 23 48 32l9 9"/><path d="M25 26 31 32l-6 6M39 26 33 32l6 6"/></g></svg>`,
  "plus-marker.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 10v44M10 32h44" stroke="currentColor" stroke-width="1.5"/><circle cx="32" cy="32" r="21" stroke="currentColor" stroke-width="1.5"/><path d="m23 32 6 6 12-14" stroke="currentColor" stroke-width="1.5"/></svg>`,
};

const radialLines = Array.from({ length: 28 }, (_, index) => {
  const angle = (Math.PI * 2 * index) / 28;
  const x1 = 800 + Math.cos(angle) * 110;
  const y1 = 450 + Math.sin(angle) * 72;
  const x2 = 800 + Math.cos(angle) * 700;
  const y2 = 450 + Math.sin(angle) * 430;
  return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}"/>`;
}).join("");

const masks = {
  "light-diagonal.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" fill="none"><defs><linearGradient id="g" x1="200" y1="70" x2="1320" y2="840" gradientUnits="userSpaceOnUse"><stop stop-color="white" stop-opacity="0"/><stop offset=".5" stop-color="white" stop-opacity=".9"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient></defs><g stroke="url(#g)" stroke-linecap="round">${Array.from({ length: 26 }, (_, index) => { const y = 100 + index * 28; return `<path d="M${120 + index * 18} ${y}L${1040 + index * 18} ${Math.min(880, y + 420)}" stroke-width="${index % 3 === 0 ? 3 : 1}"/>`; }).join("")}</g></svg>`,
  "light-radial.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" fill="none"><defs><radialGradient id="g"><stop stop-color="white" stop-opacity=".92"/><stop offset=".45" stop-color="white" stop-opacity=".22"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs><ellipse cx="800" cy="450" rx="580" ry="360" fill="url(#g)"/><g stroke="white" stroke-opacity=".54" stroke-linecap="round">${radialLines}</g></svg>`,
  "light-convergence.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" fill="none"><defs><radialGradient id="a"><stop stop-color="white" stop-opacity=".8"/><stop offset="1" stop-color="white" stop-opacity="0"/></radialGradient></defs><g stroke="white" stroke-opacity=".52" stroke-linecap="round"><path d="M0 100L800 450L1600 100"/><path d="M0 800L800 450L1600 800"/><path d="M170 450h1260"/>${Array.from({ length: 13 }, (_, index) => { const dx = 90 + index * 58; return `<path d="M${800 - dx} ${450 - dx * .44}L800 450L${800 + dx} ${450 - dx * .44}"/>`; }).join("")}</g><circle cx="800" cy="450" r="150" fill="url(#a)"/></svg>`,
  "grain-purple.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" seed="17"/><feColorMatrix values="0 0 0 0 0.435 0 0 0 0 0.29 0 0 0 0.8 0 0 0 .34 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
  "grain-red-gold.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".68" numOctaves="3" seed="31"/><feColorMatrix values="0 0 0 0 0.62 0 0 0 0 0.24 0 0 0 0.10 0 0 0 .25 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>`,
};

const derivedAssets = [
  ...Object.keys(glyphs).map((name) => ({
    id: name.replace(".svg", ""),
    type: "glyph",
    sourceUrl: systemSource,
    transformation: "traced monochrome utility glyph derived from the reference graphic-system icon language",
    output: `glyphs/${name}`,
    contents: glyphs[name],
  })),
  ...Object.keys(masks).map((name) => ({
    id: name.replace(".svg", ""),
    type: "light-mask",
    sourceUrl: systemSource,
    transformation: "reconstructed as a text-free grayscale/vector light-only alpha treatment; no campaign imagery retained",
    output: `masks/${name}`,
    contents: masks[name],
  })),
];

const requiredOutputs = [
  ...sourceAssets.map(({ output }) => output),
  ...derivedAssets.map(({ output }) => output),
];

const runtimeFiles = [
  "index.html",
  "src/main.js",
  "src/brand-system.js",
  "src/brand-system.css",
  "src/capability-visuals.js",
];

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function ensureDir(filePath) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return null;
  }
}

async function download(url) {
  const response = await fetch(url, { headers: { "user-agent": "peloquin.dev asset build" } });
  if (!response.ok) throw new Error(`Could not fetch ${url} (${response.status})`);
  return Buffer.from(await response.arrayBuffer());
}

async function writeAssets() {
  const previous = await readJson(manifestPath);
  const files = [];

  for (const asset of sourceAssets) {
    const outputPath = path.join(assetRoot, asset.output);
    const contents = await download(asset.sourceUrl);
    const hash = sha256(contents);
    const previousFile = previous?.files?.find((file) => file.id === asset.id);
    if (previousFile?.sourceSha256 && previousFile.sourceSha256 !== hash && !process.argv.includes("--refresh")) {
      throw new Error(`${asset.id} changed upstream. Re-run with --refresh only after confirming the source is still authorized.`);
    }
    await ensureDir(outputPath);
    await writeFile(outputPath, contents);
    files.push({ ...asset, sourceSha256: hash, outputSha256: hash, bytes: contents.byteLength });
  }

  for (const asset of derivedAssets) {
    const outputPath = path.join(assetRoot, asset.output);
    const contents = Buffer.from(asset.contents);
    await ensureDir(outputPath);
    await writeFile(outputPath, contents);
    files.push({
      id: asset.id,
      type: asset.type,
      sourceUrl: asset.sourceUrl,
      transformation: asset.transformation,
      output: asset.output,
      sourceSha256: null,
      outputSha256: sha256(contents),
      bytes: contents.byteLength,
    });
  }

  const manifest = {
    schema: 1,
    generatedAt: "deterministic",
    sourcePage: "https://suleymanyazki.com/project/vct22",
    usage: "Authorized local derivatives of the reference system primitives; runtime contains no remote reference-site requests.",
    files,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${files.length} local brand assets.`);
}

async function checkAssets() {
  const manifest = await readJson(manifestPath);
  if (!manifest || manifest.schema !== 1 || !Array.isArray(manifest.files)) {
    throw new Error(`Missing or invalid ${path.relative(repoRoot, manifestPath)}. Run npm run assets:vct22 first.`);
  }
  if (manifest.files.length !== sourceAssets.length + derivedAssets.length) {
    throw new Error(`Expected ${sourceAssets.length + derivedAssets.length} manifest entries, found ${manifest.files.length}.`);
  }
  const expectedTypeCounts = { font: 3, glyph: 8, "light-mask": 5 };
  for (const [type, expected] of Object.entries(expectedTypeCounts)) {
    const actual = manifest.files.filter((asset) => asset.type === type).length;
    if (actual !== expected) throw new Error(`Expected ${expected} ${type} assets, found ${actual}.`);
  }
  const manifestOutputs = manifest.files.map((asset) => asset.output);
  if (new Set(manifestOutputs).size !== manifestOutputs.length || manifestOutputs.some((output) => !requiredOutputs.includes(output))) {
    throw new Error("Manifest outputs do not match the curated local brand asset set.");
  }
  let totalBytes = 0;
  for (const asset of manifest.files) {
    if (!asset.id || !asset.type || !asset.output || !asset.sourceUrl || !asset.outputSha256) {
      throw new Error(`Incomplete manifest entry: ${asset.id || "unknown"}`);
    }
    if (asset.output.includes("..") || asset.output.startsWith("/")) {
      throw new Error(`Unsafe output path: ${asset.output}`);
    }
    if (!/^https:\/\/suleymanyazki\.com\//.test(asset.sourceUrl)) {
      throw new Error(`Unexpected source URL: ${asset.sourceUrl}`);
    }
    if (asset.type === "font" && !/unicode range/i.test(asset.transformation || "")) {
      throw new Error(`Font transformation does not document the Latin subset: ${asset.output}`);
    }
    if (asset.type === "font" && !/^[a-f0-9]{64}$/.test(asset.sourceSha256 || "")) {
      throw new Error(`Invalid source hash: ${asset.output}`);
    }
    if (!/^[a-f0-9]{64}$/.test(asset.outputSha256)) {
      throw new Error(`Invalid output hash: ${asset.output}`);
    }
    const outputPath = path.join(assetRoot, asset.output);
    const contents = await readFile(outputPath);
    const hash = sha256(contents);
    if (hash !== asset.outputSha256) throw new Error(`Hash mismatch: ${asset.output}`);
    if (asset.type === "font" && contents.byteLength > 250 * 1024) throw new Error(`Critical font exceeds 250 KB: ${asset.output}`);
    if (asset.type !== "font" && contents.byteLength > 80 * 1024) throw new Error(`Derived brand asset exceeds 80 KB: ${asset.output}`);
    totalBytes += contents.byteLength;
  }
  const unsafe = /<script|javascript:|on[a-z]+=|<iframe/i;
  for (const asset of manifest.files.filter((file) => file.type !== "font")) {
    const contents = await readFile(path.join(assetRoot, asset.output), "utf8");
    if (unsafe.test(contents)) throw new Error(`Unsafe SVG content: ${asset.output}`);
    if (!/<svg\b/i.test(contents) || /<text\b|<image\b|<foreignObject\b/i.test(contents)) {
      throw new Error(`Derived asset is not a text-free SVG: ${asset.output}`);
    }
    if (/valorant|riot|champions|team|player|vct22/i.test(contents)) {
      throw new Error(`Prohibited campaign material in derived asset: ${asset.output}`);
    }
  }
  const missingOutputs = requiredOutputs.filter((output) => !manifestOutputs.includes(output));
  if (missingOutputs.length) throw new Error(`Missing required outputs: ${missingOutputs.join(", ")}`);

  const indexContents = await readFile(path.join(repoRoot, "index.html"), "utf8");
  if (!indexContents.includes('./brand/vct22/fonts/satoshi-variable.woff2')) {
    throw new Error("The critical Satoshi display font is not preloaded from the local brand directory.");
  }
  const brandCss = await readFile(path.join(repoRoot, "src/brand-system.css"), "utf8");
  if (!/unicode-range\s*:/i.test(brandCss)) throw new Error("Brand font faces are missing a Latin unicode range.");
  const referenceDomain = /suleymanyazki\.com/i;
  for (const runtimeFile of runtimeFiles) {
    const contents = await readFile(path.join(repoRoot, runtimeFile), "utf8");
    if (referenceDomain.test(contents)) {
      throw new Error(`Reference-site request or runtime URL found in ${runtimeFile}.`);
    }
  }

  if (totalBytes > 900 * 1024) throw new Error(`Brand asset payload exceeds 900 KB: ${totalBytes}`);
  console.log(`Brand system assets valid (${manifest.files.length} files, ${totalBytes} bytes).`);
}

if (process.argv.includes("--check")) await checkAssets();
else await writeAssets();
