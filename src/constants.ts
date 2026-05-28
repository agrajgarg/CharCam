import type { AsciiSettings, CharacterPresetId, Palette } from "./types";

export const CHARACTER_PRESETS: Record<CharacterPresetId, { name: string; ramp: string }> = {
  classic: { name: "Classic", ramp: " .:-=+*#%@" },
  blocks: { name: "Blocks", ramp: " ░▒▓█" },
  minimal: { name: "Minimal", ramp: " .oO@" },
  code: { name: "Code", ramp: " .,:;irsXA253hMHGS#9B&@" },
  emoji: { name: "Emoji-lite", ramp: " .:-+*oO@" },
};

export const PALETTES: Palette[] = [
  { id: "green", name: "Terminal Green", foreground: "#8cff9a", background: "#07110b" },
  { id: "amber", name: "Amber", foreground: "#ffd27a", background: "#150e05" },
  { id: "grayscale", name: "Grayscale", foreground: "#f2f4f0", background: "#080a0c" },
  {
    id: "source",
    name: "Source Color",
    foreground: "#f4f7f1",
    background: "#07090b",
    usesSourceColor: true,
  },
  { id: "duotone", name: "Duotone", foreground: "#80f2d0", background: "#0b0f16", secondary: "#ffbf69" },
];

export const DEFAULT_SETTINGS: AsciiSettings = {
  density: 96,
  fps: 24,
  contrast: 18,
  threshold: 0,
  invert: false,
  mirror: true,
  characterPreset: "classic",
  customRamp: "",
  palette: "green",
};

export const SETTINGS_STORAGE_KEY = "charcam-settings-v1";
