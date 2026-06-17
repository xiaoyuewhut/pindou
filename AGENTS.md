# AGENTS.md

## Project

Pure static frontend — no build step, no bundler, no package.json. Open `index.html` directly in a browser to run.

拼豆图纸生成器 (MARD221): upload an image → quantize to 221-color bead palette → editable grid → export.

## Files

- `index.html` — page structure and all DOM IDs
- `app.js` — all application logic (IIFE, ~800 lines)
- `mard221.js` — color palette data + CIELAB color matching (IIFE, sets `window.MARD221`)
- `styles.css` — all styles, CSS variable theme

## Key architecture

- `mard221.js` must load before `app.js` (script order in index.html). `app.js` throws if `window.MARD221` is missing.
- All state lives in a single `state` object at the top of `app.js` IIFE. No framework, no reactivity — manual DOM updates.
- Palette is 221 colors across 9 series (A–H, M). M series = transparent/glow-in-dark.
- Color matching uses CIELAB with a quantized RGB cache (step=8). Cache lives in `mard221.js` as `NEAREST_CACHE`.
- Canvas rendering is manual `ctx.fillRect` per cell. Grid is `state.grid[y][x]` = palette index or `-1` (transparent).

## Conventions

- No comments in code unless explaining a non-obvious algorithm.
- All DOM access via `$('id')` shorthand (document.getElementById).
- History (undo/redo) is a cloned grid snapshot stack, max 60 entries.
- Export functions dynamically cap canvas size at 8192px via `calcExportCellSize`.

## Verification

No tests, no lint, no typecheck. Verify by opening `index.html` in a browser and testing:
1. Upload an image → grid appears
2. Tools (brush/eyedropper/eraser/fill) work on the grid
3. Export buttons produce valid PNG/CSV files
4. Space+drag pans the canvas, scroll wheel zooms
