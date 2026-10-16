# Changelog

## 0.5.0

### Added

- **Custom label fonts:** pass a `Sheet` as a label's `font` option, or set `Label.defaultOptions.font`. Its cells are in ASCII order starting with space. `label.font` swaps the font on an existing label.

## 0.4.0

### Breaking

- **A label's `fill` is now `tint`.** Every entity now has `tint`, and on a label it's the text color, so it works the same as before. Rename `fill` to `tint`, in options and in `Label.defaultOptions`.

### Added

- **Play-once animations:** set `loop: false` on an animation to play it once and hold the last frame. `sprite.done` turns true when it ends.
- **`label.width` and `label.height`:** a label's size in pixels, for centering text.
- **`tilemap.set(x, y, char)`:** changes the tile at a point. Collision and drawing follow the change.
- **`tint` on every entity:** multiplies its colors. Use it on sprites for hit flashes and team colors, on tilemaps to darken a background, and on particles to color one set of frames.

### Other

- `sprite.sheet` is now public, like `tilemap.sheet` and `particles.sheet`.
- Labels share one font sheet instead of creating their own.
- Examples: `falldown` and `snake` center their text with `label.width` and `label.height`.
- Examples: a new `memory` example, a card-matching game played with the mouse or touch.
- Examples: `basic` is now `platformer`, and a new `basic` is the README's Quick start, for newcomers. The shared images moved to `examples/assets/`.

## 0.3.0

### Added

- **Particles:** one entity that draws a pool of particles, for dust, sparks and splashes, without allocating. Call `emit(x, y, count)` with a world position.
- Examples: dust when the mouse lands in `basic`.

## 0.2.0

### Added

- **Mouse and touch input:** `input.pointer` gives the position in game pixels on screen, and the `"click"` control works with `held`, `pressed` and `released`.

## 0.1.0

### Breaking

- **`fixed` is now `scroll`.** `scroll` is a number: 1 (the default) moves with the camera, and 0 stays on screen. Replace `fixed: true` with `scroll: 0`, on labels and on any entity.
- **The `speed` option for animations is now `frameMS`.** It still means how long each frame shows, in ms, and still defaults to 100. Rename `speed` to `frameMS`.
- **`sprite.frame` and `sprite.animate()` are removed.** Sprites now pick their frame from `timers.elapsed`.

### Added

- **Animated tiles:** a tilemap `legend` entry can be an animation, such as `"~": { frames: [5, 6, 7, 8], frameMS: 250 }`. Tiles with the same character animate in sync.
- **Parallax:** set `scroll` between 0 and 1 to move an entity more slowly than the camera, for example `scroll: 0.5` for a background. Collision ignores `scroll`, so keep anything solid at 1.
- **Tilemaps can move:** a tilemap's `x` and `y` now move it, and its collision moves with it.
- **`timers.elapsed`:** how long, in ms, an entity or scene has been running.
- **`frameAt(animation, elapsedMS)`:** returns the sheet cell an animation shows at a given time, so your own entities can animate.

### Fixed

- Animations with a very short `frameMS`, below one frame's time, no longer play too slowly.

### Other

- Faster drawing: the renderer only looks up a texture when the image changes.
- Examples: water and parallax hills in `basic`, a new `falldown` example, and an index page that `pnpm dev` opens.

## 0.0.1

- First release.
