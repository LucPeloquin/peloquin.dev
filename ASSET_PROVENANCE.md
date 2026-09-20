# Asset provenance

## First-party material

- `public/images/jean-luc.webp` is an optimized derivative of the portrait already tracked in this repository as `images/luc.jpg`.
- `public/images/jean-luc-current.webp` is an optimized derivative of `images/image.png`.
- `public/logo-flat.png` is the square logo supplied for this redesign and is used as the flat header mark.
- `assets/source/tour-de-force-inverted.png` is the authoritative 512×512 inverted mark supplied for the engraved plaque. Its alpha channel is the sole source of the generated logo geometry.
- `public/logo-inverted.svg`, `public/models/tour-de-force-plaque.glb`, and `src/generated/logo-ascii.js` are deterministic derivatives generated from that alpha mask by `scripts/logo-model.mjs`. The SVG is the loading and failure fallback, the GLB contains the machined plaque geometry, and the ASCII rendition is used by the startup screen.
- `public/images/hero-scope.png` is the user-supplied eye-mark source. `public/images/hero-scope-3d.webp` is its transparent, web-optimized silver/graphite relief derivative, generated with OpenAI image generation from that source and used behind the full name in the hero. The source silhouette and negative space were treated as the shape authority.
- The four capability-panel CSS compositions are original code and remain only as loading, WebGL, and context-loss fallbacks. `src/capability-visuals.js` replaces them with four original procedural Three.js scenes rendered through one shared context; it loads no model, texture, thumbnail, or other remote asset.
- The six CSS project posters are original code compositions retained only as loading, WebGL, and context-loss fallbacks for the Selected Work renderer.
- `src/work-visual.js` and `src/work-visual-states.js` generate all Selected Work geometry at runtime. Their topology, platform/core, and line-field techniques substantially adapt ThreeUI Community's `nexus-topology.html`, `platform-core.html`, and `vertex-9.html` at pinned commit `fbc9b3d61b0ef4b2e93b42e4fffa617ca277429b`, under the MIT License. The complete notice and immutable source links are in `THIRD_PARTY_NOTICES.md`.
- Halftone fields, reticles, UI diagrams, favicon wrapper, and social card are original code/SVG compositions created for this portfolio.
- The engraved plaque uses locally generated contour geometry and procedural Three.js lighting. No third-party 3D model or texture is included or distributed.
- The Selected Work renderer distributes no ThreeUI package, React code, thumbnails, preview videos, Pro code, model, texture, or remote asset.
- The recent-activity panel reads public push events from GitHub's public REST API at runtime. It distributes no GitHub image or user data snapshot and falls back to a profile link when live activity is unavailable.

## Reference-derived VCT22 system primitives

- `public/brand/vct22/manifest.json` is the reproducible inventory for the locally bundled display/semimono fonts, utility glyphs, and text-free grayscale light treatments used by the re-theme.
- The local Satoshi and FK Grotesk SemiMono files are self-hosted authorized derivatives of the type resources used by the supplied [VCT22 case study](https://suleymanyazki.com/project/vct22). Their source URLs, SHA-256 hashes, and output paths are recorded in the manifest.
- The seven glyphs and two grain masks are original traced or reconstructed system primitives derived from the reference’s abstract graphic language. They contain no readable campaign text, faces, trademarks, team/player marks, or recognizable campaign imagery.
- `src/brand-system.js` and `src/brand-system.css` apply those local primitives to the portfolio’s existing content and interactive scenes. The deployed runtime makes no request to the reference site and does not redistribute the reference page, thumbnails, videos, or raw campaign artwork.
- The reference-derived files are included under the user’s stated permission for extraction, modification, redistribution, and no visible attribution. This internal record is retained for auditability; no public credit block is displayed.

## Open-source fonts

- [Manrope](https://github.com/sharanda/manrope), distributed under the SIL Open Font License 1.1.
- [IBM Plex Mono](https://github.com/IBM/plex), distributed under the SIL Open Font License 1.1.

The font files are installed through Fontsource packages and bundled locally.

## Visual research only

- [Aspen Search](https://www.aspensearch.com/) informed the editorial grid, sectional pacing, halftone approach, live clocks, and drawer interaction pattern. No Aspen font, logo, photograph, client mark, testimonial, source asset, or copy is redistributed.
- Riot Games’ [Chamber agent page](https://playvalorant.com/en-us/agents/chamber/) and the community [Tour De Force reference page](https://valorant.fandom.com/wiki/Tour_De_Force) were visual research for the earlier direction only. The shipped object is generated from the user-supplied mark and uses no Riot model, texture, audio, or game file.

VALORANT and Tour De Force are trademarks or creative properties of Riot Games. This personal portfolio is not affiliated with or endorsed by Riot Games, Aspen Search, or the referenced sites.
