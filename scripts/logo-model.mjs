import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PNG } from "pngjs";
import {
  Box3,
  ExtrudeGeometry,
  Mesh,
  MeshStandardMaterial,
  Path,
  Scene,
  Shape,
  Vector3,
} from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

const SCRIPT_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIRECTORY, "..");
const SOURCE_PATH = resolve(ROOT, "assets/source/tour-de-force-inverted.png");
const MODEL_PATH = resolve(ROOT, "public/models/tour-de-force-plaque.glb");
const SVG_PATH = resolve(ROOT, "public/logo-inverted.svg");
const ASCII_MODULE_PATH = resolve(ROOT, "src/generated/logo-ascii.js");

const EXPECTED_SOURCE_SHA256 = "cd67f902c4d4d1801f3cb15163a9ceb5eaf61f8bb900df9b8fcfe45fd97599b7";
const ISO_LEVEL = 0.5;
const SIMPLIFY_EPSILON = 0.45;
const PIXEL_TO_WORLD = 0.01;
const PLAQUE_RADIUS_PIXELS = 24;
const MAX_MODEL_BYTES = 750 * 1024;
const REQUIRED_MARK_COMPONENTS = 3;
const REQUIRED_NEGATIVE_COMPONENTS = 12;
const REQUIRED_IOU = 0.99;
const MAX_EDGE_DEVIATION = 1.5;
const ASCII_COLUMNS = 64;
const ASCII_ROWS = 40;
const ASCII_PALETTE = " .:+#@";

const EDGE_SEGMENTS = {
  0: [],
  1: [[3, 0]],
  2: [[0, 1]],
  3: [[3, 1]],
  4: [[1, 2]],
  6: [[0, 2]],
  7: [[3, 2]],
  8: [[2, 3]],
  9: [[0, 2]],
  11: [[1, 2]],
  12: [[1, 3]],
  13: [[0, 1]],
  14: [[3, 0]],
  15: [],
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function formatNumber(value, digits = 3) {
  const rounded = Number(value.toFixed(digits));
  return Object.is(rounded, -0) ? "0" : String(rounded);
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

async function readSource() {
  const buffer = await readFile(SOURCE_PATH);
  const image = PNG.sync.read(buffer);
  assert(image.width === 512 && image.height === 512, `Expected a 512x512 source, received ${image.width}x${image.height}.`);
  assert(sha256(buffer) === EXPECTED_SOURCE_SHA256, "The authoritative inverted source PNG has changed.");

  const alpha = new Float64Array(image.width * image.height);
  for (let index = 0; index < alpha.length; index += 1) {
    alpha[index] = image.data[index * 4 + 3] / 255;
  }

  return { alpha, buffer, height: image.height, width: image.width };
}

function sampleAlpha(source, x, y) {
  if (x < 0 || x >= source.width || y < 0 || y >= source.height) return 0;
  return source.alpha[y * source.width + x];
}

function roundedPlaqueAlpha(source, x, y) {
  const centerX = (source.width - 1) / 2;
  const centerY = (source.height - 1) / 2;
  const halfWidth = source.width / 2;
  const halfHeight = source.height / 2;
  const qx = Math.abs(x - centerX) - (halfWidth - PLAQUE_RADIUS_PIXELS);
  const qy = Math.abs(y - centerY) - (halfHeight - PLAQUE_RADIUS_PIXELS);
  const signedDistance =
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) +
    Math.min(Math.max(qx, qy), 0) -
    PLAQUE_RADIUS_PIXELS;
  return clamp(0.5 - signedDistance, 0, 1);
}

function interpolate(a, b) {
  if (Math.abs(b - a) < Number.EPSILON) return 0.5;
  return clamp((ISO_LEVEL - a) / (b - a), 0, 1);
}

function edgePoint(edge, x, y, values) {
  const [topLeft, topRight, bottomRight, bottomLeft] = values;
  if (edge === 0) return [x + interpolate(topLeft, topRight), y];
  if (edge === 1) return [x + 1, y + interpolate(topRight, bottomRight)];
  if (edge === 2) return [x + interpolate(bottomLeft, bottomRight), y + 1];
  return [x, y + interpolate(topLeft, bottomLeft)];
}

function segmentsForCase(index, centerInside) {
  if (index === 5) {
    return centerInside ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]];
  }
  if (index === 10) {
    return centerInside ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]];
  }
  return EDGE_SEGMENTS[index];
}

