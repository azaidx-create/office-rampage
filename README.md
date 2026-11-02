# Office Rampage — Overtime

A dependency-free HTML5 office beat-'em-up with an original pixel-art renderer and a complete playable first floor. Built around iPhone landscape play; portrait and desktop layouts are supported.

**[Play](https://azaidx-create.github.io/office-rampage/)** · **[Animation Lab](https://azaidx-create.github.io/office-rampage/tools/animation-lab.html)**

![Actual WebKit gameplay capture](docs/level-preview.png)

## Play

- Touch: drag the left joystick; tap **PUNCH**, **KICK**, or **DODGE** with the other thumb.
- Keyboard: **WASD/arrows** move, **J/Space** punch, **K** kick, **L/Shift** dodge, **P/Escape** pause.
- Tap punches in succession to chain a three-hit combo. Attacks buffer during recovery.
- Watch enemy wind-ups. Dodge through danger; it has a short cooldown.
- Smash copiers and plants, then collect coffee for 22 HP.
- Clear three encounters (eight opponents including the floor manager), then enter the elevator at the upper-right end of the floor.
- Sound is opt-in. The game pauses on focus loss or when the page becomes hidden.

## What changed in v2

- **63 discrete authored poses per character palette, across 11 states.** Startup rasterization creates 252 sprite frames for the employee, intern, guard and manager. Playback selects whole frames; it does not rotate limbs or move static character cutouts. The Animation Lab supports pause and frame stepping.
- Fixed-step combat with startup/active/recovery windows, per-swing hit tracking, lane/facing checks, enemy telegraphs, combo buffering, invulnerability and a dodge cooldown.
- A 1,960-pixel scrolling office: sunset skyline, window blinds, monitors, keyboards, mugs, task chairs, filing cabinets, noticeboards, meeting room, breakable copiers/plants and an opening exit elevator.
- Depth sorting, pixel shadows, debris, hit sparks, hit-stop, camera shake, floating pickups and synthesized sound effects.
- Safe-area-aware touch controls, pointer capture/cancellation, desktop keyboard controls, pause/resume, defeat/restart and a clear victory condition.
- Separate simulation, artwork and presentation modules; no CDN, image download or build step needed to play.

## Run locally

```sh
python3 -m http.server 8000
# Open http://localhost:8000
```

ES modules need HTTP(S); opening index.html as a file:// URL is unsupported. GitHub Pages deploys through the repository's existing workflow.

## Tests

```sh
npm test
# Optional browser suite (Node 20+):
npm install --no-save playwright@1.62.1
npx playwright install --with-deps webkit
node tests/browser.cjs
```

Validated for this revision:

- 10 simulation/animation regression tests, including an input-driven full-level win without health/stat overrides.
- WebKit at 844×390, 390×844, 667×375 and 1280×800.
- Start, movement, simultaneous joystick/attack input, released input, pause/resume, focus loss, control bounds, raster-frame uniqueness, defeat/restart and no uncaught browser errors.

Browser emulation is not a physical iPhone test. Real-device Safari performance, audio routing and home-screen safe areas still deserve device testing. This is one complete floor, not a multi-level campaign.

## Source

- `src/engine.js`: deterministic simulation and encounter progression.
- `src/art.js`: palettes, authored frame poses, rasterization and office artwork.
- `src/game.js`: input, animation playback, audio, particles, camera and HUD.
- `style.css`: responsive layout and touch controls.
- `tools/animation-lab.html`: frame-by-frame visual inspection.

Add `?debug` locally to expose `window.__office` for inspection. Normal play does not expose the test interface.
