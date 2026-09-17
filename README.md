# Jean-Luc Peloquin — Portfolio

A responsive personal portfolio for Jean-Luc Peloquin, built as a precise editorial system around software engineering, computer vision, data products, and interactive interfaces.

## Highlights

- Machined-metal Three.js plaque generated from the exact supplied alpha mask, with real recessed engraving, restrained tilt, scroll response, mobile quality controls, offscreen pausing, and an exact SVG fallback
- Terminal-style startup screen with a deterministic 64×40 ASCII rendition of that same authoritative logo mask
- Enhanced silver/graphite 3D relief of the supplied eye mark behind the full hero name
- One lazy-loaded Three.js capability renderer that scissor-renders four original automation, vision, data, and interface scenes through a shared WebGL context
- One lazy-loaded Three.js Selected Work canvas that morphs between five deterministic project scenes, with full orbit/zoom controls, adaptive themes, reduced-motion rendering, and CSS fallbacks
- Live 20-week public GitHub push-activity view with an accessible, network-safe fallback
- Responsive light/dark editorial layout with live Las Vegas and New York clocks
- Accessible mobile navigation and contact dialogs with native focus trapping and Escape handling
- Selectable project case studies and an autoplaying, user-pausable principles carousel
- Self-hosted open-source fonts, optimized WebP portraits, and deterministic ASCII/SVG/GLB logo assets
- Self-hosted VCT22-inspired display/semimono typography, eight utility glyphs, and five text-free light/grain masks tracked by a deterministic local manifest
- Standalone privacy and 404 pages
- GitHub Pages deployment workflow

## Run locally

```bash
npm install
npm run dev
```

Build and preview the production version:

```bash
npm run build
npm run preview
```

Regenerate or validate the committed logo model and fallback:

```bash
npm run generate:logo-model
npm run check:logo-model
```

Validate the procedural Selected Work states and attribution:

```bash
npm run check:work-visuals
```

Validate the shared capability renderer and enhanced hero asset:

```bash
npm run check:capability-visuals
```

Regenerate and validate the local VCT22-inspired brand primitives:

```bash
npm run assets:vct22
npm run check:brand-system
```

## Structure

```text
index.html              Main portfolio
privacy.html            Privacy details
404.html                Static 404 page
src/main.js             Page interactions and UI state
src/artifact.js         GLB loading, lighting, and plaque interaction
src/capability-visuals.js  Shared four-scene Three.js capability renderer
src/work-visual.js      Shared Three.js renderer, controls, morphing, and lifecycle
src/work-visual-states.js  Deterministic five-project procedural scene definitions
scripts/logo-model.mjs  Deterministic alpha-to-ASCII/SVG/GLB generator and validator
scripts/vct22-assets.mjs  Deterministic local font/glyph/light-mask manifest generator and validator
scripts/check-work-visuals.mjs  Procedural scene and attribution validator
scripts/check-capability-visuals.mjs  Capability renderer and hero-asset validator
src/generated/          Generated ASCII logo module
src/brand-system.js      Section lighting, glyph placement, theme, and lifecycle controller
src/brand-system.css     Local VCT22-inspired type and visual-system overrides
src/style.css           Design system and responsive layouts
public/                 Optimized images, brand primitives, social card, and favicon
.github/workflows/      GitHub Pages deployment
```

## Deployment

The Pages workflow builds the Vite project on pushes to `main` and deploys `dist/`. The Vite base is relative so assets work from a GitHub Pages repository subpath.

## Provenance

See [ASSET_PROVENANCE.md](./ASSET_PROVENANCE.md) and [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md). The site recreates its editorial and halftone system in code and does not redistribute Aspen Search artwork, fonts, photography, or brand assets. The 3D plaque is generated from the supplied mark; it does not include a third-party model, texture, audio, or game file. The Selected Work renderer adapts three MIT-licensed ThreeUI Community techniques without installing or redistributing ThreeUI media or remote assets.