function pointKey(point) {
  return `${Math.round(point[0] * 1e6)},${Math.round(point[1] * 1e6)}`;
}

function stitchSegments(segments) {
  const endpointMap = new Map();
  segments.forEach((segment, segmentIndex) => {
    segment.forEach((point) => {
      const key = pointKey(point);
      const linked = endpointMap.get(key) ?? [];
      linked.push(segmentIndex);
      endpointMap.set(key, linked);
    });
  });

  endpointMap.forEach((linked, key) => {
    assert(linked.length === 2, `Contour endpoint ${key} has degree ${linked.length}, expected 2.`);
  });

  const used = new Uint8Array(segments.length);
  const loops = [];

  for (let startIndex = 0; startIndex < segments.length; startIndex += 1) {
    if (used[startIndex]) continue;
    used[startIndex] = 1;
    const start = segments[startIndex][0];
    const loop = [start, segments[startIndex][1]];
    let currentKey = pointKey(loop.at(-1));
    const startKey = pointKey(start);

    while (currentKey !== startKey) {
      const linked = endpointMap.get(currentKey);
      const nextIndex = linked.find((index) => !used[index]);
      assert(nextIndex !== undefined, `Open contour encountered at ${currentKey}.`);
      used[nextIndex] = 1;
      const nextSegment = segments[nextIndex];
      const nextPoint = pointKey(nextSegment[0]) === currentKey ? nextSegment[1] : nextSegment[0];
      loop.push(nextPoint);
      currentKey = pointKey(nextPoint);
      assert(loop.length <= segments.length + 1, "Contour stitching exceeded the segment count.");
    }

    loop.pop();
    assert(loop.length >= 3, "A traced contour has fewer than three points.");
    loops.push(loop);
  }

  return loops;
}

function traceContours(source, field) {
  const segments = [];
  for (let y = -2; y <= source.height + 1; y += 1) {
    for (let x = -2; x <= source.width + 1; x += 1) {
      const values = [
        field(x, y),
        field(x + 1, y),
        field(x + 1, y + 1),
        field(x, y + 1),
      ];
      const index =
        (values[0] >= ISO_LEVEL ? 1 : 0) |
        (values[1] >= ISO_LEVEL ? 2 : 0) |
        (values[2] >= ISO_LEVEL ? 4 : 0) |
        (values[3] >= ISO_LEVEL ? 8 : 0);
      const centerInside = values.reduce((sum, value) => sum + value, 0) / 4 >= ISO_LEVEL;
      for (const [firstEdge, secondEdge] of segmentsForCase(index, centerInside)) {
        segments.push([
          edgePoint(firstEdge, x, y, values),
          edgePoint(secondEdge, x, y, values),
        ]);
      }
    }
  }
  return stitchSegments(segments);
}

function squaredDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function pointSegmentDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  if (lengthSquared === 0) return Math.sqrt(squaredDistance(point, start));
  const projection = clamp(
    ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared,
    0,
    1,
  );
  return Math.hypot(point[0] - (start[0] + projection * dx), point[1] - (start[1] + projection * dy));
}

function simplifyOpen(points, epsilon) {
  if (points.length <= 2) return points.slice();
  let maximumDistance = 0;
  let splitIndex = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = pointSegmentDistance(points[index], points[0], points.at(-1));
    if (distance > maximumDistance) {
      maximumDistance = distance;
      splitIndex = index;
    }
  }
  if (maximumDistance <= epsilon) return [points[0], points.at(-1)];
  const left = simplifyOpen(points.slice(0, splitIndex + 1), epsilon);
  const right = simplifyOpen(points.slice(splitIndex), epsilon);
  return [...left.slice(0, -1), ...right];
}

