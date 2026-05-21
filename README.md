# LittleBigPlanet-Inspired Engineering Portfolio Starter

A GitHub Pages-ready portfolio for engineering/CAD projects. It has a handmade patchwork aesthetic, project cards generated from one JavaScript array, and an interactive Three.js CAD viewer with rotate/pan/zoom plus exploded view.

## Quick start

1. Upload these files to a GitHub repository.
2. In the repository settings, enable **Pages** and deploy from the `main` branch root.
3. Edit `app.js` to replace the sample projects with your own.
4. Drop model files into `assets/models/` and update each project object's `model` path.

## Supported model formats

- `.glb` / `.gltf`: best for web performance and materials.
- `.stl`: good simple geometry fallback.
- `.obj`: okay for simple meshes.
- `.step` / `.stp`: supported using `occt-import-js`, but heavier because it converts CAD B-rep geometry in the browser.

## Recommended STEP workflow

STEP files can be large. For the smoothest public portfolio experience, keep the original STEP available as a download, but also export a lightweight `.glb` for browser viewing. If you want direct STEP loading:

1. Download these two files from the `occt-import-js` package `dist` folder:
   - `occt-import-js.js`
   - `occt-import-js.wasm`
2. Put them in a new `vendor/` folder.
3. In `app.js`, change:
   ```js
   const OCCT_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/occt-import-js.js";
   ```
   to:
   ```js
   const OCCT_SCRIPT_URL = "vendor/occt-import-js.js";
   ```

This makes GitHub Pages more reliable because the WASM file is served from your own repository.

## Adding a project

Copy a project object in `app.js`:

```js
{
  title: "My Project Title",
  role: "What I did",
  summary: "One short sentence about the project.",
  tags: ["CAD", "PCB", "Prototype"],
  specs: ["spec 1", "spec 2", "spec 3"],
  model: "assets/models/my-model.glb",
  modelType: "glb",
  fallbackColor: 0xf8c557
}
```

## Design note

The site uses a handmade, stitched, scrapbook-like style inspired by playful craft and invention. It does not include LittleBigPlanet art, logos, characters, textures, or copyrighted assets.
