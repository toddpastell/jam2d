# Changelog

## Unreleased

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