function simplifyClosed(loop, epsilon = SIMPLIFY_EPSILON) {
  let farthestIndex = 1;
  let farthestDistance = 0;
  for (let index = 1; index < loop.length; index += 1) {
    const distance = squaredDistance(loop[0], loop[index]);
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }
  const firstHalf = simplifyOpen(loop.slice(0, farthestIndex + 1), epsilon);
  const secondHalf = simplifyOpen([...loop.slice(farthestIndex), loop[0]], epsilon);
  const simplified = [...firstHalf.slice(0, -1), ...secondHalf.slice(0, -1)];
  assert(simplified.length >= 3, "Contour simplification collapsed a closed path.");
  return simplified;
}

function signedArea(loop) {
  let area = 0;
  for (let index = 0; index < loop.length; index += 1) {
    const current = loop[index];
    const next = loop[(index + 1) % loop.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return area / 2;
}

function pointInPolygon(point, loop) {
  let inside = false;
  for (let index = 0, previous = loop.length - 1; index < loop.length; previous = index, index += 1) {
    const currentPoint = loop[index];
    const previousPoint = loop[previous];
    const crosses =
      (currentPoint[1] > point[1]) !== (previousPoint[1] > point[1]) &&
      point[0] <
        ((previousPoint[0] - currentPoint[0]) * (point[1] - currentPoint[1])) /
          (previousPoint[1] - currentPoint[1]) +
          currentPoint[0];
    if (crosses) inside = !inside;
  }
  return inside;
}

function classifyLoops(loops) {
  const records = loops.map((loop, index) => ({
    absoluteArea: Math.abs(signedArea(loop)),
    children: [],
    depth: 0,
    index,
    loop,
    parent: null,
  }));

  for (const record of records) {
    const candidates = records.filter(
      (candidate) =>
        candidate.index !== record.index &&
        candidate.absoluteArea > record.absoluteArea &&
        pointInPolygon(record.loop[0], candidate.loop),
    );
    if (candidates.length > 0) {
      record.parent = candidates.reduce((smallest, candidate) =>
        candidate.absoluteArea < smallest.absoluteArea ? candidate : smallest,
      );
      record.parent.children.push(record);
    }
  }

  for (const record of records) {
    let parent = record.parent;
    while (parent) {
      record.depth += 1;
      parent = parent.parent;
    }
  }
  return records;
}

function toWorld(source, point) {
  return [
    (point[0] - (source.width - 1) / 2) * PIXEL_TO_WORLD,
    ((source.height - 1) / 2 - point[1]) * PIXEL_TO_WORLD,
  ];
}

function addLoopToPath(path, source, loop) {
  const first = toWorld(source, loop[0]);
  path.moveTo(first[0], first[1]);
  for (let index = 1; index < loop.length; index += 1) {
    const point = toWorld(source, loop[index]);
    path.lineTo(point[0], point[1]);
  }
  path.closePath();
}

function recordsToShapes(source, records) {
  return records
    .filter((record) => record.depth % 2 === 0)
    .map((record) => {
      const shape = new Shape();
      addLoopToPath(shape, source, record.loop);
      for (const child of record.children.filter((candidate) => candidate.depth === record.depth + 1)) {
        const hole = new Path();
        addLoopToPath(hole, source, child.loop);
        shape.holes.push(hole);
      }
      return shape;
    });
}

function createExtrusion(shapes, options, name) {
  const geometry = new ExtrudeGeometry(shapes, {
    bevelEnabled: options.bevel > 0,
    bevelOffset: -options.bevel,
    bevelSegments: options.bevel > 0 ? 2 : 0,
    bevelSize: options.bevel,
    bevelThickness: options.bevel,
    curveSegments: 1,
    depth: options.depth,
    steps: 1,
  });
  geometry.name = `${name}Geometry`;
  geometry.translate(0, 0, options.translateZ);
  geometry.computeVertexNormals();
  return geometry;
}

function installFileReaderPolyfill() {
  if (globalThis.FileReader) return;
  globalThis.FileReader = class FileReader {
    result = null;
    error = null;
    onloadend = null;

    async readAsArrayBuffer(blob) {
      try {
        this.result = await blob.arrayBuffer();
      } catch (error) {
        this.error = error;
      }
      this.onloadend?.({ target: this });
    }

    async readAsDataURL(blob) {
      try {
        const bytes = Buffer.from(await blob.arrayBuffer());
        this.result = `data:${blob.type || "application/octet-stream"};base64,${bytes.toString("base64")}`;
      } catch (error) {
        this.error = error;
      }
      this.onloadend?.({ target: this });
    }
  };
}

async function exportGlb(scene) {
  installFileReaderPolyfill();
  const exporter = new GLTFExporter();
  exporter.register(() => ({
    writeMesh(mesh, meshDefinition) {
      meshDefinition.name = mesh.name;
    },
  }));
  const arrayBuffer = await new Promise((resolveExport, rejectExport) => {
    exporter.parse(scene, resolveExport, rejectExport, {
      binary: true,
      includeCustomExtensions: false,
      onlyVisible: true,
      trs: false,
    });
  });
  return Buffer.from(arrayBuffer);
}

function createModel(source, plaqueRecords, surfaceRecords, markRecords) {
  const silver = new MeshStandardMaterial({
    color: 0xbfc3c6,
    metalness: 0.9,
    name: "BrushedSilver",
    roughness: 0.32,
  });
  const graphite = new MeshStandardMaterial({
    color: 0x111416,
    metalness: 0.35,
    name: "GraphiteRecess",
    roughness: 0.5,
  });

  const plaqueShapes = recordsToShapes(source, plaqueRecords);
  const surfaceShapes = recordsToShapes(source, surfaceRecords);
  const markShapes = recordsToShapes(source, markRecords);

  assert(plaqueShapes.length === 1, `Expected one plaque shape, received ${plaqueShapes.length}.`);
  assert(markShapes.length === REQUIRED_MARK_COMPONENTS, `Expected ${REQUIRED_MARK_COMPONENTS} engraving shapes, received ${markShapes.length}.`);
  assert(surfaceShapes.length === REQUIRED_NEGATIVE_COMPONENTS, `Expected ${REQUIRED_NEGATIVE_COMPONENTS} surface regions, received ${surfaceShapes.length}.`);

  // The full object spans z=-0.18..0.18. The silver land is 0.08 units
  // above the plaque face, while the graphite floor remains visibly recessed.
  const base = new Mesh(
    createExtrusion(plaqueShapes, { bevel: 0.02, depth: 0.24, translateZ: -0.16 }, "PlaqueBase"),
    silver,
  );
  base.name = "PlaqueBase";

  const surface = new Mesh(
    createExtrusion(surfaceShapes, { bevel: 0.01, depth: 0.06, translateZ: 0.11 }, "SurfaceLand"),
    silver,
  );
  surface.name = "SurfaceLand";

  const engraving = new Mesh(
    createExtrusion(markShapes, { bevel: 0, depth: 0.008, translateZ: 0.103 }, "EngravingFloor"),
    graphite,
  );
  engraving.name = "EngravingFloor";

  for (const mesh of [base, surface, engraving]) {
    mesh.userData.generatedFrom = "assets/source/tour-de-force-inverted.png alpha";
    mesh.userData.sourceSha256 = EXPECTED_SOURCE_SHA256;
  }

  const scene = new Scene();
  scene.name = "TourDeForcePlaque";
  scene.add(base, surface, engraving);
  scene.updateMatrixWorld(true);
  return scene;
}

function svgPathData(loops) {
  return loops
    .map((loop) => {
      const commands = loop.map((point, index) => {
        const prefix = index === 0 ? "M" : "L";
        return `${prefix}${formatNumber(point[0])} ${formatNumber(point[1])}`;
      });
      return `${commands.join(" ")} Z`;
    })
    .join(" ");
}

function createSvg(markLoops) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="-0.5 -0.5 512 512" role="img" aria-label="Inverted Tour De Force logo">',
    `  <path fill="#111416" fill-rule="evenodd" d="${svgPathData(markLoops)}"/>`,
    "</svg>",
    "",
  ].join("\n");
}

