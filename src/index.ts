import { bootstrapEngine } from "./engine_bootstrap";
import { D_DoomMain } from "./d_main";
import { bootstrapWebgl } from "./webgl_bootstrap";

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
const audio = document.getElementById("audio") as HTMLAudioElement | null;

if (!canvas) {
  throw new Error("Missing #canvas canvas element.");
}

if (!audio) {
  throw new Error("Missing #audio element.");
}

// Let the engine set the canvas backing resolution — CSS stretches it to fill viewport
audio.preload = "auto";

// Resume any AudioContext on first user interaction (browser autoplay policy)
const attachAudioUnlock = () => {
  const unlock = () => {
    audio.muted = false;
    audio.volume = 1;
    void audio.play().catch(() => undefined);
  };
  for (const event of ["pointerdown", "keydown", "mousedown", "touchstart"]) {
    window.addEventListener(event, unlock, { once: true });
  }
};

const wadParam = new URLSearchParams(window.location.search).get("wad")?.toLowerCase();
const rendererParam = new URLSearchParams(window.location.search).get("renderer")?.toLowerCase();
const wadMap: Record<string, string> = {
  doom1: "/wads/Doom1.WAD",
  doom2: "/wads/Doom2.wad",
};
const wadUrl = wadParam && wadMap[wadParam] ? wadMap[wadParam] : "/wads/Doom1.WAD";
console.log(`Loading WAD from ${wadUrl}.`);

const engineScriptUrl = "/engine/doom.js";
const engineWasmUrl = "/engine/doom.wasm";

const start = async () => {
  if (rendererParam === "webgl") {
    attachAudioUnlock();
    await bootstrapWebgl({
      wadUrl,
      canvas,
      onStatus: (message) => console.log(message),
    });
    return;
  }
  const engineResponse = await fetch(engineScriptUrl, { method: "HEAD" });
  if (engineResponse.ok) {
    attachAudioUnlock();
    const wasmResponse = await fetch(engineWasmUrl, { method: "HEAD" });
    await bootstrapEngine({
      wadUrl,
      canvas,
      audio,
      engineScriptUrl,
      wasmUrl: wasmResponse.ok ? engineWasmUrl : undefined,
      onStatus: (message) => console.log(message),
    });
    return;
  }
  console.warn("Engine bundle not found, falling back to stub renderer.");
  await D_DoomMain(wadUrl, canvas);
};

void start();
