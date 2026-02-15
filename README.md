# 🎮 DOOM in TypeScript — Browser-Native Port

> **An experiment**: converting the open-source C engine of DOOM into a TypeScript version that runs natively in the browser — no plugins, no emulation layers, just WebGL + Web Audio + WASM.

![DOOM running in the browser](doom-with-music.png)

## About

This project takes the [original DOOM source code](https://github.com/id-Software/DOOM) released by id Software and compiles it to WebAssembly (WASM) via Emscripten, with a TypeScript frontend that handles rendering (WebGL), input, and audio (Web Audio API + Tone.js for MIDI music).

> **Note**: The original C source code is not included in this repository. See the [id-Software/DOOM](https://github.com/id-Software/DOOM) repository for the original code.

The game runs entirely client-side in modern browsers using the **Shareware DOOM1.WAD** file.

## How It Was Built

The entire migration was done conversationally via **GitHub Copilot CLI**, going full "yolo" style:

- **Primary model**: `gpt-5.2-codex` handled the majority of the C-to-WASM compilation, TypeScript scaffolding, and engine bootstrapping. Used `/plan` and `/fleet` to distribute tasks to agents in parallel.
- **Rendering**: The initial migration produced a blank screen — the model couldn't figure out the rendering pipeline. I pointed out it needed **WebGL** to bridge the DOOM framebuffer (320×200 indexed color) to the browser canvas. That unlocked the visuals.
- **Screen scaling**: Getting the canvas to fill the browser window correctly was surprisingly tricky. Used the **Playwright MCP server** with `claude-opus-4.6` to auto-debug CSS scaling issues — `gpt-5.2-codex` kept going in circles on this one. The fix ended up being `width: 100%; height: 100%; object-fit: contain` with `image-rendering: pixelated`.
- **Sound effects**: The compiled WASM had stub audio functions (all no-ops). Fixed by writing a new `i_sound_ems.c` with Emscripten `EM_JS` macros that bridge C sound calls to JavaScript, then recompiling the WASM. The TypeScript side decodes DMX sound lumps into WAV and plays them via the Web Audio API.
- **Music**: DOOM's MUS format music is converted to MIDI on-the-fly and played through **Tone.js** synthesizers (FM synths for guitars, square wave for bass, noise for drums).

## Architecture

```
┌─────────────────────────────────────────────────┐
│                    Browser                       │
│                                                  │
│  ┌──────────┐    ┌──────────────┐               │
│  │ DOOM C   │───▶│ i_sound_ems.c│──┐            │
│  │ Engine   │    │ (EM_JS)      │  │            │
│  │ (WASM)   │    └──────────────┘  │            │
│  └────┬─────┘                      ▼            │
│       │ framebuffer         ┌─────────────┐     │
│       ▼                     │ DoomAudio   │     │
│  ┌──────────┐               │ Bridge (TS) │     │
│  │ WebGL    │               └──┬──────┬───┘     │
│  │ Renderer │                  │      │         │
│  │ (TS)     │                  ▼      ▼         │
│  └────┬─────┘            Web Audio  Tone.js     │
│       │                  (SFX)      (Music)     │
│       ▼                                         │
│  ┌──────────┐                                   │
│  │ <canvas> │  ← fullscreen, pixelated scaling  │
│  └──────────┘                                   │
└─────────────────────────────────────────────────┘
```

## Prerequisites

- **Node.js** ≥ 18
- **Emscripten SDK** (only if you want to recompile the WASM engine)
- A **DOOM1.WAD** file (the shareware version is freely available)

## Installation & Running

```bash
# 1. Clone the repo
git clone https://github.com/pascalvanderheiden/doom-typescript.git
cd doom-typescript

# 2. Install dependencies
npm install

# 3. Place your WAD file
#    Copy DOOM1.WAD (shareware) into public/wads/
cp /path/to/DOOM1.WAD public/wads/DOOM1.WAD

# 4. Build the TypeScript bundle
npm run build

# 5. Start the dev server
npm run dev
```

Then open **http://localhost:8000** in your browser and start fragging! 🔫

## Controls

| Key | Action |
|-----|--------|
| Arrow keys | Move / turn |
| Ctrl | Fire |
| Space | Open doors / use |
| Shift | Run |
| 1-7 | Select weapon |
| Esc | Menu |
| Tab | Automap |

## Tech Stack

- **Emscripten** — compiles DOOM's C code to WebAssembly
- **TypeScript** — frontend bootstrap, audio bridge, WebGL renderer
- **esbuild** — fast TypeScript bundling
- **Tone.js** — MIDI music synthesis
- **Web Audio API** — sound effect playback
- **WebGL** — framebuffer rendering
- **Playwright** — automated browser testing during development

## Playwright Screenshots

During development, the **Playwright MCP server** was used to capture automated screenshots for debugging rendering and scaling issues. All screenshots are stored in the `playwright-screenprints/` directory:

| Screenshot | Description |
|------------|-------------|
| `doom-1920-objectfit.png` | Testing CSS object-fit scaling at 1920px |
| `doom-1920x1080-fixed.png` | Fixed fullscreen rendering at 1920x1080 |
| `doom-1920x1080.png` | Initial 1920x1080 test |
| `doom-640x400-scaled.png` | Scaled 640x400 resolution test |
| `doom-after-title.png` | Title screen after initial load |
| `doom-broken-scale.png` | Debugging broken canvas scaling |
| `doom-canvas-list.png` | Canvas element inspection |
| `doom-fullscreen-final.png` | Final fullscreen implementation |
| `doom-fullscreen.png` | Fullscreen mode testing |
| `doom-gameplay-after.png` - `doom-gameplay-after4.png` | Gameplay progression screenshots |
| `doom-gameplay-check.png` | Gameplay verification |
| `doom-gameplay.png` | In-game screenshot |
| `doom-screen.png` | General screen capture |
| `doom-with-setcanvassize.png` | Testing setCanvasSize implementation |
| `doom1-3d-screenshot.png` | 3D rendering test |
| `doom1-automap-*.png` | Automap rendering tests (player position, crosshair) |
| `doom1-hud-labels.png` | HUD label positioning |
| `doom1-polish.png` | Final polish pass |
| `doom1-render-simple.png` | Simple renderer test |
| `doom1-screenshot-pw.png` | Playwright automated screenshot |
| `doom1-splash*.png` | Splash screen iterations |
| `doom1-webgl-*.png` | WebGL renderer tests (gameplay, HUD) |
| `doom2-*.png` | DOOM II testing screenshots |
| `playwright-doom.png` | Playwright test runner capture |

These screenshots document the iterative process of debugging the WebGL renderer, CSS scaling, and fullscreen behavior using automated browser testing.

## License

The original DOOM source code is released under the [GNU General Public License v2](https://github.com/id-Software/DOOM/blob/master/linuxdoom-1.10/DOOMLIC.TXT). This project's TypeScript code follows the same license. The DOOM1.WAD shareware data file is copyrighted by id Software and is not included in this repository.

## Acknowledgments

- **id Software** for open-sourcing the DOOM engine
- **GitHub Copilot CLI** for doing most of the heavy lifting
- **Playwright MCP** for saving my sanity on CSS scaling