function createAsciiModule(source) {
  const lines = [];
  let visibleCharacters = 0;

  for (let row = 0; row < ASCII_ROWS; row += 1) {
    const yStart = Math.floor((row * source.height) / ASCII_ROWS);
    const yEnd = Math.floor(((row + 1) * source.height) / ASCII_ROWS);
    let line = "";

    for (let column = 0; column < ASCII_COLUMNS; column += 1) {
      const xStart = Math.floor((column * source.width) / ASCII_COLUMNS);
      const xEnd = Math.floor(((column + 1) * source.width) / ASCII_COLUMNS);
      let alphaTotal = 0;
      let sampleCount = 0;

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          alphaTotal += sampleAlpha(source, x, y);
          sampleCount += 1;
        }
      }

      const coverage = alphaTotal / sampleCount;
      const paletteIndex = Math.min(
        ASCII_PALETTE.length - 1,
        Math.floor(coverage * ASCII_PALETTE.length),
      );
      const character = ASCII_PALETTE[paletteIndex];
      if (character !== " ") visibleCharacters += 1;
      line += character;
    }

    lines.push(line.trimEnd());
  }

  assert(lines.length === ASCII_ROWS, `ASCII logo must contain ${ASCII_ROWS} rows.`);
  assert(lines.every((line) => line.length <= ASCII_COLUMNS), `ASCII logo exceeds ${ASCII_COLUMNS} columns.`);
  assert(visibleCharacters > 500, "ASCII logo contains too few visible characters.");

  return [
    "// Generated by scripts/logo-model.mjs from the authoritative logo alpha mask.",
    "// Run `npm run generate:logo-model` instead of editing this file directly.",
    "export const LOGO_ASCII = [",
    ...lines.map((line) => `  ${JSON.stringify(line)},`),
    '].join("\\n");',
    "",
  ].join("\n");
}

