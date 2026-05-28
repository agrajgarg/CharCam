import { useEffect, useState } from "react";
import { CHARACTER_PRESETS, DEFAULT_SETTINGS, PALETTES, SETTINGS_STORAGE_KEY } from "../constants";
import type { AsciiSettings, CharacterPresetId, PaletteId } from "../types";
import { clamp } from "../utils/ascii";

function isCharacterPreset(value: unknown): value is CharacterPresetId {
  return typeof value === "string" && value in CHARACTER_PRESETS;
}

function isPalette(value: unknown): value is PaletteId {
  return typeof value === "string" && PALETTES.some((palette) => palette.id === value);
}

function readSettings(): AsciiSettings {
  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored) as Partial<AsciiSettings>;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      density: clamp(Number(parsed.density ?? DEFAULT_SETTINGS.density), 32, 180),
      fps: clamp(Number(parsed.fps ?? DEFAULT_SETTINGS.fps), 8, 30),
      contrast: clamp(Number(parsed.contrast ?? DEFAULT_SETTINGS.contrast), -80, 120),
      threshold: clamp(Number(parsed.threshold ?? DEFAULT_SETTINGS.threshold), -90, 90),
      customRamp: typeof parsed.customRamp === "string" ? parsed.customRamp.slice(0, 40) : "",
      invert: typeof parsed.invert === "boolean" ? parsed.invert : DEFAULT_SETTINGS.invert,
      mirror: typeof parsed.mirror === "boolean" ? parsed.mirror : DEFAULT_SETTINGS.mirror,
      characterPreset: isCharacterPreset(parsed.characterPreset)
        ? parsed.characterPreset
        : DEFAULT_SETTINGS.characterPreset,
      palette: isPalette(parsed.palette) ? parsed.palette : DEFAULT_SETTINGS.palette,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function usePersistedSettings() {
  const [settings, setSettings] = useState<AsciiSettings>(() => readSettings());

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  return [settings, setSettings] as const;
}