function countComponents(source, opaque) {
  const visited = new Uint8Array(source.width * source.height);
  const queue = new Int32Array(source.width * source.height);
  let count = 0;
  const matches = (index) => (source.alpha[index] >= ISO_LEVEL) === opaque;

  for (let start = 0; start < visited.length; start += 1) {
    if (visited[start] || !matches(start)) continue;
    count += 1;
    let read = 0;
    let write = 0;
    queue[write++] = start;
    visited[start] = 1;
    while (read < write) {
      const index = queue[read++];
      const x = index % source.width;
      const y = Math.floor(index / source.width);
      const neighbors = [];
      if (x > 0) neighbors.push(index - 1);
      if (x + 1 < source.width) neighbors.push(index + 1);
      if (y > 0) neighbors.push(index - source.width);
      if (y + 1 < source.height) neighbors.push(index + source.width);
      for (const neighbor of neighbors) {
        if (!visited[neighbor] && matches(neighbor)) {
          visited[neighbor] = 1;
          queue[write++] = neighbor;
        }
      }
    }
  }
  return count;
}

function calculateIoU(source, loops) {
  let intersection = 0;
  let union = 0;
  for (let y = 0; y < source.height; y += 1) {
    for (let x = 0; x < source.width; x += 1) {
      const expected = sampleAlpha(source, x, y) >= ISO_LEVEL;
      let actual = false;
      for (const loop of loops) {
        if (pointInPolygon([x, y], loop)) actual = !actual;
      }
      if (expected && actual) intersection += 1;
      if (expected || actual) union += 1;
    }
  }
  return intersection / union;
}

function maximumEdgeDeviation(rawLoops, simplifiedLoops) {
  assert(rawLoops.length === simplifiedLoops.length, "Raw and simplified contour counts differ.");
  let maximum = 0;
  for (let loopIndex = 0; loopIndex < rawLoops.length; loopIndex += 1) {
    const raw = rawLoops[loopIndex];
    const simplified = simplifiedLoops[loopIndex];
    for (const point of raw) {
      let nearest = Number.POSITIVE_INFINITY;
      for (let index = 0; index < simplified.length; index += 1) {
        nearest = Math.min(
          nearest,
          pointSegmentDistance(point, simplified[index], simplified[(index + 1) % simplified.length]),
        );
      }
      maximum = Math.max(maximum, nearest);
    }
  }
  return maximum;
}

function parseGlb(buffer) {
  assert(buffer.length >= 20, "GLB is too small to contain a valid header.");
  assert(buffer.toString("utf8", 0, 4) === "glTF", "GLB magic header is invalid.");
  assert(buffer.readUInt32LE(4) === 2, "GLB must use glTF version 2.");
  assert(buffer.readUInt32LE(8) === buffer.length, "GLB header length does not match the file size.");

  let offset = 12;
  let json;
  let binary;
  while (offset < buffer.length) {
    const chunkLength = buffer.readUInt32LE(offset);
    const chunkType = buffer.readUInt32LE(offset + 4);
    const chunk = buffer.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === 0x4e4f534a) json = JSON.parse(chunk.toString("utf8").trim());
    if (chunkType === 0x004e4942) binary = chunk;
    offset += 8 + chunkLength;
  }
  assert(json && binary, "GLB must contain JSON and binary chunks.");
  return { binary, json };
}

function accessorLayout(accessor) {
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 }[accessor.type];
  const bytes = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType];
  assert(components && bytes, `Unsupported accessor layout ${accessor.type}/${accessor.componentType}.`);
  return { bytes, components };
}

function validateFiniteNormals(glb) {
  let normalCount = 0;
  for (const mesh of glb.json.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      const accessorIndex = primitive.attributes?.NORMAL;
      assert(accessorIndex !== undefined, `Mesh ${mesh.name} is missing normals.`);
      const accessor = glb.json.accessors[accessorIndex];
      assert(accessor.componentType === 5126 && accessor.type === "VEC3", `Mesh ${mesh.name} normals must be float VEC3 values.`);
      const view = glb.json.bufferViews[accessor.bufferView];
      const { bytes, components } = accessorLayout(accessor);
      const stride = view.byteStride ?? bytes * components;
      const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
      for (let index = 0; index < accessor.count; index += 1) {
        for (let component = 0; component < components; component += 1) {
          const value = glb.binary.readFloatLE(start + index * stride + component * bytes);
          assert(Number.isFinite(value), `Mesh ${mesh.name} contains a non-finite normal.`);
        }
      }
      normalCount += accessor.count;
    }
  }
  assert(normalCount > 0, "GLB contains no normal data.");
  return normalCount;
}

function validateModelBuffer(buffer) {
  assert(buffer.length < MAX_MODEL_BYTES, `GLB is ${buffer.length} bytes; limit is ${MAX_MODEL_BYTES}.`);
  const glb = parseGlb(buffer);
  const expectedMeshes = ["PlaqueBase", "SurfaceLand", "EngravingFloor"];
  const meshNames = new Set((glb.json.meshes ?? []).map((mesh) => mesh.name));
  const nodeNames = new Set((glb.json.nodes ?? []).map((node) => node.name));
  const materialNames = new Set((glb.json.materials ?? []).map((material) => material.name));
  for (const name of expectedMeshes) {
    assert(meshNames.has(name), `GLB is missing mesh ${name}.`);
    assert(nodeNames.has(name), `GLB is missing node ${name}.`);
  }
  for (const name of ["BrushedSilver", "GraphiteRecess"]) {
    assert(materialNames.has(name), `GLB is missing material ${name}.`);
  }

  const materialByName = new Map(glb.json.materials.map((material, index) => [material.name, { index, material }]));
  const silver = materialByName.get("BrushedSilver");
  const graphite = materialByName.get("GraphiteRecess");
  assert(silver.material.pbrMetallicRoughness.metallicFactor === 0.9, "BrushedSilver metalness must be 0.9.");
  assert(silver.material.pbrMetallicRoughness.roughnessFactor === 0.32, "BrushedSilver roughness must be 0.32.");
  assert(graphite.material.pbrMetallicRoughness.metallicFactor === 0.35, "GraphiteRecess metalness must be 0.35.");
  assert(graphite.material.pbrMetallicRoughness.roughnessFactor === 0.5, "GraphiteRecess roughness must be 0.5.");

  for (const mesh of glb.json.meshes) {
    const expectedMaterial = mesh.name === "EngravingFloor" ? graphite.index : silver.index;
    assert(
      mesh.primitives.every((primitive) => primitive.material === expectedMaterial),
      `Mesh ${mesh.name} uses the wrong material.`,
    );
  }

  const minimum = [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY];
  const maximum = [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY];
  for (const mesh of glb.json.meshes) {
    for (const primitive of mesh.primitives) {
      const accessor = glb.json.accessors[primitive.attributes.POSITION];
      assert(accessor.min?.length === 3 && accessor.max?.length === 3, `Mesh ${mesh.name} lacks position bounds.`);
      for (let axis = 0; axis < 3; axis += 1) {
        assert(Number.isFinite(accessor.min[axis]) && Number.isFinite(accessor.max[axis]), `Mesh ${mesh.name} has invalid bounds.`);
        minimum[axis] = Math.min(minimum[axis], accessor.min[axis]);
        maximum[axis] = Math.max(maximum[axis], accessor.max[axis]);
      }
    }
  }
  const center = minimum.map((value, axis) => (value + maximum[axis]) / 2);
  assert(center.every((value) => Math.abs(value) < 0.006), `GLB bounds are not centered: ${center.join(", ")}.`);
  const width = maximum[0] - minimum[0];
  const height = maximum[1] - minimum[1];
  assert(Math.abs(width - 5.12) < 0.015, `GLB width is ${width.toFixed(4)}, not 5.12 units.`);
  assert(Math.abs(height - 5.12) < 0.015, `GLB height is ${height.toFixed(4)}, not 5.12 units.`);
  const normalCount = validateFiniteNormals(glb);
  return { bounds: { maximum, minimum }, normalCount };
}

async function buildArtifacts() {
  const source = await readSource();
  const markField = (x, y) => sampleAlpha(source, x, y);
  const plaqueField = (x, y) => roundedPlaqueAlpha(source, x, y);
  const surfaceField = (x, y) => Math.min(plaqueField(x, y), 1 - markField(x, y));

  const rawMarkLoops = traceContours(source, markField);
  const markLoops = rawMarkLoops.map((loop) => simplifyClosed(loop));
  const plaqueLoops = traceContours(source, plaqueField).map((loop) => simplifyClosed(loop));
  const surfaceLoops = traceContours(source, surfaceField).map((loop) => simplifyClosed(loop));

  const markRecords = classifyLoops(markLoops);
  const plaqueRecords = classifyLoops(plaqueLoops);
  const surfaceRecords = classifyLoops(surfaceLoops);
  const scene = createModel(source, plaqueRecords, surfaceRecords, markRecords);
  const model = await exportGlb(scene);
  const svg = createSvg(markLoops);
  const asciiModule = createAsciiModule(source);

  const opaqueComponents = countComponents(source, true);
  const negativeComponents = countComponents(source, false);
  const iou = calculateIoU(source, markLoops);
  const edgeDeviation = maximumEdgeDeviation(rawMarkLoops, markLoops);
  assert(opaqueComponents === REQUIRED_MARK_COMPONENTS, `Expected ${REQUIRED_MARK_COMPONENTS} opaque components, received ${opaqueComponents}.`);
  assert(negativeComponents === REQUIRED_NEGATIVE_COMPONENTS, `Expected ${REQUIRED_NEGATIVE_COMPONENTS} negative-space regions, received ${negativeComponents}.`);
  assert(iou >= REQUIRED_IOU, `Mask IoU ${iou.toFixed(6)} is below ${REQUIRED_IOU}.`);
  assert(edgeDeviation <= MAX_EDGE_DEVIATION, `Maximum edge deviation ${edgeDeviation.toFixed(3)}px exceeds ${MAX_EDGE_DEVIATION}px.`);
  const modelValidation = validateModelBuffer(model);

  const bounds = new Box3().setFromObject(scene);
  const sceneCenter = bounds.getCenter(new Vector3());
  assert(sceneCenter.length() < 0.006, `Generated scene is not centered: ${sceneCenter.toArray().join(", ")}.`);

  return {
    metrics: {
      bounds: modelValidation.bounds,
      asciiColumns: ASCII_COLUMNS,
      asciiRows: ASCII_ROWS,
      edgeDeviation,
      iou,
      modelBytes: model.length,
      negativeComponents,
      normalCount: modelValidation.normalCount,
      opaqueComponents,
      sourceSha256: EXPECTED_SOURCE_SHA256,
      surfaceRegions: surfaceRecords.filter((record) => record.depth % 2 === 0).length,
    },
    asciiModule,
    model,
    svg,
  };
}

function printMetrics(action, metrics) {
  const dimensions = metrics.bounds.maximum.map(
    (value, axis) => value - metrics.bounds.minimum[axis],
  );
  console.log(`${action} accurate engraved logo assets`);
  console.log(`  source: ${metrics.sourceSha256}`);
  console.log(`  components: ${metrics.opaqueComponents} opaque / ${metrics.negativeComponents} negative`);
  console.log(`  surface regions: ${metrics.surfaceRegions}`);
  console.log(`  mask IoU: ${metrics.iou.toFixed(6)}`);
  console.log(`  max edge deviation: ${metrics.edgeDeviation.toFixed(3)} px`);
  console.log(`  ASCII: ${metrics.asciiColumns} x ${metrics.asciiRows} characters`);
  console.log(`  GLB: ${metrics.modelBytes} bytes, ${metrics.normalCount} normals`);
  console.log(`  bounds: ${dimensions.map((value) => value.toFixed(3)).join(" x ")} units`);
}

async function main() {
  const mode = process.argv[2];
  assert(mode === "--write" || mode === "--check", "Usage: node scripts/logo-model.mjs --write|--check");
  const artifacts = await buildArtifacts();

  if (mode === "--write") {
    await mkdir(dirname(MODEL_PATH), { recursive: true });
    await mkdir(dirname(ASCII_MODULE_PATH), { recursive: true });
    await writeFile(MODEL_PATH, artifacts.model);
    await writeFile(SVG_PATH, artifacts.svg, "utf8");
    await writeFile(ASCII_MODULE_PATH, artifacts.asciiModule, "utf8");
    printMetrics("Generated", artifacts.metrics);
    return;
  }

  const [committedModel, committedSvg, committedAsciiModule] = await Promise.all([
    readFile(MODEL_PATH),
    readFile(SVG_PATH, "utf8"),
    readFile(ASCII_MODULE_PATH, "utf8"),
  ]);
  assert(committedModel.equals(artifacts.model), "Committed GLB is stale; run npm run generate:logo-model.");
  assert(committedSvg === artifacts.svg, "Committed SVG is stale; run npm run generate:logo-model.");
  assert(committedAsciiModule === artifacts.asciiModule, "Committed ASCII logo is stale; run npm run generate:logo-model.");
  printMetrics("Validated", artifacts.metrics);
}

main().catch((error) => {
  console.error(`Logo model generation failed: ${error.message}`);
  process.exitCode = 1;
});
